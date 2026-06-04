import { checkIntents } from "./intentCheck.js";
import { CommandRegistry } from "./registry/CommandRegistry.js";
import { buildRegistry } from "./registry/buildRegistry.js";
import { Command } from "./registry/Command.js";
import { Intent } from "./registry/Intent.js";
import { INTENT_CATALOG, NON_NAVIGABLE_COMMANDS } from "./registry/intentCatalog.js";

function registryOf(...names: string[]): CommandRegistry {
  const registry = new CommandRegistry();
  for (const name of names) {
    const command: Command<void> = {
      name,
      parse: () => undefined,
      run: async () => ({ exitCode: 0 }),
    };
    registry.register(command);
  }
  return registry;
}

describe("checkIntents", () => {
  it("DADO ação referenciando comando inexistente QUANDO check ENTÃO erro de integridade", () => {
    const catalog: Intent[] = [{ id: "x", title: "X", actions: [{ command: "fantasma" }] }];
    const result = checkIntents(catalog, registryOf("continue"));
    expect(result.errors.join("\n")).toContain("fantasma");
    expect(result.errors.join("\n")).toContain("x");
  });

  it("DADO todas as ações resolvendo QUANDO check ENTÃO sem erros", () => {
    const catalog: Intent[] = [
      { id: "x", title: "X", actions: [{ command: "continue" }, { command: "triage" }] },
    ];
    expect(checkIntents(catalog, registryOf("continue", "triage")).errors).toEqual([]);
  });

  it("DADO comando registrado sem Intent QUANDO check ENTÃO warning de cobertura", () => {
    const catalog: Intent[] = [{ id: "x", title: "X", actions: [{ command: "continue" }] }];
    const result = checkIntents(catalog, registryOf("continue", "triage"));
    expect(result.warnings.join("\n")).toContain("triage");
    expect(result.warnings.join("\n")).not.toContain('"continue"');
  });

  it("DADO comando em NON_NAVIGABLE QUANDO check ENTÃO sem warning para ele", () => {
    const catalog: Intent[] = [{ id: "x", title: "X", actions: [{ command: "continue" }] }];
    const result = checkIntents(catalog, registryOf("continue", "workflow"), ["workflow"]);
    expect(result.warnings).toEqual([]);
  });

  it("DADO o catálogo REAL contra o Registry REAL ENTÃO zero erros de integridade (catálogo válido)", () => {
    const result = checkIntents(INTENT_CATALOG, buildRegistry(), NON_NAVIGABLE_COMMANDS);
    expect(result.errors).toEqual([]);
  });
});
