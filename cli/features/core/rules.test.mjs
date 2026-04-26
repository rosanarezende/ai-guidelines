import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { applyRules } from "./rules.mjs";

async function createTempDir(prefix) {
  return await fs.mkdtemp(path.join(os.tmpdir(), `ai-test-rules-${prefix}-`));
}

describe("Feature: Rules (Governance Modules)", () => {
  let targetDir;

  before(async () => {
    targetDir = await createTempDir("rules");
  });

  after(async () => {
    await fs.rm(targetDir, { recursive: true, force: true });
  });

  it("[BEHAVIOR] Deve sincronizar regras para .ai-guidelines/rules", async () => {
    const subTarget = path.join(targetDir, "sync-ok");
    await fs.mkdir(subTarget, { recursive: true });

    const actions = [];
    await applyRules(subTarget, {}, actions);

    const rulesPath = path.join(subTarget, ".ai-guidelines", "rules", "global-rules.md");
    const exists = await fs
      .access(rulesPath)
      .then(() => true)
      .catch(() => false);
    assert.ok(exists, "Regras globais devem ser sincronizadas para a pasta de namespace");
  });

  it("[IDEMPOTENCY] Não deve re-escrever arquivos idênticos", async () => {
    const subTarget = path.join(targetDir, "idempotency");
    await fs.mkdir(subTarget, { recursive: true });

    // Primeiro sync
    await applyRules(subTarget, {}, []);

    const actions = [];
    // Segundo sync
    await applyRules(subTarget, {}, actions);

    const writes = actions.filter((a) => a.includes("write"));
    assert.strictEqual(writes.length, 0, "Não deve realizar escritas redundantes");
  });

  it("[PRUNE] Deve remover arquivos órfãos se a flag prune estiver ativa", async () => {
    const subTarget = path.join(targetDir, "prune-orphans");
    const rulesDir = path.join(subTarget, ".ai-guidelines", "rules");
    await fs.mkdir(rulesDir, { recursive: true });

    const orphanPath = path.join(rulesDir, "stale-rule.md");
    await fs.writeFile(orphanPath, "legacy");

    await applyRules(subTarget, { prune: true }, []);

    const exists = await fs
      .access(orphanPath)
      .then(() => true)
      .catch(() => false);
    assert.strictEqual(exists, false, "Arquivo órfão deve ser removido pelo sync");
  });

  it("[PRUNE] NÃO deve remover órfãos se a flag prune estiver inativa", async () => {
    const subTarget = path.join(targetDir, "no-prune");
    const rulesDir = path.join(subTarget, ".ai-guidelines", "rules");
    await fs.mkdir(rulesDir, { recursive: true });

    const orphanPath = path.join(rulesDir, "user-rule.md");
    await fs.writeFile(orphanPath, "important");

    await applyRules(subTarget, { prune: false }, []);

    const exists = await fs
      .access(orphanPath)
      .then(() => true)
      .catch(() => false);
    assert.ok(exists, "Arquivo customizado deve ser preservado sem flag prune");
  });

  it("[MANDATORY] Não deve mais permitir o skip de rules", async () => {
    const subTarget = path.join(targetDir, "mandatory-rules");
    await fs.mkdir(subTarget, { recursive: true });

    const actions = [];
    await applyRules(subTarget, { "skip-rules": true }, actions);

    const rulesDir = path.join(subTarget, ".ai-guidelines", "rules");
    const exists = await fs
      .access(rulesDir)
      .then(() => true)
      .catch(() => false);
    assert.strictEqual(exists, true, ".ai-guidelines/rules deve ser criada mesmo com flag de skip");
  });

  it("[DRY-RUN] Não deve escrever regras em disco no modo dry-run", async () => {
    const subTarget = path.join(targetDir, "dry-run-rules");
    await fs.mkdir(subTarget, { recursive: true });

    const actions = [];
    await applyRules(subTarget, { "dry-run": true }, actions);

    const rulesPath = path.join(subTarget, ".ai-guidelines", "rules", "global-rules.md");
    const exists = await fs
      .access(rulesPath)
      .then(() => true)
      .catch(() => false);
    assert.strictEqual(exists, false, "Não deve persistir arquivos de regra em dry-run");
    assert.ok(actions.some((a) => a.includes("[dry-run] mkdir .ai-guidelines/rules")));
  });
});
