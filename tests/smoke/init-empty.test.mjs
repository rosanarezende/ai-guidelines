import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import {
  exists,
  installInTempDir,
  packLocal,
  runInstalledCli,
  SMOKE_TIMEOUT_MS,
} from "./helpers/tarball.mjs";

function buildHeadlessInitArgs(targetDir, projectName) {
  return [
    "init",
    "--target",
    targetDir,
    "--name",
    projectName,
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

describe("Smoke: tarball init em diretório vazio", () => {
  let packedTarball;

  before(async () => {
    packedTarball = await packLocal();
  });

  after(async () => {
    await packedTarball?.cleanup?.();
  });

  it(
    "DADO pacote empacotado QUANDO npx ai-guidelines init roda em diretório vazio ENTÃO baseline distribuído é criado",
    { timeout: SMOKE_TIMEOUT_MS },
    async () => {
      const installation = await installInTempDir(packedTarball.tarballPath);

      try {
        await runInstalledCli(
          installation.packageDir,
          buildHeadlessInitArgs(installation.targetDir, "smoke-empty")
        );

        const agentsPath = path.join(installation.targetDir, "AGENTS.md");
        const configPath = path.join(installation.targetDir, ".ai-guidelines", "config.json");
        const templatePath = path.join(
          installation.targetDir,
          ".ai-guidelines",
          "templates",
          "spec-boilerplate.md"
        );
        const claudePath = path.join(installation.targetDir, "CLAUDE.md");

        assert.equal(await exists(agentsPath), true);
        assert.equal(await exists(configPath), true);
        assert.equal(await exists(templatePath), true);
        assert.equal(await exists(claudePath), true);

        const agentsContent = await fs.readFile(agentsPath, "utf8");
        const config = JSON.parse(await fs.readFile(configPath, "utf8"));
        const claudeContent = await fs.readFile(claudePath, "utf8");

        assert.match(agentsContent, /<AI_GUIDELINES>/);
        assert.match(agentsContent, /Top Zone: Primary Directives/);
        assert.deepEqual(config.providers, ["claude"]);
        assert.deepEqual(config.features, []);
        assert.equal(config.lang, "pt");
        assert.match(claudeContent, /ai-guidelines:managed-start v=1/);
        assert.match(claudeContent, /SYSTEM DIRECTIVE: HARD REDIRECT/);
      } finally {
        await installation.cleanup();
      }
    }
  );
});
