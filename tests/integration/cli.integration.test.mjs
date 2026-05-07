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

  it("DADO comando providers QUANDO selecionar subset ENTÃO atualiza apenas provider entrypoints correspondentes", async () => {
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

  it("DADO provider entrypoint preexistente sem marcadores QUANDO adopt ENTÃO bloco gerenciado prepended e conteúdo legado preservado abaixo", async () => {
    await withTempTarget("ai-e2e-legacy-provider-entrypoint-", async (targetDir) => {
      const claudePath = path.join(targetDir, "CLAUDE.md");
      const legacyContent = "# Custom Claude rules\n\nNotes from before ai-guidelines.\n";
      await fs.writeFile(claudePath, legacyContent, "utf8");

      await cliEntrypoint.execute("adopt", {
        target: targetDir,
        "package-manager": "npm",
        "dry-run": false,
        providers: ["claude"],
        features: [],
      });

      const updated = await fs.readFile(claudePath, "utf8");
      assert.match(updated, /<!-- ai-guidelines:managed-start v=1 -->/);
      assert.match(updated, /<!-- ai-guidelines:managed-end -->/);
      assert.match(updated, /SYSTEM DIRECTIVE: HARD REDIRECT/);
      assert.match(updated, /👤 Atenção, mantenedor humano/);
      assert.match(updated, /Notes from before ai-guidelines/);

      const managedIdx = updated.indexOf("HARD REDIRECT");
      const legacyIdx = updated.indexOf("Notes from before ai-guidelines");
      assert.ok(managedIdx < legacyIdx, "managed block deve vir antes do conteúdo legado");
    });
  });

  it("DADO provider entrypoint com marcadores QUANDO update ENTÃO atualiza apenas o bloco interno e preserva sufixo do consumidor", async () => {
    await withTempTarget("ai-e2e-managed-update-", async (targetDir) => {
      await cliEntrypoint.execute("adopt", {
        target: targetDir,
        "package-manager": "npm",
        "dry-run": false,
        providers: ["claude"],
        features: [],
      });

      const claudePath = path.join(targetDir, "CLAUDE.md");
      const afterAdopt = await fs.readFile(claudePath, "utf8");
      const customSuffix = "\n\n## Notas pessoais\n\nMeu workflow específico.\n";
      await fs.writeFile(claudePath, afterAdopt + customSuffix, "utf8");

      await cliEntrypoint.execute("update", {
        target: targetDir,
        "dry-run": false,
      });

      const updated = await fs.readFile(claudePath, "utf8");
      assert.match(updated, /<!-- ai-guidelines:managed-start v=1 -->/);
      assert.match(updated, /## Notas pessoais/);
      assert.match(updated, /Meu workflow específico/);
    });
  });

  it("DADO update executado duas vezes QUANDO config inalterado ENTÃO operação é idempotente", async () => {
    await withTempTarget("ai-e2e-update-idempotent-", async (targetDir) => {
      await cliEntrypoint.execute("adopt", {
        target: targetDir,
        "package-manager": "npm",
        "dry-run": false,
        providers: ["claude", "gemini"],
        features: ["tdd"],
        lang: "pt",
      });

      await cliEntrypoint.execute("update", { target: targetDir, "dry-run": false });
      const firstClaude = await fs.readFile(path.join(targetDir, "CLAUDE.md"), "utf8");
      const firstAgents = await fs.readFile(path.join(targetDir, "AGENTS.md"), "utf8");

      await cliEntrypoint.execute("update", { target: targetDir, "dry-run": false });
      const secondClaude = await fs.readFile(path.join(targetDir, "CLAUDE.md"), "utf8");
      const secondAgents = await fs.readFile(path.join(targetDir, "AGENTS.md"), "utf8");

      assert.equal(secondClaude, firstClaude);
      assert.equal(secondAgents, firstAgents);
    });
  });

  it("DADO providers --prune QUANDO consumidor tem template SDD customizado ENTÃO templates não são apagados", async () => {
    await withTempTarget("ai-e2e-providers-templates-safe-", async (targetDir) => {
      await cliEntrypoint.execute("adopt", {
        target: targetDir,
        "package-manager": "npm",
        "dry-run": false,
        providers: ["claude", "openai"],
        features: [],
      });

      // Consumidor adiciona template customizado dentro de .ai-guidelines/templates
      const customTemplatePath = path.join(
        targetDir,
        ".ai-guidelines",
        "templates",
        "my-custom-template.md"
      );
      await fs.writeFile(customTemplatePath, "# Custom team template\n", "utf8");

      await cliEntrypoint.execute("providers", {
        target: targetDir,
        "dry-run": false,
        providers: ["claude"],
        prune: true,
      });

      // .openai removido (prune autoritativo de providers), MAS templates customizados preservados
      assert.equal(await exists(path.join(targetDir, ".openai", "instructions.md")), false);
      assert.equal(
        await exists(customTemplatePath),
        true,
        "providers --prune não pode apagar templates customizados do consumidor"
      );
    });
  });

  it("DADO sdd_dir malicioso QUANDO resolve config ENTÃO rejeita com erro descritivo", async () => {
    await withTempTarget("ai-e2e-sddir-traversal-", async (targetDir) => {
      // Pré-popula um config malicioso
      const sddPath = path.join(targetDir, ".ai-guidelines");
      await fs.mkdir(sddPath, { recursive: true });
      await fs.writeFile(
        path.join(sddPath, "config.json"),
        JSON.stringify({
          sdd_dir: "../../etc",
          providers: ["claude"],
          features: [],
          lang: "pt",
        }),
        "utf8"
      );

      await assert.rejects(
        () =>
          cliEntrypoint.execute("update", {
            target: targetDir,
            "dry-run": true,
          }),
        /sdd_dir inválido/
      );
    });
  });
});
