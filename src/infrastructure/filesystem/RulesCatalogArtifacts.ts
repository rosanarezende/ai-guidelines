import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { format, resolveConfig } from "prettier";

import { RulesCatalogJson } from "../../domain/rules/Rule.js";

export interface RulesArtifactPaths {
  readonly rulesPath: string;
  readonly ledgerPath: string;
  readonly catalogPath: string;
  readonly dir: string;
}

export interface SaveCatalogArtifactsResult {
  readonly success: boolean;
  readonly errors: readonly string[];
}

export function resolveRulesArtifactPaths(
  repoRoot: string,
  outputDir?: string
): RulesArtifactPaths {
  if (!outputDir) {
    const dir = path.resolve(repoRoot, ".core/rules/_meta");
    return {
      rulesPath: path.resolve(dir, "rules.json"),
      ledgerPath: path.resolve(dir, "agents-core-ledger.md"),
      catalogPath: path.resolve(dir, "..", "catalog.md"),
      dir,
    };
  }

  const dir = path.resolve(repoRoot, outputDir);
  return {
    rulesPath: path.resolve(dir, "rules.json"),
    ledgerPath: path.resolve(dir, "agents-core-ledger.md"),
    catalogPath: path.resolve(dir, "..", "catalog.md"),
    dir,
  };
}

export function readPreviousGeneratedAt(rulesPath: string): string | undefined {
  if (!existsSync(rulesPath)) return undefined;
  try {
    const oldCatalog = JSON.parse(readFileSync(rulesPath, "utf-8")) as Partial<RulesCatalogJson>;
    return oldCatalog.generated_at;
  } catch {
    return undefined;
  }
}

export async function saveCatalogArtifacts(
  catalogJson: RulesCatalogJson,
  ledgerMarkdown: string,
  humanCatalogMarkdown: string,
  paths: RulesArtifactPaths
): Promise<SaveCatalogArtifactsResult> {
  const errors: string[] = [];

  try {
    mkdirSync(paths.dir, { recursive: true });
  } catch (err) {
    return {
      success: false,
      errors: [`[SAVE_ERROR] Failed to create ${paths.dir}: ${(err as Error).message}`],
    };
  }

  // Os artefatos são escritos JÁ formatados pelo Prettier (API Node, sem spawn de
  // processo), garantindo que `build:rules` deixe a working tree limpa em qualquer
  // SO. Formatar via `execFileSync("yarn", ...)` não é portátil no Windows
  // (resolução de `yarn.cmd` exige shell) e mascarava o drift de formatação.
  await writeFormatted(paths.rulesPath, JSON.stringify(catalogJson, null, 2), errors);
  await writeFormatted(paths.ledgerPath, ledgerMarkdown, errors);
  await writeFormatted(paths.catalogPath, humanCatalogMarkdown, errors);

  return { success: errors.length === 0, errors };
}

async function writeFormatted(
  filePath: string,
  rawContent: string,
  errors: string[]
): Promise<void> {
  let formatted: string;
  try {
    const config = await resolveConfig(filePath);
    formatted = await format(rawContent, { ...config, filepath: filePath });
  } catch (err) {
    // Falha de formatação é fatal: o build deve quebrar visivelmente em vez de
    // gravar artefatos fora do padrão Prettier e sujar a working tree.
    errors.push(`[FORMAT_ERROR] Failed to format ${filePath}: ${(err as Error).message}`);
    return;
  }

  try {
    if (existsSync(filePath) && readFileSync(filePath, "utf-8") === formatted) {
      return;
    }
    writeFileSync(filePath, formatted, "utf-8");
  } catch (err) {
    errors.push(`[SAVE_ERROR] Failed to write ${filePath}: ${(err as Error).message}`);
  }
}
