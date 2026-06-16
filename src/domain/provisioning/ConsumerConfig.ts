/**
 * Modelo e resolução PURA do `config.json` do consumidor.
 *
 * Migrado da parte de decisão de `resolveAiGuidelinesConfig`
 * (`cli/features/core/config.mjs` · Spec 0024 · CO-3.5). O IO (ler o arquivo do
 * disco) fica no app ({@link ../../app/use-cases/loadConsumerConfig}); aqui só o
 * parse defensivo e a fusão determinística disco × opções. Paridade faithful com
 * o legado (inclusive a semântica de append do ex-modo `providers`, preservada
 * para o flip absorvê-la em `update --providers` no Passo 4).
 */
import { PointersConfig } from "./ProvisioningPlan.js";
import { normalizeSelectedProviders } from "./ProviderCatalog.js";
import { normalizeSelectedFeatures } from "./FeatureCatalog.js";
import { DEFAULT_SDD_DIR, validateSddDir } from "./SddDir.js";

export interface RawConsumerConfig {
  readonly sdd_dir?: string;
  readonly providers?: unknown;
  readonly features?: unknown;
  readonly lang?: string;
}

export interface ResolveConfigOptions {
  readonly "sdd-dir"?: string;
  readonly providers?: unknown;
  readonly provider?: unknown;
  readonly features?: unknown;
  readonly lang?: string;
  /** Modo público: `init`/`adopt`/`update`; `providers` permanece só como ponte legada pré-flip. */
  readonly mode?: string;
  readonly prune?: boolean;
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

/** Parse defensivo do `config.json`: `null` em ausência ou JSON inválido. */
export function parseConsumerConfig(text: string | null): RawConsumerConfig | null {
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as RawConsumerConfig;
  } catch {
    return null;
  }
}

/**
 * Funde a config descoberta no disco com as opções da invocação. Determinística
 * e pura. Espelha `resolveAiGuidelinesConfig` (sem o IO de leitura).
 */
export function resolveConfig(
  discovered: RawConsumerConfig | null,
  options: ResolveConfigOptions,
  targetDir: string
): PointersConfig {
  const sddDir = options["sdd-dir"] ?? discovered?.sdd_dir ?? DEFAULT_SDD_DIR;
  validateSddDir(sddDir, targetDir);

  const selectedProvidersInput = options.providers ?? options.provider;
  const selectedProviders = normalizeSelectedProviders(
    selectedProvidersInput ?? discovered?.providers
  );

  const shouldAppendProviders =
    (options.mode === "providers" || options.mode === "update") &&
    selectedProvidersInput !== undefined &&
    !options.prune &&
    Array.isArray(discovered?.providers);

  const providers = shouldAppendProviders
    ? unique([...(discovered.providers as string[]), ...selectedProviders])
    : selectedProviders;

  const features = normalizeSelectedFeatures(options.features ?? discovered?.features);
  const lang = options.lang ?? discovered?.lang ?? "pt";

  return { sdd_dir: sddDir, providers, features, lang };
}
