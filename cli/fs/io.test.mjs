import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { collectExistingPaths, ensureTargetDir, readPackageJson } from "./io.mjs";

describe("fs/io", () => {
  it("[BR-CLI-IO-01] DADO target inexistente QUANDO ensureTargetDir ENTÃO cria diretório", async () => {
    const target = path.join(await fs.mkdtemp(path.join(os.tmpdir(), "ai-io-")), "nested");

    await ensureTargetDir(target, false);

    const stat = await fs.stat(target);
    assert.equal(stat.isDirectory(), true);
  });

  it("[BR-CLI-IO-02] DADO package.json inválido QUANDO readPackageJson ENTÃO retorna null e avisa", async () => {
    const target = await fs.mkdtemp(path.join(os.tmpdir(), "ai-io-pkg-"));
    await fs.writeFile(path.join(target, "package.json"), "{bad");
    const warnings = [];

    const result = await readPackageJson(target, (message) => warnings.push(message));

    assert.equal(result.packageJson, null);
    assert.equal(warnings.length, 1);
  });

  it("[BR-CLI-IO-03] DADO paths existentes QUANDO collectExistingPaths ENTÃO lista conflitos", async () => {
    const target = await fs.mkdtemp(path.join(os.tmpdir(), "ai-io-conflicts-"));
    await fs.writeFile(path.join(target, "AGENTS.md"), "x");

    const conflicts = await collectExistingPaths(target, ["AGENTS.md", "missing.md"]);

    assert.deepEqual(conflicts, ["AGENTS.md"]);
  });
});
