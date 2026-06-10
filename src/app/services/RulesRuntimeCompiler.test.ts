import {
  compileAdapterRulesByName,
  filterRulesByScope,
  normalizeAdapterSelection,
} from "./RulesRuntimeCompiler.js";
import { Rule, RulesCatalogJson } from "../../domain/rules/Rule.js";

function rule(partial: Partial<Rule>): Rule {
  return {
    id: partial.id ?? "R-1",
    scope: partial.scope ?? "universal",
    category: partial.category ?? "process",
    evidence_strength: partial.evidence_strength ?? "strong",
    sources: partial.sources ?? [],
    applicable_languages: partial.applicable_languages ?? ["*"],
    tags: partial.tags ?? [],
    title: partial.title ?? "Rule",
    file: partial.file ?? ".core/rules/x.md",
    instruction_en: partial.instruction_en ?? "Do the thing.",
    adapter: partial.adapter,
    opt_in_feature: partial.opt_in_feature,
    validated_by_benchmark: partial.validated_by_benchmark,
  };
}

describe("RulesRuntimeCompiler", () => {
  it("DADO providers mistos QUANDO normalizar adapters ENTÃO retorna apenas adapters suportados", () => {
    expect(normalizeAdapterSelection("claude,openai,codex.md,unknown")).toEqual([
      "claude",
      "codex",
    ]);
  });

  it("DADO catalogo QUANDO filtrar por adapters e features ENTÃO separa regras por escopo", () => {
    const result = filterRulesByScope(
      [
        rule({ id: "U", scope: "universal" }),
        rule({ id: "A1", scope: "adapter", adapter: "claude" }),
        rule({ id: "A2", scope: "adapter", adapter: "gemini" }),
        rule({ id: "O", scope: "opt-in", opt_in_feature: "bdd", file: ".core/rules/bdd-pt.md" }),
      ],
      { includeAdapters: ["claude"], optInFeatures: ["bdd"], lang: "pt" }
    );

    expect(result.universal.map((item) => item.id)).toEqual(["U"]);
    expect(result.adapters.claude?.map((item) => item.id)).toEqual(["A1"]);
    expect(result.adapters.gemini).toBeUndefined();
    expect(result.optIn.bdd?.map((item) => item.id)).toEqual(["O"]);
  });

  it("DADO catalogo com adapter QUANDO compilar provider rules ENTÃO gera bloco por adapter", () => {
    const catalog: RulesCatalogJson = {
      rules: [
        rule({ id: "ADP-1", scope: "adapter", adapter: "codex", instruction_en: "Use Codex." }),
      ],
      by_scope: { universal: [], adapter: ["ADP-1"], "opt-in": [] },
      by_feature: {},
      generated_at: "2026-06-09T00:00:00.000Z",
      schema_version: "1.0",
    };

    expect(compileAdapterRulesByName(catalog, { includeAdapters: ["codex"] })).toEqual({
      codex: "### Adapter: codex\n\n### [ADP-1]\n\nUse Codex.",
    });
  });
});
