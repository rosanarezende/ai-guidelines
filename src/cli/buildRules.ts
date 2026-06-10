import path from "node:path";

import { buildRulesCatalog } from "../app/services/RulesCatalogBuilder.js";
import { MarkdownRulesDirectorySource } from "../infrastructure/filesystem/MarkdownRulesDirectorySource.js";
import {
  readPreviousGeneratedAt,
  resolveRulesArtifactPaths,
  saveCatalogArtifacts,
} from "../infrastructure/filesystem/RulesCatalogArtifacts.js";

export async function main(repoRoot = process.cwd()): Promise<number> {
  const sourceRulesDir = path.resolve(repoRoot, ".core/rules");
  const artifactPaths = resolveRulesArtifactPaths(repoRoot);
  const source = new MarkdownRulesDirectorySource(sourceRulesDir, {
    storedFilePath: (filePath) => path.relative(repoRoot, filePath).replace(/\\/g, "/"),
  });

  const result = await buildRulesCatalog(source, {
    baseDir: sourceRulesDir,
    generatedAt: readPreviousGeneratedAt(artifactPaths.rulesPath),
  });

  if (
    !result.success ||
    !result.catalogJson ||
    !result.ledgerMarkdown ||
    !result.humanCatalogMarkdown
  ) {
    process.stderr.write("❌ Build failed:\n");
    for (const err of result.errors) {
      process.stderr.write(`  - ${err}\n`);
    }
    return 1;
  }

  const saveResult = await saveCatalogArtifacts(
    result.catalogJson,
    result.ledgerMarkdown,
    result.humanCatalogMarkdown,
    artifactPaths
  );
  if (!saveResult.success) {
    process.stderr.write("❌ Save failed:\n");
    for (const err of saveResult.errors) {
      process.stderr.write(`  - ${err}\n`);
    }
    return 1;
  }

  process.stdout.write("✅ rules.json built successfully\n");
  process.stdout.write(`   - ${result.catalogJson.rules.length} rules indexed\n`);
  process.stdout.write(
    `   - by_scope: ${JSON.stringify(Object.keys(result.catalogJson.by_scope))}\n`
  );
  process.stdout.write(`   - Ledger: ${artifactPaths.ledgerPath}\n`);
  return 0;
}
