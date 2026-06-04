import { buildRegistry } from "./buildRegistry.js";

describe("buildRegistry", () => {
  it("DADO o registry montado QUANDO resolve 'continue' ENTÃO encontra o comando-piloto", () => {
    const registry = buildRegistry();
    expect(registry.resolve("continue")?.name).toBe("continue");
  });

  it("DADO o registry montado QUANDO commandNames ENTÃO inclui 'continue'", () => {
    const registry = buildRegistry();
    expect(registry.commandNames()).toContain("continue");
  });
});
