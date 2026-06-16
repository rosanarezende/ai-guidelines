import { ProvisioningFileSystem } from "../ports/ProvisioningFileSystem.js";
import { loadConsumerConfig } from "./loadConsumerConfig.js";

class FakeFs implements ProvisioningFileSystem {
  constructor(private readonly files: Record<string, string>) {}
  async readText(relPath: string): Promise<string | null> {
    return relPath in this.files ? this.files[relPath] : null;
  }
  async writeText(): Promise<void> {}
  async exists(relPath: string): Promise<boolean> {
    return relPath in this.files;
  }
  async ensureDir(): Promise<void> {}
  async remove(): Promise<void> {}
  resolvePath(relPath: string): string {
    return relPath;
  }
}

describe("app/use-cases/loadConsumerConfig (leitura via port + resolução pura)", () => {
  it("DADO config.json existente ENTÃO lê e resolve", async () => {
    const fs = new FakeFs({
      ".ai-guidelines/config.json": JSON.stringify({
        providers: ["claude"],
        features: ["tdd"],
        lang: "en",
      }),
    });
    const cfg = await loadConsumerConfig(fs, {}, "/repo");
    expect(cfg).toEqual({
      sdd_dir: ".ai-guidelines",
      providers: ["claude"],
      features: ["tdd"],
      lang: "en",
    });
  });

  it("DADO ausência de config ENTÃO cai nos defaults", async () => {
    const cfg = await loadConsumerConfig(new FakeFs({}), {}, "/repo");
    expect(cfg.providers).toEqual(["claude", "gemini", "openai"]);
    expect(cfg.lang).toBe("pt");
  });

  it("DADO sdd-dir nas opções ENTÃO lê no diretório indicado primeiro", async () => {
    const fs = new FakeFs({
      ".custom/config.json": JSON.stringify({ providers: ["gemini"], lang: "en" }),
    });
    const cfg = await loadConsumerConfig(fs, { "sdd-dir": ".custom" }, "/repo");
    expect(cfg.sdd_dir).toBe(".custom");
    expect(cfg.providers).toEqual(["gemini"]);
  });

  it("DADO update --providers ENTÃO preserva config existente e adiciona providers selecionados", async () => {
    const fs = new FakeFs({
      ".ai-guidelines/config.json": JSON.stringify({
        providers: ["claude"],
        features: ["tdd"],
        lang: "pt",
      }),
    });
    const cfg = await loadConsumerConfig(fs, { mode: "update", providers: "gemini" }, "/repo");
    expect(cfg).toEqual({
      sdd_dir: ".ai-guidelines",
      providers: ["claude", "gemini"],
      features: ["tdd"],
      lang: "pt",
    });
  });
});
