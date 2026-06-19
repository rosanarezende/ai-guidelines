import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { ClipboardWriter } from "../app/ports/ClipboardWriter.js";
import { PromptCancelledError, Prompts } from "../app/ports/Prompts.js";
import { makeHandoffFacts } from "../test-utils/decisionFixtures.js";
import { CockpitModel } from "./cockpit.js";
import { runFlowWizard, buildFlowMenu } from "./flowWizard.js";
import { Command, CommandResult, Logger } from "./registry/Command.js";
import { CommandRegistry } from "./registry/CommandRegistry.js";
import { run } from "./main.js";

class CollectingLogger implements Logger {
  readonly infos: string[] = [];
  readonly errors: string[] = [];
  info(message: string): void {
    this.infos.push(message);
  }
  error(message: string): void {
    this.errors.push(message);
  }
}

class ScriptedPrompts implements Prompts {
  readonly selectCalls: Array<{
    readonly message: string;
    readonly values: readonly string[];
    readonly names: readonly string[];
    readonly hints: readonly string[];
  }> = [];
  readonly notes: string[] = [];
  readonly outros: string[] = [];
  readonly cancels: string[] = [];
  readonly statuses: string[] = [];
  readonly taskTitles: string[] = [];
  readonly taskLogTitles: string[] = [];
  readonly taskLogMessages: string[] = [];
  readonly confirmCalls: string[] = [];
  readonly groupMultiselectCalls: Array<{
    readonly message: string;
    readonly groups: readonly string[];
    readonly names: readonly string[];
    readonly hints: readonly string[];
  }> = [];
  private index = 0;
  private inputIndex = 0;
  private confirmIndex = 0;

  constructor(
    private readonly selections: readonly string[],
    private readonly confirmations: readonly boolean[] = [],
    private readonly groupSelections: string[][] = [],
    private readonly inputs: readonly string[] = []
  ) {}

  async select<T>(options: { message: string; choices: ReadonlyArray<{ value: T }> }): Promise<T> {
    this.selectCalls.push({
      message: options.message,
      values: options.choices.map((choice) => String(choice.value)),
      names: options.choices.map((choice) => String((choice as { name?: string }).name ?? "")),
      hints: options.choices.map((choice) => String((choice as { hint?: string }).hint ?? "")),
    });
    const selected = this.selections[this.index++] ?? String(options.choices[0]?.value ?? "");
    if (selected === "__cancel__") {
      throw new PromptCancelledError();
    }
    return selected as T;
  }

  async input(): Promise<string> {
    return this.inputs[this.inputIndex++] ?? "";
  }

  async confirm(): Promise<boolean> {
    this.confirmCalls.push("confirm");
    return this.confirmations[this.confirmIndex++] ?? false;
  }

  async groupMultiselect<T>(options: {
    message: string;
    groups: Readonly<Record<string, ReadonlyArray<{ name: string; value: T }>>>;
  }): Promise<readonly T[]> {
    this.groupMultiselectCalls.push({
      message: options.message,
      groups: Object.keys(options.groups),
      names: Object.values(options.groups)
        .flat()
        .map((choice) => choice.name),
      hints: Object.values(options.groups)
        .flat()
        .map((choice) => String((choice as { hint?: string }).hint ?? "")),
    });
    const selected = this.groupSelections.shift() ?? [];
    return selected as T[];
  }

  intro(): void {}

  outro(message: string): void {
    this.outros.push(message);
  }

  note(message: string): void {
    this.notes.push(message);
  }

  cancel(message: string): void {
    this.cancels.push(message);
  }

  status(kind: string, message: string): void {
    this.statuses.push(`${kind}:${message}`);
  }

  async taskList(
    tasks: readonly {
      readonly title: string;
      readonly task: (
        message: (value: string) => void
      ) => string | Promise<string> | void | Promise<void>;
    }[]
  ): Promise<void> {
    for (const task of tasks) {
      this.taskTitles.push(task.title);
      await task.task(() => undefined);
    }
  }

  taskLog(options: { title: string }) {
    this.taskLogTitles.push(options.title);
    const messages = this.taskLogMessages;
    return {
      message(message: string): void {
        messages.push(`message:${message}`);
      },
      group(name: string) {
        return {
          message(message: string): void {
            messages.push(`${name}:message:${message}`);
          },
          success(message: string): void {
            messages.push(`${name}:success:${message}`);
          },
          error(message: string): void {
            messages.push(`${name}:error:${message}`);
          },
        };
      },
      success(message: string): void {
        messages.push(`success:${message}`);
      },
      error(message: string): void {
        messages.push(`error:${message}`);
      },
    };
  }
}

class FakeClipboard implements ClipboardWriter {
  readonly copied: string[] = [];
  constructor(private readonly available = true) {}
  async copy(text: string): Promise<boolean> {
    if (!this.available) return false;
    this.copied.push(text);
    return true;
  }
}

