import { parse } from "yaml";

/**
 * Leitor puro dos artefatos de governança "revisão-como-artefato" (Spec 0024
 * Checkpoint 2.4). Vive sob o boundary YAML (`src/infrastructure/yaml/`).
 *
 * Modelo MÍNIMO (dogfood-first): a revisão/audit e o gate humano deixam de ser
 * comentários de PR (memória volátil) e passam a ser ARTEFATOS VERSIONADOS.
 *   - review: `.governance/specs/<spec>/reviews/c<checkpoint>-<role>.yml`
 *   - gate:   `.governance/specs/<spec>/gates/c<checkpoint>.yml`
 * Os findings vivem EMBUTIDOS na review (sem arquivo dedicado). O estado
 * consolidado é DERIVADO (nunca um arquivo mantido à mão — isso seria drift).
 */

export type FindingSeverity = "critical" | "high" | "medium" | "low";
export type FindingStatus = "open" | "resolved" | "accepted" | "dismissed";
export type ReviewRole = "technical_audit" | "architectural_review";
export type ReviewDecision = "approved" | "changes_requested" | "blocked";
export type GateDecision = "approved" | "changes_requested";

export const FINDING_SEVERITIES: readonly FindingSeverity[] = ["critical", "high", "medium", "low"];
export const FINDING_STATUSES: readonly FindingStatus[] = [
  "open",
  "resolved",
  "accepted",
  "dismissed",
];
export const REVIEW_ROLES: readonly ReviewRole[] = ["technical_audit", "architectural_review"];
export const REVIEW_DECISIONS: readonly ReviewDecision[] = [
  "approved",
  "changes_requested",
  "blocked",
];
export const GATE_DECISIONS: readonly GateDecision[] = ["approved", "changes_requested"];

/** Severidades que bloqueiam um gate `approved`. */
export const BLOCKING_SEVERITIES: readonly FindingSeverity[] = ["critical", "high"];

export interface Finding {
  readonly id: string;
  readonly severity: FindingSeverity;
  readonly status: FindingStatus;
  readonly description: string;
}

export interface ReviewArtifact {
  readonly checkpoint: string;
  readonly role: ReviewRole;
  readonly actor: string;
  readonly decision: ReviewDecision;
  readonly findings: readonly Finding[];
  readonly file: string;
}

export interface GateArtifact {
  readonly checkpoint: string;
  readonly actor: string;
  readonly decision: GateDecision;
  readonly file: string;
}

export class ReviewArtifactParseError extends Error {
  constructor(message: string) {
    super(`Invalid review artifact: ${message}`);
    this.name = "ReviewArtifactParseError";
  }
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

export function parseReview(yamlText: string, file: string): ReviewArtifact {
  const raw: unknown = parse(yamlText);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ReviewArtifactParseError(`${file}: root must be a mapping`);
  }
  const o = raw as Record<string, unknown>;

  const checkpoint = str(o.checkpoint) ?? String(o.checkpoint ?? "");
  if (!checkpoint) throw new ReviewArtifactParseError(`${file}: "checkpoint" is required`);
  const actor = str(o.actor);
  if (!actor) throw new ReviewArtifactParseError(`${file}: "actor" is required`);
  if (!(REVIEW_ROLES as readonly string[]).includes(o.role as string)) {
    throw new ReviewArtifactParseError(`${file}: "role" must be one of ${REVIEW_ROLES.join("|")}`);
  }
  if (!(REVIEW_DECISIONS as readonly string[]).includes(o.decision as string)) {
    throw new ReviewArtifactParseError(
      `${file}: "decision" must be one of ${REVIEW_DECISIONS.join("|")}`
    );
  }

  const rawFindings = o.findings === undefined || o.findings === null ? [] : o.findings;
  if (!Array.isArray(rawFindings)) {
    throw new ReviewArtifactParseError(`${file}: "findings" must be a list`);
  }
  const seen = new Set<string>();
  const findings: Finding[] = [];
  for (const [i, rf] of rawFindings.entries()) {
    if (!rf || typeof rf !== "object" || Array.isArray(rf)) {
      throw new ReviewArtifactParseError(`${file}: findings[${i}] must be a mapping`);
    }
    const f = rf as Record<string, unknown>;
    const id = str(f.id);
    if (!id) throw new ReviewArtifactParseError(`${file}: findings[${i}].id is required`);
    if (seen.has(id)) throw new ReviewArtifactParseError(`${file}: duplicate finding id "${id}"`);
    seen.add(id);
    if (!(FINDING_SEVERITIES as readonly string[]).includes(f.severity as string)) {
      throw new ReviewArtifactParseError(
        `${file}: findings[${i}].severity must be one of ${FINDING_SEVERITIES.join("|")}`
      );
    }
    if (!(FINDING_STATUSES as readonly string[]).includes(f.status as string)) {
      throw new ReviewArtifactParseError(
        `${file}: findings[${i}].status must be one of ${FINDING_STATUSES.join("|")}`
      );
    }
    const description = str(f.description);
    if (!description) {
      throw new ReviewArtifactParseError(`${file}: findings[${i}].description is required`);
    }
    findings.push({
      id,
      severity: f.severity as FindingSeverity,
      status: f.status as FindingStatus,
      description,
    });
  }

  return {
    checkpoint,
    role: o.role as ReviewRole,
    actor,
    decision: o.decision as ReviewDecision,
    findings,
    file,
  };
}

export function parseGate(yamlText: string, file: string): GateArtifact {
  const raw: unknown = parse(yamlText);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ReviewArtifactParseError(`${file}: root must be a mapping`);
  }
  const o = raw as Record<string, unknown>;
  const checkpoint = str(o.checkpoint) ?? String(o.checkpoint ?? "");
  if (!checkpoint) throw new ReviewArtifactParseError(`${file}: "checkpoint" is required`);
  const actor = str(o.actor);
  if (!actor) throw new ReviewArtifactParseError(`${file}: "actor" is required`);
  if (!(GATE_DECISIONS as readonly string[]).includes(o.decision as string)) {
    throw new ReviewArtifactParseError(
      `${file}: "decision" must be one of ${GATE_DECISIONS.join("|")}`
    );
  }
  return { checkpoint, actor, decision: o.decision as GateDecision, file };
}
