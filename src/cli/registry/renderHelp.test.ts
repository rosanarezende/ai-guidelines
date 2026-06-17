import { renderCommandsHelp } from "./renderHelp.js";
import { Command } from "./Command.js";

function fake(
  name: string,
  description: string,
  extra: Partial<Command<void>> = {}
): Command<void> {
  return {
    name,
    description,
    parse: () => undefined,
    run: async () => ({ exitCode: 0 }),
    ...extra,
  };
}

describe("renderCommandsHelp (help derivado do registry — auditoria #35, #2)", () => {
  it("DADO comandos QUANDO renderiza ENTÃO inclui nome + descrição de cada um", () => {
    const out = renderCommandsHelp([
      fake("specs", "lista as specs ativas"),
      fake("drift", "diagnostica drift do índice"),
    ]);
    expect(out).toContain("specs");
    expect(out).toContain("lista as specs ativas");
    expect(out).toContain("drift");
    expect(out).toContain("diagnostica drift do índice");
  });

  it("DADO comando com alias QUANDO renderiza ENTÃO mostra o alias", () => {
    const out = renderCommandsHelp([fake("triage", "triagem", { aliases: ["review"] })]);
    expect(out).toContain("triage");
    expect(out).toContain("alias: review");
  });

  it("DADO comando com usage QUANDO renderiza ENTÃO inclui os exemplos com o prefixo do binário", () => {
    const out = renderCommandsHelp([fake("continue", "continua", { usage: ["continue 0023"] })]);
    expect(out).toContain("Ex.: npm run flow -- continue 0023");
  });

  it("DADO lista vazia QUANDO renderiza ENTÃO retorna string vazia", () => {
    expect(renderCommandsHelp([])).toBe("");
  });
});
