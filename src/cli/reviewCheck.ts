/**
 * CLI entrypoint para o gate `review:check` — "revisão-como-artefato" (Spec 0024
 * Checkpoint 2.4/2.4a). Torna artefatos de governança load-bearing em vez de
 * comentários de PR (memória volátil). Determinístico, sem rede.
 *
 *   1. Descobre reviews/resolutions/gates sob `.governance/specs/<spec>/{reviews,gates}/`;
 *   2. valida schema + integridade (fingerprint da claim; findings_emitted+contiguidade);
 *   3. DERIVA o consolidado por checkpoint (nunca arquivo à mão);
 *   4. ENFORCA: gate `approved` ⟹ zero finding bloqueante (critical/high) com
 *      `disposition: open`. O gate lê `disposition` (reviewer-owned) — a resolução
 *      do implementador NÃO destrava (anti-autoaprovação estrutural);
 *   5. resolução órfã (aponta finding inexistente) → violação;
 *   6. imprime o consolidado (projeção mínima do PR).
 *
 * Exit codes: 0 ok · 1 violação/erro de schema · 2 uso inválido (no bin).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import {
  parseReview,
  parseReviewEvent,
  parseResolutions,
  parseGate,
  REVIEW_ROLES,
  ReviewArtifact,
  ReviewEventArtifact,
  ResolutionArtifact,
  GateArtifact,
  Finding,
  BLOCKING_SEVERITIES,
} from "../infrastructure/yaml/reviewArtifactsReader.js";
import {
  activeReviewPolicyProfile,
  parseReviewPolicy,
  ReviewPolicyProfile,
} from "../infrastructure/yaml/reviewPolicyReader.js";
import { parseWorkflowState } from "../infrastructure/yaml/workflowStateSerializer.js";

export interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

const defaultLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

const SPEC_ROOTS = [".governance/specs", ".specify/specs"] as const;

export interface SpecArtifacts {
  readonly reviews: readonly ReviewArtifact[];
  readonly reviewEvents: readonly ReviewEventArtifact[];
  readonly resolutions: readonly ResolutionArtifact[];
  readonly gates: readonly GateArtifact[];
  readonly allowedCheckpoints: readonly string[];
  readonly requiredReviewRolesByCheckpoint?: Readonly<Record<string, readonly string[]>>;
  readonly policy?: ReviewPolicyProfile;
}

function allowedReviewRoles(policy?: ReviewPolicyProfile): Set<string> {
  const roles = new Set<string>(REVIEW_ROLES);
  for (const role of policy?.implementationPr.requiredReviewRoles ?? []) roles.add(role);
  for (const role of policy?.integrationPr.requiredReviewRoles ?? []) roles.add(role);
  return roles;
}

function listYml(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".yml") && !e.name.startsWith("_"))
    .map((e) => path.join(dir, e.name))
    .sort();
}

function listYmlRecursive(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listYmlRecursive(full));
    if (entry.isFile() && entry.name.endsWith(".yml") && !entry.name.startsWith("_")) {
      out.push(full);
    }
  }
  return out.sort();
}

function normalizeCheckpoint(slug: string): string {
  return slug.replace(/^checkpoint-/, "");
}

function readPolicy(repoRoot: string, errors: string[]): ReviewPolicyProfile | undefined {
  const policyPath = path.join(repoRoot, ".governance/review-policy.yml");
  if (!fs.existsSync(policyPath)) return undefined;
  try {
    return activeReviewPolicyProfile(parseReviewPolicy(fs.readFileSync(policyPath, "utf-8")));
  } catch (e) {
    errors.push((e as Error).message);
    return undefined;
  }
}

function requiredRolesForNodeRole(
  nodeRole: string,
  policy: ReviewPolicyProfile | undefined
): readonly string[] {
  if (!policy) return [];
  return nodeRole === "integration"
    ? policy.integrationPr.requiredReviewRoles
    : policy.implementationPr.requiredReviewRoles;
}

function parseEventSequence(eventId: string): number | undefined {
  const match = /^EV([1-9]\d*)$/.exec(eventId);
  return match ? Number(match[1]) : undefined;
}

export interface ConsolidatedCheckpoint {
  readonly checkpoint: string;
  readonly reviewDecisions: ReadonlyArray<{ role: string; decision: string }>;
  readonly reviewEventCount: number;
  readonly openBlocking: readonly Finding[];
  readonly totalOpen: number;
  readonly totalClosed: number;
  readonly gate?: GateArtifact;
}

/** Pure: consolida por checkpoint e detecta violações. */
export function consolidate(artifacts: SpecArtifacts): {
  byCheckpoint: ConsolidatedCheckpoint[];
  violations: string[];
} {
  const checkpoints = new Set<string>();
  for (const r of artifacts.reviews) checkpoints.add(r.checkpoint);
  for (const e of artifacts.reviewEvents) checkpoints.add(e.checkpoint);
  for (const r of artifacts.resolutions) checkpoints.add(r.checkpoint);
  for (const g of artifacts.gates) checkpoints.add(g.checkpoint);
  const allowed = new Set<string>();
  for (const cp of artifacts.allowedCheckpoints) {
    allowed.add(cp);
    allowed.add(normalizeCheckpoint(cp));
  }
  const requiredByCheckpoint = artifacts.requiredReviewRolesByCheckpoint ?? {};
  const roles = allowedReviewRoles(artifacts.policy);

  const violations: string[] = [];
  const byCheckpoint: ConsolidatedCheckpoint[] = [];

  for (const cp of [...checkpoints].sort()) {
    if (allowed.size > 0 && !allowed.has(cp) && !allowed.has(normalizeCheckpoint(cp))) {
      violations.push(
        `checkpoint ${cp}: artefato de review/gate/event aponta para checkpoint fora de state.yml § topology.`
      );
    }
    const reviews = artifacts.reviews.filter((r) => r.checkpoint === cp);
    const reviewEvents = artifacts.reviewEvents.filter((e) => e.checkpoint === cp);
    const reviewRoles = new Set(reviews.map((r) => r.role));
    const requiredRoles =
      requiredByCheckpoint[cp] ?? requiredByCheckpoint[normalizeCheckpoint(cp)] ?? [];
    for (const role of requiredRoles) {
      if (!reviewRoles.has(role)) {
        violations.push(
          `checkpoint ${cp}: review-policy exige role "${role}", mas não há summary de review para essa lane.`
        );
      }
    }
    for (const r of reviews) {
      if (!roles.has(r.role)) {
        violations.push(
          `checkpoint ${cp}: review ${r.file} usa role "${r.role}" não declarada na review policy.`
        );
      }
    }
    for (const e of reviewEvents) {
      if (!roles.has(e.role)) {
        violations.push(
          `checkpoint ${cp}: review event ${e.file} usa role "${e.role}" não declarada na review policy.`
        );
      }
    }

    const eventsByRole = new Map<string, ReviewEventArtifact[]>();
    for (const e of reviewEvents) {
      eventsByRole.set(e.role, [...(eventsByRole.get(e.role) ?? []), e]);
    }
    for (const [role, events] of eventsByRole) {
      const seen = new Map<number, ReviewEventArtifact>();
      for (const e of events) {
        const sequence = parseEventSequence(e.eventId);
        if (!sequence) {
          violations.push(
            `checkpoint ${cp}: review event ${e.file} usa event_id "${e.eventId}" inválido; use EV1..EVN por (checkpoint, role).`
          );
          continue;
        }
        const previous = seen.get(sequence);
        if (previous) {
          violations.push(
            `checkpoint ${cp}: review event_id "${e.eventId}" duplicado para role "${role}" (${previous.file}, ${e.file}).`
          );
        }
        seen.set(sequence, e);
      }
      for (let i = 1; i <= events.length; i++) {
        if (!seen.has(i)) {
          violations.push(
            `checkpoint ${cp}: review events da role "${role}" devem ser contíguos (EV1..EV${events.length}); falta EV${i}.`
          );
          break;
        }
      }
    }

    const byRole = new Map<string, ReviewArtifact>();
    for (const r of reviews) {
      if (byRole.has(r.role)) {
        violations.push(
          `checkpoint ${cp}: múltiplos arquivos de review para role "${r.role}" (${byRole.get(r.role)!.file}, ${r.file}). 1 arquivo por (checkpoint, role).`
        );
      }
      byRole.set(r.role, r);
    }

    const findingIds = new Set<string>();
    const resolutionByFinding = new Map<string, string>();
    const approvedVerificationEvents = new Set<string>();
    const openBlocking: Finding[] = [];
    let totalOpen = 0;
    let totalClosed = 0;
    for (const r of reviews) {
      for (const f of r.findings) {
        findingIds.add(`${r.role}#${f.id}`);
        if (f.disposition === "open") {
          totalOpen++;
          if ((BLOCKING_SEVERITIES as readonly string[]).includes(f.severity)) openBlocking.push(f);
        } else {
          totalClosed++;
        }
      }
    }

    for (const e of reviewEvents) {
      for (const ref of e.verifies) {
        if (!findingIds.has(ref)) {
          violations.push(
            `checkpoint ${cp}: review event em ${e.file} verifica finding "${ref}" inexistente nas reviews.`
          );
        }
        if (e.decision === "approved") approvedVerificationEvents.add(ref);
      }
    }

    // Resolução órfã: o id DEVE ser totalmente qualificado (`<role>#<F-id>`) e
    // bater EXATAMENTE com um finding (sem `endsWith` — evita colisão cross-role:
    // `architectural_review#F1` ≠ `technical_audit#F1`). 2.4c.
    for (const res of artifacts.resolutions.filter((r) => r.checkpoint === cp)) {
      for (const r of res.resolutions) {
        if (!findingIds.has(r.finding)) {
          const hint = r.finding.includes("#")
            ? "inexistente nas reviews"
            : `não-qualificado — use "<role>#${r.finding}" (ex.: technical_audit#${r.finding})`;
          violations.push(
            `checkpoint ${cp}: resolução em ${res.file} aponta para finding "${r.finding}" ${hint}.`
          );
        } else {
          resolutionByFinding.set(r.finding, r.action);
        }
      }
    }

    const acceptedPolicy = artifacts.policy?.acceptedFindings;
    if (acceptedPolicy?.requireResolution || acceptedPolicy?.requireVerificationEventForFixed) {
      for (const r of reviews) {
        for (const f of r.findings) {
          if (f.disposition !== "accepted") continue;
          const ref = `${r.role}#${f.id}`;
          const action = resolutionByFinding.get(ref);
          if (acceptedPolicy.requireResolution && !action) {
            violations.push(
              `checkpoint ${cp}: ${ref} está accepted, mas a review policy exige resolução implementer-owned.`
            );
          }
          if (
            acceptedPolicy.requireVerificationEventForFixed &&
            action === "fixed" &&
            !approvedVerificationEvents.has(ref)
          ) {
            violations.push(
              `checkpoint ${cp}: ${ref} está accepted após action=fixed, mas a review policy exige review event approved verificando a correção.`
            );
          }
        }
      }
    }

    const gates = artifacts.gates.filter((g) => g.checkpoint === cp);
    if (gates.length > 1) {
      violations.push(
        `checkpoint ${cp}: múltiplos gates (${gates.map((g) => g.file).join(", ")}).`
      );
    }
    const gate = gates[0];

    // ENFORCEMENT: gate approved ⟹ nenhum bloqueante com disposition: open.
    if (gate && gate.decision === "approved" && openBlocking.length > 0) {
      violations.push(
        `checkpoint ${cp}: gate em ${gate.file} é "approved", mas há ${openBlocking.length} finding(s) bloqueante(s) (critical/high) com disposition: open: ${openBlocking
          .map((f) => f.id)
          .join(
            ", "
          )}. Só o reviewer fecha (accepted/dismissed) — resolução do implementador não destrava.`
      );
    }

    byCheckpoint.push({
      checkpoint: cp,
      reviewDecisions: reviews.map((r) => ({ role: r.role, decision: r.decision })),
      reviewEventCount: reviewEvents.length,
      openBlocking,
      totalOpen,
      totalClosed,
      ...(gate ? { gate } : {}),
    });
  }

  return { byCheckpoint, violations };
}

