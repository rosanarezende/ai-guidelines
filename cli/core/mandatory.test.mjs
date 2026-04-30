import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import { applyPointers } from "#features/core/pointers";

describe("Mandatory Core Features", () => {
  let targetDir;

  beforeEach(async () => {
    targetDir = await fs.mkdtemp(path.join(os.tmpdir(), "ai-mandatory-test-"));
  });

  afterEach(async () => {
    await fs.rm(targetDir, { recursive: true, force: true });
  });

  it("should NOT skip pointers even if skip-pointers flag is passed", async () => {
    const agentsPath = path.join(targetDir, "AGENTS.md");
    const actions = [];

    // Tentativa de pular (flag que removemos do parsing, mas que a função poderia ainda honrar se não limpa)
    await applyPointers(targetDir, { "dry-run": false, "skip-pointers": true }, actions);

    const exists = await fs
      .access(agentsPath)
      .then(() => true)
      .catch(() => false);
    assert.ok(exists, "AGENTS.md deve ser criado mesmo com flag de skip");
    assert.ok(
      !actions.includes("skip pointers (flag detectada)"),
      "Não deve registrar skip no log"
    );
  });

  it("should NOT create consumer rules directory through pointers", async () => {
    const rulesDir = path.join(targetDir, ".ai-guidelines", "rules");
    const actions = [];

    await applyPointers(targetDir, { "dry-run": false, "skip-rules": true }, actions);

    const exists = await fs
      .access(rulesDir)
      .then(() => true)
      .catch(() => false);
    assert.equal(exists, false, ".ai-guidelines/rules não deve ser criada no consumidor");
    assert.ok(!actions.includes("skip rules (flag detectada)"), "Não deve registrar skip no log");
  });
});
