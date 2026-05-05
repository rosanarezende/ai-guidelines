import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import { runAiCheck } from "./ai-check.mjs";

describe("ai-check CLI", () => {
  it("DADO um diretório com violações QUANDO runAiCheck executa ENTÃO agrupa as violações por ruleId sem falhar", async () => {
    const fixtureDir = path.join(process.cwd(), ".tmp-fixture-ai-check");
    await fs.mkdir(fixtureDir, { recursive: true });

    // Simulate lack of ignore files -> triggers TOKEN-LINT-01
    // Simulate node_modules -> triggers TOKEN-LINT-02
    await fs.mkdir(path.join(fixtureDir, "node_modules"), { recursive: true });

    // Simulate large file -> triggers TOKEN-LINT-03
    const largeFile = path.join(fixtureDir, "large.js");
    await fs.writeFile(largeFile, "console.log('hi');\n".repeat(2001));

    // Simulate mock catalog
    await fs.mkdir(path.join(fixtureDir, ".core", "rules", "_meta"), { recursive: true });
    const mockCatalog = path.join(fixtureDir, ".core", "rules", "_meta", "rules.json");
    await fs.writeFile(
      mockCatalog,
      JSON.stringify({
        rules: [{ id: "GR-01", tags: ["typing"] }],
      })
    );

    const mockSource = path.join(fixtureDir, "source.ts");
    await fs.writeFile(mockSource, "const a = b as any;");

    const grouped = await runAiCheck(fixtureDir);

    assert.ok(grouped["TOKEN-LINT-01"], "Deve reportar falta de ignores");
    assert.ok(grouped["TOKEN-LINT-02"], "Deve reportar node_modules");
    assert.ok(grouped["TOKEN-LINT-03"], "Deve reportar arquivo grande");
    assert.ok(grouped["GR-01"], "Deve reportar typing (quality gate)");

    // Cleanup
    await fs.rm(fixtureDir, { recursive: true, force: true });
  });
});
