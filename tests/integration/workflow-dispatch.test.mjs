// [BR-WORKFLOW-DISPATCH] Integration test — dispatcher do entrypoint
// `cli/ai-guidelines-cli.mjs` para o runtime compilado em `dist/cli/workflow.js`.
//
// Exercita o cabling completo:
//   parseArgs (cli/cli/args.mjs)
//     → main (cli/app/engine.mjs)
//     → dispatchWorkflow
//     → import("../../dist/cli/workflow.js")
//     → runContinue (src/cli/workflow.ts compilado)
//
// O bloco principal `cli.integration.test.mjs` cobre init/adopt; este
// cobre o eixo workflow. Setup inline por cenário per
// `feedback-integration-tests-stay-linear`.
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const execFileAsync = promisify(execFile);
// fileURLToPath (não `.pathname`) para path de filesystem robusto cross-OS:
// `.pathname` quebra em Windows (`/C:/...`) e com caracteres escapados (`%20`).
const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const CLI_BIN = path.join(REPO_ROOT, "cli", "ai-guidelines-cli.mjs");

/**
 * Executa a CLI real em subprocess, capturando stdout/stderr/exitCode.
 * `cwd` controla o repoRoot percebido pelo runtime.
 */
async function runCli(argv, cwd) {
  try {
    const result = await execFileAsync("node", [CLI_BIN, ...argv], {
      cwd,
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    });
    return { stdout: result.stdout, stderr: result.stderr, code: 0 };
  } catch (err) {
    return {
      stdout: err.stdout ?? "",
      stderr: err.stderr ?? "",
      code: typeof err.code === "number" ? err.code : 1,
    };
  }
}

describe("CLI dispatch — workflow continue [BR-WORKFLOW-DISPATCH]", () => {
  it("DADO spec ativa com tasks.md e gate fechado QUANDO continue ENTÃO exit 0 e briefing emitido", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ws-dispatch-ok-"));
    try {
      const { execSync } = await import("node:child_process");
      const execOpts = {
        cwd: tempDir,
        stdio: "ignore",
        env: { ...process.env, GIT_INDEX_FILE: undefined },
      };
      execSync("git init -b feat/spec-0099-dispatch", execOpts);
      execSync("git config user.email test@example.com", execOpts);
      execSync("git config user.name Test", execOpts);
      execSync('git commit --allow-empty -m "initial"', execOpts);

      const specDir = path.join(tempDir, ".governance", "specs", "0099-dispatch");
      await fs.mkdir(specDir, { recursive: true });
      await fs.writeFile(
        path.join(specDir, "spec.md"),
        "# Spec 0099 — Dispatch Test\n\n> Status: Draft\n"
      );
      await fs.writeFile(
        path.join(specDir, "state.yml"),
        `stage: implementation
gate:
  status: closed
focus:
  - dispatch
next:
  - rodar test
`
      );
      await fs.writeFile(path.join(specDir, "tasks.md"), "# Tasks\n- [ ] tarefa 1");

      const indexDir = path.join(tempDir, ".governance", "runtime", "specs");
      await fs.mkdir(indexDir, { recursive: true });
      await fs.writeFile(
        path.join(indexDir, "active.yml"),
        `version: 1
active_specs:
  - id: "0099"
    slug: "dispatch"
    branch: "feat/spec-0099-dispatch"
    stage: "implementation"
    status: "active"
    spec_path: ".governance/specs/0099-dispatch"
    updated_at: "2026-05-22T10:00:00Z"
`
      );

      const result = await runCli(["continue", "0099"], tempDir);

      assert.equal(result.code, 0, `expected exit 0, got ${result.code}. stderr: ${result.stderr}`);
      assert.match(result.stdout, /Spec: 0099-dispatch/);
      assert.match(result.stdout, /Stage: implementation/);
      assert.match(result.stdout, /Gate: closed/);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("DADO spec ativa SEM tasks.md QUANDO continue ENTÃO exit 1 e mensagem narrativa de bloqueio L2", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ws-dispatch-locked-"));
    try {
      const { execSync } = await import("node:child_process");
      const execOpts = {
        cwd: tempDir,
        stdio: "ignore",
        env: { ...process.env, GIT_INDEX_FILE: undefined },
      };
      execSync("git init -b feat/spec-0099-locked", execOpts);
      execSync("git config user.email test@example.com", execOpts);
      execSync("git config user.name Test", execOpts);
      execSync('git commit --allow-empty -m "initial"', execOpts);

      const specDir = path.join(tempDir, ".governance", "specs", "0099-locked");
      await fs.mkdir(specDir, { recursive: true });
      await fs.writeFile(
        path.join(specDir, "state.yml"),
        `stage: planning
gate:
  status: open
focus: []
next: []
`
      );

      const indexDir = path.join(tempDir, ".governance", "runtime", "specs");
      await fs.mkdir(indexDir, { recursive: true });
      await fs.writeFile(
        path.join(indexDir, "active.yml"),
        `version: 1
active_specs:
  - id: "0099"
    slug: "locked"
    branch: "feat/spec-0099-locked"
    stage: "planning"
    status: "active"
    spec_path: ".governance/specs/0099-locked"
    updated_at: "2026-05-22T10:00:00Z"
`
      );

      const result = await runCli(["continue", "0099"], tempDir);

      assert.equal(result.code, 1, `expected exit 1 (locked), got ${result.code}`);
      const out = result.stdout + result.stderr;
      assert.match(out, /Execution locked/);
      assert.match(out, /Missing:/);
      assert.match(out, /tasks\.md/);
      assert.match(out, /planning gate\.status == closed/);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
