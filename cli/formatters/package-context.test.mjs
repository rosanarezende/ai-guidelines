import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectFormatterContext,
  detectMonorepoContext,
  detectPackageManager,
  normalizePackageManager,
  resolveLocalInstallCommand,
} from "./package-context.mjs";

async function createTempDir(prefix) {
  return fs.mkdtemp(path.join(os.tmpdir(), `${prefix}-`));
}

describe("package-context", () => {
  it("DADO yarn raw value QUANDO normalizePackageManager ENTÃO resolves yarn berry runner", () => {
    const result = normalizePackageManager("yarn");

    assert.equal(result.id, "yarn-berry");
    assert.equal(result.label, "yarn@4.1.1");
    assert.match(result.runner, /yarn-4\.1\.1\.cjs/);
  });

  it("DADO yarn lock v1 QUANDO detectPackageManager ENTÃO resolves yarn classic", async () => {
    const target = await createTempDir("cli-pm-yarn-classic");
    await fs.writeFile(path.join(target, "yarn.lock"), "# yarn lockfile v1\n");

    const result = await detectPackageManager(target, undefined, null);
    assert.equal(result.id, "yarn-classic");
    assert.equal(result.runner, "yarn");
  });

  it("DADO biome config without prettier QUANDO detectFormatterContext ENTÃO marks skip prettier", async () => {
    const target = await createTempDir("cli-pm-formatter");
    await fs.writeFile(path.join(target, "biome.json"), "{}\n");

    const result = await detectFormatterContext(target, {
      name: "demo",
      private: true,
      scripts: {},
      devDependencies: {},
    });

    assert.equal(result.rival?.id, "biome");
    assert.equal(result.shouldSkipPrettier, true);
  });

  it("DADO yarn berry config QUANDO resolveLocalInstallCommand ENTÃO returns node release invocation", () => {
    const command = resolveLocalInstallCommand(normalizePackageManager("yarn@4.1.1"));

    assert.equal(command.cmd, "node");
    assert.deepEqual(command.args, [".yarn/releases/yarn-4.1.1.cjs", "install"]);
  });

  it("DADO package.json with workspaces array QUANDO detectMonorepoContext ENTÃO marks npm-yarn-bun flavor", async () => {
    const target = await createTempDir("cli-pm-monorepo-npm");
    const result = await detectMonorepoContext(target, {
      name: "demo",
      private: true,
      workspaces: ["packages/*"],
    });

    assert.equal(result.detected, true);
    assert.equal(result.flavor, "npm-yarn-bun");
    assert.equal(result.source, "package.json#workspaces");
  });

  it("DADO pnpm-workspace.yaml QUANDO detectMonorepoContext ENTÃO marks pnpm flavor", async () => {
    const target = await createTempDir("cli-pm-monorepo-pnpm");
    await fs.writeFile(path.join(target, "pnpm-workspace.yaml"), "packages:\n  - 'packages/*'\n");
    const result = await detectMonorepoContext(target, { name: "demo", private: true });

    assert.equal(result.detected, true);
    assert.equal(result.flavor, "pnpm");
    assert.equal(result.source, "pnpm-workspace.yaml");
  });

  it("DADO repo without workspace signals QUANDO detectMonorepoContext ENTÃO returns not detected", async () => {
    const target = await createTempDir("cli-pm-monorepo-none");
    const result = await detectMonorepoContext(target, { name: "demo", private: true });

    assert.equal(result.detected, false);
    assert.equal(result.flavor, null);
  });
});
