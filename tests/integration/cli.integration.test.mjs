import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { describe, it } from "node:test";
import * as cliEntrypoint from "../../cli/ai-guidelines-cli.mjs";

async function exists(filePath) {
  return fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
}

async function withTempTarget(prefix, callback) {
  const targetDir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));

  try {
    await callback(targetDir);
  } finally {
    await fs.rm(targetDir, { recursive: true, force: true });
  }
}

describe("entrypoint", () => {
  it("DADO CLI entrypoint module QUANDO imported ENTÃO exposes execute and main", () => {
    assert.equal(typeof cliEntrypoint.execute, "function");
    assert.equal(typeof cliEntrypoint.main, "function");
  });
});

describe("Integration: Runtime Monolítico no AGENTS.md", () => {
  it("DADO projeto vazio QUANDO adopt com opt-ins ENTÃO cria AGENTS runtime com AI_GUIDELINES e sem .ai-guidelines/rules", async () => {
    await withTempTarget("ai-e2e-empty-", async (targetDir) => {
      await cliEntrypoint.execute("adopt", {
        target: targetDir,
        "package-manager": "npm",
        "dry-run": false,
        features: ["quality-gates", "tdd", "bdd"],
        lang: "pt",
      });

      const agentsContent = await fs.readFile(path.join(targetDir, "AGENTS.md"), "utf8");

      assert.match(agentsContent, /<AI_GUIDELINES>/);
      assert.match(agentsContent, /Top Zone: Primary Directives/);
      assert.match(agentsContent, /Lifecycle & Spec System/);
      assert.match(agentsContent, /Git & PR Workflow/);
      assert.match(agentsContent, /Engineering Principles/);
      assert.match(agentsContent, /Center Zone: Opt-in Methodologies/);
      assert.match(agentsContent, /Base Zone: Tactical Context/);
      assert.match(agentsContent, /<FEATURE_QUALITY_GATES>/);
      assert.match(agentsContent, /<FEATURE_TDD>/);
      assert.match(agentsContent, /<FEATURE_BDD>/);
      assert.equal(await exists(path.join(targetDir, ".ai-guidelines", "rules")), false);
      assert.equal(await exists(path.join(targetDir, ".ai-guidelines", "config.json")), true);
      assert.equal(
        await exists(path.join(targetDir, ".ai-guidelines", "templates", "spec-boilerplate.md")),
        true
      );
    });
  });

  it("DADO AGENTS com regras próprias QUANDO adopt ENTÃO preserva conteúdo fora de AI_GUIDELINES", async () => {
    await withTempTarget("ai-e2e-preserve-", async (targetDir) => {
      const agentsPath = path.join(targetDir, "AGENTS.md");
      await fs.writeFile(
        agentsPath,
        ["# Projeto consumidor", "", "Regra local antes.", "", "Regra local depois."].join("\n")
      );

      await cliEntrypoint.execute("adopt", {
        target: targetDir,
        "package-manager": "npm",
        "dry-run": false,
        features: ["tdd"],
        lang: "pt",
      });

      const agentsContent = await fs.readFile(agentsPath, "utf8");

      assert.match(agentsContent, /# Projeto consumidor/);
      assert.match(agentsContent, /Regra local antes/);
      assert.match(agentsContent, /Regra local depois/);
      assert.match(agentsContent, /<AI_GUIDELINES>/);
      assert.match(agentsContent, /<FEATURE_TDD>/);
    });
  });

  it("DADO AGENTS com opt-ins antigos QUANDO adopt sem opt-ins e prune ENTÃO remove features do bloco XML", async () => {
    await withTempTarget("ai-e2e-prune-", async (targetDir) => {
      const options = {
        target: targetDir,
        "package-manager": "npm",
        "dry-run": false,
        features: ["quality-gates", "tdd"],
        lang: "pt",
      };

      await cliEntrypoint.execute("adopt", options);
      await cliEntrypoint.execute("adopt", {
        ...options,
        features: [],
        prune: true,
      });

      const agentsContent = await fs.readFile(path.join(targetDir, "AGENTS.md"), "utf8");

      assert.match(agentsContent, /<AI_GUIDELINES>/);
      assert.doesNotMatch(agentsContent, /<FEATURE_QUALITY_GATES>/);
      assert.doesNotMatch(agentsContent, /<FEATURE_TDD>/);
      assert.equal(await exists(path.join(targetDir, ".ai-guidelines", "rules")), false);
    });
  });

  it("DADO adopt executado duas vezes QUANDO mesmas opções ENTÃO AGENTS permanece idempotente", async () => {
    await withTempTarget("ai-e2e-idempotent-", async (targetDir) => {
      const options = {
        target: targetDir,
        "package-manager": "npm",
        "dry-run": false,
        features: ["bdd"],
        lang: "en",
      };

      await cliEntrypoint.execute("adopt", options);
      const firstContent = await fs.readFile(path.join(targetDir, "AGENTS.md"), "utf8");

      await cliEntrypoint.execute("adopt", options);
      const secondContent = await fs.readFile(path.join(targetDir, "AGENTS.md"), "utf8");

      assert.equal(secondContent, firstContent);
      assert.match(secondContent, /<FEATURE_BDD>/);
    });
  });

  it("DADO AGENTS com ponteiro legado QUANDO adopt ENTÃO migra para runtime monolítico na raiz", async () => {
    await withTempTarget("ai-e2e-legacy-", async (targetDir) => {
      const agentsPath = path.join(targetDir, "AGENTS.md");
      await fs.writeFile(
        agentsPath,
        [
          "# Projeto legado",
          "",
          "<!-- BEGIN:ai-guidelines-core -->",
          "ponteiro antigo",
          "<!-- END:ai-guidelines-core -->",
          "",
          "Regra local preservada.",
        ].join("\n")
      );

      await cliEntrypoint.execute("adopt", {
        target: targetDir,
        "package-manager": "npm",
        "dry-run": false,
        features: ["quality-gates"],
      });

      const agentsContent = await fs.readFile(agentsPath, "utf8");

      assert.match(agentsContent, /# Projeto legado/);
      assert.match(agentsContent, /Regra local preservada/);
      assert.match(agentsContent, /<AI_GUIDELINES>/);
      assert.match(agentsContent, /<FEATURE_QUALITY_GATES>/);
      assert.doesNotMatch(agentsContent, /ponteiro antigo/);
    });
  });

  it("DADO comando providers QUANDO selecionar subset ENTÃO atualiza apenas trampolins correspondentes", async () => {
    await withTempTarget("ai-e2e-providers-", async (targetDir) => {
      await cliEntrypoint.execute("providers", {
        target: targetDir,
        "dry-run": false,
        providers: ["claude", "cursor"],
      });

      assert.equal(await exists(path.join(targetDir, "CLAUDE.md")), true);
      assert.equal(
        await exists(path.join(targetDir, ".cursor", "rules", "ai-guidelines.mdc")),
        true
      );
      assert.equal(await exists(path.join(targetDir, "GEMINI.md")), false);
      assert.equal(await exists(path.join(targetDir, ".openai", "instructions.md")), false);
    });
  });

  it("DADO adopt com opt-ins e providers prévios QUANDO providers adicionar um novo provider ENTÃO preserva opt-ins e providers existentes", async () => {
    await withTempTarget("ai-e2e-providers-merge-", async (targetDir) => {
      await cliEntrypoint.execute("adopt", {
        target: targetDir,
        "package-manager": "npm",
        "dry-run": false,
        providers: ["claude", "openai"],
        features: ["quality-gates", "tdd"],
        lang: "pt",
      });

      await cliEntrypoint.execute("providers", {
        target: targetDir,
        "dry-run": false,
        providers: ["gemini"],
      });

      const agentsContent = await fs.readFile(path.join(targetDir, "AGENTS.md"), "utf8");
      const config = JSON.parse(
        await fs.readFile(path.join(targetDir, ".ai-guidelines", "config.json"), "utf8")
      );

      assert.match(agentsContent, /<FEATURE_QUALITY_GATES>/);
      assert.match(agentsContent, /<FEATURE_TDD>/);
      assert.equal(await exists(path.join(targetDir, "CLAUDE.md")), true);
      assert.equal(await exists(path.join(targetDir, ".openai", "instructions.md")), true);
      assert.equal(await exists(path.join(targetDir, "GEMINI.md")), true);
      assert.deepEqual(config.providers, ["claude", "openai", "gemini"]);
      assert.deepEqual(config.features, ["quality-gates", "tdd"]);
      assert.equal(config.lang, "pt");
    });
  });

  it("DADO providers com prune QUANDO selecionar novo subset ENTÃO remove providers não selecionados mas preserva opt-ins", async () => {
    await withTempTarget("ai-e2e-providers-prune-", async (targetDir) => {
      await cliEntrypoint.execute("adopt", {
        target: targetDir,
        "package-manager": "npm",
        "dry-run": false,
        providers: ["claude", "openai"],
        features: ["bdd"],
        lang: "en",
      });

      await cliEntrypoint.execute("providers", {
        target: targetDir,
        "dry-run": false,
        providers: ["claude"],
        prune: true,
      });

      const agentsContent = await fs.readFile(path.join(targetDir, "AGENTS.md"), "utf8");
      const config = JSON.parse(
        await fs.readFile(path.join(targetDir, ".ai-guidelines", "config.json"), "utf8")
      );

      assert.match(agentsContent, /<FEATURE_BDD>/);
      assert.equal(await exists(path.join(targetDir, "CLAUDE.md")), true);
      assert.equal(await exists(path.join(targetDir, ".openai", "instructions.md")), false);
      assert.deepEqual(config.providers, ["claude"]);
      assert.deepEqual(config.features, ["bdd"]);
      assert.equal(config.lang, "en");
    });
  });
});
