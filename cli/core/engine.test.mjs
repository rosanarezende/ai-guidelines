import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { execute } from "./engine.mjs";

async function createTempDir(prefix) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), `ai-engine-test-${prefix}-`));
  return tmp;
}

describe("cli-engine (Orquestração [BR-CLI-ENG])", () => {
  let targetDir;

  before(async () => {
    targetDir = await createTempDir("master");
  });

  after(async () => {
    await fs.rm(targetDir, { recursive: true, force: true });
  });

  it("[BR-CLI-ENG-01] DADO subcomando init QUANDO conflito detectado SEM --force ENTÃO aborta com erro", async () => {
    const subTarget = path.join(targetDir, "init-conflict");
    await fs.mkdir(subTarget, { recursive: true });
    // Criar arquivo conflitante
    await fs.writeFile(path.join(subTarget, "AGENTS.md"), "existing agents");

    await assert.rejects(async () => {
      await execute("init", { target: subTarget, force: false, "dry-run": true });
    }, /init encontrou arquivos já presentes/);
  });

  it("[BR-CLI-ENG-01] DADO subcomando init QUANDO conflito detectado COM --force ENTÃO prossegue (Happy Path)", async () => {
    const subTarget = path.join(targetDir, "init-force");
    await fs.mkdir(subTarget, { recursive: true });
    await fs.writeFile(path.join(subTarget, "AGENTS.md"), "existing agents");

    // Não deve lançar erro
    await execute("init", { target: subTarget, force: true, "dry-run": true });
    assert.ok(true, "Deveria ter prosseguido com --force");
  });

  it("[BR-CLI-ENG-03] DADO modo adopt QUANDO executado ENTÃO orquestra fluxo de sincronização (Happy Path)", async () => {
    const subTarget = path.join(targetDir, "adopt-happy");
    await fs.mkdir(subTarget, { recursive: true });

    // O engine deve rodar sem erros no modo adopt
    await execute("adopt", { target: subTarget, "dry-run": true });
    assert.ok(true, "Adopt executado com sucesso no Happy Path");
  });

  it("[BR-CLI-ENG-DRYRUN-01] DADO adopt --dry-run QUANDO executado ENTÃO não escreve arquivos no target", async () => {
    const subTarget = path.join(targetDir, "adopt-dryrun-no-write");
    await fs.mkdir(subTarget, { recursive: true });

    await execute("adopt", {
      target: subTarget,
      "dry-run": true,
      features: ["prettier", "husky", "ci"],
    });

    const entries = await fs.readdir(subTarget);
    assert.deepEqual(entries, [], "Dry-run não deve persistir alterações");
  });

  it("[BR-CLI-INPUT-02] DADO comando não suportado QUANDO engine.execute ENTÃO aborta com erro explícito", async () => {
    await assert.rejects(async () => {
      await execute("invalid-mode", {});
    }, /Comando não suportado: invalid-mode/);
  });

  it("[BR-CLI-ENG-04] DADO erro de leitura de package.json QUANDO applyPackageJson ENTÃO cobre ramificação de erro", async () => {
    const subTarget = path.join(targetDir, "bad-package");
    await fs.mkdir(subTarget, { recursive: true });
    await fs.writeFile(path.join(subTarget, "package.json"), "invalid json {");
    // Não deve travar a execução, apenas logar warn (conforme engine.mjs:145)
    await execute("adopt", { target: subTarget, "dry-run": true });
    assert.ok(true, "Deveria ter lidado com package.json corrompido");
  });
});
