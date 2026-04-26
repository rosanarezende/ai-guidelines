import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { applyHusky } from "./husky.mjs";

async function createTempDir(prefix) {
  return await fs.mkdtemp(path.join(os.tmpdir(), `ai-test-husky-${prefix}-`));
}

describe("Feature: Husky (Automation Hooks)", () => {
  let targetDir;

  before(async () => {
    targetDir = await createTempDir("husky");
  });

  after(async () => {
    await fs.rm(targetDir, { recursive: true, force: true });
  });

  it("[BEHAVIOR] Deve configurar Husky e scripts prepare", async () => {
    const subTarget = path.join(targetDir, "normal-flow");
    await fs.mkdir(subTarget, { recursive: true });
    const pkgPath = path.join(subTarget, "package.json");
    await fs.writeFile(pkgPath, JSON.stringify({ scripts: { format: "prettier --write ." } }));

    const actions = [];
    const context = { packageManager: { runner: "yarn" } };
    await applyHusky(subTarget, { features: ["husky"] }, context, actions);

    const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));
    assert.strictEqual(pkg.scripts.prepare, "husky", "Deve adicionar script prepare: husky");

    const preCommitExists = await fs
      .access(path.join(subTarget, ".husky", "pre-commit"))
      .then(() => true)
      .catch(() => false);
    assert.ok(preCommitExists, "Deve criar o hook pre-commit");
  });

  it("[MERGE] Deve concatenar comandos se hook já existir", async () => {
    const subTarget = path.join(targetDir, "merge-flow");
    const huskyDir = path.join(subTarget, ".husky");
    await fs.mkdir(huskyDir, { recursive: true });
    const preCommitPath = path.join(huskyDir, "pre-commit");
    await fs.writeFile(preCommitPath, "echo 'hello world'\n");

    const pkgPath = path.join(subTarget, "package.json");
    await fs.writeFile(pkgPath, JSON.stringify({ scripts: { format: "prettier --write ." } }));

    const context = { packageManager: { runner: "yarn" } };
    await applyHusky(subTarget, { features: ["husky"] }, context, []);

    const content = await fs.readFile(preCommitPath, "utf8");
    assert.match(content, /echo 'hello world'/, "Deve manter conteúdo antigo");
    assert.match(content, /yarn format/, "Deve adicionar comando novo (se detectado runner)");
  });

  it("[SKIP] Deve pular se feature desativada", async () => {
    const subTarget = path.join(targetDir, "skip-flow");
    await fs.mkdir(subTarget, { recursive: true });

    const actions = [];
    await applyHusky(subTarget, { features: ["rules"] }, {}, actions);

    assert.ok(
      actions.some((a) => a.includes("skip husky (feature desativada)")),
      "Deve logar skip"
    );
  });

  it("[DRY-RUN] Não deve criar hooks nem alterar package.json", async () => {
    const subTarget = path.join(targetDir, "dry-run");
    await fs.mkdir(subTarget, { recursive: true });
    const pkgPath = path.join(subTarget, "package.json");
    await fs.writeFile(pkgPath, JSON.stringify({ scripts: { format: "prettier --write ." } }));

    const actions = [];
    await applyHusky(
      subTarget,
      { features: ["husky"], "dry-run": true },
      { packageManager: { runner: "yarn" } },
      actions
    );

    const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));
    assert.equal(pkg.scripts.prepare, undefined);

    const hookExists = await fs
      .access(path.join(subTarget, ".husky", "pre-commit"))
      .then(() => true)
      .catch(() => false);
    assert.equal(hookExists, false);
    assert.ok(actions.some((a) => a.includes("update package.json")));
  });
});
