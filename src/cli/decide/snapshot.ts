/**
 * Coleta FACTUAL ÚNICA das decisões humanas (`guidelines decide`).
 *
 * Anti-TOCTOU (Etapa 11): UMA coleta por execução alimenta briefing,
 * elegibilidade, prévia e plano. A camada de I/O vive aqui; `detect`/
 * `buildBrief`/`plan` das definições são puros sobre o snapshot.
 *
 * Reusa as MESMAS fontes governadas do handoff/work/review (sem 2ª fonte):
 * `loadHandoffSnapshot` (facts/selo/PR/CI/lifecycle), `discover`/`consolidate`
 * (reviews/resolutions/eventos/gates), `collectFunctionalFreshness` (HEAD
 * funcional auditável). Os checks externos (pr-ready/gate-decidability) são
 * coletados SÓ quando plausivelmente relevantes (PR Ready) — caro e inútil em
 * Draft; injetáveis para teste.
 */
import * as path from "node:path";
import * as fs from "node:fs";
import { execFileSync } from "node:child_process";
import {
  HandoffFacts,
  HandoffNodeFact,
  HandoffSubCheckpoint,
  parseSubCheckpoints,
} from "../handoffFacts.js";
import {
  HandoffLoadSnapshot,
  HandoffOptions,
  ghRemotePrCollector,
  loadHandoffSnapshot,
} from "../handoff.js";
import { consolidate, discover } from "../reviewCheck.js";
import { WorkingTreeState, collectFunctionalFreshness } from "../reviewFreshness.js";
import { parse as parseYaml } from "yaml";
import { Finding, ReviewArtifact } from "../../infrastructure/yaml/reviewArtifactsReader.js";
import {
  HumanDecisionPolicy,
  parseHumanDecisionPolicy,
} from "../../infrastructure/yaml/humanDecisionPolicyReader.js";

export const HUMAN_DECISION_POLICY_PATH = ".core/governance/human-decision-policy.yml";

export interface DecisionResolution {
  readonly action: string;
  readonly ref: string | null;
  readonly evidence: string | null;
  readonly tests: readonly string[];
  /** Tradução humana opcional ("o que foi feito") — fonte primária do briefing. */
  readonly humanSummary: string | null;
}

/** Finding consolidado com proveniência da resolução e estado de verificação. */
export interface DecisionFinding {
  readonly qualified: string;
  readonly role: string;
  readonly localId: string;
  readonly severity: string;
  readonly disposition: string;
  readonly location: string;
  readonly description: string;
  readonly fingerprint: string;
  /** Tradução humana opcional ("o que estava errado") — fonte primária do briefing. */
  readonly humanSummary: string | null;
  readonly blocking: boolean;
  readonly resolution: DecisionResolution | null;
  /** Ref da resolução existe no histórico E é ancestral do HEAD funcional. */
  readonly refValid: boolean | null;
  /**
   * Correção REVALIDADA e ainda válida: o ÚLTIMO evento (scope findings) que
   * verifica o finding é approved E cobre um estado contido no histórico atual
   * (cabeça do subject_ref ancestral-ou-igual do HEAD funcional). Trabalho
   * NÃO-relacionado posterior não reabre; um evento posterior não-approved sim.
   */
  readonly verified: boolean;
}

export interface DecisionVerification {
  readonly eventId: string;
  readonly executor: string;
  readonly decision: string;
  readonly subjectRef: string | null;
  readonly verifies: readonly string[];
  readonly file: string;
}

/** Lane de review com findings abertos no checkpoint. */
export interface DecisionReviewLane {
  readonly role: string;
  readonly reviewFile: string | null;
  readonly decision: string | null;
  readonly reviewFingerprint: string | null;
  readonly executor: string | null;
  /** true ⟺ todos os findings abertos da lane revalidados por verificação no HEAD. */
  readonly current: boolean;
  readonly approvedVerifications: readonly DecisionVerification[];
}

/** Sub-checkpoint do checkpoint do cursor (fonte única: HandoffFacts/tasks.md). */
export type DecisionSubCheckpoint = HandoffSubCheckpoint;

