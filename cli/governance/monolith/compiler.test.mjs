import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "url";
import {
  buildFeatureTag,
  compileMonolithicAgentsContent,
  normalizePointerForMonolith,
  wrapFeatureModule,
  loadRulesCatalog,
  filterRulesByScope,
  extractInstructionEn,
  formatRuleInstruction,
  formatOptInRules,
  compileRulesContent,
  compileRulesFromCatalog,
  compileCoreRulesContent,
} from "./compiler.mjs";
import { buildRulesCatalog } from "./rules-builder.mjs";
import fs from "node:fs/promises";
import os from "node:os";

const __dirname = resolve(dirname(fileURLToPath(import.meta.url)));

describe("monolith/compiler", () => {
  it("[BR-CLI-COMPILER-20] DADO buffers QUANDO compilar ENTÃO preserva ordem topo centro base e newline final", () => {
    const compiled = compileMonolithicAgentsContent({
      coreTemplate: "AGENTS core",
      globalRules: "global rules",
      providerRules: [{ name: "codex", content: "codex rules" }],
      optInRules: [{ name: "quality-gates.md", content: "quality rules" }],
      pointerTemplate: "pointer",
    });

    assert.ok(compiled.indexOf("AGENTS core") < compiled.indexOf("<FEATURE_QUALITY_GATES>"));
    assert.doesNotMatch(compiled, /^# AGENTS\.md/m);
    assert.ok(compiled.indexOf("<FEATURE_QUALITY_GATES>") < compiled.indexOf("pointer"));
    assert.match(compiled, /codex rules/);
    assert.ok(compiled.endsWith("\n"));
  });

  it("[BR-CLI-COMPILER-21] DADO feature opt-in QUANDO envelopar ENTÃO tags são saneadas e estáveis", () => {
    assert.equal(buildFeatureTag("quality-gates.md"), "FEATURE_QUALITY_GATES");
    assert.equal(
      buildFeatureTag("  weird---name.md  "),
      "FEATURE_WEIRD_NAME",
      "tags devem ser estáveis mesmo com nomes estranhos"
    );

    assert.equal(
      wrapFeatureModule("tdd.md", "regra"),
      ["<FEATURE_TDD>", "regra", "</FEATURE_TDD>"].join("\n\n")
    );
  });

  it("[BR-CLI-COMPILER-22] DADO pointer bruto QUANDO normalizar ENTÃO remove link recursivo e preserva END marker", () => {
    const pointer = [
      "Para ler a Prime Directive, acesse:",
      "[.ai-guidelines/AGENTS.md](.ai-guidelines/AGENTS.md)",
      "<!-- END:ai-guidelines-core -->",
      "",
      "texto após",
    ].join("\n");

    const normalized = normalizePointerForMonolith(pointer);

    assert.doesNotMatch(normalized, /\.ai-guidelines\/AGENTS\.md/);
    assert.match(normalized, /<!-- END:ai-guidelines-core -->/);
  });
});

// ============================================================================
// Rules-Driven Compiler Tests (5.B3.5 — new functionality)
// ============================================================================

describe("monolith/compiler (rules-driven)", () => {
  let tempDir;
  let tempRulesJsonPath;

  before(async () => {
    // Create a temporary directory for test artifacts
    tempDir = await fs.mkdtemp(resolve(os.tmpdir(), "compiler-test-"));
    tempRulesJsonPath = resolve(tempDir, "rules.json");

    // Build a temporary rules.json from fixtures
    const fixtureDir = resolve(__dirname, "__fixtures__", "rules-parser", "valid");
    const { catalogJson, success, errors } = await buildRulesCatalog(fixtureDir);

    if (!success) {
      // console.error("Failed to build test catalog:", errors);
      throw new Error(
        "Test setup failed: could not build rules.json from fixtures.\n" +
          (errors?.join("\n") ?? "(no errors)")
      );
    }

    await fs.writeFile(tempRulesJsonPath, JSON.stringify(catalogJson, null, 2));
  });

  after(async () => {
    // Clean up the temporary directory
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  // ============================================================================
  // Discovery & I/O (BR-COMPILER-01..03)
  // ============================================================================

  it("[BR-COMPILER-01] DADO catálogo válido QUANDO loadRulesCatalog ENTÃO carrega com sucesso", async () => {
    const catalog = await loadRulesCatalog(tempRulesJsonPath);
    assert.ok(catalog, "Should load catalog from temp file");
    assert.ok(Array.isArray(catalog.rules), "Should have rules array");
    assert.strictEqual(catalog.rules.length > 0, true, "Should have rules from fixtures");
  });

  it("[BR-COMPILER-02] DADO path inexistente QUANDO loadRulesCatalog ENTÃO falha com erro", async () => {
    try {
      await loadRulesCatalog("nonexistent/rules.json");
      assert.fail("Should throw on nonexistent file");
    } catch (err) {
      assert.ok(err.message.includes("ENOENT") || err.message.includes("not found"));
    }
  });

  it("[BR-COMPILER-03] DADO catálogo com estrutura válida QUANDO usar filterRulesByScope ENTÃO sem exceções", () => {
    const rules = [{ id: "U-01", scope: "universal", instruction_en: "Universal rule" }];
    const result = filterRulesByScope(rules);
    assert.ok(result);
    assert.ok(Array.isArray(result.universal));
  });

  // ============================================================================
  // Filtering by Scope (BR-COMPILER-04..10)
  // ============================================================================

  it("[BR-COMPILER-04] DADO regras universal QUANDO filterRulesByScope ENTÃO agrupa corretamente", () => {
    const rules = [
      { id: "U-01", scope: "universal", instruction_en: "Universal rule 1" },
      { id: "U-02", scope: "universal", instruction_en: "Universal rule 2" },
    ];
    const result = filterRulesByScope(rules);
    assert.strictEqual(result.universal.length, 2);
    assert.ok(result.adapters);
    assert.ok(result.optIn);
  });

  it("[BR-COMPILER-05] DADO regras adapter QUANDO filterRulesByScope com includeAdapters ENTÃO seleciona apenas selecionadas", () => {
    const rules = [
      { id: "A-01", scope: "adapter", adapter: "claude", instruction_en: "Claude rule" },
      { id: "A-02", scope: "adapter", adapter: "codex", instruction_en: "Codex rule" },
    ];
    const result = filterRulesByScope(rules, { includeAdapters: ["claude"] });
    assert.strictEqual(result.adapters.claude.length, 1);
    assert.strictEqual(result.adapters.codex, undefined);
  });

  it("[BR-COMPILER-06] DADO regras opt-in QUANDO filterRulesByScope com optInFeatures ENTÃO filtra por feature", () => {
    const rules = [
      { id: "O-01", scope: "opt-in", opt_in_feature: "tdd", instruction_en: "TDD rule" },
      { id: "O-02", scope: "opt-in", opt_in_feature: "bdd", instruction_en: "BDD rule" },
    ];
    const result = filterRulesByScope(rules, { optInFeatures: ["tdd"] });
    assert.strictEqual(result.optIn.tdd.length, 1);
    assert.strictEqual(result.optIn.bdd, undefined);
  });

  it("[BR-COMPILER-07] DADO regras mistas QUANDO filterRulesByScope ENTÃO sem duplicatas entre escopos", () => {
    const rules = [
      { id: "U-01", scope: "universal", instruction_en: "Universal" },
      { id: "A-01", scope: "adapter", adapter: "claude", instruction_en: "Adapter" },
      { id: "O-01", scope: "opt-in", opt_in_feature: "tdd", instruction_en: "OptIn" },
    ];
    const result = filterRulesByScope(rules, {
      includeAdapters: ["claude"],
      optInFeatures: ["tdd"],
    });
    const allRules = [
      ...result.universal,
      ...Object.values(result.adapters).flat(),
      ...Object.values(result.optIn).flat(),
    ];
    const ids = new Set(allRules.map((r) => r.id));
    assert.strictEqual(ids.size, allRules.length, "No duplicate IDs");
  });

  it("[BR-COMPILER-08] DADO regras com scope inválido QUANDO filterRulesByScope ENTÃO ignora", () => {
    const rules = [{ id: "INVALID", scope: "unknown", instruction_en: "Invalid scope" }];
    const result = filterRulesByScope(rules);
    assert.strictEqual(result.universal.length, 0);
    assert.strictEqual(Object.keys(result.adapters).length, 0);
    assert.strictEqual(Object.keys(result.optIn).length, 0);
  });

  // ============================================================================
  // Instruction Extraction (BR-COMPILER-09..15)
  // ============================================================================

  it("[BR-COMPILER-09] DADO regra com instruction_en QUANDO extractInstructionEn ENTÃO extrai corretamente", () => {
    const rule = {
      id: "TEST-01",
      instruction_en: "This is instruction in English",
    };
    const result = extractInstructionEn(rule);
    assert.strictEqual(result, "This is instruction in English");
  });

  it("[BR-COMPILER-10] DADO regra com instructions block (```en) QUANDO extractInstructionEn ENTÃO parse ```en block", () => {
    const rule = {
      id: "TEST-02",
      instructions: "PT-BR content\n\n```en\nEnglish instruction here\n```\n\nMore PT-BR",
    };
    const result = extractInstructionEn(rule);
    assert.strictEqual(result, "English instruction here");
  });

  it("[BR-COMPILER-11] DADO regra sem instruction_en/instructions QUANDO extractInstructionEn ENTÃO retorna empty string", () => {
    const rule = { id: "TEST-03" };
    const result = extractInstructionEn(rule);
    assert.strictEqual(result, "");
  });

  it("[BR-COMPILER-12] DADO instruction com whitespace QUANDO extractInstructionEn ENTÃO trim corretamente", () => {
    const rule = {
      id: "TEST-04",
      instruction_en: "  \n  Instruction with spaces  \n  ",
    };
    const result = extractInstructionEn(rule);
    assert.strictEqual(result, "Instruction with spaces");
  });

  it("[BR-COMPILER-13] DADO instruction com markdown QUANDO extractInstructionEn ENTÃO preserva formatting", () => {
    const rule = {
      id: "TEST-05",
      instruction_en: "# Header\n\n- List item 1\n- List item 2\n\n```code\ncode block\n```",
    };
    const result = extractInstructionEn(rule);
    assert.ok(result.includes("# Header"));
    assert.ok(result.includes("- List item 1"));
    assert.ok(result.includes("```code"));
  });

  // ============================================================================
  // Rule Formatting (BR-COMPILER-14..17)
  // ============================================================================

  it("[BR-COMPILER-14] DADO regra QUANDO formatRuleInstruction ENTÃO inclui ID + instruction", () => {
    const rule = {
      id: "RULE-01",
      instruction_en: "Rule instruction",
    };
    const result = formatRuleInstruction(rule);
    assert.ok(result.includes("RULE-01"));
    assert.ok(result.includes("Rule instruction"));
    assert.ok(result.includes("###"));
  });

  it("[BR-COMPILER-15] DADO regra sem instruction QUANDO formatRuleInstruction ENTÃO retorna empty string", () => {
    const rule = { id: "EMPTY-01" };
    const result = formatRuleInstruction(rule);
    assert.strictEqual(result, "");
  });

  it("[BR-COMPILER-16] DADO regra null QUANDO formatRuleInstruction ENTÃO retorna empty string", () => {
    const result = formatRuleInstruction(null);
    assert.strictEqual(result, "");
  });

  // ============================================================================
  // Opt-in Formatting (BR-COMPILER-17..19)
  // ============================================================================

  it("[BR-COMPILER-17] DADO regras opt-in QUANDO formatOptInRules ENTÃO agrupa por feature", () => {
    const optInRules = {
      tdd: [
        {
          id: "TDD-01",
          opt_in_feature: "tdd",
          instruction_en: "TDD rule 1",
        },
      ],
      bdd: [
        {
          id: "BDD-01",
          opt_in_feature: "bdd",
          instruction_en: "BDD rule 1",
        },
      ],
    };
    const result = formatOptInRules(optInRules);
    assert.ok(result.includes("Feature: tdd"));
    assert.ok(result.includes("Feature: bdd"));
    assert.ok(result.includes("TDD rule 1"));
    assert.ok(result.includes("BDD rule 1"));
  });

  it("[BR-COMPILER-18] DADO opt-in rules vazio QUANDO formatOptInRules ENTÃO retorna empty string", () => {
    const result = formatOptInRules({});
    assert.strictEqual(result, "");
  });

  // ============================================================================
  // Content Compilation (BR-COMPILER-19..23)
  // ============================================================================

  it("[BR-COMPILER-19] DADO catálogo válido QUANDO compileRulesContent ENTÃO organiza por escopo", () => {
    const catalog = {
      rules: [
        { id: "U-01", scope: "universal", instruction_en: "Universal" },
        { id: "A-01", scope: "adapter", adapter: "claude", instruction_en: "Adapter" },
        { id: "O-01", scope: "opt-in", opt_in_feature: "tdd", instruction_en: "OptIn" },
      ],
    };
    const result = compileRulesContent(catalog, {
      includeAdapters: ["claude"],
      optInFeatures: ["tdd"],
    });
    assert.ok(result.includes("Universal Rules"));
    assert.ok(result.includes("Adapter: claude"));
    assert.ok(result.includes("Feature: tdd"));
  });

  it("[BR-COMPILER-20] DADO catálogo vazio QUANDO compileRulesContent ENTÃO retorna empty string", () => {
    const catalog = { rules: [] };
    const result = compileRulesContent(catalog);
    assert.strictEqual(result, "");
  });

  it("[BR-COMPILER-21] DADO catálogo null QUANDO compileRulesContent ENTÃO retorna empty string", () => {
    const result = compileRulesContent(null);
    assert.strictEqual(result, "");
  });

  it("[BR-COMPILER-22] DADO regras sem instructions QUANDO compileRulesContent ENTÃO não inclui seções vazias", () => {
    const catalog = {
      rules: [
        { id: "EMPTY-01", scope: "universal" },
        { id: "EMPTY-02", scope: "adapter", adapter: "claude" },
      ],
    };
    const result = compileRulesContent(catalog, { includeAdapters: ["claude"] });
    assert.strictEqual(result, "");
  });

  // ============================================================================
  // File-based Compilation (BR-COMPILER-23..25)
  // ============================================================================

  it("[BR-COMPILER-23] DADO rules.json válido QUANDO compileRulesFromCatalog ENTÃO success=true e contém conteúdo", async () => {
    const result = await compileRulesFromCatalog(tempRulesJsonPath, {
      includeAdapters: ["claude"],
      optInFeatures: [],
    });

    assert.strictEqual(
      result.success,
      true,
      `Compilation should succeed. Errors: ${result.errors.join(", ")}`
    );
    assert.ok(result.content, "Compiled content should not be empty");
    assert.ok(result.rulesCount > 0, "Should report compiled rules");
    assert.ok(result.generatedAt, "Should have a generatedAt timestamp");

    // Check for actual content from the fixture
    assert.ok(
      result.content.includes("This is a test instruction in English"),
      "Content should include instruction from test-rules.md"
    );
    assert.ok(result.content.includes("### [GR-TEST-01]"), "Should include GR-TEST-01 rule header");
  });

  it("[BR-COMPILER-24] DADO path inexistente QUANDO compileRulesFromCatalog ENTÃO success=false + errors", async () => {
    const result = await compileRulesFromCatalog("nonexistent/rules.json");
    assert.strictEqual(result.success, false);
    assert.ok(Array.isArray(result.errors));
    assert.ok(result.errors.length > 0);
    assert.ok(result.errors[0].includes("COMPILER_ERROR"));
  });

  it("[BR-COMPILER-25] DADO múltiplos adapters + features QUANDO compileRulesFromCatalog ENTÃO preserva estrutura", async () => {
    const result = await compileRulesFromCatalog(tempRulesJsonPath, {
      includeAdapters: ["claude", "codex", "gemini"],
      optInFeatures: ["tdd", "bdd"],
    });

    assert.strictEqual(result.success, true);
    assert.ok(result.rulesCount > 0);
    assert.ok(result.content.includes("Universal Rules"));
  });

  // ============================================================================
  // Core Rules Cutover (BR-COMPILER-26..29) — 5.B3.1.5.5
  // ============================================================================

  it("[BR-COMPILER-26] DADO catálogo com regras tagged core QUANDO compileCoreRulesContent ENTÃO retorna apenas core universais", () => {
    const catalog = {
      rules: [
        {
          id: "CORE-01",
          scope: "universal",
          tags: ["core", "agents"],
          instruction_en: "Core rule one",
        },
        {
          id: "GR-01",
          scope: "universal",
          tags: ["security"],
          instruction_en: "Non-core universal",
        },
        {
          id: "ADP-01",
          scope: "adapter",
          adapter: "claude",
          tags: ["core"],
          instruction_en: "Core adapter ignored",
        },
      ],
    };
    const result = compileCoreRulesContent(catalog);
    assert.ok(result.includes("CORE-01"));
    assert.ok(result.includes("Core rule one"));
    assert.ok(!result.includes("GR-01"));
    assert.ok(!result.includes("ADP-01"));
  });

  it("[BR-COMPILER-27] DADO catálogo sem regras core QUANDO compileCoreRulesContent ENTÃO retorna empty string (fallback gate)", () => {
    const catalog = {
      rules: [{ id: "GR-01", scope: "universal", tags: [], instruction_en: "X" }],
    };
    assert.strictEqual(compileCoreRulesContent(catalog), "");
  });

  it("[BR-COMPILER-28] DADO catálogo null/inválido QUANDO compileCoreRulesContent ENTÃO retorna empty string", () => {
    assert.strictEqual(compileCoreRulesContent(null), "");
    assert.strictEqual(compileCoreRulesContent({}), "");
    assert.strictEqual(compileCoreRulesContent({ rules: "not-array" }), "");
  });

  it("[BR-COMPILER-29] DADO regras core sem instruction_en QUANDO compileCoreRulesContent ENTÃO ignora regras vazias", () => {
    const catalog = {
      rules: [
        { id: "CORE-01", scope: "universal", tags: ["core"], instruction_en: "Has body" },
        { id: "CORE-02", scope: "universal", tags: ["core"] },
      ],
    };
    const result = compileCoreRulesContent(catalog);
    assert.ok(result.includes("CORE-01"));
    assert.ok(!result.includes("CORE-02"));
  });
});
