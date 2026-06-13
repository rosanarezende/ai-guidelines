/**
 * CLI entrypoint do gate `constraints:check` (CO-3.1 / Spec 0024).
 *
 * Compila as fontes REAIS de constraints em memória e valida todas as
 * invariantes do modelo: schema (parser), paridade com a fonte humana,
 * resolução de superfícies (`npm-script`/`registry-command`), resolução de
 * mecanismos e determinismo do manifesto. **REQUIRED** (estado contínuo): falha
 * (exit 1) em qualquer inconsistência — schema/paridade de uma fonte canônica é
 * invariante de estado, por isso integra o `validate`.
 *
 * NÃO é o `knowledge:compile` (entrypoint público + manifesto runtime persistido
 * = CO-3.2). Aqui o manifesto é SOMENTE em memória. Zero network, zero LLM.
 *
 * Exit codes: 0 ok · 1 inconsistência · 2 fonte core ausente/uso inválido.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { parse } from "yaml";
import {
  compileConstraints,
  CompileResult,
  ConstraintSourceFacts,
} from "../app/constraints/compileConstraints.js";
import {
  NpmScriptContract,
  NpmScriptSurfaceResolver,
} from "../app/constraints/NpmScriptSurfaceResolver.js";
import { RegistryCommandSurfaceResolver } from "../app/constraints/RegistryCommandSurfaceResolver.js";
import { SurfaceResolverRegistry } from "../app/constraints/SurfaceResolver.js";
import { buildRegistry } from "./registry/buildRegistry.js";
import { describeRegistryCommands } from "./registry/describeCommands.js";
import {
  ConstraintSource,
  mergeConstraintSources,
  parseConstraints,
} from "../infrastructure/yaml/constraintsSourceReader.js";

interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

const defaultLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

export const CORE_CONSTRAINTS_PATH = ".core/constraints/constraints.yml";
export const OVERLAY_CONSTRAINTS_PATH = ".governance/constraints.yml";
const SCRIPT_CONTRACTS_PATH = ".core/governance/script-contracts.yml";
const RULES_JSON_PATH = ".core/rules/_meta/rules.json";
const GOVERNANCE_FOUNDATION_PATH = ".core/process/governance-foundation.md";

/**
 * Carrega as fontes de constraints: core (obrigatória) + overlay do consumidor
 * (opcional; ausência ≠ erro). Lê EXCLUSIVAMENTE estes dois paths — nunca
 * `.ai-guidelines/constraints.yml` (ponte legada deferida).
 */
export function loadConstraintSources(repoRoot: string): ConstraintSource[] {
  const sources: ConstraintSource[] = [];
  const coreAbs = path.join(repoRoot, CORE_CONSTRAINTS_PATH);
  if (!fs.existsSync(coreAbs)) {
    throw new Error(`fonte core ausente: ${CORE_CONSTRAINTS_PATH}.`);
  }
  const coreText = fs.readFileSync(coreAbs, "utf-8");
  sources.push({
    path: CORE_CONSTRAINTS_PATH,
    text: coreText,
    constraints: parseConstraints(coreText),
  });

  const overlayAbs = path.join(repoRoot, OVERLAY_CONSTRAINTS_PATH);
  if (fs.existsSync(overlayAbs)) {
    const overlayText = fs.readFileSync(overlayAbs, "utf-8");
    sources.push({
      path: OVERLAY_CONSTRAINTS_PATH,
      text: overlayText,
      constraints: parseConstraints(overlayText),
    });
  }
  return sources;
}

/** Resolver de superfícies do repo real: npm-scripts (script-contracts) + registry-commands. */
export function createSurfaceResolver(repoRoot: string): SurfaceResolverRegistry {
  const contract = parse(fs.readFileSync(path.join(repoRoot, SCRIPT_CONTRACTS_PATH), "utf-8")) as {
    profiles?: { maintainer?: { package_scripts?: NpmScriptContract[] } };
  };
  const scripts = contract.profiles?.maintainer?.package_scripts ?? [];
  const commands = describeRegistryCommands(buildRegistry());
  return new SurfaceResolverRegistry([
    new NpmScriptSurfaceResolver(scripts),
    new RegistryCommandSurfaceResolver(commands),
  ]);
}

/** Fatos de paridade do repo real (fs + rules.json + governance-foundation). */
export function createSourceFacts(repoRoot: string): ConstraintSourceFacts {
  const fileCache = new Map<string, string | null>();
  const readFile = (rel: string): string | null => {
    if (!fileCache.has(rel)) {
      const abs = path.join(repoRoot, rel);
      fileCache.set(rel, fs.existsSync(abs) ? fs.readFileSync(abs, "utf-8") : null);
    }
    return fileCache.get(rel) ?? null;
  };
  const ruleIds = new Set<string>();
  try {
    const json = JSON.parse(readFile(RULES_JSON_PATH) ?? "{}") as { rules?: { id: string }[] };
    for (const r of json.rules ?? []) ruleIds.add(r.id);
  } catch {
    /* rules.json malformado é coberto por build:rules/ruleset:check */
  }
  const guardrailIds = new Set<string>();
  const foundation = readFile(GOVERNANCE_FOUNDATION_PATH) ?? "";
  for (const m of foundation.matchAll(/\[(GG-\d{4,})\]/g)) guardrailIds.add(m[1]);

  return {
    fileExists: (p) => readFile(p) !== null,
    anchorExists: (p, anchor) => {
      const text = readFile(p);
      if (text === null) return false;
      return text.includes(`[${anchor}]`);
    },
    isKnownRuleId: (id) => ruleIds.has(id),
    isKnownGuardrailId: (id) => guardrailIds.has(id),
  };
}

/** Composição pura: fontes já carregadas → resultado da compilação. */
export function runConstraintsCheck(repoRoot: string): CompileResult {
  const sources = loadConstraintSources(repoRoot);
  const constraints = mergeConstraintSources(sources);
  return compileConstraints({
    constraints,
    sources: sources.map((s) => ({ path: s.path, text: s.text })),
    surfaceResolver: createSurfaceResolver(repoRoot),
    facts: createSourceFacts(repoRoot),
  });
}

/** Composition root: lê as fontes reais, compila e reporta. */
export function main(repoRoot: string, logger: Logger = defaultLogger): number {
  let result: CompileResult;
  try {
    result = runConstraintsCheck(repoRoot);
  } catch (e: unknown) {
    logger.error(`❌ constraints:check — ${e instanceof Error ? e.message : String(e)}`);
    return e instanceof Error && /fonte core ausente/.test(e.message) ? 2 : 1;
  }

  const { manifest, violations } = result;
  if (violations.length > 0) {
    logger.error(
      `❌ constraints:check — ${violations.length} inconsistência(s) em ` +
        `${manifest.constraints.length} constraint(s):`
    );
    for (const v of violations) {
      const where = v.surface ? `${v.constraintId} → ${v.surface}` : v.constraintId;
      logger.error(`  [${v.code}] ${where}: ${v.message}`);
    }
    return 1;
  }

  const surfaces = new Set(manifest.bindings.map((b) => b.surface)).size;
  logger.info(
    `✅ constraints:check — ${manifest.constraints.length} constraints · ` +
      `${manifest.bindings.length} bindings · ${surfaces} superfícies resolvidas · paridade íntegra`
  );
  return 0;
}
