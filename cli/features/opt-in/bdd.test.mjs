import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { applyBdd } from "./bdd.mjs";

/**
 * [BR-OPT-BDD] Suite de Validação da Feature BDD
 */
describe("Opt-in Feature: BDD [BR-OPT-BDD]", () => {
  let targetDir;

  before(async () => {
    targetDir = await fs.mkdtemp(path.join(os.tmpdir(), "ai-opt-bdd-test-"));
  });

  after(async () => {
    await fs.rm(targetDir, { recursive: true, force: true });
  });

  it("DADO a feature 'bdd' ativa com idioma PT QUANDO applyBdd ENTÃO deve sincronizar o arquivo pt no destino", async () => {
    const actions = [];
    const options = { features: ["bdd"], "dry-run": false, lang: "pt" };
    const ptDir = path.join(targetDir, "pt-test");

    const mockSourceDir = path.join(ptDir, ".core", "rules", "opt-in");
    await fs.mkdir(mockSourceDir, { recursive: true });
    await fs.writeFile(path.join(mockSourceDir, "bdd-pt.md"), "# BDD PT");

    await applyBdd(ptDir, options, { rootDir: ptDir }, actions);

    const targetFile = path.join(ptDir, ".ai-guidelines", "rules", "bdd.md");
    const exists = await fs
      .access(targetFile)
      .then(() => true)
      .catch(() => false);

    assert.ok(exists, "O arquivo bdd.md deve ser criado no consumidor");
    assert.ok(
      actions.includes("sync .ai-guidelines/rules/bdd.md (lang: pt)"),
      "Deve registrar a ação de sincronização com idioma pt"
    );

    const content = await fs.readFile(targetFile, "utf8");
    assert.ok(content.includes("# BDD PT"), "O conteúdo deve ser o do template pt");
  });

  it("DADO a feature 'bdd' ativa com idioma EN QUANDO applyBdd ENTÃO deve sincronizar o arquivo en no destino", async () => {
    const actions = [];
    const options = { features: ["bdd"], "dry-run": false, lang: "en" };
    const enDir = path.join(targetDir, "en-test");

    const mockSourceDir = path.join(enDir, ".core", "rules", "opt-in");
    await fs.mkdir(mockSourceDir, { recursive: true });
    await fs.writeFile(path.join(mockSourceDir, "bdd-en.md"), "# BDD EN");

    await applyBdd(enDir, options, { rootDir: enDir }, actions);

    const targetFile = path.join(enDir, ".ai-guidelines", "rules", "bdd.md");
    const content = await fs.readFile(targetFile, "utf8");

    assert.ok(content.includes("# BDD EN"), "O conteúdo deve ser o do template en");
  });

  it("DADO a feature 'bdd' desativada QUANDO applyBdd ENTÃO não deve criar o arquivo", async () => {
    const actions = [];
    const options = { features: [], "dry-run": false, lang: "pt" };
    const subDir = path.join(targetDir, "skip-test");
    await fs.mkdir(subDir);

    await applyBdd(subDir, options, { rootDir: subDir }, actions);

    const targetFile = path.join(subDir, ".ai-guidelines", "rules", "bdd.md");
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
      actions.some((a) => a.includes("skip bdd")),
      "Deve registrar o skip nas ações"
    );
  });

  it("DADO a feature 'bdd' desativada com flag --prune QUANDO applyBdd ENTÃO deve remover o arquivo órfão do consumidor", async () => {
    const actions = [];
    const options = { features: [], "dry-run": false, prune: true, lang: "pt" };
    const subDir = path.join(targetDir, "prune-test");
    const rulesDir = path.join(subDir, ".ai-guidelines", "rules");
    await fs.mkdir(rulesDir, { recursive: true });

    const targetFile = path.join(rulesDir, "bdd.md");
    await fs.writeFile(targetFile, "old content");

    await applyBdd(subDir, options, { rootDir: subDir }, actions);

    const exists = await fs
      .access(targetFile)
      .then(() => true)
      .catch(() => false);

    assert.strictEqual(exists, false, "O arquivo deve ser removido pelo prune da própria feature");
    assert.ok(
      actions.some((a) => a.includes("prune .ai-guidelines/rules/bdd.md")),
      "Deve registrar o prune nas ações"
    );
  });

  it("DADO a feature 'bdd' ativa com --dry-run QUANDO applyBdd ENTÃO deve registrar a ação mas NÃO escrever o arquivo", async () => {
    const actions = [];
    const options = { features: ["bdd"], "dry-run": true, lang: "pt" };
    const dryDir = path.join(targetDir, "dry-run-test");

    const mockSourceDir = path.join(dryDir, ".core", "rules", "opt-in");
    await fs.mkdir(mockSourceDir, { recursive: true });
    await fs.writeFile(path.join(mockSourceDir, "bdd-pt.md"), "# BDD PT");

    await applyBdd(dryDir, options, { rootDir: dryDir }, actions);

    const targetFile = path.join(dryDir, ".ai-guidelines", "rules", "bdd.md");
    const exists = await fs
      .access(targetFile)
      .then(() => true)
      .catch(() => false);

    assert.strictEqual(exists, false, "O arquivo não deve ser escrito em modo dry-run");
    assert.ok(
      actions.includes("sync .ai-guidelines/rules/bdd.md (lang: pt)"),
      "Deve registrar a intenção no log de ações"
    );
  });
});
