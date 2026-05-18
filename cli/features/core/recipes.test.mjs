import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { describe, it, before, after } from "node:test";

import {
  deriveRecipeName,
  recipeExists,
  tryRenderViaEngine,
} from "./recipes.mjs";

const REPO_ROOT = path.resolve(import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname), "..", "..", "..");

async function tmpDir(prefix) {
  return fs.mkdtemp(path.join(os.tmpdir(), `ai-test-recipes-${prefix}-`));
}

describe("recipes.mjs: deriveRecipeName()", () => {
  it("extrai recipe name de filename canônico", () => {
    assert.equal(deriveRecipeName("spec-boilerplate.md"), "spec");
  });

  it("extrai recipe name de filename com workflow variant", () => {
    assert.equal(deriveRecipeName("tasks-evidence-driven-boilerplate.md"), "tasks-evidence-driven");
    assert.equal(deriveRecipeName("tasks-deterministic-boilerplate.md"), "tasks-deterministic");
    assert.equal(deriveRecipeName("tasks-mixed-boilerplate.md"), "tasks-mixed");
  });

  it("retorna null para arquivos sem o sufixo -boilerplate.md", () => {
    assert.equal(deriveRecipeName("README.md"), null);
    assert.equal(deriveRecipeName("spec.md"), null);
    assert.equal(deriveRecipeName("tasks-evidence-driven.md"), null);
  });
});

describe("recipes.mjs: recipeExists()", () => {
  it("retorna true para recipe presente no repo (tasks-evidence-driven)", () => {
    assert.equal(recipeExists("tasks-evidence-driven", REPO_ROOT), true);
  });

  it("retorna false para recipe ausente", () => {
    assert.equal(recipeExists("does-not-exist", REPO_ROOT), false);
    assert.equal(recipeExists("spec", REPO_ROOT), false);
  });

  it("retorna false para input vazio/null", () => {
    assert.equal(recipeExists("", REPO_ROOT), false);
    assert.equal(recipeExists(null, REPO_ROOT), false);
  });
});

describe("recipes.mjs: tryRenderViaEngine()", () => {
  let destDir;

  before(async () => {
    destDir = await tmpDir("render");
  });

  after(async () => {
    await fs.rm(destDir, { recursive: true, force: true });
  });

  it("retorna rendered=false quando filename não termina em -boilerplate.md", async () => {
    const result = await tryRenderViaEngine({
      sourceFilename: "README.md",
      destinationDir: destDir,
      repoRoot: REPO_ROOT,
    });
    assert.equal(result.rendered, false);
    assert.equal(result.reason, "not-boilerplate");
  });

  it("retorna rendered=false (no-recipe) quando boilerplate sem recipe correspondente", async () => {
    const result = await tryRenderViaEngine({
      sourceFilename: "spec-boilerplate.md",
      destinationDir: destDir,
      repoRoot: REPO_ROOT,
    });
    assert.equal(result.rendered, false);
    assert.equal(result.reason, "no-recipe");
    assert.equal(result.recipeName, "spec");
  });

  it("renderiza tasks-evidence-driven via engine e grava com filename do mirror (R4)", async () => {
    const result = await tryRenderViaEngine({
      sourceFilename: "tasks-evidence-driven-boilerplate.md",
      destinationDir: destDir,
      repoRoot: REPO_ROOT,
    });
    assert.equal(result.rendered, true);
    assert.equal(result.recipeName, "tasks-evidence-driven");
    assert.equal(
      result.outputPath,
      path.join(destDir, "tasks-evidence-driven-boilerplate.md"),
      "output filename DEVE ser igual ao do mirror (R4)"
    );
    const written = await fs.readFile(result.outputPath, "utf8");
    assert.equal(written, result.content);
    assert.ok(result.content.endsWith("\n"), "output deve terminar em exatamente um \\n (E2)");
    assert.ok(Array.isArray(result.slots) && result.slots.length > 0);
  });

  it("dryRun=true não escreve no disco mas retorna o conteúdo normalizado", async () => {
    const dryDir = await tmpDir("dryrun");
    try {
      const result = await tryRenderViaEngine({
        sourceFilename: "tasks-evidence-driven-boilerplate.md",
        destinationDir: dryDir,
        repoRoot: REPO_ROOT,
        dryRun: true,
      });
      assert.equal(result.rendered, true);
      assert.ok(result.content && result.content.length > 0);
      const stillEmpty = await fs.readdir(dryDir);
      assert.equal(stillEmpty.length, 0, "dryRun não deve criar arquivos");
    } finally {
      await fs.rm(dryDir, { recursive: true, force: true });
    }
  });
});
