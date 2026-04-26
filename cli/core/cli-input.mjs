import path from "node:path";
import readline from "node:readline";
import { normalizePackageManager, detectPackageManager } from "../formatters/package-context.mjs";
import { readTextIfExists } from "./file-system.mjs";

const SUPPORTED_MODES = ["init", "adopt"];
const WIZARD_REQUIRED_KEYS = ["target", "name", "package-manager", "dry-run"];
const WIZARD_DEFAULTS = {
  mode: "adopt",
  target: ".",
  packageManager: "npm",
  dryRun: true,
  features: "prettier,husky,ci",
};

const FEATURE_OPTIONS = ["prettier", "husky", "ci"];
const FEATURE_DESCRIPTIONS = {
  prettier: "Estilo e Padronização (Baseline Prettier)",
  husky: "Automação Local (Git Hooks)",
  ci: "Integração Contínua (GitHub Actions Workflow)",
};

export function isSupportedMode(mode) {
  return SUPPORTED_MODES.includes(mode);
}

export function printHelp() {
  console.log(`ai-guidelines CLI

Uso:
  node scripts/ai-guidelines-cli.mjs <init|adopt> [opcoes]

Comandos:
  init   Cria baseline AI-first em projeto novo
  adopt  Aplica baseline AI-first em repositório existente

Opções:
  --target <dir>             Diretório alvo (default: diretório atual)
  --name <project_name>      Nome do projeto (default: nome da pasta alvo)
  --package-manager <pm>     npm | pnpm | yarn | yarn@1.22.22 | yarn@4.1.1
  --force                    Sobrescreve arquivos suportados
  --dry-run                  Mostra ações sem escrever arquivos
  --install                  Instala dependências automaticamente
  --prune                    Remove arquivos órfãos em .ai-guidelines/ (adopt)
  --yes, -y                  Aceita todos os defaults e pula o Wizard
`);
}

export function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];

    if (!token.startsWith("-")) {
      throw new Error(`Argumento inesperado: ${token}`);
    }

    const [flag, inlineValue] = token.split("=", 2);
    const key = flag.replace(/^-+/, "");

    if (inlineValue !== undefined) {
      options[key] = inlineValue;
      continue;
    }

    if (
      key === "force" ||
      key === "dry-run" ||
      key === "install" ||
      key === "yes" ||
      key === "y" ||
      key.startsWith("skip-")
    ) {
      options[key] = true;
      continue;
    }

    const nextToken = rest[index + 1];
    if (!nextToken || nextToken.startsWith("-")) {
      throw new Error(`Valor ausente para --${key}`);
    }

    options[key] = nextToken;
    index += 1;
  }

  return { command, options };
}

export function sanitizeWizardRawOptions(rawOptions) {
  const { __wizardAnswers, ...cleanOptions } = rawOptions ?? {};
  return cleanOptions;
}

