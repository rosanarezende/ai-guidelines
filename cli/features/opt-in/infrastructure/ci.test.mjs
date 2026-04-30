import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { applyCi } from "./ci.mjs";

async function createTempDir(prefix) {
  return await fs.mkdtemp(path.join(os.tmpdir(), `ai-test-ci-${prefix}-`));
}

describe("Feature: CI (GitHub Actions Governance)", () => {
  let targetDir;

  before(async () => {
    targetDir = await createTempDir("ci");
  });

  after(async () => {
    await fs.rm(targetDir, { recursive: true, force: true });
  });

  it("[BEHAVIOR] Deve criar workflow com comandos de instalação adequados para cada package manager", async () => {
    const managers = [
      { id: "npm", install: "npm ci", check: "npm run check" },
      { id: "yarn-berry", install: "yarn install --immutable", check: "yarn check" },
    ];

    for (const pm of managers) {
      const subTarget = path.join(targetDir, `runner-${pm.id}`);
      await fs.mkdir(subTarget, { recursive: true });

      const context = { packageManager: { id: pm.id } };
      await applyCi(subTarget, { features: ["ci"] }, context, []);

      const workflowPath = path.join(subTarget, ".github", "workflows", "ai-guidelines-ci.yml");
      const content = await fs.readFile(workflowPath, "utf8");

      assert.match(
        content,
        new RegExp(pm.install.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
        `Deve usar '${pm.install}' no workflow`
      );
      assert.match(
        content,
        new RegExp(pm.check.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
        `Deve usar '${pm.check}' no workflow`
      );
    }
  });

  it("[PROTECTION] Não deve sobrescrever workflow existente sem --force", async () => {
    const subTarget = path.join(targetDir, "no-overwrite");
    const workflowDir = path.join(subTarget, ".github", "workflows");
    await fs.mkdir(workflowDir, { recursive: true });
    const workflowPath = path.join(workflowDir, "ai-guidelines-ci.yml");
    await fs.writeFile(workflowPath, "original content");

    const actions = [];
    await applyCi(subTarget, { features: ["ci"] }, { packageManager: { id: "npm" } }, actions);

    const content = await fs.readFile(workflowPath, "utf8");
    assert.strictEqual(content, "original content", "Deve preservar arquivo existente");
    assert.ok(
      actions.some((a) => a.includes("skip .github/workflows/ai-guidelines-ci.yml")),
      "Deve logar skip"
    );
  });

  it("[FORCE] Deve sobrescrever se --force estiver ativo", async () => {
    const subTarget = path.join(targetDir, "force-flow");
    const workflowDir = path.join(subTarget, ".github", "workflows");
    await fs.mkdir(workflowDir, { recursive: true });
    const workflowPath = path.join(workflowDir, "ai-guidelines-ci.yml");
    await fs.writeFile(workflowPath, "old");

    await applyCi(
      subTarget,
      { features: ["ci"], force: true },
      { packageManager: { id: "npm" } },
      []
    );

    const content = await fs.readFile(workflowPath, "utf8");
    assert.notStrictEqual(content, "old", "Deve ter sobrescrito com o baseline");
  });

  it("[DRY-RUN] Não deve criar workflow em disco", async () => {
    const subTarget = path.join(targetDir, "dry-run-flow");
    await fs.mkdir(subTarget, { recursive: true });

    const actions = [];
    await applyCi(
      subTarget,
      { features: ["ci"], "dry-run": true },
      { packageManager: { id: "npm", runner: "npm run" } },
      actions
    );

    const workflowExists = await fs
      .access(path.join(subTarget, ".github", "workflows", "ai-guidelines-ci.yml"))
      .then(() => true)
      .catch(() => false);
    assert.equal(workflowExists, false);
    assert.ok(
      actions.some((a) => a.includes("[dry-run] write .github/workflows/ai-guidelines-ci.yml"))
    );
    assert.equal(
      actions.some((a) => a === "write .github/workflows/ai-guidelines-ci.yml (CI baseline)"),
      false,
      "Dry-run não deve registrar escrita real"
    );
  });
});
