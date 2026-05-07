import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { applyPointers } from "./pointers.mjs"; // O código será criado após validação dos testes

async function createTempDir(prefix) {
  return await fs.mkdtemp(path.join(os.tmpdir(), `ai-test-pointers-${prefix}-`));
}

describe("Feature: Pointers (AGENTS.md Runtime Architecture)", () => {
  let targetDir;

  before(async () => {
    targetDir = await createTempDir("main");
  });

  after(async () => {
    await fs.rm(targetDir, { recursive: true, force: true });
  });

  it("[BEHAVIOR] Deve criar AGENTS.md como runtime monolitico governado", async () => {
    const subTarget = path.join(targetDir, "normal-flow");
    await fs.mkdir(subTarget, { recursive: true });

    const actions = [];
    await applyPointers(subTarget, { features: ["pointers"] }, actions);

    const rootContent = await fs.readFile(path.join(subTarget, "AGENTS.md"), "utf8");
    assert.match(rootContent, /<AI_GUIDELINES>/, "Raiz deve conter a tag mãe governada");
    assert.match(rootContent, /Top Zone: Primary Directives/, "Raiz deve conter o monólito");
    assert.equal(
      await fs
        .access(path.join(subTarget, ".ai-guidelines", "config.json"))
        .then(() => true)
        .catch(() => false),
      true,
      "Deve persistir config do consumidor"
    );
    assert.equal(
      await fs
        .access(path.join(subTarget, ".ai-guidelines", "templates", "spec-boilerplate.md"))
        .then(() => true)
        .catch(() => false),
      true,
      "Deve sincronizar boilerplates SDD"
    );

    const rulesDirExists = await fs
      .access(path.join(subTarget, ".ai-guidelines", "rules"))
      .then(() => true)
      .catch(() => false);
    assert.equal(rulesDirExists, false, "Não deve criar .ai-guidelines/rules no consumidor");
  });

  it("[COMPILER] Deve gerar AGENTS raiz monolitico com regras e opt-ins envelopados", async () => {
    const subTarget = path.join(targetDir, "monolithic-core");
    await fs.mkdir(subTarget, { recursive: true });

    await applyPointers(subTarget, { features: ["quality-gates", "tdd"], lang: "pt" }, []);

    const coreContent = await fs.readFile(path.join(subTarget, "AGENTS.md"), "utf8");

    assert.match(coreContent, /<AI_GUIDELINES>/);
    assert.match(coreContent, /Top Zone: Primary Directives/);
    assert.match(coreContent, /Lifecycle & Spec System/);
    assert.match(coreContent, /Git & PR Workflow/);
    assert.match(coreContent, /Engineering Principles/);
    assert.match(coreContent, /<FEATURE_QUALITY_GATES>/);
    assert.match(coreContent, /<FEATURE_TDD>/);
    assert.ok(
      coreContent.indexOf("Top Zone: Primary Directives") <
        coreContent.indexOf("Lifecycle & Spec System")
    );
    assert.ok(
      coreContent.indexOf("Engineering Principles") <
        coreContent.indexOf("Center Zone: Opt-in Methodologies")
    );
    assert.ok(
      coreContent.indexOf("Center Zone: Opt-in Methodologies") <
        coreContent.indexOf("Base Zone: Tactical Context")
    );
  });

  it("[PRESERVATION] Deve manter conteúdo do usuário fora do bloco core", async () => {
    const subTarget = path.join(targetDir, "preserve-user");
    await fs.mkdir(subTarget, { recursive: true });
    const agentsPath = path.join(subTarget, "AGENTS.md");
    await fs.writeFile(agentsPath, "# Projeto XPTO\n\n## Custom\nMinhas regras locais.");

    await applyPointers(subTarget, { features: ["pointers"] }, []);

    const content = await fs.readFile(agentsPath, "utf8");
    assert.match(content, /Minhas regras locais/, "Não deve apagar regras locais do usuário");
    assert.match(content, /<AI_GUIDELINES>/, "Deve injetar o bloco governado");
  });

  it("[BEHAVIOR] Deve injetar ponteiro por padrão no modo adopt", async () => {
    const subTarget = path.join(targetDir, "always-inject");
    await fs.mkdir(subTarget, { recursive: true });

    const actions = [];
    // Não passamos a feature explicitamente, deve ser core
    await applyPointers(subTarget, { features: ["rules"] }, actions);

    const rootContent = await fs.readFile(path.join(subTarget, "AGENTS.md"), "utf8");
    assert.match(
      rootContent,
      /<AI_GUIDELINES>/,
      "Deve injetar mesmo se não estiver na lista de features (comportamento core)"
    );
  });

  it("[MANDATORY] Não deve mais permitir o skip de pointers", async () => {
    const subTarget = path.join(targetDir, "mandatory-test");
    await fs.mkdir(subTarget, { recursive: true });

    const actions = [];
    await applyPointers(subTarget, { "skip-pointers": true }, actions);

    const exists = await fs
      .access(path.join(subTarget, "AGENTS.md"))
      .then(() => true)
      .catch(() => false);
    assert.strictEqual(exists, true, "AGENTS.md deve ser criado mesmo com flag de skip");
  });

  it("[BREAK] Deve falhar graciosamente se não tiver permissão de escrita", async () => {
    // Este teste simula uma falha de FS
    const subTarget = path.join(targetDir, "no-permission");
    await fs.mkdir(subTarget, { recursive: true });
    // No Windows é difícil simular permissão sem sudo, mas podemos testar se o motor propaga o erro
  });

  it("[DRY-RUN] Não deve persistir AGENTS.md em modo dry-run", async () => {
    const subTarget = path.join(targetDir, "dry-run");
    await fs.mkdir(subTarget, { recursive: true });

    const actions = [];
    await applyPointers(subTarget, { "dry-run": true }, actions);

    const rootExists = await fs
      .access(path.join(subTarget, "AGENTS.md"))
      .then(() => true)
      .catch(() => false);
    const rulesDirExists = await fs
      .access(path.join(subTarget, ".ai-guidelines", "rules"))
      .then(() => true)
      .catch(() => false);

    assert.equal(rootExists, false);
    assert.equal(rulesDirExists, false);
    assert.equal(
      await fs
        .access(path.join(subTarget, ".ai-guidelines", "config.json"))
        .then(() => true)
        .catch(() => false),
      false
    );
    assert.ok(actions.some((a) => a.includes("[dry-run] write AGENTS.md")));
  });

  it("[MIGRATION] Deve migrar ponteiro legado para AI_GUIDELINES na raiz", async () => {
    const subTarget = path.join(targetDir, "legacy-pointer");
    await fs.mkdir(subTarget, { recursive: true });
    const agentsPath = path.join(subTarget, "AGENTS.md");
    await fs.writeFile(
      agentsPath,
      [
        "# Projeto",
        "",
        "<!-- BEGIN:ai-guidelines-core -->",
        "ponteiro antigo",
        "<!-- END:ai-guidelines-core -->",
        "",
        "Regra local.",
      ].join("\n")
    );

    await applyPointers(subTarget, { features: ["tdd"], lang: "pt" }, []);

    const content = await fs.readFile(agentsPath, "utf8");
    assert.match(content, /# Projeto/);
    assert.match(content, /Regra local/);
    assert.match(content, /<AI_GUIDELINES>/);
    assert.match(content, /<FEATURE_TDD>/);
    assert.doesNotMatch(content, /ponteiro antigo/);
  });

  it("[PROTECTION] Deve abortar quando AI_GUIDELINES estiver malformado", async () => {
    const subTarget = path.join(targetDir, "malformed");
    await fs.mkdir(subTarget, { recursive: true });
    await fs.writeFile(path.join(subTarget, "AGENTS.md"), "# Projeto\n\n<AI_GUIDELINES>\n");

    await assert.rejects(
      () => applyPointers(subTarget, { features: ["tdd"], lang: "pt" }, []),
      /AI_GUIDELINES/
    );
  });

  it("[PROVIDERS] Deve gerar apenas trampolins dos providers selecionados", async () => {
    const subTarget = path.join(targetDir, "providers");
    await fs.mkdir(subTarget, { recursive: true });

    await applyPointers(
      subTarget,
      { providers: ["claude", "openai"], features: ["quality-gates"] },
      []
    );

    assert.equal(
      await fs
        .access(path.join(subTarget, "CLAUDE.md"))
        .then(() => true)
        .catch(() => false),
      true
    );
    assert.equal(
      await fs
        .access(path.join(subTarget, ".openai", "instructions.md"))
        .then(() => true)
        .catch(() => false),
      true
    );
    assert.equal(
      await fs
        .access(path.join(subTarget, "GEMINI.md"))
        .then(() => true)
        .catch(() => false),
      false
    );
  });
});
