import { Command, CommandContext, CommandResult, Logger } from "./Command.js";
import { ConfirmOptions, InputOptions, Prompts, SelectOptions } from "../../app/ports/Prompts.js";

/**
 * Etapa 1 da convergência das ops avançadas (Spec 0024, #35): o contrato `Command`
 * ganha um produtor de input INTERATIVO — `prompt?(ctx)` — como dual opcional de
 * `parse(argv)`. A tese arquitetural a provar aqui: **um único `run`, dois
 * produtores de options** (argv na CLI; humano no wizard via `ctx.prompts`). A
 * extensão é ADITIVA/OPCIONAL — comandos read-only/scriptáveis seguem só com
 * `parse`, e o `CommandContext` da CLI direta segue válido sem `prompts`.
 */

function fakeLogger(): Logger {
  return { info: () => {}, error: () => {} };
}

/**
 * Prompts fake: respostas predefinidas + registro das mensagens vistas. Espelha o
 * padrão de fakes de porta já usado nos testes do wizard (sem tocar inquirer).
 */
function fakePrompts(answers: {
  select?: string;
  input?: string;
  confirm?: boolean;
}): Prompts & { messages: string[] } {
  const messages: string[] = [];
  return {
    messages,
    async select<T = string>(options: SelectOptions<T>): Promise<T> {
      messages.push(options.message);
      return (answers.select ?? options.choices[0]?.value) as T;
    },
    async input(options: InputOptions): Promise<string> {
      messages.push(options.message);
      return answers.input ?? options.default ?? "";
    },
    async confirm(options: ConfirmOptions): Promise<boolean> {
      messages.push(options.message);
      return answers.confirm ?? options.default ?? false;
    },
  };
}

interface DemoOptions {
  readonly mode: string;
  readonly confirmed: boolean;
}

/**
 * Comando-demonstração: `parse` lê do argv; `prompt` lê do humano via
 * `ctx.prompts`. Ambos produzem o MESMO `DemoOptions`, consumido pelo MESMO
 * `run`. Registra o que rodou para provar a convergência.
 */
class DemoCommand implements Command<DemoOptions> {
  readonly name = "demo";
  readonly ranWith: DemoOptions[] = [];

  parse(argv: readonly string[]): DemoOptions {
    return { mode: argv[0] ?? "unit", confirmed: argv.includes("--yes") };
  }

  async prompt(context: CommandContext): Promise<DemoOptions> {
    if (!context.prompts) {
      throw new Error("prompt() requer context.prompts (a superfície humana injeta).");
    }
    const mode = await context.prompts.select<string>({
      message: "Modo de execução",
      choices: [
        { name: "unit", value: "unit" },
        { name: "sequential", value: "sequential" },
      ],
    });
    const confirmed = await context.prompts.confirm({
      message: "Confirmar?",
      default: false,
    });
    return { mode, confirmed };
  }

  async run(options: DemoOptions, _context: CommandContext): Promise<CommandResult> {
    this.ranWith.push(options);
    return { exitCode: 0 };
  }
}

describe("Command — contrato com prompt() opcional (dual interativo de parse)", () => {
  it("DADO um comando com prompt() QUANDO recebe ctx.prompts ENTÃO coleta options interativamente e run() as consome", async () => {
    const cmd = new DemoCommand();
    const prompts = fakePrompts({ select: "sequential", confirm: true });
    const context: CommandContext = { repoRoot: "/repo", logger: fakeLogger(), prompts };

    const options = await cmd.prompt(context);
    const result = await cmd.run(options, context);

    expect(options).toEqual({ mode: "sequential", confirmed: true });
    expect(result.exitCode).toBe(0);
    expect(cmd.ranWith).toEqual([{ mode: "sequential", confirmed: true }]);
    expect(prompts.messages).toEqual(["Modo de execução", "Confirmar?"]);
  });

  it("DADO o MESMO comando QUANDO parse(argv) e prompt(ctx) produzem as mesmas options ENTÃO ambas fluem pelo MESMO run (um sistema, dois produtores)", async () => {
    const cmd = new DemoCommand();
    const prompts = fakePrompts({ select: "unit", confirm: false });
    const context: CommandContext = { repoRoot: "/repo", logger: fakeLogger(), prompts };

    const fromParse = cmd.parse(["unit"]);
    const fromPrompt = await cmd.prompt(context);

    expect(fromPrompt).toEqual(fromParse);

    await cmd.run(fromParse, context);
    await cmd.run(fromPrompt, context);

    expect(cmd.ranWith).toEqual([fromParse, fromParse]);
  });

  it("DADO prompt() opcional QUANDO um comando read-only NÃO o implementa ENTÃO ainda satisfaz Command (os 5 atuais não mudam)", () => {
    // Comando parse-only — exatamente a forma dos 5 commands hoje registrados.
    const readOnly: Command<{ id?: string }> = {
      name: "read-only",
      parse: (argv) => (argv[0] ? { id: argv[0] } : {}),
      run: async () => ({ exitCode: 0 }),
    };
    expect(readOnly.prompt).toBeUndefined();
  });

  it("DADO prompts opcional no contexto QUANDO a CLI direta monta o contexto sem prompts ENTÃO ainda satisfaz CommandContext", () => {
    // Caminho CLI direta (parse→run): nenhum prompt humano envolvido.
    const cliContext: CommandContext = { repoRoot: "/repo", logger: fakeLogger() };
    expect(cliContext.prompts).toBeUndefined();
  });
});
