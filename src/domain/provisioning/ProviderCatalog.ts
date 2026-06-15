/**
 * Catálogo de providers/IDEs suportados e a derivação de adapters editoriais.
 *
 * Migrado de `cli/features/core/config.mjs` (parte PURA — catálogo e
 * normalização; Spec 0024 · CO-3.5). A leitura/escrita de `config.json` (IO)
 * permanece fora do domínio (vai para app/infra). Sem IO aqui.
 */

export type Provider = "claude" | "cursor" | "copilot" | "windsurf" | "gemini" | "aider" | "openai";

export type Adapter = "claude" | "gemini" | "codex";

const SUPPORTED_PROVIDERS: readonly Provider[] = [
  "claude",
  "cursor",
  "copilot",
  "windsurf",
  "gemini",
  "aider",
  "openai",
];

export const DEFAULT_PROVIDERS: readonly Provider[] = ["claude", "gemini", "openai"];

const PROVIDER_TO_ADAPTERS: Partial<Record<Provider, readonly Adapter[]>> = {
  claude: ["claude"],
  gemini: ["gemini"],
  openai: ["codex"],
  copilot: ["codex"],
};

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function isSupportedProvider(value: string): value is Provider {
  return (SUPPORTED_PROVIDERS as readonly string[]).includes(value);
}

export function getAdaptersForProvider(provider: string): Adapter[] {
  return [...(PROVIDER_TO_ADAPTERS[provider as Provider] ?? [])];
}

export function normalizeSelectedProviders(input: unknown): Provider[] {
  if (!input || input === "all") {
    return [...DEFAULT_PROVIDERS];
  }

  const providers = Array.isArray(input) ? input : String(input).split(",");
  const normalized = providers
    .map((item) => String(item).trim().toLowerCase())
    .filter(Boolean)
    .filter(isSupportedProvider);

  return normalized.length > 0 ? unique(normalized) : [...DEFAULT_PROVIDERS];
}

export function deriveAdaptersFromProviders(providers: readonly string[]): Adapter[] {
  return unique(providers.flatMap((provider) => getAdaptersForProvider(provider)));
}

export function getSupportedProviders(): Provider[] {
  return [...SUPPORTED_PROVIDERS];
}
