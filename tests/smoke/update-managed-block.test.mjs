import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import {
  installInTempDir,
  packLocal,
  runInstalledCli,
  SMOKE_TIMEOUT_MS,
} from "./helpers/tarball.mjs";

function buildHeadlessInitArgs(targetDir) {
  return [
    "init",
    "--target",
    targetDir,
    "--name",
    "update-target",
    "--package-manager",
    "npm",
    "--providers",
    "claude",
    "--skip-prettier",
    "--skip-husky",
    "--skip-ci",
    "--skip-quality-gates",
    "--skip-tdd",
    "--skip-bdd",
  ];
}

describe("Smoke: tarball update no managed-block", () => {
  let packedTarball;

  before(async () => {
    packedTarball = await packLocal();
  });

  after(async () => {
    await packedTarball?.cleanup?.();
  });

  it(
    "DADO consumer inicializado QUANDO update roda após drift manual ENTÃO restaura o bloco gerenciado e preserva conteúdo do consumidor",
    { timeout: SMOKE_TIMEOUT_MS },
    async () => {
      const installation = await installInTempDir(packedTarball.tarballPath);

      try {
        await runInstalledCli(
          installation.packageDir,
          buildHeadlessInitArgs(installation.targetDir)
        );

        const claudePath = path.join(installation.targetDir, "CLAUDE.md");
        const templatePath = path.join(
          installation.targetDir,
          ".ai-guidelines",
          "templates",
          "spec-boilerplate.md"
        );
        const originalTemplate = await fs.readFile(templatePath, "utf8");
        const originalClaude = await fs.readFile(claudePath, "utf8");
        const driftedClaude = originalClaude.replace(
          "SYSTEM DIRECTIVE: HARD REDIRECT",
          "SYSTEM DIRECTIVE: OUTDATED REDIRECT"
        );
        const customSuffix = "\n\n## Notas pessoais\n\nMeu workflow específico.\n";

        await fs.writeFile(claudePath, driftedClaude + customSuffix, "utf8");
        await fs.writeFile(templatePath, "# Template local desatualizado\n", "utf8");

        await runInstalledCli(installation.packageDir, [
          "update",
          "--target",
          installation.targetDir,
        ]);

        const updatedClaude = await fs.readFile(claudePath, "utf8");
        const updatedTemplate = await fs.readFile(templatePath, "utf8");

        assert.match(updatedClaude, /SYSTEM DIRECTIVE: HARD REDIRECT/);
        assert.doesNotMatch(updatedClaude, /SYSTEM DIRECTIVE: OUTDATED REDIRECT/);
        assert.match(updatedClaude, /## Notas pessoais/);
        assert.match(updatedClaude, /Meu workflow específico\./);
        assert.equal(updatedTemplate, originalTemplate);
      } finally {
        await installation.cleanup();
      }
    }
  );
});
