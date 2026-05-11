import path from "node:path";
import { checkbox, confirm, input, select } from "@inquirer/prompts";
import { normalizePackageManager, detectPackageManager } from "#formatters/package-context";
import { readTextIfExists } from "#fs/file-system";
import { DEFAULT_PROVIDERS, getSupportedProviders } from "#features/core/config";

const SUPPORTED_MODES = ["init", "adopt", "providers", "update", "check-budget"];
const WIZARD_DEFAULTS = {
  mode: "adopt",
  target: ".",
  packageManager: "npm",
  dryRun: true,
  features: "prettier,husky,ci,quality-gates,tdd,bdd",
  providers: DEFAULT_PROVIDERS.join(","),
};

/**
 * Taxonomia das features opt-in.
 *
 * Editoriais    → são compiladas no bloco <AI_GUIDELINES> do AGENTS.md.
 * Infraestrutura → modificam package.json, hooks, CI/CD do consumidor.
 *
 * FEATURE_OPTIONS é derivado por composição; as listas tipadas
 * (EDITORIAL / INFRASTRUCTURE) são a fonte de verdade.
 */
export const EDITORIAL_FEATURES = ["quality-gates", "tdd", "bdd"];
export const INFRASTRUCTURE_FEATURES = ["prettier", "husky", "ci"];
const FEATURE_OPTIONS = [...INFRASTRUCTURE_FEATURES, ...EDITORIAL_FEATURES];

const FEATURE_DESCRIPTIONS = {
  // Infraestrutura
  prettier: "⚡ Estilo e Padronização (Baseline Prettier)",
  husky: "⚡ Automação Local (Git Hooks)",
  ci: "⚡ Integração Contínua (GitHub Actions Workflow)",
  // Editoriais
  "quality-gates": "📝 Gates objetivos para código gerado por IA (Recomendado)",
  tdd: "📝 TDD: Ciclo de Desenvolvimento Guiado por Testes (Red-Green-Refactor)",
  bdd: "📝 BDD: Comportamento Guiado por Testes (Dado/Quando/Então em Português ou Inglês)",
};

const SUPPORTED_PROVIDER_OPTIONS = getSupportedProviders();
const PROVIDER_DESCRIPTIONS = {
  claude: "Claude Code (CLAUDE.md + .claudeignore)",
  cursor: "Cursor (.cursor/rules/ai-guidelines.mdc)",
  copilot: "GitHub Copilot (.github/copilot-instructions.md)",
  windsurf: "Windsurf (.windsurfrules)",
  gemini: "Gemini (GEMINI.md + .aiexclude)",
  aider: "Aider (CONVENTIONS.md + .aiderignore)",
  openai: "OpenAI / Codex (.openai/instructions.md + .gptignore)",
};

/**
 * Nomes dos arquivos .md gerados por features opt-in editoriais.
 * Derivado programaticamente de EDITORIAL_FEATURES.
 * Usado pelo motor de prune em rules.mjs para proteger arquivos
 * opt-in ativos durante a limpeza global.
 */
export const OPT_IN_RULE_FILES = EDITORIAL_FEATURES.map((f) => `${f}.md`);

const BOOLEAN_FLAGS = new Set([
  "force",
  "force-prettier",
  "dry-run",
  "install",
  "prune",
  "yes",
  "y",
]);

export function isSupportedMode(mode) {
  return SUPPORTED_MODES.includes(mode);
}

export function printHelp() {
  console.log(`ai-guidelines CLI

Uso:
  yarn guidelines <init|adopt|providers|update> [opcoes]

Comandos:
  init           Cria baseline AI-first em projeto novo
  adopt          Aplica baseline AI-first em repositório existente
  providers      Adiciona ou atualiza arquivos nativos de provider (CLAUDE.md, GEMINI.md,
                 .openai/instructions.md, .cursor/rules/ai-guidelines.mdc, etc.)
  update         Re-aplica provider entrypoints, templates SDD e recompila AGENTS.md a partir
                 do .ai-guidelines/config.json existente (idempotente, headless, não modifica
                 config). Use após atualizar a versão do framework para receber updates
                 de hard-redirect, adapter rules e templates sem reabrir o wizard.
  check-budget   Imprime o relatório de orçamento de tokens (universal, opt-in, AGENTS.md
                 compilado e cada provider entrypoint) com base no rules.json do framework.

Opções:
  --target <dir>             Diretório alvo (default: diretório atual)
  --name <project_name>      Nome do projeto (default: nome da pasta alvo)
  --package-manager <pm>     npm | pnpm | yarn | yarn@1.22.22 | yarn@4.1.1
  --providers <lista>        claude,cursor,copilot,windsurf,gemini,aider,openai
  --lang <pt|en>             Idioma para features (ex: tdd, bdd). Padrão: pt
  --force                    Sobrescreve arquivos suportados
  --force-prettier           Força baseline Prettier mesmo com formatter rival detectado
  --dry-run                  Mostra ações sem escrever arquivos
  --install                  Instala dependências automaticamente
  --prune                    Remove arquivos órfãos em .ai-guidelines/ (adopt)
  --yes, -y                  Aceita todos os defaults e pula o Wizard

Contrato Governance-Driven (Spec 0021):
  A CLI atual escreve em .ai-guidelines/ (bridge legado). O contrato canônico
  de longo prazo é .governance/ como root unificado, com reservas intake/,
  handoff/ e telemetry/. A migração CLI → GovernanceWorkspace acontece em PR4;
  nenhum alias mágico é introduzido — adoção é sempre explícita.
`);
}

