import path from "node:path";

import { MarkdownRulesDirectorySource } from "../../infrastructure/filesystem/MarkdownRulesDirectorySource.js";
import { buildRulesCatalog, generateCatalogMarkdown } from "./RulesCatalogBuilder.js";

const FIXTURES_DIR = path.resolve("cli/governance/monolith/__fixtures__/rules-builder");
const CURRENT_RULES_DIR = path.resolve(".core/rules");

function sourceFor(dirPath: string): MarkdownRulesDirectorySource {
  return new MarkdownRulesDirectorySource(dirPath, {
    storedFilePath: (filePath) => path.relative(process.cwd(), filePath).replace(/\\/g, "/"),
  });
}

describe("RulesCatalogBuilder — compilador TypeScript de rules", () => {
  it("DADO diretório de regras válido QUANDO compila ENTÃO gera catálogo com índices e generated_at estável", async () => {
    const result = await buildRulesCatalog(sourceFor(FIXTURES_DIR), {
      baseDir: FIXTURES_DIR,
      generatedAt: "2026-06-09T00:00:00.000Z",
    });

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.catalogJson?.generated_at).toBe("2026-06-09T00:00:00.000Z");
    expect(result.catalogJson?.schema_version).toBe("1.0");
    expect(result.catalogJson?.by_scope).toHaveProperty("universal");
    expect(result.catalogJson?.by_scope).toHaveProperty("adapter");
    expect(result.catalogJson?.by_scope).toHaveProperty("opt-in");
    expect(result.catalogJson?.by_feature).toBeDefined();
    expect(result.ledgerMarkdown).toContain("Agents Core Ledger");
    expect(result.humanCatalogMarkdown).toContain("# Rules Catalog");
  });

  it("DADO catálogo atual QUANDO recompila via TypeScript ENTÃO preserva a estrutura serializada existente", async () => {
    const result = await buildRulesCatalog(sourceFor(CURRENT_RULES_DIR), {
      baseDir: CURRENT_RULES_DIR,
      generatedAt: "stable",
    });

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.catalogJson?.rules).toHaveLength(42);
    expect(result.catalogJson?.by_scope).toEqual({
      universal: expect.arrayContaining(["CORE-01", "CORE-16", "GR-0203"]),
      adapter: expect.arrayContaining(["ADP-0101", "ADP-0304"]),
      "opt-in": expect.arrayContaining(["OPT-0101", "OPT-0501"]),
    });
    expect(result.catalogJson?.by_feature).toEqual({
      bdd: expect.arrayContaining(["OPT-0101", "OPT-0201"]),
      tdd: expect.arrayContaining(["OPT-0401", "OPT-0501"]),
      "quality-gates": ["OPT-0301"],
    });
  });

  it("DADO paths relativos do catálogo QUANDO projeta markdown ENTÃO links permanecem portáveis", async () => {
    const result = await buildRulesCatalog(sourceFor(CURRENT_RULES_DIR), {
      baseDir: CURRENT_RULES_DIR,
      generatedAt: "stable",
    });

    const markdown = generateCatalogMarkdown(result.catalogJson?.rules ?? [], CURRENT_RULES_DIR);

    expect(markdown).toContain("[Ver](top/agents-core.md#core01)");
    expect(markdown).not.toContain(process.cwd());
    expect(markdown).not.toContain("../../../../");
  });

  it("generated ledger uses npm-canonical commands, not yarn", async () => {
    const result = await buildRulesCatalog(sourceFor(CURRENT_RULES_DIR), {
      baseDir: CURRENT_RULES_DIR,
      generatedAt: "stable",
    });
    expect(result.success).toBe(true);
    expect(result.ledgerMarkdown).toContain("npm run build:rules");
    expect(result.ledgerMarkdown).not.toContain("yarn ");
  });
});
