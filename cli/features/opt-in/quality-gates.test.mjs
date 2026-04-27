import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { applyQualityGates } from "./quality-gates.mjs";

/**
 * [BR-OPT-QG] Suite de Validação da Feature Quality Gates
 */
describe("Opt-in Feature: Quality Gates [BR-OPT-QG]", () => {
  let targetDir;

  before(async () => {
    targetDir = await fs.mkdtemp(path.join(os.tmpdir(), "ai-opt-qg-test-"));
  });

  after(async () => {
    await fs.rm(targetDir, { recursive: true, force: true });
  });

  it("DADO a feature 'quality-gates' ativa QUANDO applyQualityGates ENTÃO deve sincronizar o arquivo de regras no destino", async () => {
    const actions = [];
    const options = { features: ["quality-gates"], "dry-run": false };

    await applyQualityGates(targetDir, options, {}, actions);

    const targetFile = path.join(targetDir, ".ai-guidelines", "rules", "quality-gates.md");
    const exists = await fs
      .access(targetFile)
      .then(() => true)
      .catch(() => false);

    assert.ok(exists, "O arquivo quality-gates.md deve ser criado no consumidor");
    assert.ok(
      actions.includes("sync .ai-guidelines/rules/quality-gates.md"),
      "Deve registrar a ação de sincronização"
    );

    const content = await fs.readFile(targetFile, "utf8");
    assert.ok(content.includes("# Quality Gates"), "O conteúdo deve ser o baseline editorial");
  });

  it("DADO a feature 'quality-gates' desativada QUANDO applyQualityGates ENTÃO não deve criar o arquivo", async () => {
    const actions = [];
    const options = { features: [], "dry-run": false };
    const subDir = path.join(targetDir, "skip-test");
    await fs.mkdir(subDir);

    await applyQualityGates(subDir, options, {}, actions);

    const targetFile = path.join(subDir, ".ai-guidelines", "rules", "quality-gates.md");
    const exists = await fs
      .access(targetFile)
      .then(() => true)
      .catch(() => false);

    assert.strictEqual(
      exists,
      false,
      "O arquivo não deve ser criado se a feature estiver desativada"
    );
    assert.ok(
      actions.some((a) => a.includes("skip quality-gates")),
      "Deve registrar o skip nas ações"
    );
  });

  it("DADO a feature 'quality-gates' ativa com --dry-run QUANDO applyQualityGates ENTÃO deve registrar a ação mas NÃO escrever o arquivo", async () => {
    const actions = [];
    const options = { features: ["quality-gates"], "dry-run": true };
    const dryDir = path.join(targetDir, "dry-run-test");
    await fs.mkdir(dryDir);

    await applyQualityGates(dryDir, options, {}, actions);

    const targetFile = path.join(dryDir, ".ai-guidelines", "rules", "quality-gates.md");
    const exists = await fs
      .access(targetFile)
      .then(() => true)
      .catch(() => false);

    assert.strictEqual(exists, false, "O arquivo não deve ser escrito em modo dry-run");
    assert.ok(
      actions.includes("sync .ai-guidelines/rules/quality-gates.md"),
      "Deve registrar a intenção no log de ações"
    );
  });
});
