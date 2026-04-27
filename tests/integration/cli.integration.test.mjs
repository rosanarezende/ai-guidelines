import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { describe, it } from "node:test";
import * as cliEntrypoint from "../../cli/ai-guidelines-cli.mjs";

describe("entrypoint", () => {
  it("DADO CLI entrypoint module QUANDO imported ENTÃO exposes execute and main", () => {
    assert.equal(typeof cliEntrypoint.execute, "function");
    assert.equal(typeof cliEntrypoint.main, "function");
  });
});

describe("Integration: End-to-End Opt-in Features", () => {
  it("DADO comando adopt sem features opt-in QUANDO executado ENTÃO não deve sincronizar regras editoriais opt-in e DEVE remover se --prune", async () => {
    const targetDir = await fs.mkdtemp(path.join(os.tmpdir(), "ai-e2e-opt-in-"));
    const rulesDir = path.join(targetDir, ".ai-guidelines", "rules");

    // Prepara o ambiente "sujo" (como se as features já tivessem sido ativadas antes)
    await fs.mkdir(rulesDir, { recursive: true });
    await fs.writeFile(path.join(rulesDir, "quality-gates.md"), "lixo antigo");
    await fs.writeFile(path.join(rulesDir, "tdd.md"), "lixo antigo");

    // Roda o motor simulando entrada real (cli) com prune e features vazias
    await cliEntrypoint.execute("adopt", {
      target: targetDir,
      "package-manager": "npm",
      "dry-run": false,
      features: [], // array vazio explícito, pulando opt-ins
      prune: true,
    });

    const checkExists = async (file) =>
      fs
        .access(file)
        .then(() => true)
        .catch(() => false);

    // Regras core devem ter sido criadas (global-rules.md)
    assert.ok(await checkExists(path.join(rulesDir, "global-rules.md")), "Regra core deve existir");

    // Regras opt-in devem ter sido apagadas
    assert.strictEqual(
      await checkExists(path.join(rulesDir, "quality-gates.md")),
      false,
      "Regra quality-gates não deveria existir"
    );
    assert.strictEqual(
      await checkExists(path.join(rulesDir, "tdd.md")),
      false,
      "Regra tdd não deveria existir"
    );

    // Limpeza
    await fs.rm(targetDir, { recursive: true, force: true });
  });
});
