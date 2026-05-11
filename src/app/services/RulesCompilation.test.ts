/**
 * RulesEngine.compile — pipeline parse + build determinístico.
 *
 * Usa um `RulesCatalogSource` em memória para isolar do filesystem.
 */
import { Rule, RulesCatalogJson } from "../../domain/rules/Rule.js";
import { GovernanceError } from "../../domain/shared/errors.js";
import { RulesCatalogSource } from "../ports/RulesCatalogSource.js";
import { RulesEngine } from "./RulesEngine.js";

function makeRule(overrides: Partial<Rule> & Pick<Rule, "id" | "scope">): Rule {
  return {
    id: overrides.id,
    scope: overrides.scope,
    category: overrides.category ?? "process",
    evidence_strength: overrides.evidence_strength ?? "declared_heuristic",
    sources: overrides.sources ?? [],
    applicable_languages: overrides.applicable_languages ?? ["*"],
    tags: overrides.tags ?? [],
    title: overrides.title ?? `Rule ${overrides.id}`,
    file: overrides.file ?? `.core/rules/top/${overrides.id}.md`,
    instruction_en: overrides.instruction_en ?? "Do the thing carefully.",
    documentation_pt: overrides.documentation_pt,
    adapter: overrides.adapter,
    opt_in_feature: overrides.opt_in_feature,
  };
}

function makeSource(catalog: Partial<RulesCatalogJson> & { rules: Rule[] }): RulesCatalogSource {
  return {
    load: () => ({
      rules: catalog.rules,
      by_scope: catalog.by_scope ?? { universal: [], adapter: [], "opt-in": [] },
      by_feature: catalog.by_feature ?? {},
      generated_at: catalog.generated_at ?? "2026-05-10T00:00:00.000Z",
      schema_version: catalog.schema_version ?? "1.0",
    }),
  };
}

describe("RulesEngine — parse + build", () => {
  it("DADO catálogo válido ENTÃO build agrega by_scope/by_zone/by_feature ordenados por id", () => {
    const rules: Rule[] = [
      makeRule({ id: "TDD-01", scope: "opt-in", opt_in_feature: "tdd" }),
      makeRule({ id: "CORE-01", scope: "universal", tags: ["core"] }),
      makeRule({ id: "ADP-0101", scope: "adapter", adapter: "claude" }),
      makeRule({ id: "QG-01", scope: "opt-in", opt_in_feature: "quality-gates" }),
    ];
    const engine = new RulesEngine(makeSource({ rules }));
    const built = engine.build();

    expect(built.rules.map((r) => r.id)).toEqual(["ADP-0101", "CORE-01", "QG-01", "TDD-01"]);
    expect(built.by_scope.universal).toEqual(["CORE-01"]);
    expect(built.by_scope.adapter).toEqual(["ADP-0101"]);
    expect(built.by_scope["opt-in"]).toEqual(["QG-01", "TDD-01"]);
    expect(built.by_zone.top).toEqual(["CORE-01"]);
    expect(built.by_zone.adapter).toEqual(["ADP-0101"]);
    expect(built.by_zone.center).toEqual(["TDD-01"]);
    expect(built.by_zone.base).toEqual(["QG-01"]);
    expect(built.by_feature).toEqual({
      tdd: ["TDD-01"],
      "quality-gates": ["QG-01"],
    });
  });

  it("DADO duas chamadas consecutivas ENTÃO output é byte-equivalente (determinismo)", () => {
    const rules: Rule[] = [
      makeRule({ id: "B-02", scope: "universal" }),
      makeRule({ id: "A-01", scope: "universal" }),
    ];
    const engine = new RulesEngine(makeSource({ rules }));
    const a = JSON.stringify(engine.build());
    const b = JSON.stringify(engine.build());
    expect(a).toEqual(b);
  });

  it("DADO IDs duplicados ENTÃO lança RULES_DUPLICATE_ID", () => {
    const engine = new RulesEngine(
      makeSource({
        rules: [
          makeRule({ id: "DUP", scope: "universal" }),
          makeRule({ id: "DUP", scope: "universal" }),
        ],
      })
    );
    expect(() => engine.build()).toThrow(GovernanceError);
  });

  it("DADO catálogo sem campo rules ENTÃO parse lança RULES_CATALOG_INVALID", () => {
    const engine = new RulesEngine({
      load: () => ({}) as unknown as RulesCatalogJson,
    });
    expect(() => engine.parse()).toThrow(/`rules` ausente/);
    try {
      engine.parse();
    } catch (err) {
      expect((err as { code: string }).code).toBe("RULES_CATALOG_INVALID");
    }
  });

  it("lookup por id/zone/tag funciona", () => {
    const rules: Rule[] = [
      makeRule({ id: "CORE-01", scope: "universal", tags: ["core", "planning"] }),
      makeRule({ id: "CORE-02", scope: "universal", tags: ["core"] }),
      makeRule({ id: "ADP-0101", scope: "adapter", adapter: "claude" }),
    ];
    const engine = new RulesEngine(makeSource({ rules }));

    expect(engine.findById("CORE-02")?.id).toBe("CORE-02");
    expect(engine.findById("MISSING")).toBeUndefined();
    expect(engine.listByZone("top").map((r) => r.id)).toEqual(["CORE-01", "CORE-02"]);
    expect(engine.listByTag("planning").map((r) => r.id)).toEqual(["CORE-01"]);
  });
});