function createWizardAsker(rawOptions) {
  const scriptedAnswers = Array.isArray(rawOptions?.__wizardAnswers)
    ? [...rawOptions.__wizardAnswers]
    : null;

  if (scriptedAnswers) {
    return async () => scriptedAnswers.shift() ?? "";
  }

  return (question) => {
    return new Promise((resolve) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  };
}

async function promptTextWithDefault(ask, questionLabel, defaultValue, validate, errorMessage) {
  while (true) {
    const answer = (await ask(`${questionLabel} [${defaultValue}]: `)).trim();
    const resolved = answer === "" ? defaultValue : answer;

    if (!validate || validate(resolved)) {
      return resolved;
    }

    console.log(errorMessage);
  }
}

async function promptBooleanWithDefault(ask, questionLabel, defaultValue) {
  const hint = defaultValue ? "S/n" : "s/N";

  while (true) {
    const answer = (await ask(`${questionLabel} [${hint}] `)).trim().toLowerCase();

    if (answer === "") {
      return defaultValue;
    }

    if (["s", "sim", "y", "yes"].includes(answer)) {
      return true;
    }

    if (["n", "nao", "não", "no"].includes(answer)) {
      return false;
    }

    console.log("Entrada inválida. Responda com s ou n.");
  }
}

function shouldUseWizard(mode, rawOptions) {
  if (!process.stdin.isTTY) {
    return false;
  }

  if (!isSupportedMode(mode)) {
    return true;
  }

  if (rawOptions.yes || rawOptions.y) {
    return false;
  }

  return WIZARD_REQUIRED_KEYS.some((key) => rawOptions[key] === undefined);
}

function isValidPackageManagerInput(value) {
  try {
    normalizePackageManager(value);
    return true;
  } catch {
    return false;
  }
}

export async function resolveExecutionInput(mode, rawOptions) {
  const cleanOptions = sanitizeWizardRawOptions(rawOptions);

  if (!shouldUseWizard(mode, cleanOptions)) {
    if (cleanOptions.features === undefined) {
      cleanOptions.features = FEATURE_OPTIONS.filter((f) => !cleanOptions[`skip-${f}`]);
    } else if (typeof cleanOptions.features === "string") {
      cleanOptions.features = cleanOptions.features.split(",").map((f) => f.trim());
    }
    return { mode, options: cleanOptions, usedWizard: false };
  }

  const ask = createWizardAsker(rawOptions);
  const wizardOptions = { ...cleanOptions };
  let resolvedMode = mode;

  if (!isSupportedMode(resolvedMode)) {
    const modeInput = await promptTextWithDefault(
      ask,
      "Modo (init/adopt) - init cria um projeto novo com baseline AI-first; adopt aplica o baseline de forma conservadora em repo existente",
      WIZARD_DEFAULTS.mode,
      (value) => isSupportedMode(value.toLowerCase()),
      "Modo inválido. Use init ou adopt."
    );
    resolvedMode = modeInput.toLowerCase();
  }

  if (wizardOptions.target === undefined) {
    wizardOptions.target = await promptTextWithDefault(
      ask,
      "Diretório alvo",
      WIZARD_DEFAULTS.target,
      (value) => value.trim().length > 0,
      "Diretório alvo não pode ser vazio."
    );
  }

  const defaultName = path.basename(path.resolve(wizardOptions.target));

  if (wizardOptions.name === undefined) {
    wizardOptions.name = await promptTextWithDefault(
      ask,
      "Nome do projeto",
      defaultName,
      (value) => value.trim().length > 0,
      "Nome do projeto não pode ser vazio."
    );
  }

  if (wizardOptions["package-manager"] === undefined) {
    // Detecção inteligente antes de perguntar
    const pkgPath = path.join(wizardOptions.target, "package.json");
    const pkgContent = await readTextIfExists(pkgPath);
    let pkgJson = null;
    try {
      pkgJson = pkgContent ? JSON.parse(pkgContent) : null;
    } catch {
      // Ignorar erro de parse
    }

    const detectedPm = await detectPackageManager(wizardOptions.target, null, pkgJson);

    wizardOptions["package-manager"] = await promptTextWithDefault(
      ask,
      "Package manager",
      detectedPm.label,
      isValidPackageManagerInput,
      "Package manager inválido. Use npm, pnpm, yarn, yarn@1.22.22 ou yarn@4.1.1."
    );
  }

  if (wizardOptions.features === undefined) {
    const suggestedFeatures = FEATURE_OPTIONS.filter((f) => !wizardOptions[`skip-${f}`]).join(",");

    const featurePrompt =
      "Features para ativar:\n" +
      FEATURE_OPTIONS.map((f) => `  - ${f}: ${FEATURE_DESCRIPTIONS[f]}`).join("\n") +
      `\nSeleção [${suggestedFeatures}]: `;

    const featuresInput = await promptTextWithDefault(
      ask,
      featurePrompt,
      suggestedFeatures,
      (value) =>
        value.split(",").every((f) => FEATURE_OPTIONS.includes(f.trim()) || f.trim() === ""),
      "Uma ou mais features são inválidas."
    );
    wizardOptions.features = featuresInput
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
  } else if (typeof wizardOptions.features === "string") {
    wizardOptions.features = wizardOptions.features.split(",").map((f) => f.trim());
  }

  if (wizardOptions["dry-run"] === undefined) {
    wizardOptions["dry-run"] = await promptBooleanWithDefault(
      ask,
      "Executar em dry-run? (simula as ações sem escrever arquivos)",
      WIZARD_DEFAULTS.dryRun
    );
  }

  return { mode: resolvedMode, options: wizardOptions, usedWizard: true };
}
