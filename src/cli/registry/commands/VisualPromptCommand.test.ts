import { VisualPromptCommand } from "./VisualPromptCommand.js";
import { Command, CommandContext, Logger } from "../Command.js";
import { Prompts } from "../../../app/ports/Prompts.js";
import { ClipboardWriter } from "../../../app/ports/ClipboardWriter.js";

function capturingLogger(): { logger: Logger; infos: string[]; errors: string[] } {
  const infos: string[] = [];
  const errors: string[] = [];
  return { logger: { info: (m) => infos.push(m), error: (m) => errors.push(m) }, infos, errors };
}

function context(logger: Logger, prompts?: Prompts): CommandContext {
  return { repoRoot: "/repo", logger, ...(prompts ? { prompts } : {}) };
}

/** Prompts fake: respostas roteiradas por mensagem-chave. */
function scriptedPrompts(answers: { select?: string; input?: string }): Prompts {
  return {
    async select<T>(o: { choices: ReadonlyArray<{ value: T }> }): Promise<T> {
      return (answers.select ?? o.choices[0].value) as T;
    },
    async input(): Promise<string> {
      return answers.input ?? "";
    },
    async confirm(): Promise<boolean> {
      return false;
    },
  };
}

/** Deps fake: render + collect + clipboard sem tocar fs/git reais. */
function fakeDeps(over: Partial<VisualPromptCommand["deps"]> = {}) {
  const copied: string[] = [];
  const clipboard: ClipboardWriter = {
    async copy(text) {
      copied.push(text);
      return true;
    },
  };
  return {
    copied,
    deps: {
      makeFs: () => ({}) as never,
      clipboard,
      collect: () => "CTX-LOCAL",
      render: (_fs: unknown, slug: string, vars: { context: string; localContext?: string }) =>
        `RENDER[${slug}] ctx=${vars.context} local=${vars.localContext ?? ""}`,
      ...over,
    },
  };
}