export interface ExternalCheckResult {
  readonly ok: boolean;
  readonly summary: string;
}

export type ExternalChecksCollector = (repoRoot: string) => {
  prReady: ExternalCheckResult | null;
  gateDecidability: ExternalCheckResult | null;
};

export interface DecisionSnapshot {
  readonly repoRoot: string;
  readonly facts: HandoffFacts;
  readonly handoffSnapshot: HandoffLoadSnapshot;
  readonly seal: string;
  readonly gitHead: string | null;
  readonly effectiveFunctionalHead: string | null;
  readonly workingTreeState: WorkingTreeState;
  readonly functionalDirtyFiles: readonly string[];
  readonly checkpoint: string | null;
  readonly specId: string;
  readonly specPath: string;
  readonly policy: HumanDecisionPolicy | null;
  readonly policyError: string | null;
  readonly consolidation: {
    readonly errors: readonly string[];
    readonly violations: readonly string[];
  };
  readonly openFindings: readonly DecisionFinding[];
  readonly closedFindingsCount: number;
  readonly lanes: readonly DecisionReviewLane[];
  readonly gateExists: boolean;
  readonly gateFile: string | null;
  readonly subCheckpoints: readonly DecisionSubCheckpoint[];
  readonly nextPlannedNode: HandoffNodeFact | null;
  /** Coletados só quando PR Ready; null em Draft / não coletado. */
  readonly prReady: ExternalCheckResult | null;
  readonly gateDecidability: ExternalCheckResult | null;
}

export interface DecisionSnapshotOptions extends HandoffOptions {
  /** Override do coletor de checks externos (teste). */
  readonly externalChecks?: ExternalChecksCollector;
}

function normalizeCheckpoint(slug: string): string {
  return slug.replace(/^checkpoint-/, "");
}

function sameSha(a: string, b: string): boolean {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x.startsWith(y) || y.startsWith(x);
}

/** Cabeça de um subject_ref (`base..head` → head; SHA único → ele mesmo). */
function refHead(subjectRef: string): string {
  const parts = subjectRef.split("..");
  return parts[parts.length - 1].replace(/^\.+/, "");
}

