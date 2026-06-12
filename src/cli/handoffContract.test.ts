import {
  extractAiGuidelinesBlock,
  parsePackageIdentity,
  parseRulesContract,
} from "./handoffContract.js";

const RULES = {
  schema_version: "1.0",
  generated_at: "2026-01-01T00:00:00.000Z",
  rules: [
    {
      id: "CORE-A",
      scope: "universal",
      tags: ["core", "always_injected"],
      title: "Regra global A",
      instruction_en: "Always A.",
      file: "rules/a.md",
    },
    {
      id: "CORE-B",
      scope: "universal",
      tags: ["core"],
      title: "Universal sem always_injected",
      file: "rules/b.md",
    },
    { id: "ADP-X", scope: "adapter", tags: ["always_injected"], title: "Adapter", file: "x.md" },
  ],
};

describe("handoffContract · parsing puro [CO-4]", () => {
  it("seleciona regras globais = universal + always_injected (sem inventar, sem vazar outras)", () => {
    const contract = parseRulesContract(JSON.stringify(RULES), "rules.json");

    expect(contract.mandatoryRules).toEqual([
      { id: "CORE-A", title: "Regra global A", scope: "global", source: "rules/a.md" },
    ]);
    expect(contract.totalRules).toBe(3);
  });

  it("regra removida do catálogo desaparece da seleção", () => {
    const without = { ...RULES, rules: RULES.rules.filter((r) => r.id !== "CORE-A") };
    const contract = parseRulesContract(JSON.stringify(without), "rules.json");
    expect(contract.mandatoryRules).toEqual([]);
  });

  it("fingerprint é determinístico (mesma semântica ⇒ mesmo fp)", () => {
    const a = parseRulesContract(JSON.stringify(RULES), "rules.json").fingerprint;
    const b = parseRulesContract(JSON.stringify(RULES), "rules.json").fingerprint;
    expect(a).toBe(b);
  });

  it("mudança SEMÂNTICA (título/instrução de regra) muda o fingerprint", () => {
    const base = parseRulesContract(JSON.stringify(RULES), "rules.json").fingerprint;
    const changed = JSON.parse(JSON.stringify(RULES));
    changed.rules[0].instruction_en = "Always A — agora mais forte.";
    expect(parseRulesContract(JSON.stringify(changed), "rules.json").fingerprint).not.toBe(base);
  });

  it("metadata volátil (generated_at) e ordem irrelevante (regras/tags) NÃO mudam o fingerprint", () => {
    const base = parseRulesContract(JSON.stringify(RULES), "rules.json").fingerprint;

    const volatileOnly = { ...RULES, generated_at: "2030-12-31T23:59:59.999Z" };
    expect(parseRulesContract(JSON.stringify(volatileOnly), "rules.json").fingerprint).toBe(base);

    const reordered = JSON.parse(JSON.stringify(RULES));
    reordered.rules.reverse();
    reordered.rules.find((r: { id: string }) => r.id === "CORE-A").tags = [
      "always_injected",
      "core",
    ];
    expect(parseRulesContract(JSON.stringify(reordered), "rules.json").fingerprint).toBe(base);
  });

  it("catálogo inválido lança (coletor degrada; nenhuma regra inventada)", () => {
    expect(() => parseRulesContract("{}", "rules.json")).toThrow(/campo "rules" ausente/);
    expect(() =>
      parseRulesContract(JSON.stringify({ rules: [{ scope: "universal" }] }), "rules.json")
    ).toThrow(/sem "id"/);
  });

  it("extractAiGuidelinesBlock: bloco presente, ausente e vazio", () => {
    expect(extractAiGuidelinesBlock("# A\n<AI_GUIDELINES>\nconteudo\n</AI_GUIDELINES>\n")).toBe(
      "conteudo"
    );
    expect(extractAiGuidelinesBlock("# A\nsem bloco\n")).toBeNull();
    expect(extractAiGuidelinesBlock("<AI_GUIDELINES>\n\n</AI_GUIDELINES>")).toBeNull();
  });

  it("identidade: framework (mantenedor) × consumidor; versão de release fora do fingerprint", () => {
    const maintainer = parsePackageIdentity(
      JSON.stringify({ name: "ai-guidelines", description: "Framework", version: "1.1.0" })
    );
    expect(maintainer.repositoryKind).toBe("framework (mantenedor)");

    const consumer = parsePackageIdentity(
      JSON.stringify({ name: "meu-app", description: "App", version: "2.0.0" })
    );
    expect(consumer.repositoryKind).toBe("consumidor do framework");
    expect(consumer.repositoryId).toBe("meu-app");

    const bumped = parsePackageIdentity(
      JSON.stringify({ name: "meu-app", description: "App", version: "3.0.0" })
    );
    expect(bumped.fingerprint).toBe(consumer.fingerprint);
  });
});
