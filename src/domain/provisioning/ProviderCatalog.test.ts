import {
  deriveAdaptersFromProviders,
  DEFAULT_PROVIDERS,
  getAdaptersForProvider,
  getSupportedProviders,
  normalizeSelectedProviders,
} from "./ProviderCatalog.js";

describe("domain/provisioning/ProviderCatalog (paridade com cli/features/core/config)", () => {
  it("DADO entrada vazia/all ENTÃO retorna os providers default (cópia, não a constante)", () => {
    expect(normalizeSelectedProviders(undefined)).toEqual([...DEFAULT_PROVIDERS]);
    expect(normalizeSelectedProviders("")).toEqual([...DEFAULT_PROVIDERS]);
    expect(normalizeSelectedProviders("all")).toEqual([...DEFAULT_PROVIDERS]);
    expect(normalizeSelectedProviders(undefined)).not.toBe(DEFAULT_PROVIDERS);
  });

  it("DADO string CSV ENTÃO normaliza, baixa caixa, deduplica e filtra desconhecidos", () => {
    expect(normalizeSelectedProviders("Claude, cursor ,claude,foo")).toEqual(["claude", "cursor"]);
  });

  it("DADO array só com desconhecidos ENTÃO cai no default", () => {
    expect(normalizeSelectedProviders(["foo", "bar"])).toEqual([...DEFAULT_PROVIDERS]);
  });

  it("DADO provider ENTÃO mapeia para os adapters editoriais", () => {
    expect(getAdaptersForProvider("openai")).toEqual(["codex"]);
    expect(getAdaptersForProvider("copilot")).toEqual(["codex"]);
    expect(getAdaptersForProvider("cursor")).toEqual([]);
  });

  it("DADO lista de providers ENTÃO deriva adapters únicos", () => {
    expect(deriveAdaptersFromProviders(["openai", "copilot", "claude"])).toEqual([
      "codex",
      "claude",
    ]);
  });

  it("getSupportedProviders retorna cópia da lista canônica", () => {
    const a = getSupportedProviders();
    expect(a).toContain("windsurf");
    a.pop();
    expect(getSupportedProviders()).toContain("openai");
  });
});
