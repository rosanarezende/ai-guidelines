/**
 * Topology consistency — guarda que o repo-fonte (`.core/rules/`) está
 * fisicamente alinhado com a taxonomia Top/Center/Base/Adapters [DEC-0021-B05].
 *
 * Lê o artefato `rules.json` (gerado por `build:rules`) e classifica cada `file`
 * via `pathToZone`. Qualquer arquivo fora de `top|center|base|adapters` falha
 * o teste — esta é a barreira contra drift de topologia.
 */
import { readFileSync } from "node:fs";
import * as path from "node:path";

import { RulesCatalogJson, Rule } from "../domain/rules/Rule.js";
import { pathToZone, scopeToZone } from "../domain/rules/ruleZone.js";

const RULES_ROOT = path.resolve(__dirname, "..", "..", ".core", "rules");
const RULES_JSON = path.join(RULES_ROOT, "_meta", "rules.json");

function loadCatalog(): RulesCatalogJson {
  const raw = readFileSync(RULES_JSON, "utf-8");
  return JSON.parse(raw) as RulesCatalogJson;
}

function toPosixRelative(absOrRel: string): string {
  // `rules.json` salva paths com backslash em Windows; normaliza para posix.
  const normalized = absOrRel.replace(/\\/g, "/");
  // Remove prefixo ".core/rules/" para isolar o segmento topológico.
  const stripped = normalized.replace(/^\.core\/rules\//, "").replace(/^\/+/, "");
  return stripped;
}

describe("Rules topology — `.core/rules/` Top/Center/Base/Adapters", () => {
  const catalog = loadCatalog();
  const rules: Rule[] = [...catalog.rules];

  it("DADO rules.json ENTÃO todo rule.file reside em top|center|base|adapters", () => {
    const offenders: string[] = [];
    for (const rule of rules) {
      const rel = toPosixRelative(rule.file);
      const zone = pathToZone(rel);
      if (!zone) {
        offenders.push(`${rule.id}: ${rel}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("DADO cada rule ENTÃO scope→zone bate com pathToZone(file)", () => {
    const mismatches: string[] = [];
    for (const rule of rules) {
      const physical = pathToZone(toPosixRelative(rule.file));
      const logical = scopeToZone(rule);
      if (physical !== logical) {
        mismatches.push(`${rule.id}: file=${rule.file} (physical=${physical}, logical=${logical})`);
      }
    }
    expect(mismatches).toEqual([]);
  });
});
