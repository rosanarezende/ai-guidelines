import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { applyPrettier } from "./prettier.mjs";

async function createTempDir(prefix) {
  return await fs.mkdtemp(path.join(os.tmpdir(), `ai-test-prettier-${prefix}-`));
}

describe("Feature: Prettier (Styling Governance)", () => {
  let targetDir;

  before(async () => {
    targetDir = await createTempDir("prettier");
  });

  after(async () => {
    await fs.rm(targetDir, { recursive: true, force: true });
  });

  it("[BEHAVIOR] Deve injetar prettier se não houver rival e feature ativa", async () => {
    const subTarget = path.join(targetDir, "normal-flow");
    await fs.mkdir(subTarget, { recursive: true });
    const pkgPath = path.join(subTarget, "package.json");
    await fs.writeFile(pkgPath, JSON.stringify({ name: "test" }));

    const actions = [];
    const options = { features: ["prettier"] };
    const context = { formatterContext: { shouldSkipPrettier: false } };

    await applyPrettier(subTarget, options, context, actions);

    const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));
    assert.ok(pkg.devDependencies.prettier, "Prettier deve ser adicionado");
    assert.ok(pkg.scripts.format, "Script de format deve ser adicionado");
  });

  it("[RIVAL] Deve pular injeção se detectar rival (Biome, etc)", async () => {
    const subTarget = path.join(targetDir, "rival-flow");
    await fs.mkdir(subTarget, { recursive: true });
    const pkgPath = path.join(subTarget, "package.json");
    await fs.writeFile(pkgPath, JSON.stringify({ devDependencies: { "@biomejs/biome": "1.0.0" } }));

    const actions = [];
    const options = { features: ["prettier"] };
    // O context viria do motor de detecção
    const context = { formatterContext: { shouldSkipPrettier: true, rival: { label: "Biome" } } };

    await applyPrettier(subTarget, options, context, actions);

    const log = actions.join("\n");
    assert.match(log, /skip prettier .* rival detectado: Biome/, "Deve logar skip por rival");

    const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));
    assert.strictEqual(pkg.devDependencies.prettier, undefined, "Não deve injetar prettier");
  });

  it("[FALSO-POSITIVO] Não deve reportar como nova dependência se já existir no package.json", async () => {
    const subTarget = path.join(targetDir, "existing-dep");
    await fs.mkdir(subTarget, { recursive: true });
    const pkgPath = path.join(subTarget, "package.json");
    await fs.writeFile(pkgPath, JSON.stringify({ devDependencies: { prettier: "^3.0.0" } }));

    const actions = [];
    await applyPrettier(subTarget, { features: ["prettier"] }, { formatterContext: {} }, actions);

    const log = actions.join("\n");
    assert.ok(
      !log.includes("novas dependências detectadas"),
      "Não deve disparar alerta de nova dependência"
    );
  });

  it("[IGNORE] Deve injetar .prettierignore baseline", async () => {
    const subTarget = path.join(targetDir, "ignore-flow");
    await fs.mkdir(subTarget, { recursive: true });
    await fs.writeFile(path.join(subTarget, "package.json"), JSON.stringify({}));

    await applyPrettier(subTarget, { features: ["prettier"] }, { formatterContext: {} }, []);

    const ignoreExists = await fs
      .access(path.join(subTarget, ".prettierignore"))
      .then(() => true)
      .catch(() => false);
    assert.ok(ignoreExists, "Deve criar .prettierignore");
  });

  it("[DRY-RUN] Não deve persistir alterações de prettier em disco", async () => {
    const subTarget = path.join(targetDir, "dry-run");
    await fs.mkdir(subTarget, { recursive: true });
    const pkgPath = path.join(subTarget, "package.json");
    await fs.writeFile(pkgPath, JSON.stringify({ name: "test" }));

    const actions = [];
    await applyPrettier(
      subTarget,
      { features: ["prettier"], "dry-run": true },
      { formatterContext: {} },
      actions
    );

    const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));
    assert.equal(pkg.devDependencies, undefined);
    assert.equal(pkg.scripts, undefined);

    const ignoreExists = await fs
      .access(path.join(subTarget, ".prettierignore"))
      .then(() => true)
      .catch(() => false);
    assert.equal(ignoreExists, false);
    assert.ok(actions.some((a) => a.includes("update package.json")));
  });
});
