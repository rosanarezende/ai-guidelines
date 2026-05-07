import path from "node:path";
import { readTextIfExists, stringifyJson, writeFileIfChanged } from "#fs/file-system";
import { normalizeAdapterSelection } from "#governance/monolith/rules-loader";

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

function unique(values) {
  return [...new Set(values)];
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
  const providers = normalizeSelectedProviders(
    options.providers ?? options.provider ?? discoveredConfig?.providers
  );
  const adapters =
    options.adapters !== undefined
      ? normalizeAdapterSelection(options.adapters)
      : deriveAdaptersFromProviders(providers);

  return {
    sdd_dir: sddDir,
    providers,
    adapters,
  };
}

export async function writeAiGuidelinesConfig(targetDir, config, dryRun, actions) {
  const configPath = getConfigPath(targetDir, config.sdd_dir);
  return writeFileIfChanged(configPath, stringifyJson(config), dryRun, actions);
}

export function getSupportedProviders() {
  return [...SUPPORTED_PROVIDERS];
}
