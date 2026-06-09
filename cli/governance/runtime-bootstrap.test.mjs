import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  buildRuntimeBootstrapContent,
  checkRuntimeBootstrap,
  syncRuntimeBootstrap,
} from "./runtime-bootstrap.mjs";

describe("runtime-bootstrap", () => {
  it("DADO conteúdo local QUANDO buildRuntimeBootstrapContent ENTÃO substitui só AI_GUIDELINES por stub", () => {
    const existing = "# Projeto\n\nRegra local.\n\n<AI_GUIDELINES>\nlegado\n</AI_GUIDELINES>\n";
    const next = buildRuntimeBootstrapContent(existing);

    assert.match(next, /Regra local/);
    assert.match(next, /## Runtime Bootstrap/);
    assert.doesNotMatch(next, /legado/);
  });

  it("DADO AGENTS divergente QUANDO sync ENTÃO grava o stub e check passa", () => {
    const dir = mkdtempSync(join(tmpdir(), "runtime-bootstrap-"));
    const agentsPath = join(dir, "AGENTS.md");
    try {
      writeFileSync(agentsPath, "# AGENTS.md\n\n<AI_GUIDELINES>\nvelho\n</AI_GUIDELINES>\n");

      assert.equal(checkRuntimeBootstrap({ agentsPath }).ok, false);
      const synced = syncRuntimeBootstrap({ agentsPath });

      assert.equal(synced.changed, true);
      assert.equal(checkRuntimeBootstrap({ agentsPath }).ok, true);
      assert.match(readFileSync(agentsPath, "utf-8"), /yarn guidelines handoff \[spec\]/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