function spyCommand(name: string): Command<void> & { readonly calls: readonly string[][] } {
  const calls: string[][] = [];
  return {
    name,
    description: `spy ${name}`,
    usage: [name],
    calls,
    parse(argv: readonly string[]): void {
      calls.push([...argv]);
    },
    async run(): Promise<CommandResult> {
      return { exitCode: 0 };
    },
  };
}

function outputCommand(
  name: string,
  output: string
): Command<void> & { readonly calls: readonly string[][] } {
  const command = spyCommand(name);
  return {
    ...command,
    async run(_options: void, context): Promise<CommandResult> {
      context.logger.info(output);
      return { exitCode: 0 };
    },
  };
}

function registryWith(...commands: Command<unknown>[]): CommandRegistry {
  const registry = new CommandRegistry();
  for (const command of commands) registry.register(command);
  return registry;
}

async function withTempRepo<T>(
  setup: (repoRoot: string) => void,
  run: (repoRoot: string) => Promise<T>
): Promise<T> {
  const repoRoot = mkdtempSync(path.join(tmpdir(), "flow-wizard-"));
  try {
    setup(repoRoot);
    return await run(repoRoot);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
}

function model(): CockpitModel {
  const facts = makeHandoffFacts({
    git: {
      ...makeHandoffFacts().git,
      branch: "feat/spec-0024-co-flow-convergence",
      head: "abc1234",
    },
    pullRequest: {
      ...makeHandoffFacts().pullRequest!,
      number: 43,
      isDraft: true,
      checks: { pass: 5, fail: 0, pending: 0 },
    },
  });
  const recommendedAction = {
    id: "finish-subcheckpoint" as const,
    title: "Concluir ponto atual e iniciar o próximo",
    availability: { status: "available" as const, reasons: [] },
    command: "npm run flow -- decide --type finish-subcheckpoint --brief-only",
    mutatingCommand:
      "npm run flow -- decide --type finish-subcheckpoint --decision finish --authorization explicit-human-decision --confirm",
    effect: ["altera somente tasks.md"],
  };
  const alternativeAction = {
    id: "mark-readiness" as const,
    title: "Declarar readiness do sub-checkpoint ativo",
    availability: { status: "available" as const, reasons: [] },
    command: "npm run flow -- decide --type mark-readiness --brief-only",
    mutatingCommand:
      "npm run flow -- decide --type mark-readiness --decision mark-ready --authorization explicit-human-decision --confirm",
    effect: ["altera somente tasks.md"],
  };
  return {
    work: {
      snapshot: {
        collected: { facts },
      } as never,
      brief: {
        mode: "implement_checkpoint",
        object: {
          subCheckpoint: { id: "CO-10.2", title: "confronto modelo x codigo", line: 110 },
        },
        nextAction: {
          description: "Concluir CO-10.2 e iniciar CO-10.3",
          basis: [],
          commands: [],
          stillForbidden: [],
          decisionType: "finish-subcheckpoint",
        },
      } as never,
    },
    decisions: [],
    flow: {
      actions: [],
      available: [recommendedAction, alternativeAction],
      blocked: [
        {
          id: "human-gate",
          title: "Decidir Human Gate",
          availability: { status: "blocked", reasons: ["PR continua Draft."] },
          command: "npm run flow -- decide --type human-gate --brief-only",
          effect: [],
        },
      ],
      forbidden: ["Fazer merge"],
      recommended: recommendedAction,
      humanSummary: {
        state: [
          "Estamos em checkpoint-co-flow-convergence.",
          "Objeto atual: CO-10.2 — confronto modelo x codigo.",
          "PR #43 Draft; CI 5 ok, 0 falha(s), 0 pendente(s).",
        ],
        currentObject: {
          label: "CO-10.2 — confronto modelo x codigo",
          objective: "Comparar a maquina de estados canonica com os comandos vivos.",
          output: "Matriz modelo x codigo.",
        },
        nextObject: {
          label: "CO-10.3 — correcao integral",
          objective: "Corrigir divergencias reais sem criar segunda SSOT.",
          output: null,
        },
        ready: ["Os findings do checkpoint estao fechados.", "A CI esta verde."],
        missing: ["Falta uma decisão única para concluir este ponto e iniciar o próximo."],
        nextAction: "Concluir ponto atual e iniciar o próximo",
        command: "npm run flow -- decide --type finish-subcheckpoint --brief-only",
        forbidden: ["Fazer merge"],
      },
    },
  };
}

function dirtyModel(): CockpitModel {
  const base = model();
  return {
    ...base,
    work: {
      ...base.work,
      brief: {
        ...base.work.brief,
        workingTreeState: "functional-dirty",
        nextAction: {
          ...base.work.brief.nextAction,
          description: "Finalizar as mudancas locais e deixar a working tree limpa.",
        },
      } as never,
    },
    flow: {
      ...base.flow!,
      available: [],
      recommended: null,
      humanSummary: {
        ...base.flow!.humanSummary,
        missing: ["Ha mudancas locais nao finalizadas.", "A working tree não está limpa."],
        nextAction: "Finalizar as mudancas locais e deixar a working tree limpa.",
        command: null,
      },
    },
  };
}

function insightCandidateModel(): CockpitModel {
  const base = model();
  const insightAction = {
    id: "review-insight-candidates" as const,
    title: "Ver percepções recorrentes que precisam de decisão",
    availability: {
      status: "available" as const,
      reasons: [],
      hint: "1 percepção recorrente precisa de decisão humana.",
    },
    command: "npm run flow -- insight list",
    effect: ["abre a lista de percepções", "não promove nem descarta automaticamente"],
  };
  return {
    ...base,
    flow: {
      ...base.flow!,
      available: [base.flow!.recommended!, insightAction],
      actions: [...base.flow!.actions, insightAction],
      humanSummary: {
        ...base.flow!.humanSummary,
        missing: [
          ...base.flow!.humanSummary.missing,
          "Há percepção recorrente aguardando decisão humana.",
        ],
      },
    },
  };
}

function advisoryReviewModel(): CockpitModel {
  const base = model();
  const reviewAction = {
    id: "request-advisory-review" as const,
    title: "Pedir revisão antes da decisão humana",
    availability: {
      status: "available" as const,
      reasons: [],
      hint: "technical_audit stale pode reduzir risco antes do Human Gate.",
    },
    command: "npm run flow -- review types",
    effect: [
      "prepara contexto para uma revisão opcional/recomendada",
      "não publica review sem autorização explícita",
    ],
  };
  return {
    ...base,
    flow: {
      ...base.flow!,
      available: [base.flow!.recommended!, reviewAction],
      actions: [...base.flow!.actions, reviewAction],
      humanSummary: {
        ...base.flow!.humanSummary,
        missing: [
          ...base.flow!.humanSummary.missing,
          "Há revisão opcional/recomendada que pode reduzir risco antes do Human Gate.",
        ],
      },
    },
  };
}

function blockedModel(): CockpitModel {
  const base = dirtyModel();
  return {
    ...base,
    work: {
      ...base.work,
      brief: {
        ...base.work.brief,
        workingTreeState: "clean",
        nextAction: {
          ...base.work.brief.nextAction,
          description: "Aguardar a CI terminar.",
        },
      } as never,
    },
    flow: {
      ...base.flow!,
      humanSummary: {
        ...base.flow!.humanSummary,
        missing: ["A CI tem 1 check(s) pendente(s)."],
        nextAction: "Aguardar a CI terminar.",
      },
    },
  };
}

describe("flow wizard", () => {
  it("menu principal expõe cockpit/provisioning e não lista providers como ação", () => {
    const menu = buildFlowMenu(model());
    const values = menu.map((item) => item.value);
    expect(values).toEqual(
      expect.arrayContaining([
        "cockpit",
        "next",
        "alternative",
        "validate",
        "decisions",
        "work",
        "spec-work",
        "provisioning",
      ])
    );
    expect(values.slice(0, 3)).toEqual(["cockpit", "next", "alternative"]);
    expect(menu[0].name).toBe("Ver resumo completo antes de escolher");
    expect(menu[1].name).toBe("PRÓXIMA AÇÃO RECOMENDADA: Concluir ponto atual e iniciar o próximo");
    expect(menu[2].name).toBe("ALTERNATIVA: declarar que este ponto está pronto");
    expect(values).not.toContain("providers");
  });

  it("menu principal usa intenção humana em vez de termos internos", () => {
    const menuText = buildFlowMenu(model())
      .map((item) => item.name)
      .join("\n");

    expect(menuText).toContain("Ver resumo completo antes de escolher");
    expect(menuText).toContain("Ver ações disponíveis e bloqueadas");
    expect(menuText).toContain("Ver orientação de trabalho / handoff");
    expect(menuText).toContain("Ver tipos de revisão disponíveis");
    expect(menuText).toContain("Escolher ou iniciar uma spec");
    expect(menuText).toContain("Ferramentas técnicas e diagnósticos");
    expect(menuText).not.toMatch(/\bcockpit\b/i);
    expect(menuText).not.toMatch(/\bbriefing\b/i);
    expect(menuText).not.toMatch(/review governado/i);
    expect(menuText).not.toMatch(/comando mutante/i);
    expect(menuText).not.toMatch(/\bwizard\b/i);
  });

  it("quando há mudanças locais e nenhuma mutação disponível, recomenda validar o diff", () => {
    const menu = buildFlowMenu(dirtyModel());
    const values = menu.map((item) => item.value);

    expect(values[0]).toBe("cockpit");
    expect(values[1]).toBe("validate");
    expect(menu[1].name).toBe(
      "PRÓXIMA AÇÃO RECOMENDADA: Finalizar as mudancas locais e deixar a working tree limpa."
    );
    expect(menu[1].hint).toBe("opção principal agora");
    expect(values).not.toContain("next");
  });

  it("quando não há mutação disponível por bloqueio factual, mostra decisões em vez de menu separado de bloqueios", () => {
    const menu = buildFlowMenu(blockedModel());
    const values = menu.map((item) => item.value);

    expect(values[0]).toBe("cockpit");
    expect(values).toContain("decisions");
    expect(values).not.toContain("blockers");
    expect(values).not.toContain("next");
  });

  it("continuar próxima ação recomendada delega para decide sem regra própria", async () => {
    const prompts = new ScriptedPrompts(["next"], [true]);
    const decide = spyCommand("decide");
    const logger = new CollectingLogger();

    const code = await runFlowWizard("/repo", logger, {
      prompts,
      registry: registryWith(decide),
      collectModel: () => model(),
    });

    expect(code).toBe(0);
    expect(decide.calls).toEqual([[]]);
    expect(prompts.notes.join("\n")).toContain("Próximo passo recomendado");
  });

  it("continuar próxima ação recomendada pode ser cancelada antes de abrir decide", async () => {
    const prompts = new ScriptedPrompts(["next"], [false]);
    const decide = spyCommand("decide");

    const code = await runFlowWizard("/repo", new CollectingLogger(), {
      prompts,
      registry: registryWith(decide),
      collectModel: () => model(),
    });

    expect(code).toBe(0);
    expect(decide.calls).toEqual([]);
  });

  it("alternativa disponível abre prévia específica sem aplicar mutação", async () => {
    const prompts = new ScriptedPrompts(["alternative"]);
    const decide = spyCommand("decide");

    const code = await runFlowWizard("/repo", new CollectingLogger(), {
      prompts,
      registry: registryWith(decide),
      collectModel: () => model(),
    });

    expect(code).toBe(0);
    expect(decide.calls).toEqual([["--type", "mark-readiness", "--brief-only"]]);
  });

  it("decisões do fluxo abrem em modo somente leitura", async () => {
    const prompts = new ScriptedPrompts(["decisions"]);
    const decide = spyCommand("decide");

    const code = await runFlowWizard("/repo", new CollectingLogger(), {
      prompts,
      registry: registryWith(decide),
      collectModel: () => model(),
    });

    expect(code).toBe(0);
    expect(decide.calls).toEqual([["--brief-only"]]);
  });

  it("orientação de trabalho / handoff copia contexto para clipboard", async () => {
    const prompts = new ScriptedPrompts(["work"]);
    const clipboard = new FakeClipboard();
    const handoff = outputCommand("handoff", "HANDOFF ATUAL");
    const work = outputCommand("work", "TRABALHO ATUAL");

    const code = await runFlowWizard("/repo", new CollectingLogger(), {
      prompts,
      registry: registryWith(handoff, work),
      clipboard,
      collectModel: () => model(),
    });

    expect(code).toBe(0);
    expect(handoff.calls).toEqual([["0024"]]);
    expect(work.calls).toEqual([[]]);
    expect(clipboard.copied[0]).toContain("HANDOFF ATUAL");
    expect(clipboard.copied[0]).toContain("TRABALHO ATUAL");
    expect(prompts.statuses.join("\n")).toContain("copiado para o clipboard");
  });

  it("tipos de revisão disponíveis são copiados para clipboard sem publicar review", async () => {
    const prompts = new ScriptedPrompts(["review", "types"]);
    const clipboard = new FakeClipboard();
    const review = outputCommand("review", "TIPOS DE REVISAO");

    const code = await runFlowWizard("/repo", new CollectingLogger(), {
      prompts,
      registry: registryWith(review),
      clipboard,
      collectModel: () => model(),
    });

    expect(code).toBe(0);
    expect(review.calls).toEqual([["types"]]);
    expect(clipboard.copied[0]).toContain("TIPOS DE REVISAO");
    expect(prompts.notes.join("\n")).toContain("esta tela só prepara contexto");
  });

  it("percepção recorrente aparece como alternativa e abre a lista canônica", async () => {
    const prompts = new ScriptedPrompts(["alternative"]);
    const insight = spyCommand("insight");

    const code = await runFlowWizard("/repo", new CollectingLogger(), {
      prompts,
      registry: registryWith(insight),
      collectModel: () => insightCandidateModel(),
    });

    expect(code).toBe(0);
    expect(prompts.selectCalls[0].names.join("\n")).toContain(
      "Ver percepções recorrentes que precisam de decisão"
    );
    expect(insight.calls).toEqual([["list"]]);
  });

  it("review opcional/recomendada aparece como alternativa e prepara contexto sem publicar review", async () => {
    const prompts = new ScriptedPrompts(["alternative", "types"]);
    const clipboard = new FakeClipboard();
    const review = outputCommand("review", "TIPOS DE REVISAO");
    const decide = spyCommand("decide");

    const code = await runFlowWizard("/repo", new CollectingLogger(), {
      prompts,
      registry: registryWith(review, decide),
      clipboard,
      collectModel: () => advisoryReviewModel(),
    });

    expect(code).toBe(0);
    expect(prompts.selectCalls[0].names.join("\n")).toContain(
      "pedir revisão antes da decisão humana"
    );
    expect(prompts.selectCalls[1].message).toBe("Qual contexto você quer preparar?");
    expect(review.calls).toEqual([["types"]]);
    expect(decide.calls).toEqual([]);
    expect(clipboard.copied[0]).toContain("TIPOS DE REVISAO");
  });

  it("resumo inicial do wizard vem do HumanSummary comum", async () => {
    const prompts = new ScriptedPrompts(["quit"]);

    const code = await runFlowWizard("/repo", new CollectingLogger(), {
      prompts,
      registry: registryWith(),
      collectModel: () => model(),
    });

    expect(code).toBe(0);
    expect(prompts.notes[0]).toContain("ESTADO");
    expect(prompts.notes[0]).toContain("AGORA");
    expect(prompts.notes[0]).toContain("CO-10.2 — confronto modelo x codigo");
    expect(prompts.notes[0]).toContain("DEPOIS");
    expect(prompts.notes[0]).toContain("CO-10.3 — correcao integral");
    expect(prompts.notes[0]).toContain("ALTERNATIVAS");
    expect(prompts.notes[0]).toContain("declarar que este ponto está pronto");
    expect(prompts.notes[0]).toContain("PRÓXIMA AÇÃO RECOMENDADA");
    expect(prompts.notes[0]).toContain(
      "Falta uma decisão única para concluir este ponto e iniciar o próximo."
    );
    expect(prompts.notes[0]).not.toContain("NÃO FAZER AGORA");
    expect(prompts.notes[0].indexOf("PRÓXIMA AÇÃO RECOMENDADA")).toBeLessThan(
      prompts.notes[0].indexOf("ALTERNATIVAS")
    );
    expect(prompts.statuses).toEqual([]);
  });

  it("provisioning em repo governado recomenda update e esconde init/adopt do caminho principal", async () => {
    await withTempRepo(
      (repoRoot) => {
        mkdirSync(path.join(repoRoot, ".ai-guidelines"), { recursive: true });
        writeFileSync(path.join(repoRoot, ".ai-guidelines", "config.json"), "{}\n");
      },
      async (repoRoot) => {
        const prompts = new ScriptedPrompts(["provisioning", "guided-update", "runtime"]);
        const init = spyCommand("init");
        const adopt = spyCommand("adopt");
        const update = spyCommand("update");

        const code = await runFlowWizard(repoRoot, new CollectingLogger(), {
          prompts,
          registry: registryWith(init, adopt, update),
          collectModel: () => model(),
        });

        expect(code).toBe(0);
        expect(update.calls).toEqual([[]]);
        expect(init.calls).toEqual([]);
        expect(adopt.calls).toEqual([]);
        expect(prompts.selectCalls[0].names).toContain("Atualizar este repositório");
        expect(prompts.selectCalls[1].values).toEqual([
          "guided-update",
          "policy",
          "details",
          "__back__",
        ]);
        expect(prompts.selectCalls[1].names[0]).toBe(
          "Atualizar runtime, templates, providers ou práticas"
        );
        expect(prompts.selectCalls[1].values).not.toContain("providers");
        expect(prompts.selectCalls[1].values).not.toContain("init");
        expect(prompts.selectCalls[1].values).not.toContain("adopt");
        expect(prompts.selectCalls[2].values).toEqual([
          "runtime",
          "providers",
          "features",
          "collaboration",
          "policy",
          "details",
          "__back__",
        ]);
        expect(prompts.selectCalls[2].names).toContain("Práticas do repositório");
        expect(prompts.notes.join("\n")).toContain("Este repositório já usa ai-guidelines.");
      }
    );
  });

  it("update guiado permite atualizar práticas como Prettier, Husky e CI", async () => {
    await withTempRepo(
      (repoRoot) => {
        mkdirSync(path.join(repoRoot, ".governance"), { recursive: true });
      },
      async (repoRoot) => {
        const prompts = new ScriptedPrompts(
          ["provisioning", "guided-update", "features"],
          [],
          [["prettier", "husky", "ci"]]
        );
        const update = spyCommand("update");

        const code = await runFlowWizard(repoRoot, new CollectingLogger(), {
          prompts,
          registry: registryWith(spyCommand("init"), spyCommand("adopt"), update),
          collectModel: () => model(),
        });

        expect(code).toBe(0);
        expect(prompts.groupMultiselectCalls[0].groups).toEqual([
          "Práticas de infraestrutura",
          "Práticas editoriais",
        ]);
        expect(prompts.groupMultiselectCalls[0].names).toEqual(
          expect.arrayContaining([
            "Prettier",
            "Hooks locais com Husky",
            "CI no GitHub Actions",
            "Quality Gates",
            "TDD",
            "BDD",
          ])
        );
        expect(prompts.groupMultiselectCalls[0].hints).toEqual(
          expect.arrayContaining([
            "roda checagens antes do commit",
            "valida o PR automaticamente no GitHub",
          ])
        );
        expect(update.calls).toEqual([["--features", "prettier,husky,ci"]]);
        expect(prompts.notes.join("\n")).toContain("Práticas selecionadas:");
      }
    );
  });

  it("update guiado usa seleção agrupada para providers em vez de texto por vírgula", async () => {
    await withTempRepo(
      (repoRoot) => {
        mkdirSync(path.join(repoRoot, ".governance"), { recursive: true });
      },
      async (repoRoot) => {
        const prompts = new ScriptedPrompts(
          ["provisioning", "guided-update", "providers"],
          [],
          [["claude", "openai", "cursor"]]
        );
        const update = spyCommand("update");

        const code = await runFlowWizard(repoRoot, new CollectingLogger(), {
          prompts,
          registry: registryWith(spyCommand("init"), spyCommand("adopt"), update),
          collectModel: () => model(),
        });

        expect(code).toBe(0);
        expect(prompts.groupMultiselectCalls[0].message).toBe(
          "Quais ferramentas de IA devem receber arquivos de orientação?"
        );
        expect(prompts.groupMultiselectCalls[0].groups).toEqual([
          "Assistentes principais do repositório",
          "Editores e agentes locais",
        ]);
        expect(prompts.groupMultiselectCalls[0].names).toEqual(
          expect.arrayContaining(["Claude", "OpenAI/Codex", "Cursor"])
        );
        expect(update.calls).toEqual([["--providers", "claude,openai,cursor"]]);
      }
    );
  });

  it("update guiado expõe perfil de colaboração a partir de review-policy.yml", async () => {
    await withTempRepo(
      (repoRoot) => {
        mkdirSync(path.join(repoRoot, ".governance"), { recursive: true });
        writeFileSync(
          path.join(repoRoot, ".governance", "review-policy.yml"),
          [
            "active_profile: team",
            "profiles:",
            "  team:",
            "    implementation_pr:",
            "      required_native_approvals: 1",
            "    integration_pr:",
            "      required_native_approvals: 2",
            "    accepted_findings:",
            "      require_resolution: true",
            "      require_verification_event_for_fixed: true",
            "    github:",
            "      minimum_approving_reviews: 2",
            "      require_code_owner_review: true",
            "      dismiss_stale_reviews_on_push: true",
            "      require_last_push_approval: true",
            "review_requirements:",
            "  defaults:",
            "    technical_audit: optional",
            "    security_review: required",
          ].join("\n")
        );
      },
      async (repoRoot) => {
        const prompts = new ScriptedPrompts(["provisioning", "policy"]);

        const code = await runFlowWizard(repoRoot, new CollectingLogger(), {
          prompts,
          registry: registryWith(spyCommand("init"), spyCommand("adopt"), spyCommand("update")),
          collectModel: () => model(),
        });

        expect(code).toBe(0);
        expect(prompts.selectCalls[1].hints).toContain("perfil atual: team");
        expect(prompts.notes.join("\n")).toContain("Perfil de colaboração atual: team");
        expect(prompts.notes.join("\n")).toContain("approvals nativos em PR de integração: 2");
        expect(prompts.notes.join("\n")).toContain("security_review: required");
      }
    );
  });

  it("alterar perfil de colaboração exige confirmação e delega para update", async () => {
    await withTempRepo(
      (repoRoot) => {
        mkdirSync(path.join(repoRoot, ".governance"), { recursive: true });
        writeFileSync(
          path.join(repoRoot, ".governance", "review-policy.yml"),
          [
            "active_profile: solo",
            "profiles:",
            "  solo:",
            "    implementation_pr: { required_native_approvals: 0 }",
            "    integration_pr: { required_native_approvals: 0 }",
            "    accepted_findings:",
            "      require_resolution: false",
            "      require_verification_event_for_fixed: false",
            "    github:",
            "      minimum_approving_reviews: 1",
            "      require_code_owner_review: true",
            "      dismiss_stale_reviews_on_push: true",
            "      require_last_push_approval: false",
            "  team:",
            "    implementation_pr: { required_native_approvals: 1 }",
            "    integration_pr: { required_native_approvals: 2 }",
            "    accepted_findings:",
            "      require_resolution: true",
            "      require_verification_event_for_fixed: true",
            "    github:",
            "      minimum_approving_reviews: 2",
            "      require_code_owner_review: true",
            "      dismiss_stale_reviews_on_push: true",
            "      require_last_push_approval: true",
          ].join("\n")
        );
      },
      async (repoRoot) => {
        const prompts = new ScriptedPrompts(
          ["provisioning", "guided-update", "collaboration", "team"],
          [true]
        );
        const update = spyCommand("update");

        const code = await runFlowWizard(repoRoot, new CollectingLogger(), {
          prompts,
          registry: registryWith(spyCommand("init"), spyCommand("adopt"), update),
          collectModel: () => model(),
        });

        expect(code).toBe(0);
        expect(prompts.notes.join("\n")).toContain("mudança de prática global");
        expect(prompts.confirmCalls).toHaveLength(1);
        expect(update.calls).toEqual([["--collaboration-profile", "team"]]);
      }
    );
  });

  it("provisioning não oferece init/adopt/update juntos quando o contexto já escolheu o caminho normal", async () => {
    await withTempRepo(
      (repoRoot) => {
        mkdirSync(path.join(repoRoot, ".governance"), { recursive: true });
      },
      async (repoRoot) => {
        const prompts = new ScriptedPrompts(["provisioning", "details"]);
        const init = spyCommand("init");
        const adopt = spyCommand("adopt");
        const update = spyCommand("update");

        const code = await runFlowWizard(repoRoot, new CollectingLogger(), {
          prompts,
          registry: registryWith(init, adopt, update),
          collectModel: () => model(),
        });

        expect(code).toBe(0);
        expect(init.calls).toEqual([]);
        expect(adopt.calls).toEqual([]);
        expect(update.calls).toEqual([]);
        expect(prompts.selectCalls[1].values).toEqual([
          "guided-update",
          "policy",
          "details",
          "__back__",
        ]);
        expect(prompts.selectCalls[1].values).not.toContain("init");
        expect(prompts.selectCalls[1].values).not.toContain("adopt");
        expect(prompts.notes.join("\n")).toContain("Para este repo: update.");
      }
    );
  });

  it("ferramentas técnicas não abrem a superfície antiga diretamente", async () => {
    const prompts = new ScriptedPrompts(["spec-work", "active-specs"]);
    const workflow = spyCommand("workflow");
    const specs = spyCommand("specs");

    const code = await runFlowWizard("/repo", new CollectingLogger(), {
      prompts,
      registry: registryWith(workflow, specs),
      collectModel: () => model(),
    });

    expect(code).toBe(0);
    expect(specs.calls).toEqual([[]]);
    expect(workflow.calls).toEqual([]);
    expect(prompts.selectCalls[0].names).toContain("Escolher ou iniciar uma spec");
    expect(prompts.selectCalls[1].message).toBe("O que você quer fazer com as specs?");
    expect(prompts.selectCalls[1].names).toContain("Ver specs abertas");
  });

  it("continuar uma spec específica pede identificador e delega ao comando continue", async () => {
    const prompts = new ScriptedPrompts(
      ["spec-work", "continue-other"],
      [],
      [],
      ["context-architecture"]
    );
    const continueCommand = spyCommand("continue");

    const code = await runFlowWizard("/repo", new CollectingLogger(), {
      prompts,
      registry: registryWith(continueCommand),
      collectModel: () => model(),
    });

    expect(code).toBe(0);
    expect(continueCommand.calls).toEqual([["context-architecture"]]);
  });

  it("iniciar spec nova mostra orientação governada sem criar branch, PR ou topologia", async () => {
    const prompts = new ScriptedPrompts(["spec-work", "new-spec"]);
    const continueCommand = spyCommand("continue");
    const workflow = spyCommand("workflow");

    const code = await runFlowWizard("/repo", new CollectingLogger(), {
      prompts,
      registry: registryWith(continueCommand, workflow),
      collectModel: () => model(),
    });

    expect(code).toBe(0);
    expect(continueCommand.calls).toEqual([]);
    expect(workflow.calls).toEqual([]);
    expect(prompts.notes.join("\n")).toContain("não cria spec sozinho");
    expect(prompts.notes.join("\n")).toContain("Peça autorização humana explícita");
    expect(prompts.notes.join("\n")).toContain("criar branch ou PR automaticamente");
  });

  it("ferramentas técnicas ficam restritas a diagnóstico, publicação e operações finais", async () => {
    const prompts = new ScriptedPrompts(["advanced", "__back__"]);

    const code = await runFlowWizard("/repo", new CollectingLogger(), {
      prompts,
      registry: registryWith(),
      collectModel: () => model(),
    });

    expect(code).toBe(0);
    expect(prompts.selectCalls[1].message).toBe("Ferramentas técnicas e diagnósticos");
    expect(prompts.selectCalls[1].names).not.toContain("Ver specs abertas");
    expect(prompts.selectCalls[1].names).not.toContain("Trocar para outra spec pelo ID ou nome");
  });

  it("provisioning em repo existente sem governança recomenda adopt no caminho principal", async () => {
    await withTempRepo(
      (repoRoot) => {
        writeFileSync(path.join(repoRoot, "package.json"), '{"name":"consumer"}\n');
      },
      async (repoRoot) => {
        const prompts = new ScriptedPrompts(["provisioning", "adopt"]);
        const adopt = spyCommand("adopt");

        const code = await runFlowWizard(repoRoot, new CollectingLogger(), {
          prompts,
          registry: registryWith(spyCommand("init"), adopt, spyCommand("update")),
          collectModel: () => model(),
        });

        expect(code).toBe(0);
        expect(adopt.calls).toEqual([[]]);
        expect(prompts.selectCalls[0].names).toContain("Adotar ai-guidelines neste repositório");
        expect(prompts.selectCalls[1].values).toEqual(["adopt", "details", "__back__"]);
        expect(prompts.selectCalls[1].names[0]).toBe("Adotar ai-guidelines neste repositório");
      }
    );
  });

  it("provisioning em diretório vazio recomenda init no caminho principal", async () => {
    await withTempRepo(
      () => undefined,
      async (repoRoot) => {
        const prompts = new ScriptedPrompts(["provisioning", "init"]);
        const init = spyCommand("init");

        const code = await runFlowWizard(repoRoot, new CollectingLogger(), {
          prompts,
          registry: registryWith(init, spyCommand("adopt"), spyCommand("update")),
          collectModel: () => model(),
        });

        expect(code).toBe(0);
        expect(init.calls).toEqual([[]]);
        expect(prompts.selectCalls[0].names).toContain("Iniciar ai-guidelines neste repositório");
        expect(prompts.selectCalls[1].values).toEqual(["init", "details", "__back__"]);
        expect(prompts.selectCalls[1].names[0]).toBe("Iniciar ai-guidelines neste repositório");
      }
    );
  });

  it("validação intermediária executa validate changed com task visual", async () => {
    const prompts = new ScriptedPrompts(["validate", "changed"]);
    const validate = spyCommand("validate");

    const code = await runFlowWizard("/repo", new CollectingLogger(), {
      prompts,
      registry: registryWith(validate),
      collectModel: () => model(),
    });

    expect(code).toBe(0);
    expect(validate.calls).toEqual([["changed"]]);
    expect(prompts.taskTitles).toEqual(["Validar o diff"]);
    expect(prompts.taskLogTitles).toEqual(["Etapas da validação"]);
    expect(prompts.taskLogMessages.join("\n")).toContain(
      "validate changed:success:Validação intermediária passou."
    );
  });

  it("validação com --fix exige confirmação antes de formatar", async () => {
    const prompts = new ScriptedPrompts(["validate", "changed-fix"], [true]);
    const validate = spyCommand("validate");

    const code = await runFlowWizard("/repo", new CollectingLogger(), {
      prompts,
      registry: registryWith(validate),
      collectModel: () => model(),
    });

    expect(code).toBe(0);
    expect(validate.calls).toEqual([["changed", "--fix"]]);
    expect(prompts.taskTitles).toEqual(["Formatar e validar o diff"]);
    expect(prompts.taskLogMessages.join("\n")).toContain(
      "validate changed --fix:message:2/4 Conferindo formatação dos arquivos alterados."
    );
  });

  it("validação com --fix cancelada não executa comando", async () => {
    const prompts = new ScriptedPrompts(["validate", "changed-fix"], [false]);
    const validate = spyCommand("validate");

    const code = await runFlowWizard("/repo", new CollectingLogger(), {
      prompts,
      registry: registryWith(validate),
      collectModel: () => model(),
    });

    expect(code).toBe(0);
    expect(validate.calls).toEqual([]);
  });

  it("comando raiz em TTY chama o wizard", async () => {
    const logger = new CollectingLogger();
    const prompts = new ScriptedPrompts(["quit"]);
    const registry = registryWith();
    const calls: string[] = [];

    const code = await run([], {
      logger,
      prompts,
      registry,
      isTTY: true,
      runFlowWizard: async () => {
        calls.push("wizard");
        return 0;
      },
    });

    expect(code).toBe(0);
    expect(calls).toEqual(["wizard"]);
  });

  it("comando raiz non-TTY imprime cockpit e não abre prompt", async () => {
    const logger = new CollectingLogger();
    const prompts = new ScriptedPrompts(["quit"]);
    const calls: string[] = [];

    const code = await run([], {
      logger,
      prompts,
      registry: registryWith(),
      isTTY: false,
      runCockpit: () => {
        calls.push("cockpit");
        return 0;
      },
      runFlowWizard: async () => {
        calls.push("wizard");
        return 0;
      },
    });

    expect(code).toBe(0);
    expect(calls).toEqual(["cockpit"]);
    expect(prompts.selectCalls).toEqual([]);
  });

  it("cancelamento no wizard sai limpo sem executar comando", async () => {
    const prompts = new ScriptedPrompts(["__cancel__"]);
    const decide = spyCommand("decide");

    const code = await runFlowWizard("/repo", new CollectingLogger(), {
      prompts,
      registry: registryWith(decide),
      collectModel: () => model(),
    });

    expect(code).toBe(0);
    expect(decide.calls).toEqual([]);
    expect(prompts.cancels).toEqual(["Operação cancelada pelo usuário."]);
    expect(prompts.outros).toContain("Saindo sem alterações.");
  });
});