describe("VisualPromptCommand (`visual-prompt`) — migração interativa (etapa 3 do #35)", () => {
  describe("parse (CLI direta)", () => {
    it("DADO --type sem contexto exigido QUANDO parse ENTÃO devolve {type, context:''}", () => {
      const { deps } = fakeDeps();
      const cmd = new VisualPromptCommand(deps);
      expect(cmd.parse(["--type=architecture"])).toEqual({ type: "architecture", context: "" });
    });

    it("DADO --type que exige contexto + --context válido QUANDO parse ENTÃO devolve ambos", () => {
      const { deps } = fakeDeps();
      const cmd = new VisualPromptCommand(deps);
      expect(cmd.parse(["--type=value-delivered", "--context=PR #25"])).toEqual({
        type: "value-delivered",
        context: "PR #25",
      });
    });

    it("DADO --type ausente QUANDO parse ENTÃO erro narrativo listando os tipos", () => {
      const { deps } = fakeDeps();
      const cmd = new VisualPromptCommand(deps);
      expect(() => cmd.parse([])).toThrow(/type/i);
    });

    it("DADO --type desconhecido QUANDO parse ENTÃO erro narrativo", () => {
      const { deps } = fakeDeps();
      const cmd = new VisualPromptCommand(deps);
      expect(() => cmd.parse(["--type=zzz"])).toThrow(/zzz|desconhecid/i);
    });

    it("DADO tipo que exige contexto SEM --context QUANDO parse ENTÃO erro narrativo", () => {
      const { deps } = fakeDeps();
      const cmd = new VisualPromptCommand(deps);
      expect(() => cmd.parse(["--type=value-delivered"])).toThrow(/contexto/i);
    });

    it("DADO --context não reconhecido QUANDO parse ENTÃO erro narrativo (parseContextTarget)", () => {
      const { deps } = fakeDeps();
      const cmd = new VisualPromptCommand(deps);
      expect(() => cmd.parse(["--type=value-delivered", "--context=blah"])).toThrow(
        /não reconhecid|contexto/i
      );
    });
  });

  describe("prompt (wizard)", () => {
    it("DADO tipo sem contexto QUANDO prompt ENTÃO produz {type, context:''} (mesmo TOptions do parse)", async () => {
      const { deps } = fakeDeps();
      const cmd = new VisualPromptCommand(deps);
      const { logger } = capturingLogger();
      const out = await cmd.prompt(context(logger, scriptedPrompts({ select: "architecture" })));
      expect(out).toEqual({ type: "architecture", context: "" });
    });

    it("DADO tipo que exige contexto QUANDO prompt ENTÃO coleta e valida o contexto", async () => {
      const { deps } = fakeDeps();
      const cmd = new VisualPromptCommand(deps);
      const { logger } = capturingLogger();
      const out = await cmd.prompt(
        context(logger, scriptedPrompts({ select: "value-delivered", input: "spec 0024" }))
      );
      expect(out).toEqual({ type: "value-delivered", context: "spec 0024" });
    });

    it("DADO contexto inválido QUANDO prompt ENTÃO lança erro narrativo (não gera prompt inútil)", async () => {
      const { deps } = fakeDeps();
      const cmd = new VisualPromptCommand(deps);
      const { logger } = capturingLogger();
      await expect(
        cmd.prompt(context(logger, scriptedPrompts({ select: "value-delivered", input: "blah" })))
      ).rejects.toThrow(/não reconhecid|contexto/i);
    });

    it("DADO ctx SEM prompts QUANDO prompt ENTÃO lança (prompt exige a superfície humana)", async () => {
      const { deps } = fakeDeps();
      const cmd = new VisualPromptCommand(deps);
      const { logger } = capturingLogger();
      await expect(cmd.prompt(context(logger))).rejects.toThrow(/prompts/i);
    });
  });

  describe("run (execução compartilhada)", () => {
    it("DADO options com contexto QUANDO run ENTÃO coleta local, renderiza, copia e instrui; exitCode 0", async () => {
      const { deps, copied } = fakeDeps();
      const cmd = new VisualPromptCommand(deps);
      const { logger, infos } = capturingLogger();

      const out = await cmd.run({ type: "value-delivered", context: "PR #25" }, context(logger));

      expect(out.exitCode).toBe(0);
      expect(copied).toEqual(["RENDER[value-delivered] ctx=PR #25 local=CTX-LOCAL"]);
      const text = infos.join("\n");
      expect(text).toContain("COMO USAR");
      expect(text).toContain("copiado para o clipboard");
    });

    it("DADO clipboard indisponível QUANDO run ENTÃO faz fallback imprimindo o prompt entre delimitadores", async () => {
      const { deps } = fakeDeps({
        clipboard: {
          async copy() {
            return false;
          },
        },
      });
      const cmd = new VisualPromptCommand(deps);
      const { logger, infos } = capturingLogger();

      const out = await cmd.run({ type: "architecture", context: "" }, context(logger));

      expect(out.exitCode).toBe(0);
      const text = infos.join("\n");
      expect(text).toContain("clipboard indisponível");
      expect(text).toContain("RENDER[architecture-end-to-end]");
    });

    it("DADO template que não renderiza (null) QUANDO run ENTÃO erro e exitCode 1", async () => {
      const { deps } = fakeDeps({ render: () => null });
      const cmd = new VisualPromptCommand(deps);
      const { logger, errors } = capturingLogger();

      const out = await cmd.run({ type: "architecture", context: "" }, context(logger));

      expect(out.exitCode).toBe(1);
      expect(errors.join("\n")).toMatch(/template|não encontrado/i);
    });
  });

  it("é interativo: define prompt() (dual de parse) — Command<…> com produtor humano", () => {
    const { deps } = fakeDeps();
    const cmd: Command<{ type: string; context: string }> = new VisualPromptCommand(deps);
    expect(typeof cmd.prompt).toBe("function");
    expect(cmd.name).toBe("visual-prompt");
  });
});
