import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  MAINTAINER_BDD_SCENARIOS,
  maintainerBddScenariosByJourney,
} from "./maintainerScenarioCatalog.js";

const repoRoot = process.cwd();

describe("maintainer BDD scenario catalog", () => {
  it("cobre jornadas críticas de manutenção humana", () => {
    const journeys = new Set(MAINTAINER_BDD_SCENARIOS.map((scenario) => scenario.journey));

    expect([...journeys]).toEqual(
      expect.arrayContaining([
        "uso diario",
        "decisao governada",
        "fechamento de checkpoint",
        "manutencao de repo",
        "validacao de consumidor",
        "documentacao viva",
      ])
    );
  });

  it("ancora cada cenário em teste e artefatos reais", () => {
    const ids = new Set<string>();

    for (const scenario of MAINTAINER_BDD_SCENARIOS) {
      expect(ids.has(scenario.id)).toBe(false);
      ids.add(scenario.id);

      expect(scenario.given.length).toBeGreaterThan(0);
      expect(scenario.when.length).toBeGreaterThan(0);
      expect(scenario.then.length).toBeGreaterThan(0);
      expect(scenario.artifacts.length).toBeGreaterThan(0);

      const testPath = path.join(repoRoot, scenario.evidence.testFile);
      expect(existsSync(testPath)).toBe(true);
      expect(readFileSync(testPath, "utf-8")).toContain(scenario.evidence.testName);

      for (const artifact of scenario.artifacts) {
        expect(existsSync(path.join(repoRoot, artifact))).toBe(true);
      }
    }
  });

  it("oferece agrupamento navegável por jornada", () => {
    const grouped = maintainerBddScenariosByJourney();

    expect(grouped.get("uso diario")?.map((scenario) => scenario.id)).toEqual(
      expect.arrayContaining(["flow-dirty-tree-validation", "flow-multiple-specs-focus"])
    );
    expect(grouped.get("documentacao viva")?.map((scenario) => scenario.id)).toEqual([
      "site-command-fidelity",
    ]);
  });
});
