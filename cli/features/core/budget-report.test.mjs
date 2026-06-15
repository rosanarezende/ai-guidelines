import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { runBudgetReport } from "./budget-report.mjs";

/**
 * Contrato ADVISORY do `check-budget` (Spec 0024 · CO-3.3).
 *
 * Exercita o caminho RECONECTADO (`budget-report.mjs` → `dist/` TokenBudget) e
 * prova o contrato: orçamento estourado é DIAGNÓSTICO (não falha); só erro de
 * leitura do catálogo seta exit ≠ 0; e `check-budget` NÃO entra no `validate`
 * (não pode bloquear CI). Requer `dist/` construído (o `validate` builda antes).
 */
async function withSilencedConsole(fn) {
  const log = console.log;
  const err = console.error;
  console.log = () => {};
  console.error = () => {};
  try {
    return await fn();
  } finally {
    console.log = log;
    console.error = err;
  }
}

describe("check-budget — contrato advisory (CO-3.3)", () => {
  let tmpDir;
  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "budget-report-"));
  });
  after(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("DADO catálogo ACIMA do orçamento QUANDO roda ENTÃO é ADVISORY (exit permanece 0)", async () => {
    const over = path.join(tmpDir, "rules.json");
    // universal ~1715 tokens (6000/3.5) > limite 1500 ⇒ warning, mas advisory.
    await fs.writeFile(
      over,
      JSON.stringify({ rules: [{ id: "X", scope: "universal", instruction_en: "a".repeat(6000) }] })
    );
    const prev = process.exitCode;
    process.exitCode = 0;
    try {
      await withSilencedConsole(() => runBudgetReport({ rulesJsonPath: over }));
      assert.equal(process.exitCode, 0, "orçamento estourado é advisory: não seta exit ≠ 0");
    } finally {
      process.exitCode = prev ?? 0;
    }
  });

  it("DADO catálogo AUSENTE QUANDO roda ENTÃO seta exit 1 (erro de leitura, não advisory)", async () => {
    const prev = process.exitCode;
    process.exitCode = 0;
    try {
      await withSilencedConsole(() =>
        runBudgetReport({ rulesJsonPath: path.join(tmpDir, "inexistente.json") })
      );
      assert.equal(process.exitCode, 1);
    } finally {
      process.exitCode = prev ?? 0; // restaura p/ não falhar o runner
    }
  });

  it("DADO o contrato QUANDO inspeciono `validate` ENTÃO check-budget NÃO está nele (não bloqueia CI)", () => {
    const pkg = JSON.parse(
      readFileSync(new URL("../../../package.json", import.meta.url), "utf-8")
    );
    assert.ok(
      !/check-budget/.test(pkg.scripts.validate),
      "check-budget é diagnóstico advisory — fora do validate"
    );
  });
});