/** Carrega reviews/resolutions/gates/policy de todas as specs (reusado por pr-ready:check). */
export function discover(repoRoot: string): { artifacts: SpecArtifacts; errors: string[] } {
  const reviews: ReviewArtifact[] = [];
  const reviewEvents: ReviewEventArtifact[] = [];
  const resolutions: ResolutionArtifact[] = [];
  const gates: GateArtifact[] = [];
  const allowedCheckpoints: string[] = [];
  const requiredReviewRolesByCheckpoint: Record<string, readonly string[]> = {};
  const errors: string[] = [];
  const policy = readPolicy(repoRoot, errors);
  for (const rootRel of SPEC_ROOTS) {
    const root = path.join(repoRoot, rootRel);
    if (!fs.existsSync(root)) continue;
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const specDir = path.join(root, entry.name);
      try {
        const statePath = path.join(specDir, "state.yml");
        if (fs.existsSync(statePath)) {
          const state = parseWorkflowState(fs.readFileSync(statePath, "utf-8"));
          const topology = state.topology;
          if (topology) {
            for (const node of [
              ...topology.prs.concluded,
              ...topology.prs.active,
              ...topology.prs.planned,
            ]) {
              const requiredRoles = requiredRolesForNodeRole(node.role, policy);
              for (const cp of node.checkpoints) {
                allowedCheckpoints.push(cp);
                if (requiredRoles.length > 0) {
                  requiredReviewRolesByCheckpoint[cp] = requiredRoles;
                  requiredReviewRolesByCheckpoint[normalizeCheckpoint(cp)] = requiredRoles;
                }
              }
            }
          }
        }
      } catch (e) {
        errors.push((e as Error).message);
      }
      for (const file of listYml(path.join(specDir, "reviews"))) {
        const rel = path.relative(repoRoot, file);
        try {
          if (path.basename(file).endsWith("-resolutions.yml")) {
            resolutions.push(parseResolutions(fs.readFileSync(file, "utf-8"), rel));
          } else {
            reviews.push(parseReview(fs.readFileSync(file, "utf-8"), rel));
          }
        } catch (e) {
          errors.push((e as Error).message);
        }
      }
      for (const file of listYmlRecursive(path.join(specDir, "reviews", "events"))) {
        const rel = path.relative(repoRoot, file);
        try {
          reviewEvents.push(parseReviewEvent(fs.readFileSync(file, "utf-8"), rel));
        } catch (e) {
          errors.push((e as Error).message);
        }
      }
      for (const file of listYml(path.join(specDir, "gates"))) {
        try {
          gates.push(parseGate(fs.readFileSync(file, "utf-8"), path.relative(repoRoot, file)));
        } catch (e) {
          errors.push((e as Error).message);
        }
      }
    }
  }
  return {
    artifacts: {
      reviews,
      reviewEvents,
      resolutions,
      gates,
      allowedCheckpoints,
      requiredReviewRolesByCheckpoint,
      ...(policy ? { policy } : {}),
    },
    errors,
  };
}

