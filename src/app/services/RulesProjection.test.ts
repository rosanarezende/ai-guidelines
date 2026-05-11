/**
 * Pipeline 3 — projeção markdown determinística.
 */
import { Rule, RulesCatalogJson } from "../../domain/rules/Rule.js";
import { RulesEngine } from "./RulesEngine.js";

function rule(id: string, overrides: Partial<Rule> = {}): Rule {
  return {
    id,
    scope: overrides.scope ?? "universal",
    category: overrides.category ?? "process",
    evidence_strength: overrides.evidence_strength ?? "declared_heuristic",
    sources: overrides.sources ?? [],
    applicable_languages: overrides.applicable_languages ?? ["*"],
    tags: overrides.tags ?? [],
    title: overrides.title ?? `Title ${id}`,
    file: overrides.file ?? `.core/rules/top/${id}.md`,
    instruction_en: overrides.instruction_en ?? "Instruction.",
    adapter: overrides.adapter,
    opt_in_feature: overrides.opt_in_feature,
  };
}

const baseRelativePath = (p: string) => p.replace(/^\.core\/rules\//, "");

describe("RulesEngine — projection (catálogo markdown)", () => {
  it("renderiza tabela ordenada por id com zona e link relativo", () => {
    const rules: Rule[] = [
      rule("B-02", { scope: "universal", title: "Beta", file: ".core/rules/top/b.md" }),
      rule("A-01", { scope: "universal", title: "Alpha", file: ".core/rules/top/a.md" }),
      rule("OPT-1", {
        scope: "opt-in",
        opt_in_feature: "tdd",
        title: "TDD",
        file: ".core/rules/center/methodologies/tdd-en.md",
      }),
    ];
    const engine = new RulesEngine({
      load: (): RulesCatalogJson => ({
        rules,
        by_scope: { universal: [], adapter: [], "opt-in": [] },
        by_feature: {},
        generated_at: "x",
        schema_version: "1.0",
      }),
    });
    const md = engine.projectCatalogMarkdown({ baseRelativePath });

    expect(md).toContain("| **A-01** |");
    expect(md).toContain("| **B-02** |");
    expect(md).toContain("| **OPT-1** |");
    expect(md).toContain("`top`");
    expect(md).toContain("`center`");
    expect(md.indexOf("A-01")).toBeLessThan(md.indexOf("B-02"));
    expect(md.indexOf("B-02")).toBeLessThan(md.indexOf("OPT-1"));
    expect(md).toContain("(top/a.md#a01)");
    expect(md).toContain("(center/methodologies/tdd-en.md#opt1)");
  });

  it("escapa pipe em title (sem quebrar tabela)", () => {
    const rules: Rule[] = [rule("X-01", { title: "Has | pipe", file: ".core/rules/top/x.md" })];
    const engine = new RulesEngine({
      load: () => ({
        rules,
        by_scope: { universal: [], adapter: [], "opt-in": [] },
        by_feature: {},
        generated_at: "x",
        schema_version: "1.0",
      }),
    });
    const md = engine.projectCatalogMarkdown({ baseRelativePath });
    expect(md).toContain("Has \\| pipe");
  });

  it("output é determinístico entre chamadas consecutivas", () => {
    const rules: Rule[] = [rule("Z-01"), rule("A-01"), rule("M-01")];
    const engine = new RulesEngine({
      load: () => ({
        rules,
        by_scope: { universal: [], adapter: [], "opt-in": [] },
        by_feature: {},
        generated_at: "x",
        schema_version: "1.0",
      }),
    });
    expect(engine.projectCatalogMarkdown({ baseRelativePath })).toEqual(
      engine.projectCatalogMarkdown({ baseRelativePath })
    );
  });
});
