/**
 * Lê o `config.json` do consumidor (via port) e resolve a config efetiva.
 *
 * Migração Spec 0024 · CO-3.5. Espelha a dupla-leitura de
 * `resolveAiGuidelinesConfig` (sdd-dir das opções → fallback default) usando o
 * port {@link ../ports/ProvisioningFileSystem}; a fusão é a função pura
 * {@link ../../domain/provisioning/ConsumerConfig.resolveConfig}. **Aditivo:**
 * fora do caminho ativo até o flip (Passo 4).
 */
import { ProvisioningFileSystem } from "../ports/ProvisioningFileSystem.js";
import { configRelPath, PointersConfig } from "../../domain/provisioning/ProvisioningPlan.js";
import { DEFAULT_SDD_DIR } from "../../domain/provisioning/SddDir.js";
import {
  parseConsumerConfig,
  resolveConfig,
  ResolveConfigOptions,
} from "../../domain/provisioning/ConsumerConfig.js";

export async function loadConsumerConfig(
  fs: ProvisioningFileSystem,
  options: ResolveConfigOptions,
  targetDir: string
): Promise<PointersConfig> {
  const primarySddDir = options["sdd-dir"] ?? DEFAULT_SDD_DIR;
  const primary = parseConsumerConfig(await fs.readText(configRelPath(primarySddDir)));
  const discovered =
    primary ?? parseConsumerConfig(await fs.readText(configRelPath(DEFAULT_SDD_DIR)));
  return resolveConfig(discovered, options, targetDir);
}
