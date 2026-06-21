import { CommandRegistry } from "./CommandRegistry.js";
import { Command, CommandContext, CommandResult, Logger } from "./Command.js";

function fakeLogger(): { logger: Logger; infos: string[]; errors: string[] } {
  const infos: string[] = [];
  const errors: string[] = [];
  return {
    logger: { info: (m) => infos.push(m), error: (m) => errors.push(m) },
    infos,
    errors,
  };
}

function fakeContext(logger: Logger): CommandContext {
  return { repoRoot: "/repo", logger };
}

/**
 * Comando-espião: registra o argv que recebeu em `parse` e as options que
 * chegaram em `run`, devolvendo um exitCode configurável. Prova o roteamento
 * argv → parse → run sem tocar infraestrutura.
 */
function spyCommand(
  name: string,
  opts: { aliases?: readonly string[]; exitCode?: number } = {}
): Command<{ rest: readonly string[] }> & {
  parsedFrom: (readonly string[])[];
  ranWith: { rest: readonly string[] }[];
} {
  const parsedFrom: (readonly string[])[] = [];
  const ranWith: { rest: readonly string[] }[] = [];
  return {
    name,
    description: `spy: ${name}`,
    aliases: opts.aliases,
    parsedFrom,
    ranWith,
    parse(argv) {
      parsedFrom.push(argv);
      return { rest: argv };
    },
    async run(options): Promise<CommandResult> {
      ranWith.push(options);
      return { exitCode: opts.exitCode ?? 0 };
    },
  };
}