function normalizeInlineValue(key, value) {
  if (!BOOLEAN_FLAGS.has(key) && !key.startsWith("skip-")) {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y", "sim", "s"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "n", "nao", "não"].includes(normalized)) {
    return false;
  }

  return value;
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
      options[key] = normalizeInlineValue(key, inlineValue);
      continue;
    }

    if (BOOLEAN_FLAGS.has(key) || key.startsWith("skip-")) {
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

function createWizardPrompter(rawOptions) {
  const scriptedAnswers = Array.isArray(rawOptions?.__wizardAnswers)
    ? [...rawOptions.__wizardAnswers]
    : null;

  if (scriptedAnswers) {
    return {
      scripted: true,
      async input() {
        return scriptedAnswers.shift() ?? "";
      },
      async select() {
        const answer = scriptedAnswers.shift();
        return answer === undefined ? "" : answer;
      },
      async checkbox() {
        const answer = scriptedAnswers.shift();
        if (answer === "") {
          return "__DEFAULT__";
        }
        if (Array.isArray(answer)) {
          return answer;
        }
        if (typeof answer === "string") {
          return answer
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        }
        return [];
      },
      async confirm() {
        const answer = scriptedAnswers.shift();
        if (typeof answer === "boolean") {
          return answer;
        }
        return answer ?? "";
      },
    };
  }

  return null;
}

async function resolveInteractivePrompter(rawOptions) {
  const scriptedPrompter = createWizardPrompter(rawOptions);
  if (scriptedPrompter) {
    return scriptedPrompter;
  }

  return {
    scripted: false,
    input: (options) => input(options),
    select: (options) => select(options),
    checkbox: (options) => checkbox(options),
    confirm: (options) => confirm(options),
  };
}

async function promptTextWithDefault(
  prompter,
  questionLabel,
  defaultValue,
  validate,
  errorMessage
) {
  while (true) {
    const answer = String(
      await prompter.input({
        message: questionLabel,
        default: defaultValue,
      })
    ).trim();
    const resolved = answer === "" ? defaultValue : answer;

    if (!validate || validate(resolved)) {
      return resolved;
    }

    console.log(errorMessage);
  }
}

async function promptBooleanWithDefault(prompter, questionLabel, defaultValue) {
  while (true) {
    const answer = await prompter.confirm({
      message: questionLabel,
      default: defaultValue,
    });

    if (typeof answer === "boolean") {
      return answer;
    }

    const normalizedAnswer = String(answer).trim().toLowerCase();

    if (normalizedAnswer === "") {
      return defaultValue;
    }

    if (["s", "sim", "y", "yes"].includes(normalizedAnswer)) {
      return true;
    }

    if (["n", "nao", "não", "no"].includes(normalizedAnswer)) {
      return false;
    }

    console.log("Entrada inválida. Responda com s ou n.");
  }
}

async function promptSelectWithDefault(prompter, message, choices, defaultValue, errorMessage) {
  while (true) {
    const answer = await prompter.select({
      message,
      choices,
      default: defaultValue,
    });

    const normalizedAnswer = String(answer).trim() || defaultValue;
    if (choices.some((choice) => choice.value === normalizedAnswer)) {
      return normalizedAnswer;
    }

    console.log(errorMessage);
  }
}

async function promptCheckboxWithDefault(prompter, message, choices, defaultValues, errorMessage) {
  while (true) {
    const answer = await prompter.checkbox({
      message,
      choices,
      default: defaultValues,
      required: true,
    });

    if (answer === "__DEFAULT__") {
      return defaultValues;
    }

    if (
      Array.isArray(answer) &&
      answer.length > 0 &&
      answer.every((item) => choices.some((choice) => choice.value === item))
    ) {
      return answer;
    }

    console.log(errorMessage);
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

  // Os comandos `update` e `check-budget` são headless por contrato — leem
  // estado existente (config / catálogo) e nunca abrem wizard.
  if (mode === "update" || mode === "check-budget") {
    return false;
  }

  const requiredKeys =
    mode === "providers"
      ? ["target", "providers", "dry-run"]
      : ["target", "name", "package-manager", "providers", "dry-run"];

  return requiredKeys.some((key) => rawOptions[key] === undefined);
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
    if (cleanOptions.features === undefined && mode !== "providers") {
      cleanOptions.features = FEATURE_OPTIONS.filter((f) => !cleanOptions[`skip-${f}`]);
    } else if (typeof cleanOptions.features === "string") {
      cleanOptions.features = cleanOptions.features.split(",").map((f) => f.trim());
    }
    if (cleanOptions.providers === undefined) {
      cleanOptions.providers = WIZARD_DEFAULTS.providers.split(",");
    } else if (typeof cleanOptions.providers === "string") {
      cleanOptions.providers = cleanOptions.providers.split(",").map((provider) => provider.trim());
    }
    return { mode, options: cleanOptions, usedWizard: false };
  }

  const prompter = await resolveInteractivePrompter(rawOptions);
  const wizardOptions = { ...cleanOptions };
  let resolvedMode = mode;

  if (!isSupportedMode(resolvedMode)) {
    const modeInput = await promptSelectWithDefault(
      prompter,
      "Modo de execução",
      [
        {
          value: "init",
          name: "init — cria um projeto novo com baseline AI-first",
        },
        {
          value: "adopt",
          name: "adopt — aplica o baseline de forma conservadora em repo existente",
        },
        {
          value: "providers",
          name: "providers — adiciona ou atualiza provider entrypoints nativos",
        },
        {
          value: "update",
          name: "update — re-aplica provider entrypoints, templates e runtime a partir do config existente",
        },
      ],
      WIZARD_DEFAULTS.mode,
      "Modo inválido. Use init, adopt, providers ou update."
    );
    resolvedMode = modeInput.toLowerCase();
  }

  if (wizardOptions.target === undefined) {
    wizardOptions.target = await promptTextWithDefault(
      prompter,
      "Diretório alvo",
      WIZARD_DEFAULTS.target,
      (value) => value.trim().length > 0,
      "Diretório alvo não pode ser vazio."
    );
  }

  const defaultName = path.basename(path.resolve(wizardOptions.target));

  if (resolvedMode !== "providers" && wizardOptions.name === undefined) {
    wizardOptions.name = await promptTextWithDefault(
      prompter,
      "Nome do projeto",
      defaultName,
      (value) => value.trim().length > 0,
      "Nome do projeto não pode ser vazio."
    );
  }

  if (resolvedMode !== "providers" && wizardOptions["package-manager"] === undefined) {
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
      prompter,
      "Package manager",
      detectedPm.label,
      isValidPackageManagerInput,
      "Package manager inválido. Use npm, pnpm, yarn, yarn@1.22.22 ou yarn@4.1.1."
    );
  }

  if (wizardOptions.providers === undefined) {
    wizardOptions.providers = await promptCheckboxWithDefault(
      prompter,
      "Providers e IDEs para gerar provider entrypoints nativos",
      SUPPORTED_PROVIDER_OPTIONS.map((provider) => ({
        value: provider,
        name: `${provider} — ${PROVIDER_DESCRIPTIONS[provider]}`,
      })),
      WIZARD_DEFAULTS.providers.split(","),
      "Um ou mais providers são inválidos."
    );
  } else if (typeof wizardOptions.providers === "string") {
    wizardOptions.providers = wizardOptions.providers.split(",").map((provider) => provider.trim());
  }

  if (resolvedMode !== "providers" && wizardOptions.features === undefined) {
    const suggestedFeatures = FEATURE_OPTIONS.filter((f) => !wizardOptions[`skip-${f}`]);

    wizardOptions.features = await promptCheckboxWithDefault(
      prompter,
      "Features para ativar",
      [
        ...INFRASTRUCTURE_FEATURES.map((feature) => ({
          value: feature,
          name: `[Infra] ${feature} — ${FEATURE_DESCRIPTIONS[feature]}`,
        })),
        ...EDITORIAL_FEATURES.map((feature) => ({
          value: feature,
          name: `[Editorial] ${feature} — ${FEATURE_DESCRIPTIONS[feature]}`,
        })),
      ],
      suggestedFeatures,
      "Uma ou mais features são inválidas."
    );
  } else if (resolvedMode !== "providers" && typeof wizardOptions.features === "string") {
    wizardOptions.features = wizardOptions.features.split(",").map((f) => f.trim());
  }

  if (
    resolvedMode !== "providers" &&
    (wizardOptions.features.includes("tdd") || wizardOptions.features.includes("bdd")) &&
    wizardOptions.lang === undefined
  ) {
    wizardOptions.lang = await promptSelectWithDefault(
      prompter,
      "Idioma para regras TDD/BDD",
      [
        { value: "pt", name: "pt — Português do Brasil" },
        { value: "en", name: "en — English" },
      ],
      "pt",
      "Idioma inválido. Use pt ou en."
    );
  }

  if (wizardOptions["dry-run"] === undefined) {
    wizardOptions["dry-run"] = await promptBooleanWithDefault(
      prompter,
      "Executar em dry-run? (simula as ações sem escrever arquivos)",
      WIZARD_DEFAULTS.dryRun
    );
  }

  return { mode: resolvedMode, options: wizardOptions, usedWizard: true };
}
