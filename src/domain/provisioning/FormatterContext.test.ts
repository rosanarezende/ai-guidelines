import { detectFormatterContext } from "./FormatterContext.js";

describe("domain/provisioning/FormatterContext (paridade com detectFormatterContext legado)", () => {
  it("detecta formatter rival por arquivo de configuração", () => {
    expect(
      detectFormatterContext({ existingFiles: ["biome.json"], packageJson: { name: "consumer" } })
    ).toEqual({
      rival: { id: "biome", label: "Biome" },
      hasPrettier: false,
      shouldSkipPrettier: true,
    });
  });

  it("não pula Prettier quando já há sinal de Prettier no consumidor", () => {
    expect(
      detectFormatterContext({
        existingFiles: ["biome.json", ".prettierrc"],
        packageJson: { name: "consumer" },
      })
    ).toEqual({
      rival: { id: "biome", label: "Biome" },
      hasPrettier: true,
      shouldSkipPrettier: false,
    });
  });

  it("detecta rival por dependência ou script", () => {
    expect(
      detectFormatterContext({
        existingFiles: [],
        packageJson: {
          devDependencies: { dprint: "^1.0.0" },
          scripts: { fmt: "dprint fmt" },
        },
      }).rival
    ).toEqual({ id: "dprint", label: "dprint" });
  });
});
