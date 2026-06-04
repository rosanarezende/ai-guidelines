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

  it("DADO argv vazio QUANDO dispatch ENTÃO exitCode 1 com erro de comando ausente", async () => {
    const reg = new CommandRegistry();
    const { logger, errors } = fakeLogger();

    const result = await reg.dispatch([], fakeContext(logger));

    expect(result.exitCode).toBe(1);
    expect(errors.join("\n")).toMatch(/comando/i);
  });

  it("DADO comandos registrados QUANDO commandNames ENTÃO devolve só os nomes canônicos, ordenados, sem aliases", () => {
    const reg = new CommandRegistry();
    reg.register(spyCommand("why"));
    reg.register(spyCommand("graph", { aliases: ["g"] }));
    expect(reg.commandNames()).toEqual(["graph", "why"]);
  });
});
