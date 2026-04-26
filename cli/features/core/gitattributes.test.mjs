import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { describe, it, beforeEach, afterEach } from "node:test";
import { applyGitattributes } from "./gitattributes.mjs";

describe("Feature: gitattributes", () => {
  const tmpDir = path.join(process.cwd(), ".tmp-test-gitattributes");

  beforeEach(async () => {
    await fs.mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("[BR-GIT-01] DADO ausência de .gitattributes QUANDO applyGitattributes ENTÃO cria arquivo com baseline", async () => {
    const actions = [];
    const result = await applyGitattributes(tmpDir, {}, actions);

    assert.equal(result.didWrite, true);
    assert.ok(actions.some((a) => a.includes("write .gitattributes")));

    const content = await fs.readFile(path.join(tmpDir, ".gitattributes"), "utf8");
    assert.ok(content.includes("binary"), "Deve conter regras de baseline");
  });

  it("[BR-GIT-02] DADO .gitattributes existente QUANDO applyGitattributes ENTÃO mescla conteúdo", async () => {
    const filePath = path.join(tmpDir, ".gitattributes");
    await fs.writeFile(filePath, "*.custom text\n");

    const actions = [];
    await applyGitattributes(tmpDir, {}, actions);

    const content = await fs.readFile(filePath, "utf8");
    assert.ok(content.includes("*.custom text"), "Deve manter conteúdo anterior");
    assert.ok(content.includes("binary"), "Deve injetar baseline");
  });

  it("[BR-GIT-03] DADO dry-run QUANDO applyGitattributes ENTÃO não persiste em disco", async () => {
    const actions = [];
    const result = await applyGitattributes(tmpDir, { "dry-run": true }, actions);

    assert.equal(result.didWrite, true);
    const exists = await fs
      .access(path.join(tmpDir, ".gitattributes"))
      .then(() => true)
      .catch(() => false);
    assert.equal(exists, false);
    assert.ok(actions.some((a) => a.includes("[dry-run] write .gitattributes")));
  });

  it("[BR-GIT-04] DADO arquivo já sincronizado QUANDO applyGitattributes ENTÃO não re-escreve", async () => {
    const actions1 = [];
    await applyGitattributes(tmpDir, {}, actions1);

    const actions2 = [];
    const result = await applyGitattributes(tmpDir, {}, actions2);

    assert.equal(result.didWrite, false);
    assert.equal(actions2.length, 0);
  });
});