export function main(repoRoot: string, logger: Logger = defaultLogger): number {
  const { artifacts, errors } = discover(repoRoot);

  if (errors.length > 0) {
    logger.error(`❌ review:check — ${errors.length} erro(s) de schema/integridade:`);
    for (const e of errors) logger.error(`  - ${e}`);
    return 1;
  }

  if (
    artifacts.reviews.length === 0 &&
    artifacts.reviewEvents.length === 0 &&
    artifacts.resolutions.length === 0 &&
    artifacts.gates.length === 0
  ) {
    logger.info(`ℹ review:check — nenhum artefato de revisão. Estado válido.`);
    return 0;
  }

  const { byCheckpoint, violations } = consolidate(artifacts);

  for (const c of byCheckpoint) {
    const decs =
      c.reviewDecisions.map((d) => `${d.role}=${d.decision}`).join(" · ") || "(sem reviews)";
    const gate = c.gate ? c.gate.decision : "pending";
    logger.info(
      `• checkpoint ${c.checkpoint}: reviews [${decs}] · events ${c.reviewEventCount} · findings ${c.totalOpen} open / ${c.totalClosed} closed · gate ${gate}`
    );
  }

  if (violations.length > 0) {
    logger.error(`\n❌ review:check FALHOU — ${violations.length} violação(ões):`);
    for (const v of violations) logger.error(`  - ${v}`);
    return 1;
  }

  logger.info(
    `✅ review:check — ${artifacts.reviews.length} review(s) + ${artifacts.reviewEvents.length} evento(s) + ${artifacts.resolutions.length} resolução(ões) + ${artifacts.gates.length} gate(s); integridade ok; nenhum gate aprovado com bloqueante aberto.`
  );
  return 0;
}
