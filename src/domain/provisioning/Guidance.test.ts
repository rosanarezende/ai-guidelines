import { buildOverwriteGuidance } from "./Guidance.js";

describe("domain/provisioning/Guidance (paridade com buildOverwriteGuidance)", () => {
  it("update: headless vs --force", () => {
    expect(buildOverwriteGuidance("update", false)[0]).toMatch(/update headless/);
    expect(buildOverwriteGuidance("update", true)[0]).toMatch(/--force ativo/);
  });

  it("providers: conservador vs --force", () => {
    expect(buildOverwriteGuidance("providers", false)[0]).toMatch(/conservador/);
    expect(buildOverwriteGuidance("providers", true)[0]).toMatch(/provider entrypoints nativos/);
  });

  it("init: conservador (aborta) vs --force (sobrescreve)", () => {
    expect(buildOverwriteGuidance("init", false)[0]).toMatch(/o init aborta/);
    expect(buildOverwriteGuidance("init", true)[0]).toMatch(/o init pode sobrescrever/);
  });

  it("adopt: conservador (mescla) vs --force (atualiza)", () => {
    expect(buildOverwriteGuidance("adopt", false)[0]).toMatch(/o adopt adiciona ou mescla/);
    expect(buildOverwriteGuidance("adopt", true)[0]).toMatch(/o adopt pode atualizar/);
  });
});
