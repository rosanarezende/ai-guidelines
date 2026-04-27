import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { applyTdd } from "./tdd.mjs";

/**
 * [BR-OPT-TDD] Suite de Validação da Feature TDD
 */
describe("Opt-in Feature: TDD [BR-OPT-TDD]", () => {
  let targetDir;

  before(async () => {
    targetDir = await fs.mkdtemp(path.join(os.tmpdir(), "ai-opt-tdd-test-"));
  });

  after(async () => {
    await fs.rm(targetDir, { recursive: true, force: true });
  });

  it("DADO a feature 'tdd' ativa QUANDO applyTdd ENTÃO deve sincronizar o arquivo de regras no destino", async () => {
    const actions = [];
    const options = { features: ["tdd"], "dry-run": false };

    await applyTdd(targetDir, options, {}, actions);

    const targetFile = path.join(targetDir, ".ai-guidelines", "rules", "tdd.md");
    const exists = await fs
      .access(targetFile)
      .then(() => true)
      .catch(() => false);

    assert.ok(exists, "O arquivo tdd.md deve ser criado no consumidor");
    assert.ok(
      actions.includes("sync .ai-guidelines/rules/tdd.md"),
      "Deve registrar a ação de sincronização"
    );

    const content = await fs.readFile(targetFile, "utf8");
    assert.ok(content.includes("# TDD & BDD"), "O conteúdo deve ser o baseline editorial");
  });

  it("DADO a feature 'tdd' desativada QUANDO applyTdd ENTÃO não deve criar o arquivo", async () => {
    const actions = [];
    const options = { features: [], "dry-run": false };
    const subDir = path.join(targetDir, "skip-test");
    await fs.mkdir(subDir);

    await applyTdd(subDir, options, {}, actions);

    const targetFile = path.join(subDir, ".ai-guidelines", "rules", "tdd.md");
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
      actions.some((a) => a.includes("skip tdd")),
      "Deve registrar o skip nas ações"
    );
  });

  it("DADO a feature 'tdd' ativa com --dry-run QUANDO applyTdd ENTÃO deve registrar a ação mas NÃO escrever o arquivo", async () => {
    const actions = [];
    const options = { features: ["tdd"], "dry-run": true };
    const dryDir = path.join(targetDir, "dry-run-test");
    await fs.mkdir(dryDir);

    await applyTdd(dryDir, options, {}, actions);

    const targetFile = path.join(dryDir, ".ai-guidelines", "rules", "tdd.md");
    const exists = await fs
      .access(targetFile)
      .then(() => true)
      .catch(() => false);

    assert.strictEqual(exists, false, "O arquivo não deve ser escrito em modo dry-run");
    assert.ok(
      actions.includes("sync .ai-guidelines/rules/tdd.md"),
      "Deve registrar a intenção no log de ações"
    );
  });
});