/** Ref existe no histórico E é ancestral do HEAD funcional? */
function refIsValid(repoRoot: string, ref: string, head: string | null): boolean {
  try {
    execFileSync("git", ["cat-file", "-e", `${ref}^{commit}`], { cwd: repoRoot, stdio: "ignore" });
  } catch {
    return false;
  }
  if (!head) return true;
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ref, head], {
      cwd: repoRoot,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function loadPolicy(repoRoot: string): {
  policy: HumanDecisionPolicy | null;
  error: string | null;
} {
  const policyPath = path.join(repoRoot, HUMAN_DECISION_POLICY_PATH);
  if (!fs.existsSync(policyPath)) {
    return { policy: null, error: `fonte governada ausente: ${HUMAN_DECISION_POLICY_PATH}` };
  }
  try {
    return { policy: parseHumanDecisionPolicy(fs.readFileSync(policyPath, "utf-8")), error: null };
  } catch (e) {
    return { policy: null, error: e instanceof Error ? e.message : String(e) };
  }
}

// Sub-checkpoints: fonte única em handoffFacts (`facts.subCheckpoints`); o parser
// canônico (`parseSubCheckpoints`) é re-exportado para compat de testes.
export { parseSubCheckpoints };

/** Runner real dos checks externos (node scripts) — usado só quando PR Ready. */
function defaultExternalChecks(repoRoot: string): {
  prReady: ExternalCheckResult | null;
  gateDecidability: ExternalCheckResult | null;
} {
  const run = (...args: readonly string[]): ExternalCheckResult => {
    try {
      execFileSync("node", [...args], { cwd: repoRoot, stdio: ["ignore", "ignore", "ignore"] });
      return { ok: true, summary: "verde" };
    } catch (e) {
      return { ok: false, summary: e instanceof Error ? e.message.split("\n")[0] : String(e) };
    }
  };
  return {
    prReady: run("dist/cli/bin.js", "pr-ready-check"),
    gateDecidability: run("dist/cli/bin.js", "gate-decidability-check"),
  };
}

export function collectDecisionSnapshot(
  repoRoot: string,
  options: DecisionSnapshotOptions = {}
): DecisionSnapshot {
  const handoffSnapshot = loadHandoffSnapshot(repoRoot, options);
  const facts = handoffSnapshot.collected.facts;
  const seal = handoffSnapshot.derived.seal;
  const cursor = facts.cursor;
  const checkpoint = cursor?.checkpoint ?? null;
  const specId = /^(\d{4})/.exec(facts.spec.label)?.[1] ?? facts.spec.label;
  const matches = (cp: string): boolean =>
    cursor !== null && normalizeCheckpoint(cp) === normalizeCheckpoint(cursor.checkpoint);

  const { artifacts, errors } = discover(repoRoot);
  const violations = errors.length === 0 ? consolidate(artifacts).violations : [];

  const reviews = artifacts.reviews.filter((r) => matches(r.checkpoint));
  const resolutionArtifacts = artifacts.resolutions.filter((r) => matches(r.checkpoint));
  const events = artifacts.reviewEvents.filter((e) => matches(e.checkpoint));
  const gate = artifacts.gates.find((g) => matches(g.checkpoint)) ?? null;

  const freshness = collectFunctionalFreshness(repoRoot, `${facts.spec.path}/reviews`);
  const head = freshness.effectiveFunctionalHead ?? facts.git.head;

  // role#id → resolução consolidada (action + ref + evidence + tests). evidence/
  // tests não fazem parte do schema de Resolution (parser enxuto): lê o YAML cru
  // do arquivo para a narrativa humana ("o que foi feito"). Degrada sem erro.
  const resByFinding = new Map<string, DecisionResolution>();
  for (const artifact of resolutionArtifacts) {
    const extras = new Map<
      string,
      { evidence: string | null; tests: string[]; humanSummary: string | null }
    >();
    try {
      const rawDoc = parseYaml(fs.readFileSync(path.join(repoRoot, artifact.file), "utf-8")) as {
        resolutions?: Array<Record<string, unknown>>;
      } | null;
      for (const r of rawDoc?.resolutions ?? []) {
        const fin = typeof r.finding === "string" ? r.finding : null;
        if (!fin) continue;
        const hc = r.human_context as { resolution_summary?: unknown } | undefined;
        extras.set(fin, {
          evidence: typeof r.evidence === "string" ? r.evidence.replace(/\s+/g, " ").trim() : null,
          tests: Array.isArray(r.tests) ? r.tests.map(String) : [],
          humanSummary:
            typeof hc?.resolution_summary === "string" ? hc.resolution_summary.trim() : null,
        });
      }
    } catch {
      // sem narrativa: a seção "o que foi feito" usa fallback.
    }
    for (const res of artifact.resolutions) {
      const extra = extras.get(res.finding) ?? { evidence: null, tests: [], humanSummary: null };
      resByFinding.set(res.finding, {
        action: res.action,
        ref: res.ref ?? null,
        evidence: extra.evidence,
        tests: extra.tests,
        humanSummary: extra.humanSummary,
      });
    }
  }

  // Verificação por finding (ledger append-only): o ÚLTIMO evento (scope findings)
  // que o verifica deve ser approved E cobrir um estado contido no histórico atual
  // (cabeça do subject_ref ancestral-ou-igual do HEAD funcional). Trabalho NÃO
  // relacionado posterior não reabre; um evento posterior não-approved reabre.
  const sortedEvents = [...events].sort((a, b) =>
    a.eventId.localeCompare(b.eventId, undefined, { numeric: true })
  );
  const latestVerifier = new Map<string, (typeof sortedEvents)[number]>();
  for (const e of sortedEvents) {
    if (e.scope !== "findings") continue;
    for (const v of e.verifies) latestVerifier.set(v, e);
  }
  const verified = new Set<string>();
  for (const [q, e] of latestVerifier) {
    if (
      e.decision === "approved" &&
      e.subjectRef &&
      refIsValid(repoRoot, refHead(e.subjectRef), head)
    ) {
      verified.add(q);
    }
  }

  const openFindings: DecisionFinding[] = [];
  let closedFindingsCount = 0;
  const findingByLane = new Map<string, Finding[]>();
  const reviewByRole = new Map<string, ReviewArtifact>();
  for (const review of reviews) {
    reviewByRole.set(review.role, review);
    for (const f of review.findings) {
      if (f.disposition !== "open") {
        closedFindingsCount++;
        continue;
      }
      const qualified = `${review.role}#${f.id}`;
      const resolution = resByFinding.get(qualified) ?? null;
      const refValid = resolution?.ref ? refIsValid(repoRoot, resolution.ref, head) : null;
      const finding: DecisionFinding = {
        qualified,
        role: review.role,
        localId: f.id,
        severity: f.severity,
        disposition: f.disposition,
        location: f.location,
        description: f.description,
        fingerprint: f.fingerprint,
        humanSummary: f.humanContext?.summary ?? null,
        blocking: f.severity === "critical" || f.severity === "high",
        resolution,
        refValid,
        verified: verified.has(qualified),
      };
      openFindings.push(finding);
      const arr = findingByLane.get(review.role) ?? [];
      arr.push(f);
      findingByLane.set(review.role, arr);
    }
  }

  // Lanes com findings abertos: CURRENT ⟺ todas as aberturas revalidadas e ainda
  // válidas, sem condições de bloqueio do NÓ (drift / gate já aprovado). A tree
  // funcional suja NÃO entra aqui: o briefing é read-only; a sujeira é guarda de
  // PUBLICAÇÃO (o efeito governado exige diff exclusivo do artefato).
  const nodeBlocked =
    facts.driftWarnings.length > 0 || facts.lifecycle?.gateDecision === "approved";
  const lanes: DecisionReviewLane[] = [];
  for (const [role, laneFindings] of findingByLane) {
    const review = reviewByRole.get(role) ?? null;
    const laneEvents = events.filter((e) => e.role === role);
    const approvedVerifications: DecisionVerification[] = laneEvents
      .filter((e) => e.decision === "approved")
      .map((e) => ({
        eventId: e.eventId,
        executor: `${e.executor.platform} · ${e.executor.model}`,
        decision: e.decision,
        subjectRef: e.subjectRef ?? null,
        verifies: e.verifies,
        file: e.file,
      }));
    const allVerified = laneFindings.every((f) => verified.has(`${role}#${f.id}`));
    lanes.push({
      role,
      reviewFile: review?.file ?? null,
      decision: review?.decision ?? null,
      reviewFingerprint: review?.reviewFingerprint ?? null,
      executor: review?.executor
        ? `${review.executor.platform} · ${review.executor.model}`
        : (review?.actor ?? null),
      current: !nodeBlocked && allVerified,
      approvedVerifications,
    });
  }

  // Sub-checkpoints: fonte única já coletada nos HandoffFacts (tasks.md).
  const subCheckpoints = facts.subCheckpoints;

  const { policy, error: policyError } = loadPolicy(repoRoot);

  // Checks externos: só quando o gate é plausível (PR Ready); caro/inútil em Draft.
  const prReadyPlausible = facts.pullRequest !== null && !facts.pullRequest.isDraft;
  const external = prReadyPlausible
    ? (options.externalChecks ?? defaultExternalChecks)(repoRoot)
    : { prReady: null, gateDecidability: null };

  return {
    repoRoot,
    facts,
    handoffSnapshot,
    seal,
    gitHead: facts.git.head,
    effectiveFunctionalHead: freshness.effectiveFunctionalHead,
    workingTreeState: freshness.workingTreeState,
    functionalDirtyFiles: freshness.functionalDirtyFiles,
    checkpoint,
    specId,
    specPath: facts.spec.path,
    policy,
    policyError,
    consolidation: { errors: errors.map(String), violations: violations.map(String) },
    openFindings,
    closedFindingsCount,
    lanes,
    gateExists: gate !== null,
    gateFile: gate?.file ?? null,
    subCheckpoints,
    nextPlannedNode: facts.nextPlannedNode,
    prReady: external.prReady,
    gateDecidability: external.gateDecidability,
  };
}

export { sameSha, refHead, normalizeCheckpoint, ghRemotePrCollector };
