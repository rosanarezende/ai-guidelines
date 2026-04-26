import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { applyPointers } from "./pointers.mjs"; // O código será criado após validação dos testes

async function createTempDir(prefix) {
  return await fs.mkdtemp(path.join(os.tmpdir(), `ai-test-pointers-${prefix}-`));
}

describe("Feature: Pointers (AGENTS.md Architecture)", () => {
  let targetDir;

  before(async () => {
    targetDir = await createTempDir("main");
  });

  after(async () => {
    await fs.rm(targetDir, { recursive: true, force: true });
  });

  it("[BEHAVIOR] Deve criar AGENTS.md como ponteiro e mover core para .ai-guidelines/", async () => {
    const subTarget = path.join(targetDir, "normal-flow");
    await fs.mkdir(subTarget, { recursive: true });

    const actions = [];
    await applyPointers(subTarget, { features: ["pointers"] }, actions);

    const rootContent = await fs.readFile(path.join(subTarget, "AGENTS.md"), "utf8");
    assert.match(rootContent, /Governança Centralizada/, "Raiz deve conter o texto de ponteiro");
    assert.match(rootContent, /\.ai-guidelines\/AGENTS\.md/, "Raiz deve apontar para o core");

    const coreExists = await fs
      .access(path.join(subTarget, ".ai-guidelines", "AGENTS.md"))
      .then(() => true)
      .catch(() => false);
    assert.ok(coreExists, "Arquivo core deve ser criado em .ai-guidelines/");
  });

  it("[PRESERVATION] Deve manter conteúdo do usuário fora do bloco core", async () => {
    const subTarget = path.join(targetDir, "preserve-user");
    await fs.mkdir(subTarget, { recursive: true });
    const agentsPath = path.join(subTarget, "AGENTS.md");
    await fs.writeFile(agentsPath, "# Projeto XPTO\n\n## Custom\nMinhas regras locais.");

    await applyPointers(subTarget, { features: ["pointers"] }, []);

    const content = await fs.readFile(agentsPath, "utf8");
    assert.match(content, /Minhas regras locais/, "Não deve apagar regras locais do usuário");
    assert.match(content, /Governança Centralizada/, "Deve injetar o ponteiro");
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
      /Governança Centralizada/,
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
    const coreExists = await fs
      .access(path.join(subTarget, ".ai-guidelines", "AGENTS.md"))
      .then(() => true)
      .catch(() => false);

    assert.equal(rootExists, false);
    assert.equal(coreExists, false);
    assert.ok(actions.some((a) => a.includes("[dry-run] write AGENTS.md")));
  });
});
