import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { applyPointers } from "../features/core/pointers.mjs";
import { normalizePackageManager } from "../formatters/package-context.mjs";

/**
 * [BR-CLI] Suite de Validação de Regras de Negócio (BDD)
 * Foco: Garantir que as decisões de governança da Spec 0005 estão refletidas no motor.
 */
describe("CLI Governance Business Rules [BR-CLI]", () => {
  let targetDir;

  before(async () => {
    targetDir = await fs.mkdtemp(path.join(os.tmpdir(), "ai-bdd-test-"));
  });

  after(async () => {
    await fs.rm(targetDir, { recursive: true, force: true });
  });

  // [BR-CLI-01]: Arquitetura de Ponteiros
  describe("Ponteiros de Governança [BR-CLI-01]", () => {
    it("DADO um AGENTS.md existente QUANDO applyPointers ENTÃO deve injetar o ponteiro e criar o core baseline separado", async () => {
      const agentsPath = path.join(targetDir, "AGENTS.md");
      const corePath = path.join(targetDir, ".ai-guidelines", "AGENTS.md");
      const originalContent = "# My Rules\nLocal rule 1";

      await fs.writeFile(agentsPath, originalContent);

      const actions = [];
      await applyPointers(targetDir, { "dry-run": false }, actions);

      const rootContent = await fs.readFile(agentsPath, "utf8");
      const coreContent = await fs.readFile(corePath, "utf8");

      assert.ok(
        rootContent.includes("<!-- BEGIN:ai-guidelines-core -->"),
        "Deve conter o bloco de ponteiro na raiz"
      );
      assert.ok(
        rootContent.includes(".ai-guidelines/AGENTS.md"),
        "Deve apontar para o arquivo core"
      );
      assert.ok(
        rootContent.includes("Local rule 1"),
        "Deve preservar as regras originais do usuário"
      );

      assert.ok(
        coreContent.includes("### PHASE 0: The Prime Directive"),
        "O core deve conter o baseline real, não o ponteiro"
      );
      assert.ok(
        !coreContent.includes("👉 **[.ai-guidelines/AGENTS.md]"),
        "O core NÃO deve conter o link para si mesmo (sem recursividade)"
      );
    });
  });

  // [BR-CLI-02]: Detecção de Ambiente
  describe("Detecção de Ambiente [BR-CLI-02]", () => {
    it("DADO a entrada 'yarn@4.1.1' QUANDO normalizePackageManager ENTÃO deve identificar como yarn-berry com runner específico", () => {
      const pm = normalizePackageManager("yarn@4.1.1");
      assert.strictEqual(pm.id, "yarn-berry");
      assert.ok(pm.runner.includes(".cjs"), "Deve usar o runner do wrapper cjs para Yarn Berry");
    });

    it("DADO a entrada 'yarn@1.22.22' QUANDO normalizePackageManager ENTÃO deve identificar como yarn-classic", () => {
      const pm = normalizePackageManager("yarn@1.22.22");
      assert.strictEqual(pm.id, "yarn-classic");
      assert.strictEqual(pm.runner, "yarn");
    });
  });

  // [BR-CLI-04]: Permissões POSIX (Mapeado via Git Chmod)
  // Nota: Testar o chmod real exige um repo git real, aqui validamos a intenção no log de ações
  // se implementado no nível de feature.
});
