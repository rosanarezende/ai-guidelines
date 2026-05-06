import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";

/**
 * Utilitário compartilhado para testes de features opt-in que sincronizam
 * regras editoriais em `.ai-guidelines/rules/`.
 *
 * Elimina duplicação de boilerplate entre quality-gates.test.mjs,
 * tdd.test.mjs e bdd.test.mjs (e futuras features opt-in de regras).
 *
 * Padrão de uso:
 *   import { createOptInRuleTestSuite } from "./test-helpers.mjs";
 *   createOptInRuleTestSuite({ featureName, applyFn, outputFileName, ... });
 */

/**
 * Cria um diretório temporário com prefixo padronizado.
 */
export async function createTempDir(prefix) {
  return await fs.mkdtemp(path.join(os.tmpdir(), `ai-opt-${prefix}-`));
}

/**
 * Verifica se um arquivo existe no disco.
 */
export async function fileExists(filePath) {
  return fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
}

/**
 * Cria a estrutura de mock do source para testes que precisam de
 * templates em `.core/rules/opt-in/` usando a hierarquia mínima por tema.
 *
 * @param {string} baseDir - Diretório raiz do mock
 * @param {string} sourceFileName - Nome relativo do arquivo fonte (ex: "methodologies/tdd-pt.md")
 * @param {string} content - Conteúdo do arquivo mock
 * @returns {string} caminho do diretório de mock criado
 */
export async function createMockSource(baseDir, sourceFileName, content) {
  const mockSourceDir = path.join(baseDir, ".core", "rules", "opt-in");
  const targetPath = path.join(mockSourceDir, sourceFileName);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, content);
  return mockSourceDir;
}

/**
 * Gera uma suite de testes BDD padronizada para qualquer feature opt-in
 * que sincronize um arquivo de regras em `.ai-guidelines/rules/`.
 *
 * @param {object} config
 * @param {string} config.featureName - Nome da feature (ex: "quality-gates", "tdd", "bdd")
 * @param {Function} config.applyFn - A função apply da feature (ex: applyQualityGates)
 * @param {string} config.outputFileName - Nome do arquivo gerado (ex: "quality-gates.md")
 * @param {string} config.suiteLabel - Label do describe (ex: "[BR-OPT-QG]")
 * @param {string} config.syncActionPattern - Padrão esperado na action de sync
 * @param {string} config.pruneActionPattern - Padrão esperado na action de prune
 * @param {boolean} [config.usesI18n=false] - Se a feature suporta i18n via lang
 * @param {string} [config.sourceFileNamePt] - Nome do arquivo fonte PT (ex: "tdd-pt.md")
 * @param {string} [config.sourceFileNameEn] - Nome do arquivo fonte EN (ex: "tdd-en.md")
 * @param {string} [config.mockContentPt] - Conteúdo mock PT
 * @param {string} [config.mockContentEn] - Conteúdo mock EN
 * @param {Function} [config.describe] - função describe do test runner
 * @param {Function} [config.it] - função it do test runner
 * @param {Function} [config.before] - função before do test runner
 * @param {Function} [config.after] - função after do test runner
 */
