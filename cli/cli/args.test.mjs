import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { describe, it } from "node:test";
import {
  SUPPORTED_MODES,
  isSupportedMode,
  printHelp,
  resolveExecutionInput,
  sanitizeWizardRawOptions,
} from "./args.mjs";

async function withTTY(value, callback) {
  const originalIsTTY = process.stdin.isTTY;
  let didOverride = false;

  try {
    Object.defineProperty(process.stdin, "isTTY", {
      value,
      configurable: true,
    });
    didOverride = true;
  } catch {
    // Ignore when isTTY cannot be overridden in this runtime.
  }

  try {
    await callback();
  } finally {
    if (didOverride) {
      Object.defineProperty(process.stdin, "isTTY", {
        value: originalIsTTY,
        configurable: true,
      });
    }
  }
}

describe("cli/args", () => {
  it("[BR-CLI-INPUT-07] DADO os verbos de bootstrap QUANDO comparados ao registry ENTÃO SUPPORTED_MODES espelha os verbos registrados (anti-drift)", async () => {
    const { BOOTSTRAP_COMMANDS } = await import(
      new URL("../../dist/cli/registry/commands/BootstrapCommand.js", import.meta.url)
    );
    const registryVerbs = BOOTSTRAP_COMMANDS.map((definition) => definition.name);
    assert.deepEqual(
      [...SUPPORTED_MODES].sort(),
      [...registryVerbs].sort(),
      "SUPPORTED_MODES (args.mjs) divergiu dos verbos registrados em BOOTSTRAP_COMMANDS (BootstrapCommand.ts)"
    );
  });

  it("[BR-CLI-INPUT-03] DADO tokens de wizard QUANDO sanitizeWizardRawOptions ENTÃO remove metadados internos", () => {
    const result = sanitizeWizardRawOptions({
      target: ".",
      __wizardAnswers: ["init"],
    });

    assert.deepEqual(result, { target: "." });
  });

  it("[BR-CLI-WIZARD-01] DADO ausência de parâmetros QUANDO ambiente TTY ENTÃO aciona o wizard", async () => {
    await withTTY(true, async () => {
      const result = await resolveExecutionInput(undefined, {
        __wizardAnswers: [
          "init",
          "./demo",
          "demo-app",
          "npm",
          ["claude", "gemini", "openai"],
          ["prettier", "husky"],
          "s",
        ],
      });

      assert.equal(result.usedWizard, true, "Deveria ter acionado o wizard");
      assert.equal(result.mode, "init");
      assert.deepEqual(result.options.features, ["prettier", "husky"]);
    });
  });

  it("[BR-CLI-WIZARD-02] DADO respostas vazias no Wizard QUANDO executado em pasta vazia ENTÃO aplica valores padrão (Happy Path)", async () => {
    const tmpDir = path.join(process.cwd(), ".tmp-wizard-test");
    await fs.mkdir(tmpDir, { recursive: true });

    try {
      await withTTY(true, async () => {
        const result = await resolveExecutionInput(undefined, {
          target: tmpDir,
          __wizardAnswers: ["", "", "", "", "", ""], // [mode, name, pm, providers, features, dryRun]
        });

        assert.equal(result.mode, "adopt", "Default mode deve ser adopt");
        assert.equal(result.options.target, tmpDir);
        assert.ok(
          result.options.features.includes("prettier"),
          "Deve incluir prettier por default"
        );
        assert.equal(
          result.options["package-manager"],
          "npm",
          "Default PM deve ser npm em pasta vazia"
        );
        assert.equal(result.options["dry-run"], true, "Default dry-run deve ser true");
      });
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("[BR-CLI-WIZARD-03] DADO flags completas QUANDO resolveExecutionInput ENTÃO pula wizard (Modo Headless)", async () => {
    await withTTY(false, async () => {
      const result = await resolveExecutionInput("init", {
        target: "./demo",
        name: "demo",
        "package-manager": "npm",
        "dry-run": true,
        features: "pointers,rules",
        providers: "claude,openai",
      });

      assert.equal(result.usedWizard, false);
      assert.equal(result.mode, "init");
      assert.deepEqual(result.options.features, ["pointers", "rules"]);
      assert.deepEqual(result.options.providers, ["claude", "openai"]);
    });
  });

  it("[BR-CLI-WIZARD-04] DADO skip flags QUANDO modo headless ENTÃO resolve features corretamente", async () => {
    await withTTY(false, async () => {
      const result = await resolveExecutionInput("adopt", {
        target: "./demo",
        "skip-prettier": true,
      });

      assert.ok(result.options.features.includes("husky"));
      assert.ok(!result.options.features.includes("prettier"));
      assert.deepEqual(result.options.providers, ["claude", "gemini", "openai"]);
    });
  });

  it("[BR-CLI-WIZARD-05] DADO flag --yes QUANDO resolveExecutionInput ENTÃO pula wizard mesmo em TTY", async () => {
    await withTTY(true, async () => {
      const result = await resolveExecutionInput("adopt", {
        target: "./demo",
        yes: true,
      });

      assert.equal(result.usedWizard, false);
      assert.equal(result.options.yes, true);
    });
  });

  it("[BR-CLI-WIZARD-06] DADO wizard QUANDO features tdd ou bdd selecionadas ENTÃO solicita idioma", async () => {
    await withTTY(true, async () => {
      const result = await resolveExecutionInput(undefined, {
        __wizardAnswers: [
          "init",
          "./demo",
          "demo-app",
          "npm",
          ["claude", "gemini", "openai"],
          ["tdd"],
          "en",
          "s",
        ],
      });

      assert.equal(result.usedWizard, true);
      assert.deepEqual(result.options.features, ["tdd"]);
      assert.equal(result.options.lang, "en");
    });
  });

  it("[BR-CLI-WIZARD-03] DADO entrada inválida QUANDO no Wizard ENTÃO entra em loop até resposta válida (Retry Loop)", async () => {
    await withTTY(true, async () => {
      // Sequência: 'invalid-pm', 'invalid-pm2', 'pnpm'
      const result = await resolveExecutionInput("adopt", {
        target: ".",
        name: "demo",
        // Pula o comando e target, vai direto pro PM
        __wizardAnswers: ["invalid-pm", "invalid-pm2", "pnpm", ["claude", "openai"], "", "s"],
      });

      assert.equal(
        result.options["package-manager"],
        "pnpm",
        "Deveria ter aceitado pnpm após erros"
      );
    });
  });

  it("[BR-CLI-INPUT-05] DADO validacao de modos QUANDO isSupportedMode avaliar ENTÃO retorna os limiares corretos booleanos", () => {
    assert.equal(isSupportedMode("init"), true);
    assert.equal(isSupportedMode("adopt"), true);
    assert.equal(isSupportedMode("invalid"), false);
  });

  it("[BR-CLI-INPUT-*] DADO printHelp com bloco do registry QUANDO chamado ENTÃO exibe o manual de uso", () => {
    const originalLog = console.log;
    let output = "";
    console.log = (msg) => (output += msg);
    printHelp("  init\n  adopt");
    console.log = originalLog;
    assert.ok(output.includes("ai-guidelines CLI"), "Deveria conter cabeçalho CLI");
    assert.ok(output.includes("init"), "Deveria conter comando init");
    assert.ok(output.includes("adopt"), "Deveria conter comando adopt");
  });

  it("[BR-CLI-WIZARD-03] DADO erros de validacao no Wizard QUANDO em loop ENTÃO cobre ramificações de erro (Rigor)", async () => {
    await withTTY(true, async () => {
      // Forçar erro de PM (inválido por não estar na lista) para disparar o loop
      const result = await resolveExecutionInput("init", {
        target: "demo",
        name: "fixed-name",
        __wizardAnswers: ["invalid-pm", "npm", ["claude", "gemini", "openai"], "", "s"],
      });
      assert.equal(
        result.options["package-manager"],
        "npm",
        "Deveria ter aceitado npm após erro de validação"
      );
    });
  });

  it("[BR-CLI-WIZARD-*] DADO resposta vazia QUANDO campo tem default ENTÃO assume o default", async () => {
    await withTTY(true, async () => {
      const result = await resolveExecutionInput("init", {
        target: "demo",
        name: "fixed-name",
        __wizardAnswers: ["npm", "", "", ""],
      });
      assert.ok(result.options.target);
    });
  });

  it("[BR-CLI-WIZARD-07] DADO modo providers QUANDO wizard rodar ENTÃO resolve providers sem exigir package manager ou features", async () => {
    await withTTY(true, async () => {
      const result = await resolveExecutionInput("providers", {
        __wizardAnswers: ["./demo", ["claude", "cursor", "openai"], "s"],
      });

      assert.equal(result.mode, "providers");
      assert.deepEqual(result.options.providers, ["claude", "cursor", "openai"]);
      assert.equal(result.options["package-manager"], undefined);
      assert.equal(result.options.features, undefined);
    });
  });
});
