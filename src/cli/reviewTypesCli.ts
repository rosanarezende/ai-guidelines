/**
 * UX de CONFIGURAÇÃO da governança de reviews (CO-4, rodada 8):
 *
 *   `review types`            → catálogo resolvido (origem, status, aliases,
 *                               requirement default, aplicabilidade);
 *   `review policy`           → requirements EFETIVOS no contexto atual
 *                               (aplicável? requirement? estado? bloqueia?);
 *   `review type add <slug>`  → cria tipo CUSTOMIZADO na policy canônica,
 *                               declarativamente (flags), sem tocar no core
 *                               TypeScript — o briefing o reconhece na hora.
 *
 * Zero LLM (ADR 0018); escrita APENAS na fonte canônica
 * (.governance/review-policy.yml), validada antes de salvar.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { parseDocument } from "yaml";
import { parseSpecBranch } from "../app/workflow/DetectActiveSpec.js";
import { parseReviewPolicy } from "../infrastructure/yaml/reviewPolicyReader.js";
import {
  buildReviewTypeRegistry,
  deriveEffectiveReviewStatuses,
  evaluateApplicability,
  resolveRequirement,
  resolveReviewType,
  isRequirementLevel,
} from "../app/reviews/reviewRequirements.js";
import { loadReviewGovernance } from "./reviewBrief.js";
import { discover, observedReviewStates } from "./reviewCheck.js";
import { collectFunctionalFreshness } from "./reviewFreshness.js";

export interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

const POLICY_REL = ".governance/review-policy.yml";

function gitBranch(repoRoot: string): string | null {
  try {
    return (
      execFileSync("git", ["branch", "--show-current"], {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim() || null
    );
  } catch {
    return null;
  }
}

/** Cursor da spec ativa (branch canônica → state.yml), local-only. */
function findCursorCheckpoint(repoRoot: string): { specDir: string; checkpoint: string } | null {
  const branch = gitBranch(repoRoot);
  const parsed = parseSpecBranch(branch);
  if (!parsed) return null;
  const specsRoot = path.join(repoRoot, ".governance/specs");
  if (!fs.existsSync(specsRoot)) return null;
  const specDir = fs
    .readdirSync(specsRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .find((d) => d.startsWith(`${parsed.specId}-`));
  if (!specDir) return null;
  const statePath = path.join(specsRoot, specDir, "state.yml");
  if (!fs.existsSync(statePath)) return null;
  const match = /^\s*checkpoint:\s*(\S+)\s*$/m.exec(fs.readFileSync(statePath, "utf8"));
  if (!match) return null;
  return { specDir: `.governance/specs/${specDir}`, checkpoint: match[1] };
}

// ── `review types` ───────────────────────────────────────────────────────────

export function runReviewTypes(repoRoot: string, logger: Logger): number {
  const governance = loadReviewGovernance(repoRoot);
  if (governance.errors.length > 0) {
    logger.error("❌ review types — policy/catálogo inválido:");
    for (const e of governance.errors) logger.error(`   - ${e}`);
    return 1;
  }
  for (const w of governance.warnings) logger.error(`⚠️  ${w}`);
  logger.info("# Catálogo de tipos de review");
  logger.info("");
  for (const type of governance.registry.types) {
    const defaultLevel = governance.policy?.requirements?.defaults?.[type.id] ?? "optional";
    const applicability = governance.policy?.applicability?.[type.id];
    logger.info(`${type.id}`);
    logger.info(`- título: ${type.title}`);
    logger.info(`- origem: ${type.source}`);
    logger.info(`- status: ${type.enabled ? "enabled" : "disabled"}`);
    logger.info(`- aliases: ${type.aliases.join(", ")}`);
    logger.info(`- requirement default: ${defaultLevel}`);
    if (applicability) {
      const profiles = applicability.any
        .map((s) => s.prProfile)
        .filter((p): p is string => p !== undefined);
      const extra = applicability.any.some((s) => s.labelsAny || s.changedPathsAny)
        ? " (+ labels/paths)"
        : "";
      logger.info(
        `- aplicável: ${profiles.length > 0 ? profiles.join(", ") : "(por labels/paths)"}${extra}`
      );
    } else {
      logger.info("- aplicável: qualquer PR");
    }
    const rules = (governance.policy?.requirements?.rules ?? []).filter(
      (r) => r.set[type.id] !== undefined
    );
    for (const rule of rules) {
      logger.info(
        `- regra: ${rule.id} (prio ${rule.priority}) → ${rule.set[type.id]}${rule.when.prProfile ? ` em ${rule.when.prProfile}` : ""}${rule.when.labelsAny ? ` com labels [${rule.when.labelsAny.join(", ")}]` : ""}`
      );
    }
    logger.info("");
  }
  logger.info(
    "_Capacidade disponível ≠ obrigação: requirements são governados em review_requirements; somente `required` bloqueia._"
  );
  return 0;
}

// ── `review policy` ──────────────────────────────────────────────────────────

export function runReviewPolicy(repoRoot: string, logger: Logger): number {
  const governance = loadReviewGovernance(repoRoot);
  if (governance.errors.length > 0) {
    logger.error("❌ review policy — policy/catálogo inválido:");
    for (const e of governance.errors) logger.error(`   - ${e}`);
    return 1;
  }
  const located = findCursorCheckpoint(repoRoot);
  if (!located) {
    logger.error(
      "❌ review policy — checkpoint ativo não derivável (branch fora do padrão de spec ou state.yml sem cursor)."
    );
    return 1;
  }
  const { artifacts } = discover(repoRoot);
  const nodeCtx =
    artifacts.topologyByCheckpoint?.[located.checkpoint] ??
    artifacts.topologyByCheckpoint?.[located.checkpoint.replace(/^checkpoint-/, "")];
  const freshness = collectFunctionalFreshness(repoRoot, `${located.specDir}/reviews`);
  // Local-only: labels do PR não observadas aqui ⇒ regras dependentes ficam
  // `unknown` (degradação declarada, nunca conclusão inventada).
  const ctx = {
    prProfile: nodeCtx?.nodeRole ?? null,
    labels: null,
    changedPaths: null,
  };
  const statuses = deriveEffectiveReviewStatuses({
    registry: governance.registry,
    policy: governance.policy,
    ctx,
    ...(nodeCtx?.overrides ? { nodeOverrides: nodeCtx.overrides } : {}),
    observed: observedReviewStates(artifacts, located.checkpoint),
    functionalHead: freshness.effectiveFunctionalHead,
  });

  logger.info(`# Review requirements — checkpoint ${located.checkpoint}`);
  logger.info(
    `_contexto: pr_profile=${ctx.prProfile ?? "?"} · labels não observadas (local-only) · functional HEAD ${freshness.effectiveFunctionalHead ?? "?"}_`
  );
  logger.info("");
  for (const type of governance.registry.types) {
    logger.info(`${type.id}`);
    if (!type.enabled) {
      logger.info("- disabled neste repositório (não participa do fluxo)");
      logger.info("");
      continue;
    }
    const s = statuses.find((st) => st.typeId === type.id);
    if (!s) continue;
    if (s.applicability === "no") {
      logger.info(`- applicable: no — ${s.applicabilityReasons.join("; ")}`);
    } else {
      logger.info(
        `- applicable: ${s.applicability === "unknown" ? `unknown (${s.applicabilityReasons.join("; ")})` : "yes"}`
      );
      logger.info(`- requirement: ${s.requirement} (fonte: ${s.requirementSource})`);
      logger.info(`- state: ${s.state}${s.decision ? ` (${s.decision})` : ""}`);
      logger.info(`- blocking: ${s.blocking ? "YES" : "no"}`);
      for (const note of s.notes) logger.info(`  - ${note}`);
    }
    for (const e of s?.errors ?? []) logger.error(`  ❌ ${e}`);
    logger.info("");
  }
  return statuses.some((s) => s.errors.length > 0) ? 1 : 0;
}

// ── `review type add <slug>` ─────────────────────────────────────────────────

export interface ReviewTypeAddArgs {
  readonly slug: string;
  readonly title?: string;
  readonly objective?: string;
  readonly vectors: readonly string[];
  readonly aliases: readonly string[];
  readonly profiles: readonly string[];
  readonly requirement?: string;
}

export function parseTypeAddArgs(argv: readonly string[]): ReviewTypeAddArgs | null {
  const positional: string[] = [];
  const vectors: string[] = [];
  const aliases: string[] = [];
  const profiles: string[] = [];
  let title: string | undefined;
  let objective: string | undefined;
  let requirement: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--title") title = argv[++i];
    else if (arg === "--objective") objective = argv[++i];
    else if (arg === "--vector") vectors.push(argv[++i]);
    else if (arg === "--alias") aliases.push(argv[++i]);
    else if (arg === "--applies-to") profiles.push(argv[++i]);
    else if (arg === "--requirement") requirement = argv[++i];
    else if (!arg.startsWith("--")) positional.push(arg);
  }
  if (positional.length === 0) return null;
  return {
    slug: positional[0],
    title,
    objective,
    vectors,
    aliases,
    profiles,
    requirement,
  };
}

