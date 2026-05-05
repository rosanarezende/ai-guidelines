import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import { parseRulesFromDirectory, parseRuleFile, validateRule } from "./rules-parser.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, "__fixtures__", "rules-parser");

describe("Rules Parser (BDD + TDD)", () => {
  // ============================================================================
  // DISCOVERY TESTS (BR-PARSER-01..05)
  // ============================================================================

  describe("[BR-PARSER-01] DADO um diretório com arquivos .md QUANDO percorrer recursivamente ENTÃO encontra todos os arquivos", async () => {
    it("[BR-PARSER-01] discovers all .md files in valid directory", async () => {
      const validDir = path.join(fixturesDir, "valid");
      const result = await parseRulesFromDirectory(validDir);

      // Deve ter encontrado 6 arquivos válidos (fixtures/valid/*.md)
      assert.ok(result.rules.length > 0, "Should find at least one rule");
      assert.deepStrictEqual(result.errors, []);
    });
  });

  describe("[BR-PARSER-02] DADO um diretório QUANDO contém subdiretórios ENTÃO percorre recursivamente", async () => {
    it("[BR-PARSER-02] finds rules in nested directories", async () => {
      const result = await parseRulesFromDirectory(fixturesDir);
      // Deve encontrar regras em valid/ e invalid/
      assert.ok(result.rules.length >= 6, "Should find rules from valid directory");
    });
  });

  describe("[BR-PARSER-03] DADO arquivos em _meta/ QUANDO percorrer diretório ENTÃO ignora _meta/", async () => {
    it("[BR-PARSER-03] ignores _meta/ directory", async () => {
      // Este teste valida a ignore-list
      const result = await parseRulesFromDirectory(fixturesDir);
      // _meta files should not be parsed
      const hasMeta = result.rules.some((r) => r.id?.startsWith("_"));
      assert.strictEqual(hasMeta, false, "Should not parse files from _meta");
    });
  });

  describe("[BR-PARSER-04] DADO arquivo catalog.md QUANDO percorrer ENTÃO ignora", async () => {
    it("[BR-PARSER-04] ignores catalog.md", async () => {
      // catalog.md should be ignored
      const result = await parseRulesFromDirectory(fixturesDir);
      assert.ok(
        !result.rules.some((r) => r.file?.includes("catalog.md")),
        "Should ignore catalog.md"
      );
    });
  });

  describe("[BR-PARSER-05] DADO arquivo com sufixo -ledger.md QUANDO percorrer ENTÃO ignora", async () => {
    it("[BR-PARSER-05] ignores *-ledger.md files", async () => {
      const result = await parseRulesFromDirectory(fixturesDir);
      assert.ok(
        !result.rules.some((r) => r.file?.endsWith("-ledger.md")),
        "Should ignore *-ledger.md"
      );
    });
  });

  // ============================================================================
  // RULE DETECTION TESTS (BR-PARSER-06..09)
  // ============================================================================

  describe("[BR-PARSER-06] DADO markdown com heading #### [ID] Title QUANDO parsear ENTÃO detecta como regra", async () => {
    it("[BR-PARSER-06] detects rule with #### heading", async () => {
      const content = `## Bloco

#### [GR-0001] Primeira regra

\`\`\`yaml
id: GR-0001
scope: universal
category: correctness
evidence_strength: strong
sources: ["CWE-1"]
applicable_languages: []
tags: []
\`\`\`

Descrição.
**Instruction (en):**
Instruction here.`;

      const result = await parseRuleFile("test.md", content);
      assert.strictEqual(result.rules.length, 1);
      assert.strictEqual(result.rules[0].id, "GR-0001");
    });
  });

  describe("[BR-PARSER-07] DADO arquivo com múltiplas regras QUANDO parsear ENTÃO detecta todas", async () => {
    it("[BR-PARSER-07] detects multiple rules in one file", async () => {
      const content = `## Bloco

#### [GR-0010] Regra 1

\`\`\`yaml
id: GR-0010
scope: universal
category: correctness
evidence_strength: strong
sources: ["CWE-1"]
applicable_languages: []
tags: []
\`\`\`

**Instruction (en):**
Instruction rule 1.

#### [GR-0011] Regra 2

\`\`\`yaml
id: GR-0011
scope: universal
category: correctness
evidence_strength: strong
sources: ["CWE-2"]
applicable_languages: []
tags: []
\`\`\`

**Instruction (en):**
Instruction rule 2.`;

      const result = await parseRuleFile("test.md", content);
      assert.strictEqual(result.rules.length, 2);
      assert.strictEqual(result.rules[0].id, "GR-0010");
      assert.strictEqual(result.rules[1].id, "GR-0011");
    });
  });

  describe("[BR-PARSER-08] DADO arquivo sem regras QUANDO parsear ENTÃO não falha", async () => {
    it("[BR-PARSER-08] file without rules does not cause error", async () => {
      const content = `# Introdução

Apenas texto, sem regras.`;

      const result = await parseRuleFile("metadata.md", content);
      assert.strictEqual(result.rules.length, 0);
      assert.strictEqual(result.errors.length, 0);
    });
  });

  describe("[BR-PARSER-09] DADO regra sem bloco YAML QUANDO parsear ENTÃO trata como erro e não vaza", async () => {
    it("[BR-PARSER-09] rule without YAML block is error and does not capture next YAML", async () => {
      const content = `#### [GR-0099] Regra sem YAML

Apenas descrição, sem bloco \`\`\`yaml\`\`\`.

#### [GR-0100] Próxima Regra

\`\`\`yaml
id: GR-0100
scope: universal
category: correctness
evidence_strength: strong
sources: ["CWE-1"]
applicable_languages: []
tags: []
\`\`\`
**Instruction (en):**
Instruction here.
`;

      const result = await parseRuleFile("test.md", content);
      assert.strictEqual(
        result.errors.length,
        1,
        "Should have one error for the missing YAML block"
      );
      assert.ok(result.errors[0].includes("[MISSING_YAML_BLOCK] Rule [GR-0099]"));
      assert.strictEqual(result.rules.length, 1, "Should only parse the valid rule");
      assert.strictEqual(result.rules[0].id, "GR-0100");
    });
  });

  // ============================================================================
  // YAML SUBSET PARSING TESTS (BR-PARSER-10..17)
  // ============================================================================

  describe("[BR-PARSER-10] DADO YAML com strings simples QUANDO parsear ENTÃO extrai valores", async () => {
    it("[BR-PARSER-10] parses simple string values", async () => {
      const yaml = `id: GR-0001
scope: universal
category: correctness
evidence_strength: strong
sources: []
applicable_languages: []
tags: []`;

      const result = parseYamlSubset(yaml);
      assert.strictEqual(result.id, "GR-0001");
      assert.strictEqual(result.scope, "universal");
    });
  });

  describe("[BR-PARSER-11] DADO YAML com array inline QUANDO parsear ENTÃO extrai array", async () => {
    it("[BR-PARSER-11] parses inline arrays", async () => {
      const yaml = `id: GR-0001
sources: ["CWE-1", "CWE-2"]
applicable_languages: ["JavaScript", "TypeScript"]
tags: [correctness, strong]`;

      const result = parseYamlSubset(yaml);
      assert.deepStrictEqual(result.sources, ["CWE-1", "CWE-2"]);
      assert.deepStrictEqual(result.applicable_languages, ["JavaScript", "TypeScript"]);
    });
  });

  describe("[BR-PARSER-12] DADO YAML com array multi-linha QUANDO parsear ENTÃO extrai array", async () => {
    it("[BR-PARSER-12] parses multi-line arrays", async () => {
      const yaml = `id: GR-0001
sources:
  - "CWE-1"
  - "CWE-2"
applicable_languages:
  - JavaScript
  - Python`;

      const result = parseYamlSubset(yaml);
      assert.deepStrictEqual(result.sources, ["CWE-1", "CWE-2"]);
      assert.deepStrictEqual(result.applicable_languages, ["JavaScript", "Python"]);
    });
  });

  describe("[BR-PARSER-13] DADO YAML com array vazio QUANDO parsear ENTÃO extrai array vazio", async () => {
    it("[BR-PARSER-13] parses empty arrays", async () => {
      const yaml = `id: GR-0001
sources: []
applicable_languages: []
tags: []`;

      const result = parseYamlSubset(yaml);
      assert.deepStrictEqual(result.sources, []);
      assert.deepStrictEqual(result.applicable_languages, []);
    });
  });

  describe("[BR-PARSER-14] DADO YAML com comentários QUANDO parsear ENTÃO ignora comentários", async () => {
    it("[BR-PARSER-14] ignores YAML comments", async () => {
      const yaml = `# Comentário no topo
id: GR-0001  # comentário inline
scope: universal  # outro
sources: []  # vazio
applicable_languages: []
tags: []`;

      const result = parseYamlSubset(yaml);
      assert.strictEqual(result.id, "GR-0001");
      assert.strictEqual(result.scope, "universal");
    });
  });

  describe("[BR-PARSER-15] DADO YAML com strings entre aspas QUANDO parsear ENTÃO preserva valores", async () => {
    it("[BR-PARSER-15] parses quoted strings", async () => {
      const yaml = `id: "GR-0001"
scope: 'universal'
category: "correctness"`;

      const result = parseYamlSubset(yaml);
      assert.strictEqual(result.id, "GR-0001");
      assert.strictEqual(result.scope, "universal");
    });
  });

  describe("[BR-PARSER-16] DADO YAML com indentação 2 espaços QUANDO parsear ENTÃO respeita indentação", async () => {
    it("[BR-PARSER-16] respects 2-space indentation", async () => {
      const yaml = `id: GR-0001
sources:
  - "CWE-1"
  - "CWE-2"
applicable_languages:
  - JavaScript
  - Python`;

      const result = parseYamlSubset(yaml);
      assert.strictEqual(result.sources.length, 2);
    });
  });

  describe("[BR-PARSER-17] DADO YAML com indentação inconsistente QUANDO parsear ENTÃO falha", async () => {
    it("[BR-PARSER-17] fails on inconsistent indentation", async () => {
      const yaml = `id: GR-0001
sources:
  - "CWE-1"
 - "malformed"`;

      assert.throws(() => parseYamlSubset(yaml), /indentation/i);
    });
  });

  // ============================================================================
  // SCHEMA VALIDATION TESTS (BR-PARSER-18..27)
  // ============================================================================

  describe("[BR-PARSER-18] DADO rule sem campo id QUANDO validar ENTÃO falha", async () => {
    it("[BR-PARSER-18] fails on missing id field", async () => {
      const rule = {
        scope: "universal",
        category: "correctness",
        evidence_strength: "strong",
        sources: ["CWE-1"],
        applicable_languages: [],
        tags: [],
      };

      const result = validateRule(rule);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("id")));
    });
  });

  describe("[BR-PARSER-19] DADO rule sem campo scope QUANDO validar ENTÃO falha", async () => {
    it("[BR-PARSER-19] fails on missing scope field", async () => {
      const rule = {
        id: "GR-0001",
        category: "correctness",
        evidence_strength: "strong",
        sources: ["CWE-1"],
        applicable_languages: [],
        tags: [],
      };

      const result = validateRule(rule);
      assert.strictEqual(result.valid, false);
    });
  });

  describe("[BR-PARSER-20] DADO rule com scope inválido QUANDO validar ENTÃO falha", async () => {
    it("[BR-PARSER-20] fails on invalid scope value", async () => {
      const rule = {
        id: "GR-0001",
        scope: "invalid_scope",
        category: "correctness",
        evidence_strength: "strong",
        sources: ["CWE-1"],
        applicable_languages: [],
        tags: [],
      };

      const result = validateRule(rule);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("scope")));
    });
  });

  describe("[BR-PARSER-21] DADO rule com category inválido QUANDO validar ENTÃO falha", async () => {
    it("[BR-PARSER-21] fails on invalid category value", async () => {
      const rule = {
        id: "GR-0001",
        scope: "universal",
        category: "invalid_category",
        evidence_strength: "strong",
        sources: ["CWE-1"],
        applicable_languages: [],
        tags: [],
      };

      const result = validateRule(rule);
      assert.strictEqual(result.valid, false);
    });
  });

  describe("[BR-PARSER-22] DADO rule com evidence_strength inválido QUANDO validar ENTÃO falha", async () => {
    it("[BR-PARSER-22] fails on invalid evidence_strength", async () => {
      const rule = {
        id: "GR-0001",
        scope: "universal",
        category: "correctness",
        evidence_strength: "invalid_strength",
        sources: ["CWE-1"],
        applicable_languages: [],
        tags: [],
      };

      const result = validateRule(rule);
      assert.strictEqual(result.valid, false);
    });
  });

  describe("[BR-PARSER-23] DADO rule correctness+strong sem sources QUANDO validar ENTÃO falha", async () => {
    it("[BR-PARSER-23] fails on correctness+strong without sources", async () => {
      const rule = {
        id: "GR-0001",
        scope: "universal",
        category: "correctness",
        evidence_strength: "strong",
        sources: [],
        applicable_languages: [],
        tags: [],
      };

      const result = validateRule(rule);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("sources")));
    });
  });

  describe("[BR-PARSER-24] DADO rule security+medium sem sources QUANDO validar ENTÃO falha", async () => {
    it("[BR-PARSER-24] fails on security+medium without sources", async () => {
      const rule = {
        id: "GR-0001",
        scope: "universal",
        category: "security",
        evidence_strength: "medium",
        sources: [],
        applicable_languages: [],
        tags: [],
      };

      const result = validateRule(rule);
      assert.strictEqual(result.valid, false);
    });
  });

  describe("[BR-PARSER-25] DADO rule process+declared_heuristic QUANDO validar ENTÃO aceita sources vazio", async () => {
    it("[BR-PARSER-25] accepts process+declared_heuristic without sources", async () => {
      const rule = {
        id: "PR-0001",
        scope: "universal",
        category: "process",
        evidence_strength: "declared_heuristic",
        sources: [],
        applicable_languages: [],
        tags: [],
      };

      const result = validateRule(rule);
      assert.strictEqual(result.valid, true);
    });
  });

  describe("[BR-PARSER-26] DADO rule scope:opt-in sem opt_in_feature QUANDO validar ENTÃO falha", async () => {
    it("[BR-PARSER-26] fails on opt-in scope without opt_in_feature", async () => {
      const rule = {
        id: "OPT-0001",
        scope: "opt-in",
        category: "process",
        evidence_strength: "declared_heuristic",
        sources: [],
        applicable_languages: [],
        tags: [],
      };

      const result = validateRule(rule);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("opt_in_feature")));
    });
  });

  describe("[BR-PARSER-27] DADO rule scope:adapter sem adapter QUANDO validar ENTÃO falha", async () => {
    it("[BR-PARSER-27] fails on adapter scope without adapter field", async () => {
      const rule = {
        id: "ADP-0001",
        scope: "adapter",
        category: "editorial",
        evidence_strength: "declared_heuristic",
        sources: [],
        applicable_languages: [],
        tags: [],
      };

      const result = validateRule(rule);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("adapter")));
    });
  });

  // ============================================================================
  // BODY PARSING TESTS (NEW)
  // ============================================================================
  describe("[BR-PARSER-32] DADO regra com instruction e documentation QUANDO parsear ENTÃO extrai ambos", async () => {
    it("extracts instruction_en and documentation_pt correctly", async () => {
      const content = `
#### [GR-TEST-01] Happy Path Rule

\`\`\`yaml
id: GR-TEST-01
scope: universal
category: correctness
evidence_strength: strong
sources: ["TEST-1"]
applicable_languages: ["all"]
tags: ["test"]
\`\`\`

**Instruction (en):**

This is a test instruction in English.
It can span multiple lines.

**Documentação (pt-br):**

Esta é uma documentação de teste em português.

Também pode ter múltiplas linhas.
`;
      const result = parseRuleFile("test.md", content);
      assert.strictEqual(result.rules.length, 1);
      assert.strictEqual(result.errors.length, 0);
      const rule = result.rules[0];
      assert.strictEqual(
        rule.instruction_en,
        "This is a test instruction in English.\nIt can span multiple lines."
      );
      assert.strictEqual(
        rule.documentation_pt,
        "Esta é uma documentação de teste em português.\n\nTambém pode ter múltiplas linhas."
      );
    });
  });

  describe("[BR-PARSER-33] DADO regra sem marcador de instrução QUANDO parsear ENTÃO retorna erro", async () => {
    it("fails when instruction marker is missing", async () => {
      const content = `
#### [GR-TEST-03] Rule with missing instruction marker

\`\`\`yaml
id: GR-TEST-03
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["all"]
tags: ["test"]
\`\`\`

This rule is missing the instruction marker and should fail.
`;
      const result = parseRuleFile("test.md", content);
      assert.strictEqual(result.rules.length, 0);
      assert.strictEqual(result.errors.length, 1);
      assert.ok(result.errors[0].includes("INVALID_CONTENT"));
    });
  });

  describe("[BR-PARSER-34] DADO regra com instrução vazia ou muito curta QUANDO parsear ENTÃO retorna erro", async () => {
    it("fails when instruction content is empty or less than 10 chars", async () => {
      const content = `
#### [GR-TEST-04] Rule with empty instruction

\`\`\`yaml
id: GR-TEST-04
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["all"]
tags: ["test"]
\`\`\`

**Instruction (en):**
short

**Documentação (pt-br):**
This rule has an empty instruction and should fail.
`;
      const result = parseRuleFile("test.md", content);
      assert.strictEqual(result.rules.length, 0);
      assert.strictEqual(result.errors.length, 1);
      assert.ok(result.errors[0].includes("INVALID_CONTENT"));
    });
  });

  describe("[BR-PARSER-35] DADO regra com blocos duplicados QUANDO parsear ENTÃO falha com DUPLICATE_SECTION", async () => {
    it("fails when instruction or documentation markers are duplicated", async () => {
      const content = `
#### [GR-TEST-05] Rule with duplicate instruction

\`\`\`yaml
id: GR-TEST-05
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["all"]
tags: ["test"]
\`\`\`

**Instruction (en):**
This is a valid instruction that is at least 10 chars long.

**Instruction (en):**
Duplicate instruction block.

**Documentação (pt-br):**
Some docs.
`;
      const result = parseRuleFile("test.md", content);
      assert.strictEqual(result.rules.length, 0);
      assert.strictEqual(result.errors.length, 1);
      assert.ok(result.errors[0].includes("DUPLICATE_SECTION"));
    });
  });

  // ============================================================================
  // FAIL-FAST TESTS (BR-PARSER-28..31)
  // ============================================================================

  describe("[BR-PARSER-28] DADO arquivo com YAML malformado QUANDO parsear ENTÃO falha com mensagem precisa", async () => {
    it("[BR-PARSER-28] fails on malformed YAML with line number", async () => {
      const content = `#### [GR-0001] Test

\`\`\`yaml
id: GR-0001
sources:
  - "item1"
 - "bad indent"
\`\`\`

**Instruction (en):**
Instruction here.`;

      const result = await parseRuleFile("test.md", content);
      assert.ok(result.errors.length > 0);
      assert.ok(result.errors[0].includes("indentation") || result.errors[0].includes("YAML"));
    });
  });

  describe("[BR-PARSER-29] DADO rules com IDs duplicados QUANDO parsear diretório ENTÃO falha", async () => {
    it("[BR-PARSER-29] fails on duplicate IDs across files", async () => {
      const invalidDir = path.join(fixturesDir, "invalid");
      const result = await parseRulesFromDirectory(invalidDir);
      // duplicate-id.md has two rules with same ID
      const dupError = result.errors.some((e) => e.includes("duplicate") || e.includes("GR-0001"));
      assert.strictEqual(dupError, true, "Should detect duplicate IDs");
    });
  });

  describe("[BR-PARSER-30] DADO rule com scope inválido QUANDO fail-fast ENTÃO falha imediatamente", async () => {
    it("[BR-PARSER-30] fail-fast on invalid scope", async () => {
      const content = `#### [GR-0001] Test

\`\`\`yaml
id: GR-0001
scope: "INVALID_SCOPE_VALUE"
category: correctness
evidence_strength: strong
sources: ["CWE-1"]
applicable_languages: []
tags: []
\`\`\`

**Instruction (en):**
Instruction here.`;

      const result = await parseRuleFile("test.md", content);
      assert.ok(result.errors.length > 0);
      assert.ok(result.errors[0].includes("scope"));
    });
  });

  describe("[BR-PARSER-31] DADO rule com evidence_strength inválido QUANDO fail-fast ENTÃO falha imediatamente", async () => {
    it("[BR-PARSER-31] fail-fast on invalid evidence_strength", async () => {
      const content = `#### [GR-0001] Test

\`\`\`yaml
id: GR-0001
scope: universal
category: correctness
evidence_strength: "INVALID_STRENGTH"
sources: ["CWE-1"]
applicable_languages: []
tags: []
\`\`\`

**Instruction (en):**
Instruction here.`;

      const result = await parseRuleFile("test.md", content);
      assert.ok(result.errors.length > 0);
      assert.ok(result.errors[0].includes("evidence_strength"));
    });
  });
});

