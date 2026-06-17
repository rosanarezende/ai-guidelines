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
  readonly selectCalls: Array<{ readonly message: string; readonly values: readonly string[] }> =
    [];
  readonly notes: string[] = [];
  readonly outros: string[] = [];
  readonly cancels: string[] = [];
  private index = 0;

  constructor(private readonly selections: readonly string[]) {}

  async select<T>(options: { message: string; choices: ReadonlyArray<{ value: T }> }): Promise<T> {
    this.selectCalls.push({
      message: options.message,
      values: options.choices.map((choice) => String(choice.value)),
    });
    const selected = this.selections[this.index++] ?? String(options.choices[0]?.value ?? "");
    if (selected === "__cancel__") {
      throw new PromptCancelledError();
    }
    return selected as T;
  }

  async input(): Promise<string> {
    return "";
  }

  async confirm(): Promise<boolean> {
    return false;
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

function registryWith(...commands: Command<unknown>[]): CommandRegistry {
  const registry = new CommandRegistry();
  for (const command of commands) registry.register(command);
  return registry;
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
          description: "Declarar readiness de CO-10.2",
          basis: [],
          commands: [],
          stillForbidden: [],
          decisionType: "mark-readiness",
        },
      } as never,
    },
    decisions: [],
    flow: {
      actions: [],
      available: [],
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
      recommended: {
        id: "mark-readiness",
        title: "Declarar readiness do sub-checkpoint ativo",
        availability: { status: "available", reasons: [] },
        command: "npm run flow -- decide --type mark-readiness --brief-only",
        mutatingCommand:
          "npm run flow -- decide --type mark-readiness --decision mark-ready --authorization explicit-human-decision --confirm",
        effect: ["altera somente tasks.md"],
      },
    },
  };
}

describe("flow wizard", () => {
  it("menu principal expõe cockpit/provisioning e não lista providers como ação", () => {
    const values = buildFlowMenu(model()).map((item) => item.value);
    expect(values).toEqual(
      expect.arrayContaining(["cockpit", "next", "decisions", "blockers", "work", "provisioning"])
    );
    expect(values).not.toContain("providers");
  });

  it("continuar próxima ação recomendada delega para decide sem regra própria", async () => {
    const prompts = new ScriptedPrompts(["next"]);
    const decide = spyCommand("decide");
    const logger = new CollectingLogger();

    const code = await runFlowWizard("/repo", logger, {
      prompts,
      registry: registryWith(decide),
      collectModel: () => model(),
    });

    expect(code).toBe(0);
    expect(decide.calls).toEqual([[]]);
  });

  it("provisioning mostra init/adopt/update e não oferece providers", async () => {
    const prompts = new ScriptedPrompts(["provisioning", "update"]);
    const update = spyCommand("update");

    const code = await runFlowWizard("/repo", new CollectingLogger(), {
      prompts,
      registry: registryWith(spyCommand("init"), spyCommand("adopt"), update),
      collectModel: () => model(),
    });

    expect(code).toBe(0);
    expect(update.calls).toEqual([[]]);
    expect(prompts.selectCalls[1].values).toEqual(
      expect.arrayContaining(["init", "adopt", "update"])
    );
    expect(prompts.selectCalls[1].values).not.toContain("providers");
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
