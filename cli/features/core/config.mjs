import path from "node:path";
import { readTextIfExists, stringifyJson, writeFileIfChanged } from "#fs/file-system";
export const DEFAULT_SDD_DIR = ".ai-guidelines";
export const DEFAULT_PROVIDERS = ["claude", "gemini", "openai"];

const SUPPORTED_PROVIDERS = [
  "claude",
  "cursor",
  "copilot",
  "windsurf",
  "gemini",
  "aider",
  "openai",
];

const PROVIDER_TO_ADAPTERS = {
  claude: ["claude"],
  gemini: ["gemini"],
  openai: ["codex"],
  copilot: ["codex"],
};

export function getAdaptersForProvider(provider) {
  return PROVIDER_TO_ADAPTERS[provider] ?? [];
}

function unique(values) {
  return [...new Set(values)];
}

function normalizeSelectedFeatures(input) {
  if (input === undefined || input === null) {
    return [];
  }

  const features = Array.isArray(input) ? input : String(input).split(",");
  return unique(features.map((item) => item.trim()).filter(Boolean));
}

export function normalizeSelectedProviders(input) {
  if (!input || input === "all") {
    return DEFAULT_PROVIDERS;
  }

  const providers = Array.isArray(input) ? input : String(input).split(",");
  const normalized = providers
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .filter((item) => SUPPORTED_PROVIDERS.includes(item));

  return normalized.length > 0 ? unique(normalized) : DEFAULT_PROVIDERS;
}

export function deriveAdaptersFromProviders(providers) {
  return unique(
    providers.flatMap((provider) => {
      return PROVIDER_TO_ADAPTERS[provider] ?? [];
    })
  );
}

/**
 * Valida que `sddDir` é um path relativo seguro contido em `targetDir`.
 *
 * Como `sdd_dir` vem do `config.json` lido do disco (potencialmente
 * commitado por terceiros em monorepos), um valor malicioso como
 * `"../../etc"` ou `"/etc"` faria a CLI escrever fora do `targetDir`.
 * Esta função normaliza e rejeita esses casos com erro descritivo.
 */
export function validateSddDir(sddDir, targetDir) {
  if (typeof sddDir !== "string" || sddDir.trim() === "") {
    throw new Error(`sdd_dir inválido: deve ser uma string não-vazia (recebido: ${sddDir})`);
  }

  if (path.isAbsolute(sddDir)) {
    throw new Error(`sdd_dir inválido: caminho absoluto não é permitido (${sddDir})`);
  }

  const resolved = path.resolve(targetDir, sddDir);
  const resolvedTarget = path.resolve(targetDir);
  const relativeFromTarget = path.relative(resolvedTarget, resolved);

  if (
    relativeFromTarget.startsWith("..") ||
    path.isAbsolute(relativeFromTarget) ||
    relativeFromTarget === ".."
  ) {
    throw new Error(`sdd_dir inválido: deve permanecer dentro do targetDir (recebido: ${sddDir})`);
  }
}

export function getConfigPath(targetDir, sddDir = DEFAULT_SDD_DIR) {
  return path.join(targetDir, sddDir, "config.json");
}

export async function readAiGuidelinesConfig(targetDir, sddDir = DEFAULT_SDD_DIR) {
  const configPath = getConfigPath(targetDir, sddDir);
  const configText = await readTextIfExists(configPath);

  if (!configText) {
    return null;
  }

  try {
    return JSON.parse(configText);
  } catch {
    return null;
  }
}

export async function resolveAiGuidelinesConfig(targetDir, options = {}) {
  const discoveredConfig =
    (await readAiGuidelinesConfig(targetDir, options["sdd-dir"])) ??
    (await readAiGuidelinesConfig(targetDir, DEFAULT_SDD_DIR));

  const sddDir = options["sdd-dir"] ?? discoveredConfig?.sdd_dir ?? DEFAULT_SDD_DIR;
  validateSddDir(sddDir, targetDir);
  const selectedProvidersInput = options.providers ?? options.provider;
  const selectedProviders = normalizeSelectedProviders(
    selectedProvidersInput ?? discoveredConfig?.providers
  );
  const providers =
    options.mode === "providers" &&
    selectedProvidersInput !== undefined &&
    !options.prune &&
    Array.isArray(discoveredConfig?.providers)
      ? unique([...discoveredConfig.providers, ...selectedProviders])
      : selectedProviders;
  const features = normalizeSelectedFeatures(options.features ?? discoveredConfig?.features);
  const lang = options.lang ?? discoveredConfig?.lang ?? "pt";

  return {
    sdd_dir: sddDir,
    providers,
    features,
    lang,
  };
}

export async function writeAiGuidelinesConfig(targetDir, config, dryRun, actions) {
  const configPath = getConfigPath(targetDir, config.sdd_dir);
  return writeFileIfChanged(
    configPath,
    stringifyJson({
      sdd_dir: config.sdd_dir,
      providers: config.providers,
      features: config.features,
      lang: config.lang,
    }),
    dryRun,
    actions
  );
}

export function getSupportedProviders() {
  return [...SUPPORTED_PROVIDERS];
}
