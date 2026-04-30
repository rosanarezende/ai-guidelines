import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildFeatureTag,
  compileMonolithicAgentsContent,
  normalizePointerForMonolith,
  wrapFeatureModule,
} from "./compiler.mjs";

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
    assert.ok(compiled.indexOf("<FEATURE_QUALITY_GATES>") < compiled.indexOf("pointer"));
    assert.match(compiled, /Regras do Provedor: codex/);
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
