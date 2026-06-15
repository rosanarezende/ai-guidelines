import {
  EDITORIAL_FEATURES,
  FEATURE_OPTIONS,
  INFRASTRUCTURE_FEATURES,
  normalizeSelectedFeatures,
  OPT_IN_RULE_FILES,
} from "./FeatureCatalog.js";

describe("domain/provisioning/FeatureCatalog (paridade com args/config)", () => {
  it("DADO as listas-fonte ENTÃO FEATURE_OPTIONS é infra ++ editorial nessa ordem", () => {
    expect(FEATURE_OPTIONS).toEqual([...INFRASTRUCTURE_FEATURES, ...EDITORIAL_FEATURES]);
    expect(FEATURE_OPTIONS).toEqual(["prettier", "husky", "ci", "quality-gates", "tdd", "bdd"]);
  });

  it("DADO as features editoriais ENTÃO OPT_IN_RULE_FILES deriva os arquivos .md", () => {
    expect(OPT_IN_RULE_FILES).toEqual(["quality-gates.md", "tdd.md", "bdd.md"]);
  });

  it("DADO null/undefined ENTÃO normaliza para lista vazia", () => {
    expect(normalizeSelectedFeatures(undefined)).toEqual([]);
    expect(normalizeSelectedFeatures(null)).toEqual([]);
  });

  it("DADO CSV ou array ENTÃO trima, remove vazios e deduplica", () => {
    expect(normalizeSelectedFeatures("tdd, bdd ,tdd")).toEqual(["tdd", "bdd"]);
    expect(normalizeSelectedFeatures(["ci", "", " prettier ", "ci"])).toEqual(["ci", "prettier"]);
  });
});