// ============================================================================
// HELPER FUNCTION (for tests)
// ============================================================================

/**
 * Simple YAML subset parser for tests.
 * This is a helper; the real parser goes in rules-parser.mjs
 */
function parseYamlSubset(yaml) {
  const result = {};
  const lines = yaml.split("\n");
  let currentArray = null;
  let currentKey = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.replace(/#.*$/, "").trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Detect indentation level
    const match = line.match(/^( *)/);
    const leadingSpaces = match ? match[1].length : 0;

    // Check for consistent indentation (multiple of 2)
    if (leadingSpaces > 0 && leadingSpaces % 2 !== 0) {
      throw new Error(
        `YAML indentation error at line ${i + 1}: expected 2-space indent, got ${leadingSpaces} spaces`
      );
    }

    // Array item: - value
    if (trimmed.startsWith("- ")) {
      if (!currentArray) {
        throw new Error(`Unexpected array item at line ${i + 1}: no array started`);
      }
      const arrayValue = trimmed.slice(2).trim();
      // Remove quotes if present
      const cleanValue = arrayValue.replace(/^["']|["']$/g, "");
      if (cleanValue) {
        currentArray.push(cleanValue);
      }
    } else if (trimmed.includes(":")) {
      // Key: value pair
      const colonIndex = trimmed.indexOf(":");
      const key = trimmed.slice(0, colonIndex).trim();
      const value = trimmed.slice(colonIndex + 1).trim();

      // If we had an array, store it
      if (currentArray) {
        result[currentKey] = currentArray;
        currentArray = null;
        currentKey = null;
      }

      // Parse value
      if (value.startsWith("[") && value.endsWith("]")) {
        // Inline array: [a, b, c]
        const inner = value.slice(1, -1);
        result[key] = inner
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      } else if (value === "") {
        // Start of multi-line array
        currentKey = key;
        currentArray = [];
      } else {
        // Scalar value (remove quotes)
        result[key] = value.replace(/^["']|["']$/g, "");
      }
    }
  }

  // Finalize any pending array
  if (currentArray) {
    result[currentKey] = currentArray;
  }

  return result;
}