const TYPE_ADD_USAGE =
  "uso: review type add <slug> --title <t> --objective <o> --vector <v> [--vector <v>...] " +
  "[--alias <a>...] [--applies-to <pr_profile>...] [--requirement disabled|optional|recommended|required]";

export function runReviewTypeAdd(
  repoRoot: string,
  args: ReviewTypeAddArgs,
  logger: Logger
): number {
  const slug = args.slug.replace(/-/g, "_");
  if (!/^[a-z][a-z0-9_]*$/.test(slug)) {
    logger.error(`❌ slug inválido: "${args.slug}" — use kebab/snake-case (ex.: security-review).`);
    return 2;
  }
  if (!args.title || !args.objective || args.vectors.length === 0) {
    logger.error(
      `❌ campos obrigatórios ausentes (título, objetivo e ≥1 vetor).\n${TYPE_ADD_USAGE}`
    );
    return 2;
  }
  if (args.requirement !== undefined && !isRequirementLevel(args.requirement)) {
    logger.error(`❌ requirement inválido: "${args.requirement}".\n${TYPE_ADD_USAGE}`);
    return 2;
  }
  const governance = loadReviewGovernance(repoRoot);
  if (
    resolveReviewType(governance.registry, slug) ||
    resolveReviewType(governance.registry, args.slug)
  ) {
    logger.error(`❌ tipo/alias "${args.slug}" já existe no catálogo. Nada foi escrito.`);
    return 1;
  }
  for (const alias of args.aliases) {
    if (resolveReviewType(governance.registry, alias)) {
      logger.error(`❌ alias "${alias}" já pertence a outro tipo. Nada foi escrito.`);
      return 1;
    }
  }

  const policyPath = path.join(repoRoot, POLICY_REL);
  if (!fs.existsSync(policyPath)) {
    logger.error(
      `❌ ${POLICY_REL} não existe — crie a policy primeiro (init/adopt) ou declare review_types manualmente.`
    );
    return 1;
  }

  // Edição PRESERVANDO comentários (Document API do yaml).
  const doc = parseDocument(fs.readFileSync(policyPath, "utf8"));
  const aliasList = [...new Set([slug.replace(/_/g, "-"), slug, ...args.aliases])];
  doc.setIn(["review_types", slug], {
    source: "repository",
    enabled: true,
    title: args.title,
    aliases: aliasList,
    objective: args.objective,
    vectors: [...args.vectors],
  });
  if (args.profiles.length > 0) {
    doc.setIn(["review_applicability", slug], { pr_profiles: [...args.profiles] });
  }
  if (args.requirement !== undefined && args.requirement !== "optional") {
    doc.setIn(["review_requirements", "defaults", slug], args.requirement);
  }

  // Valida ANTES de salvar: parse + registry sem erros.
  const candidate = doc.toString();
  try {
    const parsed = parseReviewPolicy(candidate);
    const build = buildReviewTypeRegistry(parsed);
    if (build.errors.length > 0) {
      logger.error("❌ resultado inválido — nada foi escrito:");
      for (const e of build.errors) logger.error(`   - ${e}`);
      return 1;
    }
    // Pré-visualização do efeito: aplicabilidade/requirement no vácuo do perfil.
    const applicability = evaluateApplicability(slug, parsed.applicability, {
      prProfile: args.profiles[0] ?? null,
      labels: null,
      changedPaths: null,
    });
    const requirement = resolveRequirement(slug, parsed, {
      prProfile: args.profiles[0] ?? null,
      labels: null,
      changedPaths: null,
    });
    fs.writeFileSync(policyPath, candidate);
    logger.info(`✅ tipo "${slug}" criado em ${POLICY_REL} § review_types.`);
    logger.info(`   - aliases: ${aliasList.join(", ")}`);
    logger.info(
      `   - aplicabilidade: ${args.profiles.length > 0 ? args.profiles.join(", ") : "qualquer PR"} (avaliação: ${applicability.value})`
    );
    logger.info(`   - requirement default: ${requirement.level} (${requirement.source})`);
    logger.info(`   - briefing imediato: npm run flow -- review ${slug.replace(/_/g, "-")}`);
    return 0;
  } catch (e) {
    logger.error(
      `❌ resultado inválido (${e instanceof Error ? e.message : String(e)}) — nada foi escrito.`
    );
    return 1;
  }
}
