import { WorkflowState } from "../domain/workflow/WorkflowState.js";
import { ClipboardWriter } from "../app/ports/ClipboardWriter.js";
import { Prompts, SelectOptions, InputOptions } from "../app/ports/Prompts.js";
import { WorkflowFileSystem } from "../app/ports/WorkflowFileSystem.js";
import { ListActiveSpecsResult } from "../app/workflow/ListActiveSpecs.js";
import {
  Logger,
  buildContextBundle,
  buildMenu,
  classifyInput,
  findActiveSpecByIdentifier,
  main,
  renderActiveSpecsIndex,
  runContinue,
  runPublishState,
  runWorkflow,
} from "./workflow.js";
import { PublishState } from "../app/workflow/PublishState.js";
import {
  parseActiveSpecs,
  stringifyActiveSpecs,
} from "../infrastructure/yaml/activeSpecsSerializer.js";
import { parseWorkflowState } from "../infrastructure/yaml/workflowStateSerializer.js";

class CollectingLogger implements Logger {
  readonly lines: string[] = [];
  info(msg: string): void {
    this.lines.push(msg);
  }
  error(msg: string): void {
    this.lines.push(`ERR: ${msg}`);
  }
}

/**
 * Stub de `Prompts` para tests. Cada chamada (`select` ou `input`) consome
 * a próxima resposta do array. Para `select`, a resposta é o `value` esperado
 * — se não bater com nenhum choice, lança erro com diagnóstico.
 */
class FakePrompts implements Prompts {
  private idx = 0;
  constructor(private readonly answers: ReadonlyArray<string>) {}
  async select<T = string>(options: SelectOptions<T>): Promise<T> {
    const answer = this.answers[this.idx++];
    if (answer === undefined) {
      throw new Error(`FakePrompts: select sem resposta restante (message="${options.message}")`);
    }
    const choice = options.choices.find((c) => String(c.value) === answer);
    if (!choice) {
      throw new Error(
        `FakePrompts: nenhum choice match para "${answer}" em select "${options.message}". ` +
          `Choices disponíveis: ${options.choices.map((c) => c.value).join(", ")}`
      );
    }
    return choice.value;
  }
  async input(_options: InputOptions): Promise<string> {
    const answer = this.answers[this.idx++];
    return answer ?? "";
  }
}

class FakeClipboard implements ClipboardWriter {
  copied: string | null = null;
  async copy(text: string): Promise<boolean> {
    this.copied = text;
    return true;
  }
}

/**
 * Auto-populate dirs Set with all ancestors of each entry, and derive
 * `listDirectory` listings from it. Mimics real filesystem semantics needed
 * by `DetectActiveSpec` (id-based lookup per [DEC-0023-I01]): given a dir
 * `.governance/specs/0023-workflow-runtime`, `directoryExists(".governance/specs")`
 * must be true and `listDirectory(".governance/specs")` must include
 * `0023-workflow-runtime`.
 */
function expandAncestors(dirs: Set<string>): Set<string> {
  const expanded = new Set<string>(dirs);
  for (const d of dirs) {
    const parts = d.split("/");
    for (let i = parts.length - 1; i > 0; i--) {
      const ancestor = parts.slice(0, i).join("/");
      if (ancestor) expanded.add(ancestor);
    }
  }
  return expanded;
}

function deriveListing(allDirs: Set<string>, path: string): ReadonlyArray<string> {
  const prefix = `${path}/`;
  const children = new Set<string>();
  for (const d of allDirs) {
    if (d.startsWith(prefix)) {
      const firstSeg = d.slice(prefix.length).split("/")[0];
      if (firstSeg) children.add(firstSeg);
    }
  }
  return [...children];
}

class StubFs implements WorkflowFileSystem {
  private readonly allDirs: Set<string>;

  constructor(
    private readonly files: Map<string, string>,
    dirs: Set<string>,
    private readonly branch: string | null
  ) {
    this.allDirs = expandAncestors(dirs);
  }
  fileExists(p: string): boolean {
    return this.files.has(p);
  }
  directoryExists(p: string): boolean {
    return this.allDirs.has(p);
  }
  readTextFile(p: string): string {
    const f = this.files.get(p);
    if (f === undefined) throw new Error(`missing ${p}`);
    return f;
  }
  writeTextFile(): void {
    throw new Error("not used");
  }
  listDirectory(p: string): ReadonlyArray<string> {
    return deriveListing(this.allDirs, p);
  }
  currentBranch(): string | null {
    return this.branch;
  }
  resolveAbsolute(p: string): string {
    return `/repo/${p}`;
  }
}

const sampleSpec = `# Spec 0023 — Workflow Runtime

> Status: Draft (Stage B)

Conteúdo.
`;
const sampleState = `stage: implementation
gate:
  status: closed
focus:
  - workflow-runtime
next:
  - executar PR1
`;

function makeFsWithSpec(): StubFs {
  return new StubFs(
    new Map([
      [".governance/specs/0023-workflow-runtime/spec.md", sampleSpec],
      [".governance/specs/0023-workflow-runtime/state.yml", sampleState],
    ]),
    new Set([".governance/specs/0023-workflow-runtime"]),
    "feat/spec-0023-workflow-runtime"
  );
}