describe("CommandRegistry", () => {
  it("DADO um comando registrado QUANDO resolve pelo nome ENTÃO retorna o comando", () => {
    const reg = new CommandRegistry();
    const cmd = spyCommand("continue");
    reg.register(cmd);
    expect(reg.resolve("continue")).toBe(cmd);
  });

  it("DADO um comando com alias QUANDO resolve pelo alias ENTÃO retorna o mesmo comando", () => {
    const reg = new CommandRegistry();
    const cmd = spyCommand("graph", { aliases: ["g"] });
    reg.register(cmd);
    expect(reg.resolve("g")).toBe(cmd);
    expect(reg.resolve("graph")).toBe(cmd);
  });

  it("DADO nome já registrado QUANDO register de novo ENTÃO lança erro (anti-colisão)", () => {
    const reg = new CommandRegistry();
    reg.register(spyCommand("why"));
    expect(() => reg.register(spyCommand("why"))).toThrow(/duplicad/i);
  });

  it("DADO alias que colide com nome existente QUANDO register ENTÃO lança erro", () => {
    const reg = new CommandRegistry();
    reg.register(spyCommand("graph"));
    expect(() => reg.register(spyCommand("g", { aliases: ["graph"] }))).toThrow(/duplicad/i);
  });

  it("DADO argv com nome conhecido QUANDO dispatch ENTÃO roteia parse→run e devolve o result", async () => {
    const reg = new CommandRegistry();
    const cmd = spyCommand("continue", { exitCode: 0 });
    reg.register(cmd);
    const { logger } = fakeLogger();

    const result = await reg.dispatch(["continue", "0024", "--flag"], fakeContext(logger));

    expect(result.exitCode).toBe(0);
    expect(cmd.parsedFrom).toEqual([["0024", "--flag"]]); // argv SEM o nome do comando
    expect(cmd.ranWith).toEqual([{ rest: ["0024", "--flag"] }]);
  });

  it("DADO comando desconhecido QUANDO dispatch ENTÃO exitCode 1 e lista os disponíveis", async () => {
    const reg = new CommandRegistry();
    reg.register(spyCommand("graph"));
    reg.register(spyCommand("why"));
    const { logger, errors } = fakeLogger();

    const result = await reg.dispatch(["inexistente"], fakeContext(logger));

    expect(result.exitCode).toBe(1);
    expect(errors.join("\n")).toContain("inexistente");
    expect(errors.join("\n")).toContain("graph");
    expect(errors.join("\n")).toContain("why");
  });

  it("DADO comando providers removido QUANDO dispatch ENTÃO falha sem registrar alias e orienta update --providers", async () => {
    const reg = new CommandRegistry();
    reg.register(spyCommand("update"));
    const { logger, errors } = fakeLogger();

    const result = await reg.dispatch(["providers", "--providers", "claude"], fakeContext(logger));

    expect(result.exitCode).toBe(1);
    expect(reg.resolve("providers")).toBeUndefined();
    expect(errors.join("\n")).toContain('Comando não suportado: "providers"');
    expect(errors.join("\n")).toContain("npx ai-guidelines update --providers <lista>");
  });

  it("DADO uma flag no lugar do verbo QUANDO dispatch ENTÃO orienta que falta um comando antes da opção", async () => {
    const reg = new CommandRegistry();
    reg.register(spyCommand("init"));
    reg.register(spyCommand("adopt"));
    const { logger, errors } = fakeLogger();

    const result = await reg.dispatch(["--target", "./x"], fakeContext(logger));

    expect(result.exitCode).toBe(1);
    const out = errors.join("\n");
    expect(out).toContain("--target");
    expect(out).toContain("opção"); // mensagem orientada para flag-sem-verbo
    expect(out).toContain("init"); // lista os comandos disponíveis
    expect(out).not.toContain("não suportado"); // não cai na mensagem genérica
  });

  it("DADO argv vazio QUANDO dispatch ENTÃO exitCode 1 com erro de comando ausente", async () => {
    const reg = new CommandRegistry();
    const { logger, errors } = fakeLogger();

    const result = await reg.dispatch([], fakeContext(logger));

    expect(result.exitCode).toBe(1);
    expect(errors.join("\n")).toMatch(/comando/i);
  });

  it("DADO um comando cujo parse lança QUANDO dispatch ENTÃO captura, loga a mensagem e devolve exitCode 1", async () => {
    const reg = new CommandRegistry();
    const throwing: Command<void> = {
      name: "boom",
      description: "boom",
      parse() {
        throw new Error("input inválido");
      },
      async run() {
        return { exitCode: 0 };
      },
    };
    reg.register(throwing);
    const { logger, errors } = fakeLogger();

    const result = await reg.dispatch(["boom", "x"], fakeContext(logger));

    expect(result.exitCode).toBe(1);
    expect(errors.join("\n")).toContain("input inválido");
  });

  it("DADO um comando cujo run lança QUANDO dispatch ENTÃO captura e devolve exitCode 1", async () => {
    const reg = new CommandRegistry();
    const throwing: Command<void> = {
      name: "boom",
      description: "boom",
      parse() {
        return undefined;
      },
      async run() {
        throw new Error("falha de execução");
      },
    };
    reg.register(throwing);
    const { logger, errors } = fakeLogger();

    const result = await reg.dispatch(["boom"], fakeContext(logger));

    expect(result.exitCode).toBe(1);
    expect(errors.join("\n")).toContain("falha de execução");
  });

  it("DADO comandos registrados QUANDO commandNames ENTÃO devolve só os nomes canônicos, ordenados, sem aliases", () => {
    const reg = new CommandRegistry();
    reg.register(spyCommand("why"));
    reg.register(spyCommand("graph", { aliases: ["g"] }));
    expect(reg.commandNames()).toEqual(["graph", "why"]);
  });

  // ── Seleção de produtor de input no dispatch (etapa 3 do #35) ──
  // Um único `run`, dois produtores: `parse(argv)` (CLI) e `prompt(ctx)` (wizard).
  // O dispatch escolhe `prompt` SSE `ctx.prompts` existe E o comando define `prompt`.

  /** Spy com os DOIS produtores: regista qual foi usado e o que chegou ao run. */
  function spyDualCommand(name: string): Command<{ source: "parse" | "prompt" }> & {
    ranWith: { source: "parse" | "prompt" }[];
  } {
    const ranWith: { source: "parse" | "prompt" }[] = [];
    return {
      name,
      description: `dual: ${name}`,
      ranWith,
      parse: () => ({ source: "parse" as const }),
      prompt: async () => ({ source: "prompt" as const }),
      async run(options): Promise<CommandResult> {
        ranWith.push(options);
        return { exitCode: 0 };
      },
    };
  }

  function fakePrompts(): CommandContext["prompts"] {
    return {
      async select<T>(o: { choices: ReadonlyArray<{ value: T }> }) {
        return o.choices[0].value;
      },
      async input() {
        return "";
      },
      async confirm() {
        return false;
      },
    };
  }

  it("DADO comando com prompt() E ctx com prompts QUANDO dispatch ENTÃO usa prompt() (não parse) e roteia ao mesmo run", async () => {
    const reg = new CommandRegistry();
    const cmd = spyDualCommand("visual");
    reg.register(cmd);
    const { logger } = fakeLogger();

    await reg.dispatch(["visual", "ignorado"], {
      repoRoot: "/repo",
      logger,
      prompts: fakePrompts(),
    });

    expect(cmd.ranWith).toEqual([{ source: "prompt" }]);
  });

  it("DADO comando com prompt() MAS ctx SEM prompts QUANDO dispatch ENTÃO cai em parse() (CLI direta)", async () => {
    const reg = new CommandRegistry();
    const cmd = spyDualCommand("visual");
    reg.register(cmd);
    const { logger } = fakeLogger();

    await reg.dispatch(["visual"], fakeContext(logger));

    expect(cmd.ranWith).toEqual([{ source: "parse" }]);
  });

  it("DADO comando SEM prompt() E ctx COM prompts QUANDO dispatch ENTÃO usa parse() (read-only no wizard)", async () => {
    const reg = new CommandRegistry();
    const cmd = spyCommand("specs");
    reg.register(cmd);
    const { logger } = fakeLogger();

    await reg.dispatch(["specs", "x"], { repoRoot: "/repo", logger, prompts: fakePrompts() });

    expect(cmd.ranWith).toEqual([{ rest: ["x"] }]); // parse recebeu o argv sem o nome
  });

  it("DADO prompt() que lança QUANDO dispatch ENTÃO captura, loga e devolve exitCode 1 (mesmo tratamento de parse)", async () => {
    const reg = new CommandRegistry();
    const throwing: Command<void> = {
      name: "boom",
      description: "boom",
      parse: () => undefined,
      prompt: async () => {
        throw new Error("prompt abortado");
      },
      run: async () => ({ exitCode: 0 }),
    };
    reg.register(throwing);
    const { logger, errors } = fakeLogger();

    const result = await reg.dispatch(["boom"], {
      repoRoot: "/repo",
      logger,
      prompts: fakePrompts(),
    });

    expect(result.exitCode).toBe(1);
    expect(errors.join("\n")).toContain("prompt abortado");
  });
});

