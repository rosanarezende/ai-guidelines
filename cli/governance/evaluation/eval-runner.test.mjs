import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import { runEvaluation } from "./eval-runner.mjs";

describe("Evaluation Runner", () => {
  it("DADO um diretório com violações QUANDO runEvaluation executa ENTÃO retorna contagem agrupada e total sem regras extras", async () => {
    const fixtureDir = path.join(process.cwd(), ".tmp-fixture-eval");
    await fs.mkdir(fixtureDir, { recursive: true });

    // Simulate no ignores -> TOKEN-LINT-01
    // Simulate mock catalog
    await fs.mkdir(path.join(fixtureDir, ".core", "rules", "_meta"), { recursive: true });
    const mockCatalog = path.join(fixtureDir, ".core", "rules", "_meta", "rules.json");
    await fs.writeFile(
      mockCatalog,
      JSON.stringify({
        rules: [{ id: "GR-01", tags: ["typing"] }],
      })
    );

    const mockSource1 = path.join(fixtureDir, "source1.ts");
    await fs.writeFile(mockSource1, "const a = b as any;");
    const mockSource2 = path.join(fixtureDir, "source2.ts");
    await fs.writeFile(mockSource2, "const c = d as unknown;");

    const savePath = path.join(fixtureDir, ".ai-eval.json");

    const result = await runEvaluation(fixtureDir, savePath);

    assert.equal(typeof result.totalViolations, "number");
    assert.equal(result.violationsByRule["GR-01"], 2);
    assert.ok(result.violationsByRule["TOKEN-LINT-01"]);

    const saved = JSON.parse(await fs.readFile(savePath, "utf-8"));
    assert.equal(saved.totalViolations, result.totalViolations);
    assert.equal(saved.violationsByRule["GR-01"], 2);

    await fs.rm(fixtureDir, { recursive: true, force: true });
  });
});