function makeFsWithSpecAndTasks(): StubFs {
  return new StubFs(
    new Map([
      [".governance/specs/0023-workflow-runtime/spec.md", sampleSpec],
      [".governance/specs/0023-workflow-runtime/state.yml", sampleState],
      [".governance/specs/0023-workflow-runtime/tasks.md", "# Tasks\n- [ ] tarefa 1"],
    ]),
    new Set([".governance/specs/0023-workflow-runtime"]),
    "feat/spec-0023-workflow-runtime"
  );
}

describe("CLI — workflow [BR-WORKFLOW-CLI]", () => {
  describe("classifyInput", () => {
    it("DADO input vazio ENTÃO trata como 'briefing'", () => {
      expect(classifyInput("")).toEqual({ kind: "structured", name: "briefing" });
    });

    it("DADO 'q' ENTÃO retorna menu key q", () => {
      expect(classifyInput("q")).toEqual({ kind: "menu", key: "q" });
    });

    it("DADO número ENTÃO retorna menu key", () => {
      expect(classifyInput("3")).toEqual({ kind: "menu", key: "3" });
    });

    it("DADO 'briefing' ou 'quit' ENTÃO classifica como structured", () => {
      expect(classifyInput("briefing")).toEqual({ kind: "structured", name: "briefing" });
      expect(classifyInput("quit")).toEqual({ kind: "structured", name: "quit" });
      expect(classifyInput("exit")).toEqual({ kind: "structured", name: "quit" });
    });

    it("DADO texto livre ENTÃO classifica como free-text", () => {
      expect(classifyInput("acho que estamos overengineering")).toEqual({
        kind: "free-text",
        text: "acho que estamos overengineering",
      });
    });
  });

  describe("buildMenu", () => {
    it("DADO gate fechado ENTÃO inclui apenas uma opção de 'blockers' (omite a segunda variante)", () => {
      const state: WorkflowState = {
        stage: "implementation",
        gate: { status: "closed" },
        focus: [],
        next: ["x"],
      };
      const menu = buildMenu(state);
      const blockersItems = menu.filter((m) => m.action === "blockers");
      expect(blockersItems).toHaveLength(1);
    });

    it("DADO gate aberto ENTÃO inclui as duas variantes de 'blockers' (lacunas E critérios)", () => {
      const state: WorkflowState = {
        stage: "discovery",
        gate: { status: "open" },
        focus: [],
        next: [],
      };
      const menu = buildMenu(state);
      const blockersItems = menu.filter((m) => m.action === "blockers");
      expect(blockersItems).toHaveLength(2);
    });

    it("DADO state.next vazio ENTÃO não oferece ação 'execute-next'", () => {
      const state: WorkflowState = {
        stage: "discovery",
        gate: { status: "open" },
        focus: [],
        next: [],
      };
      const menu = buildMenu(state);
      expect(menu.find((m) => m.action === "execute-next")).toBeUndefined();
    });

    it("DADO gate fechado E state.next presente ENTÃO keys numéricas são sequenciais 1,2,3 sem gaps (regressão runtime 2026-05-23)", () => {
      // Bug observado em runtime: com gate=closed, menu exibia 1,2,4 (pulando
      // 3 porque key "3" era omitido literal). Fix: renumeração dinâmica
      // posicional. Inconsistência posicional destrói confiança operacional
      // do wizard — `key` agora é display puro, dispatch usa `action`.
      const state: WorkflowState = {
        stage: "implementation",
        gate: { status: "closed" },
        focus: [],
        next: ["fazer X"],
      };
      const menu = buildMenu(state);
      const numericKeys = menu.filter((m) => m.key !== "q").map((m) => m.key);
      expect(numericKeys).toEqual(["1", "2", "3"]);
    });

    it("DADO gate aberto E state.next presente ENTÃO keys numéricas sequenciais 1,2,3,4 (sanity check)", () => {
      const state: WorkflowState = {
        stage: "discovery",
        gate: { status: "open" },
        focus: [],
        next: ["fazer X"],
      };
      const menu = buildMenu(state);
      const numericKeys = menu.filter((m) => m.key !== "q").map((m) => m.key);
      expect(numericKeys).toEqual(["1", "2", "3", "4"]);
    });
  });

  describe("buildContextBundle", () => {
    it("DADO pergunta em texto livre ENTÃO produz bundle com contexto + pergunta", () => {
      const bundle = buildContextBundle(
        {
          location: {
            slug: "0023-workflow-runtime",
            absolutePath: "/repo/.governance/specs/0023-workflow-runtime",
            source: "governance",
          },
          state: {
            stage: "decision",
            gate: { status: "awaiting-review" },
            focus: ["x"],
            next: ["y"],
          },
          defaulted: false,
          headers: { title: "Workflow Runtime", status: null, openHypotheses: [], blockers: [] },
        },
        "acho que estamos overengineering"
      );
      expect(bundle).toMatch(/Spec: 0023-workflow-runtime/);
      expect(bundle).toMatch(/Stage: decision/);
      expect(bundle).toMatch(/Pergunta: acho que estamos overengineering/);
    });
  });

  describe("runWorkflow", () => {
    it("DADO wizard opção 1 (continuar spec atual) E usuário escolhe sair no REPL ENTÃO retorna 0 com briefing emitido", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["continue-current", "q"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
      });
      expect(code).toBe(0);
      expect(logger.lines.join("\n")).toMatch(/Spec: 0023-workflow-runtime/);
    });

    it("DADO wizard opção 1 + texto livre digitado ENTÃO gera contexto da spec e copia para clipboard", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts([
        "continue-current",
        "acho que estamos overengineering",
        "q",
      ]);
      const clip = new FakeClipboard();
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: clip,
        fs: makeFsWithSpec(),
      });
      expect(code).toBe(0);
      expect(clip.copied).not.toBeNull();
      expect(clip.copied!).toMatch(/Pergunta: acho que estamos overengineering/);
    });

    it("DADO wizard opção 1 mas branch fora do padrão ENTÃO retorna 1 com mensagem de erro", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["continue-current"]);
      const fs = new StubFs(new Map(), new Set(), "main");
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs,
      });
      expect(code).toBe(1);
      expect(logger.lines.some((l) => l.startsWith("ERR:"))).toBe(true);
    });

    it("DADO wizard opção q (sair) no boot ENTÃO retorna 0 sem invocar briefing nem REPL", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["quit"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
      });
      expect(code).toBe(0);
      // Quit no wizard NÃO deve disparar briefing nem REPL.
      expect(logger.lines.join("\n")).not.toMatch(/Spec: 0023-workflow-runtime/);
      // Inquirer renderiza o menu direto no stdout/TTY (não via logger),
      // então não asseguramos texto "Wizard operacional" no logger — apenas
      // a ausência de side-effects pós-quit.
    });

    it("DADO wizard opção 3 (publish-state help) ENTÃO emite instruções e retorna 0", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["publish-state-help"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
      });
      expect(code).toBe(0);
      expect(logger.lines.join("\n")).toMatch(/publish-state --status=/);
    });

    // NOTA: o teste antigo "opção desconhecida no wizard" foi removido após migração para
    // inquirer/select — agora é impossível digitar opção fora da lista (inquirer restringe
    // navegação às choices declaradas).

    it("DADO wizard opção 6 + tipo 'a' (arquitetura, sem contexto) E template existe ENTÃO copia briefing para clipboard, emite confirmação no logger E NÃO renderiza o prompt", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["visual-prompt", "architecture"]);
      const clip = new FakeClipboard();
      const files = new Map<string, string>([
        [
          ".governance/visual-prompts/architecture-end-to-end.prompt.md",
          "Investigate the current repo and produce a finished image prompt.\n",
        ],
      ]);
      const fs = new StubFs(files, new Set(), "feat/spec-0023-workflow-runtime");
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: clip,
        fs,
      });
      const out = logger.lines.join("\n");
      expect(code).toBe(0);
      // Mensagem de copy + instruções aparecem; arquitetura agora vai para IA conversacional
      // (caminho consistente com value-delivered).
      expect(out).toMatch(/COMO USAR \(destino: IA conversacional/);
      expect(out).toMatch(/✓ Prompt copiado para o clipboard/);
      // O conteúdo do briefing NÃO aparece no terminal (por design — está no clipboard)
      expect(out).not.toMatch(/Investigate the current repo/);
      // Mas o conteúdo correto foi para o clipboard
      expect(clip.copied).toBe(
        "Investigate the current repo and produce a finished image prompt.\n"
      );
    });

    it("DADO wizard opção 6 + tipo 'b' (valor) + contexto 'PR #25' ENTÃO substitui {{context}} e envia para clipboard com sucesso", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["visual-prompt", "value-delivered", "PR #25"]);
      const clip = new FakeClipboard();
      const files = new Map<string, string>([
        [
          ".governance/visual-prompts/value-delivered.prompt.md",
          "Investigate {{context}} and produce a finished image prompt for {{context}}.\n",
        ],
      ]);
      const fs = new StubFs(files, new Set(), "feat/spec-0023-workflow-runtime");
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: clip,
        fs,
      });
      const out = logger.lines.join("\n");
      expect(code).toBe(0);
      // Instruções de IA conversacional + confirmação de copy
      expect(out).toMatch(/COMO USAR \(destino: IA conversacional/);
      expect(out).toMatch(/✓ Prompt copiado para o clipboard/);
      // Conteúdo enviado ao clipboard tem {{context}} substituído por "PR #25"
      expect(clip.copied).toBe(
        "Investigate PR #25 and produce a finished image prompt for PR #25.\n"
      );
      expect(clip.copied).not.toMatch(/\{\{context\}\}/);
    });

    it("DADO wizard opção 6 + tipo 'b' + contexto inválido 'spec' (sem identificador) ENTÃO emite erro narrativo e quit gracioso", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["visual-prompt", "value-delivered", "spec"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
      });
      expect(code).toBe(0);
      expect(logger.lines.some((l) => l.includes('Contexto não reconhecido: "spec"'))).toBe(true);
    });

    // NOTA: opção `value-delivered-auto` (placeholder "em breve") removida do
    // menu — confundia UX expor opção não-funcional. Modo automático fica
    // como sub-escopo da candidata `governance-dashboard-and-visual-artifacts`
    // (backlog Now); quando materializar, adicionará variantes ao menu.

    it("DADO wizard opção 6 + tipo 'b' SEM contexto fornecido ENTÃO emite erro e quit gracioso", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["visual-prompt", "value-delivered", ""]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
      });
      expect(code).toBe(0);
      expect(logger.lines.some((l) => l.includes("Contexto vazio"))).toBe(true);
    });

    // NOTA: o teste antigo "tipo desconhecido em visual prompts" foi removido após migração
    // para inquirer/select — o submenu de tipos restringe escolhas válidas na fonte.

    it("DADO wizard opção 6 + tipo válido MAS template ausente no filesystem ENTÃO emite erro e retorna 1", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["visual-prompt", "architecture"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
      });
      expect(code).toBe(1);
      expect(logger.lines.some((l) => l.includes('Template "architecture-end-to-end"'))).toBe(true);
    });
  });

  describe("runContinue", () => {
    it("DADO spec detectada com state.next ENTÃO imprime briefing + próxima ação", async () => {
      const logger = new CollectingLogger();
      const code = await runContinue({
        repoRoot: "/repo",
        logger,
        fs: makeFsWithSpecAndTasks(),
      });
      expect(code).toBe(0);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/Stage: implementation/);
      expect(out).toMatch(/Próxima ação: executar PR1/);
    });

    it("DADO spec detectada MAS tasks.md ausente QUANDO runContinue ENTÃO recusa narrativamente E retorna 1", async () => {
      const logger = new CollectingLogger();
      const code = await runContinue({
        repoRoot: "/repo",
        logger,
        fs: makeFsWithSpec(),
      });
      expect(code).toBe(1);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/ERR: Execution locked\./);
      expect(out).toMatch(/ERR: Missing:/);
      expect(out).toMatch(
        /ERR: - tasks\.md em \.governance\/specs\/0023-workflow-runtime\/tasks\.md \(não encontrado\)/
      );
      expect(out).not.toMatch(/gate\.status/);
    });

    it("DADO spec detectada MAS gate aberto QUANDO runContinue ENTÃO recusa narrativamente E retorna 1", async () => {
      const logger = new CollectingLogger();
      const openState = sampleState.replace("status: closed", "status: open");
      const fs = new StubFs(
        new Map([
          [".governance/specs/0023-workflow-runtime/spec.md", sampleSpec],
          [".governance/specs/0023-workflow-runtime/state.yml", openState],
          [".governance/specs/0023-workflow-runtime/tasks.md", "# Tasks"],
        ]),
        new Set([".governance/specs/0023-workflow-runtime"]),
        "feat/spec-0023-workflow-runtime"
      );

      const code = await runContinue({
        repoRoot: "/repo",
        logger,
        fs,
      });
      expect(code).toBe(1);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/ERR: Execution locked\./);
      expect(out).toMatch(/ERR: Missing:/);
      expect(out).toMatch(/ERR: - planning gate\.status == closed \(atual: open\)/);
      expect(out).not.toMatch(/tasks\.md/);
    });

    it("DADO spec detectada MAS tasks.md ausente E gate aberto QUANDO runContinue ENTÃO recusa com ambas as violações E retorna 1", async () => {
      const logger = new CollectingLogger();
      const openState = sampleState.replace("status: closed", "status: open");
      const fs = new StubFs(
        new Map([
          [".governance/specs/0023-workflow-runtime/spec.md", sampleSpec],
          [".governance/specs/0023-workflow-runtime/state.yml", openState],
        ]),
        new Set([".governance/specs/0023-workflow-runtime"]),
        "feat/spec-0023-workflow-runtime"
      );

      const code = await runContinue({
        repoRoot: "/repo",
        logger,
        fs,
      });
      expect(code).toBe(1);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/ERR: Execution locked\./);
      expect(out).toMatch(/ERR: Missing:/);
      expect(out).toMatch(
        /ERR: - tasks\.md em \.governance\/specs\/0023-workflow-runtime\/tasks\.md \(não encontrado\)/
      );
      expect(out).toMatch(/ERR: - planning gate\.status == closed \(atual: open\)/);
    });

    it("DADO spec não detectada ENTÃO retorna 1", async () => {
      const logger = new CollectingLogger();
      const code = await runContinue({
        repoRoot: "/repo",
        logger,
        fs: new StubFs(new Map(), new Set(), null),
      });
      expect(code).toBe(1);
    });
  });

  describe("renderActiveSpecsIndex — helper puro (lookup-only, sem coordination)", () => {
    const emptyResult: ListActiveSpecsResult = {
      indexAvailable: true,
      entries: [],
      warnings: [],
    };
    const absentResult: ListActiveSpecsResult = {
      indexAvailable: false,
      entries: [],
      warnings: ["Index not found. Run yarn guidelines workflow publish-state to populate."],
    };
    const oneEntryResult: ListActiveSpecsResult = {
      indexAvailable: true,
      entries: [
        {
          entry: {
            id: "0023",
            slug: "workflow-runtime",
            branch: "feat/spec-0023-runtime-active-state",
            stage: "implementation",
            status: "active",
            specPath: ".governance/specs/0023-workflow-runtime",
            updatedAt: "2026-05-21T00:00:00Z",
          },
          specPathExists: true,
        },
      ],
      warnings: [],
    };

    it("DADO indexAvailable=false E showWhenAbsent default(false) QUANDO renderActiveSpecsIndex ENTÃO retorna lista vazia (silencioso no bootstrap)", () => {
      expect(renderActiveSpecsIndex(absentResult)).toEqual([]);
    });

    it("DADO indexAvailable=false E showWhenAbsent=true QUANDO renderActiveSpecsIndex ENTÃO retorna heading + warning informativo", () => {
      const lines = renderActiveSpecsIndex(absentResult, undefined, { showWhenAbsent: true });
      expect(lines.join("\n")).toMatch(/Índice operacional público/);
      expect(lines.join("\n")).toMatch(/publish-state/);
    });

    it("DADO indexAvailable=true E entries vazio QUANDO renderActiveSpecsIndex ENTÃO retorna lista vazia (sem heading inútil)", () => {
      expect(renderActiveSpecsIndex(emptyResult)).toEqual([]);
    });

    it("DADO 1 entry E currentSlug ausente QUANDO renderActiveSpecsIndex ENTÃO loga linha sem marca de spec corrente", () => {
      const lines = renderActiveSpecsIndex(oneEntryResult);
      const out = lines.join("\n");
      expect(out).toMatch(/Specs ativas no índice público/);
      expect(out).toMatch(/workflow-runtime/);
      expect(out).toMatch(/implementation\/active/);
      expect(out).toMatch(/feat\/spec-0023-runtime-active-state/);
      // sem asterisco quando currentSlug é undefined
      expect(out).not.toMatch(/\* ✓ workflow-runtime/);
    });

    it("DADO entry cujo slug === currentSlug QUANDO renderActiveSpecsIndex ENTÃO marca a entry corrente com '*'", () => {
      const lines = renderActiveSpecsIndex(oneEntryResult, "workflow-runtime");
      expect(lines.join("\n")).toMatch(/\* ✓ workflow-runtime/);
    });

    it("DADO currentSlug no formato id-slug (nome do diretório de DetectActiveSpec) QUANDO renderActiveSpecsIndex ENTÃO marca corrente — match tri-form (descoberta operacional Passo 7)", () => {
      // ctx.location.slug = "0023-workflow-runtime" (formato do diretório);
      // entry.slug do índice = "workflow-runtime" (formato editorial).
      // Match deve aceitar ambos para que a spec corrente seja sinalizada
      // corretamente quando o REPL roda na branch dela.
      const lines = renderActiveSpecsIndex(oneEntryResult, "0023-workflow-runtime");
      expect(lines.join("\n")).toMatch(/\* ✓ workflow-runtime/);
    });

    it("DADO currentSlug = id puro QUANDO renderActiveSpecsIndex ENTÃO marca corrente — match tri-form", () => {
      const lines = renderActiveSpecsIndex(oneEntryResult, "0023");
      expect(lines.join("\n")).toMatch(/\* ✓ workflow-runtime/);
    });

    it("DADO entry com specPathExists=false QUANDO renderActiveSpecsIndex ENTÃO mostra '✗' E loga linha de drift narrativa", () => {
      const driftResult: ListActiveSpecsResult = {
        indexAvailable: true,
        entries: [
          {
            entry: oneEntryResult.entries[0].entry,
            specPathExists: false,
          },
        ],
        warnings: [
          `Spec "workflow-runtime" declares spec_path "${oneEntryResult.entries[0].entry.specPath}" in the index, but the directory is missing locally.`,
        ],
      };
      const out = renderActiveSpecsIndex(driftResult).join("\n");
      expect(out).toMatch(/✗ workflow-runtime/);
      expect(out).toMatch(/\(drift\) Spec "workflow-runtime"/);
    });
  });

  describe("runWorkflow + índice operacional público", () => {
    const indexWithCurrent: ListActiveSpecsResult = {
      indexAvailable: true,
      entries: [
        {
          entry: {
            id: "0023",
            slug: "0023-workflow-runtime",
            branch: "feat/spec-0023-workflow-runtime",
            stage: "implementation",
            status: "active",
            specPath: ".governance/specs/0023-workflow-runtime",
            updatedAt: "2026-05-21T00:00:00Z",
          },
          specPathExists: true,
        },
      ],
      warnings: [],
    };

    it("DADO wizard opção 1 + spec local detectada + índice presente com a mesma spec ENTÃO loga briefing + seção do índice marcando spec corrente com '*'", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["continue-current", "q"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
        loadActiveSpecsIndex: () => indexWithCurrent,
      });
      const out = logger.lines.join("\n");
      expect(code).toBe(0);
      expect(out).toMatch(/Spec: 0023-workflow-runtime/);
      expect(out).toMatch(/Specs ativas no índice público/);
      expect(out).toMatch(/\* ✓ 0023-workflow-runtime/);
    });

    it("DADO wizard opção 1 + spec local detectada + índice ausente ENTÃO loga briefing sem seção de índice (silencioso quando branch já orienta)", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["continue-current", "q"]);
      const absent: ListActiveSpecsResult = {
        indexAvailable: false,
        entries: [],
        warnings: ["not found"],
      };
      await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
        loadActiveSpecsIndex: () => absent,
      });
      const out = logger.lines.join("\n");
      expect(out).not.toMatch(/Índice operacional público/);
      expect(out).not.toMatch(/Specs ativas no índice público/);
    });

    it("DADO wizard opção 1 + branch fora do padrão + índice presente com 1 entry ENTÃO erro + seção do índice exibida + retorna 1", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["continue-current"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: new StubFs(new Map(), new Set(), "main"),
        loadActiveSpecsIndex: () => indexWithCurrent,
      });
      const out = logger.lines.join("\n");
      expect(code).toBe(1);
      expect(logger.lines.some((l) => l.startsWith("ERR:"))).toBe(true);
      expect(out).toMatch(/Specs ativas no índice público/);
      expect(out).toMatch(/0023-workflow-runtime/);
    });

    it("DADO wizard opção 1 + branch fora do padrão + índice ausente ENTÃO erro + heading com aviso de publish-state + retorna 1", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["continue-current"]);
      const absent: ListActiveSpecsResult = {
        indexAvailable: false,
        entries: [],
        warnings: ["Index not found. Run yarn guidelines workflow publish-state to populate."],
      };
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: new StubFs(new Map(), new Set(), "main"),
        loadActiveSpecsIndex: () => absent,
      });
      expect(code).toBe(1);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/Índice operacional público/);
      expect(out).toMatch(/publish-state/);
    });

    it("DADO wizard opção 4 (ver specs ativas) ENTÃO loga índice e retorna 0 sem invocar briefing", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["list-active"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
        loadActiveSpecsIndex: () => indexWithCurrent,
      });
      const out = logger.lines.join("\n");
      expect(code).toBe(0);
      expect(out).toMatch(/Specs ativas no índice público/);
      expect(out).not.toMatch(/Stage: implementation/);
    });

    it("DADO wizard opção 5 (diagnosticar drift) com entries sem drift ENTÃO loga 'Nenhum drift' e retorna 0", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["diagnose-drift"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
        loadActiveSpecsIndex: () => indexWithCurrent,
      });
      expect(code).toBe(0);
      expect(logger.lines.join("\n")).toMatch(/Nenhum drift detectado/);
    });

    it("DADO runContinue sem identifier QUANDO há índice com entries ENTÃO NÃO loga seção do índice (atalho focado na spec corrente)", async () => {
      const logger = new CollectingLogger();
      await runContinue({
        repoRoot: "/repo",
        logger,
        fs: makeFsWithSpec(),
        // mesmo se passado, runContinue sem identifier não consulta o índice
        loadActiveSpecsIndex: () => indexWithCurrent,
      });
      const out = logger.lines.join("\n");
      expect(out).not.toMatch(/Specs ativas no índice público/);
    });
  });

  describe("findActiveSpecByIdentifier — match exato em id | slug | id-slug", () => {
    const entries = [
      {
        entry: {
          id: "0023",
          slug: "workflow-runtime",
          branch: "feat/spec-0023-runtime-active-state",
          stage: "implementation" as const,
          status: "active" as const,
          specPath: ".governance/specs/0023-workflow-runtime",
          updatedAt: "2026-05-21T00:00:00Z",
        },
        specPathExists: true,
      },
      {
        entry: {
          id: "0099",
          slug: "foo-bar",
          branch: "feat/spec-0099-foo-bar",
          stage: "discovery" as const,
          status: "paused" as const,
          specPath: ".governance/specs/0099-foo-bar",
          updatedAt: "2026-05-01T00:00:00Z",
        },
        specPathExists: false,
      },
    ];

    it("DADO identifier = id puro QUANDO findActiveSpecByIdentifier ENTÃO retorna a entry correspondente", () => {
      expect(findActiveSpecByIdentifier(entries, "0023")?.entry.slug).toBe("workflow-runtime");
      expect(findActiveSpecByIdentifier(entries, "0099")?.entry.slug).toBe("foo-bar");
    });

    it("DADO identifier = slug puro QUANDO findActiveSpecByIdentifier ENTÃO retorna a entry correspondente", () => {
      expect(findActiveSpecByIdentifier(entries, "workflow-runtime")?.entry.id).toBe("0023");
    });

    it("DADO identifier = id-slug (formato de diretório) QUANDO findActiveSpecByIdentifier ENTÃO retorna a entry correspondente", () => {
      expect(findActiveSpecByIdentifier(entries, "0023-workflow-runtime")?.entry.id).toBe("0023");
    });

    it("DADO identifier que não casa QUANDO findActiveSpecByIdentifier ENTÃO retorna null (sem fuzzy)", () => {
      expect(findActiveSpecByIdentifier(entries, "workflow")).toBeNull();
      expect(findActiveSpecByIdentifier(entries, "WORKFLOW-RUNTIME")).toBeNull();
      expect(findActiveSpecByIdentifier(entries, "23")).toBeNull();
      expect(findActiveSpecByIdentifier([], "0023")).toBeNull();
    });
  });

  describe("runContinue + identifier (lookup via índice, sem auto-checkout)", () => {
    function makeIndexResult(
      opts: {
        indexAvailable?: boolean;
        entries?: ListActiveSpecsResult["entries"];
        warnings?: ListActiveSpecsResult["warnings"];
      } = {}
    ): ListActiveSpecsResult {
      return {
        indexAvailable: opts.indexAvailable ?? true,
        entries: opts.entries ?? [],
        warnings: opts.warnings ?? [],
      };
    }

    const reachableEntry = {
      entry: {
        id: "0023",
        slug: "workflow-runtime",
        branch: "feat/spec-0023-runtime-active-state",
        stage: "implementation" as const,
        status: "active" as const,
        specPath: ".governance/specs/0023-workflow-runtime",
        updatedAt: "2026-05-21T00:00:00Z",
      },
      specPathExists: true,
    };

    const unreachableEntry = {
      ...reachableEntry,
      specPathExists: false,
    };

    it("DADO identifier que casa entry com spec_path existente QUANDO runContinue ENTÃO loga briefing E próxima ação da spec encontrada", async () => {
      const logger = new CollectingLogger();
      const code = await runContinue(
        {
          repoRoot: "/repo",
          logger,
          fs: makeFsWithSpecAndTasks(),
          loadActiveSpecsIndex: () => makeIndexResult({ entries: [reachableEntry] }),
        },
        "workflow-runtime"
      );
      expect(code).toBe(0);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/Stage: implementation/);
      expect(out).toMatch(/Próxima ação: executar PR1/);
    });

    it("DADO identifier que casa entry mas spec_path NÃO existe localmente QUANDO runContinue ENTÃO erro instrutivo com git checkout + retorna 1 (sem auto-checkout)", async () => {
      const logger = new CollectingLogger();
      const code = await runContinue(
        {
          repoRoot: "/repo",
          logger,
          fs: new StubFs(new Map(), new Set(), null),
          loadActiveSpecsIndex: () => makeIndexResult({ entries: [unreachableEntry] }),
        },
        "0023"
      );
      expect(code).toBe(1);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/diretório não existe localmente/);
      expect(out).toMatch(/git fetch origin && git checkout feat\/spec-0023-runtime-active-state/);
    });

    it("DADO identifier que NÃO casa nenhuma entry QUANDO runContinue ENTÃO erro listando specs disponíveis + retorna 1", async () => {
      const logger = new CollectingLogger();
      const code = await runContinue(
        {
          repoRoot: "/repo",
          logger,
          fs: new StubFs(new Map(), new Set(), null),
          loadActiveSpecsIndex: () => makeIndexResult({ entries: [reachableEntry] }),
        },
        "ghost"
      );
      expect(code).toBe(1);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/Spec "ghost" não encontrada/);
      expect(out).toMatch(/Specs disponíveis no índice/);
      expect(out).toMatch(/0023 \/ workflow-runtime/);
    });

    it("DADO identifier presente E índice ausente QUANDO runContinue ENTÃO erro com aviso de publish-state + retorna 1", async () => {
      const logger = new CollectingLogger();
      const code = await runContinue(
        {
          repoRoot: "/repo",
          logger,
          fs: new StubFs(new Map(), new Set(), null),
          loadActiveSpecsIndex: () =>
            makeIndexResult({
              indexAvailable: false,
              warnings: ["Index not found."],
            }),
        },
        "0023"
      );
      expect(code).toBe(1);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/Índice operacional público.*não encontrado/);
      expect(out).toMatch(/yarn guidelines workflow publish-state/);
    });

    it("DADO main(['continue', '<identifier>'], opts) QUANDO entry casa E path existe ENTÃO encaminha identifier para runContinue (lookup via índice)", async () => {
      const logger = new CollectingLogger();
      const code = await main(["continue", "0023"], {
        repoRoot: "/repo",
        logger,
        fs: makeFsWithSpecAndTasks(),
        loadActiveSpecsIndex: () => makeIndexResult({ entries: [reachableEntry] }),
      });
      expect(code).toBe(0);
      expect(logger.lines.join("\n")).toMatch(/Stage: implementation/);
    });

    it("DADO main(['continue'], opts) sem identifier QUANDO branch detecta spec ENTÃO mantém comportamento legado (detecção via branch)", async () => {
      const logger = new CollectingLogger();
      const code = await main(["continue"], {
        repoRoot: "/repo",
        logger,
        fs: makeFsWithSpecAndTasks(),
      });
      expect(code).toBe(0);
      expect(logger.lines.join("\n")).toMatch(/Próxima ação: executar PR1/);
    });
  });

  describe("runPublishState — CLI wrapper do PublishState use case", () => {
    class WritableFakeFs implements WorkflowFileSystem {
      files: Map<string, string>;
      dirs: Set<string>;
      branch: string | null;
      constructor(files: Map<string, string>, dirs: Set<string>, branch: string | null) {
        this.files = new Map(files);
        this.dirs = expandAncestors(dirs);
        this.branch = branch;
      }
      fileExists(p: string): boolean {
        return this.files.has(p);
      }
      directoryExists(p: string): boolean {
        return this.dirs.has(p);
      }
      readTextFile(p: string): string {
        const c = this.files.get(p);
        if (c === undefined) throw new Error(`missing ${p}`);
        return c;
      }
      writeTextFile(p: string, contents: string): void {
        this.files.set(p, contents);
      }
      listDirectory(p: string): ReadonlyArray<string> {
        return deriveListing(this.dirs, p);
      }
      currentBranch(): string | null {
        return this.branch;
      }
      resolveAbsolute(p: string): string {
        return `/repo/${p}`;
      }
    }

    function makeWritableFs(): WritableFakeFs {
      return new WritableFakeFs(
        new Map([
          [
            ".governance/specs/0023-workflow-runtime/state.yml",
            `stage: implementation\ngate:\n  status: closed\nfocus: []\nnext: []\n`,
          ],
        ]),
        new Set([".governance/specs/0023-workflow-runtime"]),
        "feat/spec-0023-workflow-runtime"
      );
    }

    function buildPublishStateWithFixedNow(now: Date) {
      return (fs: WorkflowFileSystem) =>
        new PublishState(fs, parseActiveSpecs, stringifyActiveSpecs, parseWorkflowState, () => now);
    }

    it("DADO --status ausente QUANDO runPublishState ENTÃO erro narrativo citando [DEC-0023-G04] E retorna 1", async () => {
      const logger = new CollectingLogger();
      const code = await runPublishState(
        { repoRoot: "/repo", logger, fs: makeWritableFs() },
        { updatedBy: "@x" }
      );
      expect(code).toBe(1);
      expect(logger.lines.join("\n")).toMatch(/--status/);
      expect(logger.lines.join("\n")).toMatch(/\[DEC-0023-G04\]/);
    });

    it("DADO --updated-by ausente QUANDO runPublishState ENTÃO erro narrativo distinguindo 'autorizou' E retorna 1", async () => {
      const logger = new CollectingLogger();
      const code = await runPublishState(
        { repoRoot: "/repo", logger, fs: makeWritableFs() },
        { status: "active" }
      );
      expect(code).toBe(1);
      expect(logger.lines.join("\n")).toMatch(/--updated-by/);
      expect(logger.lines.join("\n")).toMatch(/autorizou/i);
    });

    it("DADO args válidos QUANDO runPublishState ENTÃO escreve índice, loga confirmação E retorna 0", async () => {
      const logger = new CollectingLogger();
      const fs = makeWritableFs();
      const code = await runPublishState(
        {
          repoRoot: "/repo",
          logger,
          fs,
          buildPublishState: buildPublishStateWithFixedNow(new Date("2026-05-21T10:00:00Z")),
        },
        { status: "active", updatedBy: "@rosanarezende" }
      );
      expect(code).toBe(0);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/Spec 0023 \/ workflow-runtime publicada/);
      expect(out).toMatch(/stage=implementation/);
      expect(out).toMatch(/status=active/);
      expect(fs.fileExists(".governance/runtime/active-specs.yml")).toBe(true);
    });

    it("DADO publish já tem entry E args válidos QUANDO runPublishState ENTÃO loga 'atualizada' (não 'publicada')", async () => {
      const logger = new CollectingLogger();
      const fs = makeWritableFs();
      // primeiro publish para popular o índice
      await runPublishState(
        {
          repoRoot: "/repo",
          logger: new CollectingLogger(),
          fs,
          buildPublishState: buildPublishStateWithFixedNow(new Date("2026-05-21T10:00:00Z")),
        },
        { status: "active", updatedBy: "@x" }
      );
      // segundo publish — agora deve ser update
      await runPublishState(
        {
          repoRoot: "/repo",
          logger,
          fs,
          buildPublishState: buildPublishStateWithFixedNow(new Date("2026-05-21T11:00:00Z")),
        },
        { status: "blocked", updatedBy: "@x" }
      );
      expect(logger.lines.join("\n")).toMatch(/atualizada/);
    });

    it("DADO PublishStateError lançado pelo use case QUANDO runPublishState ENTÃO loga mensagem do erro E retorna 1 (sem stack trace)", async () => {
      const logger = new CollectingLogger();
      const fs = makeWritableFs();
      fs.branch = "main"; // branch fora do padrão → DetectActiveSpec falha narrativamente per [DEC-0023-I01]
      const code = await runPublishState(
        { repoRoot: "/repo", logger, fs },
        { status: "active", updatedBy: "@x" }
      );
      expect(code).toBe(1);
      // pós-[DEC-0023-I01]: PublishState propaga o reason de DetectActiveSpec
      // sem consultar projection layer (active-specs.yml).
      expect(
        logger.lines.some(
          (l) =>
            l.startsWith("ERR:") &&
            /Não foi possível detectar spec ativa/.test(l) &&
            /branch "main" não segue o padrão/.test(l)
        )
      ).toBe(true);
    });

    it("DADO main(['workflow', 'publish-state'], opts com publishStateArgs) QUANDO main ENTÃO encaminha para runPublishState", async () => {
      const logger = new CollectingLogger();
      const fs = makeWritableFs();
      const code = await main(["workflow", "publish-state"], {
        repoRoot: "/repo",
        logger,
        fs,
        buildPublishState: buildPublishStateWithFixedNow(new Date("2026-05-21T10:00:00Z")),
        publishStateArgs: { status: "active", updatedBy: "@rosanarezende" },
      } as Parameters<typeof main>[1]);
      expect(code).toBe(0);
      expect(logger.lines.join("\n")).toMatch(/publicada/);
    });
  });
});