describe("CommandRegistry — `--help` por comando [CO-4 r9: descoberta situada]", () => {
  it("DADO `<comando> --help` QUANDO dispatch ENTÃO mostra o help derivado do comando e NÃO executa", async () => {
    const { logger, infos } = fakeLogger();
    const spy = spyCommand("handoff");
    const reg = new CommandRegistry().register(spy);

    const result = await reg.dispatch(["handoff", "--help"], fakeContext(logger));

    expect(result.exitCode).toBe(0);
    expect(spy.parsedFrom).toHaveLength(0); // nem parse, nem run — zero efeito colateral
    expect(spy.ranWith).toHaveLength(0);
    expect(infos.join("\n")).toContain("handoff");
    expect(infos.join("\n")).toContain("spy: handoff");
    expect(infos.join("\n")).toContain("npx ai-guidelines --help");
  });

  it("DADO `-h` curto QUANDO dispatch ENTÃO mesmo comportamento (help, exit 0, sem execução)", async () => {
    const { logger } = fakeLogger();
    const spy = spyCommand("review");
    const reg = new CommandRegistry().register(spy);

    const result = await reg.dispatch(["review", "-h"], fakeContext(logger));
    expect(result.exitCode).toBe(0);
    expect(spy.ranWith).toHaveLength(0);
  });

  it("DADO argv sem --help QUANDO dispatch ENTÃO executa normalmente (interceptação não vaza)", async () => {
    const { logger } = fakeLogger();
    const spy = spyCommand("handoff");
    const reg = new CommandRegistry().register(spy);

    const result = await reg.dispatch(["handoff", "0024", "--no-remote"], fakeContext(logger));
    expect(result.exitCode).toBe(0);
    expect(spy.ranWith).toHaveLength(1);
  });
});
