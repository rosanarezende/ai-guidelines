import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { main } from "./buildRules.js";

function writeRuleFile(repoRoot: string): void {
  const rulesDir = path.join(repoRoot, ".core/rules/top");
  mkdirSync(rulesDir, { recursive: true });
  writeFileSync(
    path.join(rulesDir, "agents-core.md"),
    [
      "#### [CORE-99] Test Rule",
      "",
      "```yaml",
      "id: CORE-99",
      "scope: universal",
      "category: process",
      "evidence_strength: declared_heuristic",
      "sources: []",
      'applicable_languages: ["*"]',
      'tags: ["core"]',
      "```",
      "",
      "**Instruction (en):**",
      "",
      "Use this deterministic test rule for build:rules coverage.",
      "",
    ].join("\n"),
    "utf-8"
  );
}

describe("buildRules CLI", () => {
  it("DADO repo com .core/rules QUANDO main executa ENTÃO escreve rules.json, ledger e catalogo no root informado", async () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "rules-build-cli-"));
    const originalStdout = process.stdout.write;
    const originalStderr = process.stderr.write;
    process.stdout.write = jest.fn() as unknown as typeof process.stdout.write;
    process.stderr.write = jest.fn() as unknown as typeof process.stderr.write;

    try {
      writeRuleFile(repoRoot);

      const exitCode = await main(repoRoot);

      expect(exitCode).toBe(0);
      const rulesJson = JSON.parse(
        readFileSync(path.join(repoRoot, ".core/rules/_meta/rules.json"), "utf-8")
      ) as { rules: Array<{ id: string; file: string }> };
      expect(rulesJson.rules).toHaveLength(1);
      expect(rulesJson.rules[0]).toMatchObject({
        id: "CORE-99",
        file: ".core/rules/top/agents-core.md",
      });
      expect(
        readFileSync(path.join(repoRoot, ".core/rules/_meta/agents-core-ledger.md"), "utf-8")
      ).toContain("CORE-99");
      expect(readFileSync(path.join(repoRoot, ".core/rules/catalog.md"), "utf-8")).toContain(
        "[Ver](top/agents-core.md#core99)"
      );
    } finally {
      process.stdout.write = originalStdout;
      process.stderr.write = originalStderr;
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });
});
