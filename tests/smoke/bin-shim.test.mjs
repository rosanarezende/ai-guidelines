// [BR-CLI-SMOKE] Smoke test — bin shim do consumidor.
//
// Contrato testado: `.ai-guidelines/config.json` deve ser criado pelo shim no
// consumidor. Este caminho corresponde à BRIDGE LEGADA da Spec 0021 — a CLI
// mjs atual escreve em `.ai-guidelines/` até a CLI ser plugada no novo
// `GovernanceWorkspace`. O contrato canônico de longo prazo é `.governance/`
// (ver `.core/governance/ARCHITECTURE.md` + `ARCHITECTURE-REFERENCE.md` §6 e Spec 0021 PR4). Atualizar este
// smoke para asserções sob `.governance/` chega quando a CLI migrar — débito
// rastreado em `.specify/specs/0021-governance-information-architecture/NEXT.md`.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { exists, installInTempDir, packLocal, SMOKE_TIMEOUT_MS } from "./helpers/tarball.mjs";

// Resolve o atalho criado pelo npm em `node_modules/.bin/<name>`. Em Windows,
// o npm gera três shims (`<name>`, `<name>.cmd`, `<name>.ps1`); usamos `.cmd`
// para que `spawn` com `shell: true` consiga executá-lo via cmd.exe.
function resolveBinShim(runnerDir, binName) {
  const ext = process.platform === "win32" ? ".cmd" : "";
  return path.join(runnerDir, "node_modules", ".bin", `${binName}${ext}`);
}

function runViaShim(binPath, args, options = {}) {
  return new Promise((resolve, reject) => {
    // Em Windows, spawn de `.cmd` exige `shell: true` desde Node 20+
    // (CVE-2024-27980). Em Unix o shim é um script com shebang executável,
    // sem necessidade de shell.
    const useShell = process.platform === "win32";
    const child = spawn(binPath, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      shell: useShell,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

describe("Smoke: bin shim do npm (caminho do consumidor pós-publish)", () => {
  let packed;

  before(async () => {
    packed = await packLocal();
  });

  after(async () => {
    await packed?.cleanup?.();
  });

  it(
    "DADO pacote instalado QUANDO bin é invocado via shim do npm ENTÃO entrypoint roda e cria artefatos",
    { timeout: SMOKE_TIMEOUT_MS },
    async () => {
      const installation = await installInTempDir(packed.tarballPath);

      try {
        // Invariante de empacotamento: o arquivo apontado por `package.json::bin`
        // PRECISA começar com shebang `#!...node...`. Sem isso, o shim que o npm
        // cria em Windows tenta executar o `.mjs` diretamente, e Windows usa
        // associação de extensão (editor), resultando em saída silenciosa com
        // exit 0 sem rodar nada — bug que afetou ai-guidelines@1.0.0.
        // Referência: https://docs.npmjs.com/cli/v10/configuring-npm/package-json#bin
        const pkgJsonPath = path.join(installation.packageDir, "package.json");
        const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, "utf8"));
        const binValue = pkgJson.bin;
        assert.ok(binValue, 'package.json deve declarar campo "bin"');

        const binRelative =
          typeof binValue === "string"
            ? binValue
            : (binValue["ai-guidelines"] ?? Object.values(binValue)[0]);
        assert.ok(binRelative, "campo bin deve resolver para um caminho");

        const binAbsolute = path.join(installation.packageDir, binRelative);
        const fileContent = await fs.readFile(binAbsolute, "utf8");
        const firstLine = fileContent.split("\n", 1)[0];

        assert.ok(
          firstLine.startsWith("#!"),
          `Arquivo apontado por "bin" deve começar com shebang. Primeira linha encontrada: ${JSON.stringify(firstLine)}`
        );
        assert.match(
          firstLine,
          /node/,
          `Shebang deve referenciar node. Primeira linha encontrada: ${JSON.stringify(firstLine)}`
        );

        // Invariante comportamental: invocar o bin via shim do npm (caminho
        // real do consumidor `npx ai-guidelines …`) deve executar a CLI e
        // criar os artefatos esperados no target.
        const shimPath = resolveBinShim(installation.runnerDir, "ai-guidelines");
        assert.equal(await exists(shimPath), true, `Shim do npm deve existir em ${shimPath}`);

        const result = await runViaShim(
          shimPath,
          [
            "init",
            "--target",
            installation.targetDir,
            "--name",
            "shim-smoke",
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
          ],
          { cwd: installation.runnerDir }
        );

        assert.equal(
          result.code,
          0,
          `Shim deve sair com 0. exit=${result.code}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
        );

        const agentsPath = path.join(installation.targetDir, "AGENTS.md");
        const configPath = path.join(installation.targetDir, ".ai-guidelines", "config.json");
        assert.equal(
          await exists(agentsPath),
          true,
          `AGENTS.md deve ser criado pelo shim. stdout:\n${result.stdout}\nstderr:\n${result.stderr}`
        );
        assert.equal(
          await exists(configPath),
          true,
          ".ai-guidelines/config.json deve ser criado pelo shim"
        );
      } finally {
        await installation.cleanup();
      }
    }
  );
});