export function createOptInRuleTestSuite(config) {
  const {
    featureName,
    applyFn,
    outputFileName,
    suiteLabel,
    syncActionPattern,
    pruneActionPattern,
    usesI18n = false,
    sourceFileNamePt,
    sourceFileNameEn,
    mockContentPt,
    mockContentEn,
    describe: desc,
    it: testIt,
    before: testBefore,
    after: testAfter,
  } = config;
  const canUseMockSource = Boolean(sourceFileNamePt && mockContentPt);

  desc(`Opt-in Feature: ${featureName} ${suiteLabel}`, () => {
    let targetDir;

    testBefore(async () => {
      targetDir = await createTempDir(`${featureName}-test`);
    });

    testAfter(async () => {
      await fs.rm(targetDir, { recursive: true, force: true });
    });

    // --- Cenário: feature ativa (idioma padrão ou PT) ---
    testIt(
      `DADO a feature '${featureName}' ativa ${usesI18n ? "com idioma PT " : ""}QUANDO apply ENTÃO deve sincronizar o arquivo no destino`,
      async () => {
        const actions = [];
        const options = {
          features: [featureName],
          "dry-run": false,
          ...(usesI18n && { lang: "pt" }),
        };
        const subDir = usesI18n ? path.join(targetDir, "pt-test") : targetDir;

        let context = {};
        if (canUseMockSource) {
          await createMockSource(subDir, sourceFileNamePt, mockContentPt);
          context = { rootDir: subDir };
        }

        await applyFn(subDir, options, context, actions);

        const targetFile = path.join(subDir, ".ai-guidelines", "rules", outputFileName);
        assert.ok(
          await fileExists(targetFile),
          `O arquivo ${outputFileName} deve ser criado no consumidor`
        );
        assert.ok(
          actions.some((a) => a.includes(syncActionPattern)),
          "Deve registrar a ação de sincronização"
        );

        const content = await fs.readFile(targetFile, "utf8");
        assert.ok(content.length > 0, "O conteúdo não deve estar vazio");
      }
    );

    // --- Cenário: feature ativa com idioma EN (apenas i18n) ---
    if (usesI18n) {
      testIt(
        `DADO a feature '${featureName}' ativa com idioma EN QUANDO apply ENTÃO deve sincronizar o arquivo en no destino`,
        async () => {
          const actions = [];
          const options = { features: [featureName], "dry-run": false, lang: "en" };
          const enDir = path.join(targetDir, "en-test");

          await createMockSource(enDir, sourceFileNameEn, mockContentEn);

          await applyFn(enDir, options, { rootDir: enDir }, actions);

          const targetFile = path.join(enDir, ".ai-guidelines", "rules", outputFileName);
          const content = await fs.readFile(targetFile, "utf8");
          assert.ok(
            content.includes(mockContentEn.split("\n")[0]),
            "O conteúdo deve ser o do template en"
          );
        }
      );
    }

    // --- Cenário: feature desativada ---
    testIt(
      `DADO a feature '${featureName}' desativada QUANDO apply ENTÃO não deve criar o arquivo`,
      async () => {
        const actions = [];
        const options = { features: [], "dry-run": false, ...(usesI18n && { lang: "pt" }) };
        const subDir = path.join(targetDir, "skip-test");
        await fs.mkdir(subDir);

        const context = canUseMockSource ? { rootDir: subDir } : {};
        await applyFn(subDir, options, context, actions);

        const targetFile = path.join(subDir, ".ai-guidelines", "rules", outputFileName);
        assert.strictEqual(
          await fileExists(targetFile),
          false,
          "O arquivo não deve ser criado se a feature estiver desativada"
        );
        assert.ok(
          actions.some((a) => a.includes(`skip ${featureName}`)),
          "Deve registrar o skip nas ações"
        );
      }
    );

    // --- Cenário: prune quando desativada ---
    testIt(
      `DADO a feature '${featureName}' desativada com flag --prune QUANDO apply ENTÃO deve remover o arquivo órfão do consumidor`,
      async () => {
        const actions = [];
        const options = {
          features: [],
          "dry-run": false,
          prune: true,
          ...(usesI18n && { lang: "pt" }),
        };
        const subDir = path.join(targetDir, "prune-test");
        const rulesDir = path.join(subDir, ".ai-guidelines", "rules");
        await fs.mkdir(rulesDir, { recursive: true });

        const targetFile = path.join(rulesDir, outputFileName);
        await fs.writeFile(targetFile, "old content");

        const context = canUseMockSource ? { rootDir: subDir } : {};
        await applyFn(subDir, options, context, actions);

        assert.strictEqual(
          await fileExists(targetFile),
          false,
          "O arquivo deve ser removido pelo prune da própria feature"
        );
        assert.ok(
          actions.some((a) => a.includes(pruneActionPattern)),
          "Deve registrar o prune nas ações"
        );
      }
    );

    // --- Cenário: dry-run ---
    testIt(
      `DADO a feature '${featureName}' ativa com --dry-run QUANDO apply ENTÃO deve registrar a ação mas NÃO escrever o arquivo`,
      async () => {
        const actions = [];
        const options = {
          features: [featureName],
          "dry-run": true,
          ...(usesI18n && { lang: "pt" }),
        };
        const dryDir = path.join(targetDir, "dry-run-test");

        let context = {};
        if (canUseMockSource) {
          await createMockSource(dryDir, sourceFileNamePt, mockContentPt);
          context = { rootDir: dryDir };
        }

        await applyFn(dryDir, options, context, actions);

        const targetFile = path.join(dryDir, ".ai-guidelines", "rules", outputFileName);
        assert.strictEqual(
          await fileExists(targetFile),
          false,
          "O arquivo não deve ser escrito em modo dry-run"
        );
        assert.ok(
          actions.some((a) => a.includes(syncActionPattern)),
          "Deve registrar a intenção no log de ações"
        );
      }
    );
  });
}
