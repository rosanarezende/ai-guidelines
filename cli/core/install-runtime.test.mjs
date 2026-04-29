import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { describe, it } from "node:test";
import { getInstallHint, runInstall } from "./install-runtime.mjs";
import { normalizePackageManager } from "#formatters/package-context";

async function createTempDir(prefix) {
  return fs.mkdtemp(path.join(os.tmpdir(), `${prefix}-`));
}

function createFakeSpawn(exitCode, { autoClose = true } = {}) {
  let observedCall = null;
  const spawnFn = (cmd, args, options) => {
    observedCall = { cmd, args, options };
    const child = new EventEmitter();
    if (autoClose) {
      queueMicrotask(() => child.emit("close", exitCode));
    }
    return child;
  };

  return {
    spawnFn,
    getObservedCall: () => observedCall,
  };
}

describe("install-runtime", () => {
  it("DADO npm package manager QUANDO getInstallHint ENTÃO returns npm install", async () => {
    const target = await createTempDir("cli-install-npm");
    const hint = await getInstallHint(target, normalizePackageManager("npm"));

    assert.equal(hint, "npm install");
  });

  it("DADO yarn berry without release file QUANDO getInstallHint ENTÃO deixa sugestão corepack", async () => {
    const target = await createTempDir("cli-install-yarn");
    const hint = await getInstallHint(target, normalizePackageManager("yarn@4.1.1"));

    assert.equal(hint, "corepack enable && yarn install");
  });

  it("DADO spawn exits with zero QUANDO runInstall ENTÃO resolves and passes target cwd", async () => {
    const target = await createTempDir("cli-install-resolve");
    const { spawnFn, getObservedCall } = createFakeSpawn(0);

    await runInstall(target, normalizePackageManager("npm"), { spawnFn });

    const call = getObservedCall();
    assert.equal(call.cmd, "npm");
    assert.deepEqual(call.args, ["install"]);
    assert.equal(call.options.cwd, target);
  });

  it("DADO spawn exits with non-zero QUANDO runInstall ENTÃO rejeita com erro de código", async () => {
    const target = await createTempDir("cli-install-reject");
    const { spawnFn } = createFakeSpawn(42);

    await assert.rejects(
      runInstall(target, normalizePackageManager("npm"), { spawnFn }),
      /Install falhou com código 42/
    );
  });

  it("DADO yarn berry without release file QUANDO runInstall ENTÃO rejects before spawning", async () => {
    const target = await createTempDir("cli-install-yarn-missing");
    const { spawnFn, getObservedCall } = createFakeSpawn(0);

    await assert.rejects(
      runInstall(target, normalizePackageManager("yarn@4.1.1"), { spawnFn }),
      /Arquivo de release do yarn não encontrado/
    );
    assert.equal(getObservedCall(), null);
  });

  it("DADO erro no spawn QUANDO runInstall ENTÃO rejeita com erro de sistema", async () => {
    const target = await createTempDir("cli-install-error");
    const { spawnFn } = createFakeSpawn(0, { autoClose: false });
    const spawnWithError = (cmd, args, options) => {
      const child = spawnFn(cmd, args, options);
      queueMicrotask(() => child.emit("error", new Error("spawn ENOENT")));
      return child;
    };

    await assert.rejects(
      runInstall(target, normalizePackageManager("npm"), { spawnFn: spawnWithError }),
      /spawn ENOENT/
    );
  });
});
