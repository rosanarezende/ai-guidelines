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

function buildAdoptArgs(targetDir) {
  return [
    "adopt",
    "--target",
    targetDir,
    "--name",
    "existing-project",
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

describe("Smoke: tarball adopt em projeto existente", () => {
  let packedTarball;

  before(async () => {
    packedTarball = await packLocal();
  });

  after(async () => {
    await packedTarball?.cleanup?.();
  });

  it(
    "DADO projeto com package.json e arquivos legados QUANDO adopt roda ENTÃO managed-block é injetado e conteúdo legado preservado",
    { timeout: SMOKE_TIMEOUT_MS },
    async () => {
      const installation = await installInTempDir(packedTarball.tarballPath);

      try {
        const packageJsonPath = path.join(installation.targetDir, "package.json");
        const sentinelPath = path.join(installation.targetDir, "notes.txt");
        const claudePath = path.join(installation.targetDir, "CLAUDE.md");
        const originalPackageJson = `${JSON.stringify(
          {
            name: "existing-project",
            version: "0.0.1",
            private: true,
          },
          null,
          2
        )}\n`;
        const originalSentinel = "preservar sem alterações\n";
        const legacyClaude = "# Regras locais\n\nMeu workflow anterior.\n";

        await fs.writeFile(packageJsonPath, originalPackageJson, "utf8");
        await fs.writeFile(sentinelPath, originalSentinel, "utf8");
        await fs.writeFile(claudePath, legacyClaude, "utf8");

        await runInstalledCli(installation.packageDir, buildAdoptArgs(installation.targetDir));

        const packageJsonAfter = await fs.readFile(packageJsonPath, "utf8");
        const sentinelAfter = await fs.readFile(sentinelPath, "utf8");
        const claudeAfter = await fs.readFile(claudePath, "utf8");

        assert.equal(packageJsonAfter, originalPackageJson);
        assert.equal(sentinelAfter, originalSentinel);
        assert.match(claudeAfter, /ai-guidelines:managed-start v=1/);
        assert.match(claudeAfter, /SYSTEM DIRECTIVE: HARD REDIRECT/);
        assert.match(claudeAfter, /Meu workflow anterior\./);

        const managedIndex = claudeAfter.indexOf("SYSTEM DIRECTIVE: HARD REDIRECT");
        const legacyIndex = claudeAfter.indexOf("Meu workflow anterior.");
        assert.ok(managedIndex > -1 && legacyIndex > managedIndex);
      } finally {
        await installation.cleanup();
      }
    }
  );
});
