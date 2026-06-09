import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

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

export function saveCatalogArtifacts(
  catalogJson: RulesCatalogJson,
  ledgerMarkdown: string,
  humanCatalogMarkdown: string,
  paths: RulesArtifactPaths
): SaveCatalogArtifactsResult {
  const errors: string[] = [];

  try {
    mkdirSync(paths.dir, { recursive: true });
  } catch (err) {
    return {
      success: false,
      errors: [`[SAVE_ERROR] Failed to create ${paths.dir}: ${(err as Error).message}`],
    };
  }

  writeIfChanged(paths.rulesPath, JSON.stringify(catalogJson, null, 2), errors);
  writeIfChanged(paths.ledgerPath, ledgerMarkdown, errors);
  writeIfChanged(paths.catalogPath, humanCatalogMarkdown, errors);

  try {
    execFileSync(
      "yarn",
      ["prettier", "--write", paths.rulesPath, paths.ledgerPath, paths.catalogPath],
      {
        stdio: "ignore",
      }
    );
  } catch {
    // Non-fatal: tests and constrained shells may not have yarn on PATH.
  }

  return { success: errors.length === 0, errors };
}

function writeIfChanged(filePath: string, content: string, errors: string[]): void {
  try {
    if (existsSync(filePath) && readFileSync(filePath, "utf-8") === content) {
      return;
    }
    writeFileSync(filePath, content, "utf-8");
  } catch (err) {
    errors.push(`[SAVE_ERROR] Failed to write ${filePath}: ${(err as Error).message}`);
  }
}
