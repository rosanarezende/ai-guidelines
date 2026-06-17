/**
 * Fixtures de teste para as decisões humanas (`guidelines decide`).
 * Constroem `DecisionSnapshot` sintéticos (sem I/O) — espelha o padrão de
 * `workBrief.test.ts` (HandoffFacts builder).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { HandoffFacts } from "../cli/handoffFacts.js";
import {
  DecisionFinding,
  DecisionReviewLane,
  DecisionSnapshot,
  DecisionSubCheckpoint,
} from "../cli/decide/snapshot.js";
import {
  HumanDecisionPolicy,
  parseHumanDecisionPolicy,
} from "../infrastructure/yaml/humanDecisionPolicyReader.js";

export function loadRealDecisionPolicy(repoRoot = process.cwd()): HumanDecisionPolicy {
  return parseHumanDecisionPolicy(
    fs.readFileSync(path.join(repoRoot, ".core/governance/human-decision-policy.yml"), "utf-8")
  );
}

export function makeHandoffFacts(over: Partial<HandoffFacts> = {}): HandoffFacts {
  return {
    spec: {
      label: "0024-context-architecture",
      path: ".governance/specs/0024-context-architecture",
    },
    contract: null,
    stage: "execution",
    gateStatus: "pending",
    cursor: { pr: "co-enforcement", checkpoint: "checkpoint-co-enforcement" },
    activeNode: { id: "co-enforcement", githubPr: 42, sequence: 9, terminal: false },
    nextPlannedNode: {
      id: "co-flow-convergence",
      githubPr: null,
      sequence: 10,
      terminal: false,
    },
    narrativeNextHead: null,
    git: {
      branch: "feat/spec-0024-co-enforcement",
      head: "a069f9c",
      workingTreeClean: true,
      ahead: 0,
      behind: 0,
      upstream: "origin/feat/spec-0024-co-enforcement",
    },
    pullRequest: {
      number: 42,
      state: "OPEN",
      isDraft: true,
      baseRefName: "feat/spec-0024-co-projection",
      headRefName: "feat/spec-0024-co-enforcement",
      headRefOid: "a069f9c",
      checks: { pass: 11, fail: 0, pending: 0 },
      bodyReadyReasons: [],
      labels: [],
    },
    lifecycle: {
      reviewDecisions: [{ role: "technical_audit", decision: "changes_requested" }],
      requiredReviewRoles: [],
      reviewStatuses: [
        {
          typeId: "technical_audit",
          applicability: "yes",
          requirement: "optional",
          state: "current",
          decision: "changes_requested",
          blocking: false,
          source: "repo-default",
        },
      ],
      openFindings: 3,
      openBlocking: 1,
      closedFindings: 0,
      resolutions: 3,
      gateDecision: null,
    },
    tasks: [],
    subCheckpoints: [],
    insights: [],
    driftWarnings: [],
    sources: [{ id: "pull-request", origin: "gh", status: "fresh", fingerprint: "x" }],
    ...over,
  };
}

export function makeFinding(over: Partial<DecisionFinding> = {}): DecisionFinding {
  return {
    qualified: "technical_audit#F1",
    role: "technical_audit",
    localId: "F1",
    severity: "high",
    disposition: "open",
    location: "src/cli/constraintsCheck.ts#L48-L81",
    description: "Overlay de consumidor nao esta wired end-to-end.",
    fingerprint: "284894d6b794",
    humanSummary:
      "Repositórios que usam o framework não conseguiam definir apenas suas próprias constraints.",
    blocking: true,
    resolution: {
      action: "fixed",
      ref: "5ad592a",
      evidence: "Overlay por duas raízes.",
      tests: ["[F1.1]"],
      humanSummary: "O framework e o consumidor agora usam raízes distintas.",
    },
    refValid: true,
    verified: true,
    ...over,
  };
}

export function makeLane(over: Partial<DecisionReviewLane> = {}): DecisionReviewLane {
  return {
    role: "technical_audit",
    reviewFile:
      ".governance/specs/0024-context-architecture/reviews/c-co-enforcement-technical_audit.yml",
    decision: "changes_requested",
    reviewFingerprint: "2c0140608c8a",
    executor: "codex-cli · gpt-5",
    current: true,
    approvedVerifications: [
      {
        eventId: "EV2",
        executor: "antigravity · gemini-3.1-pro-high",
        decision: "approved",
        subjectRef: "e2c98d6..1e95474",
        verifies: ["technical_audit#F1", "technical_audit#F2", "technical_audit#F3"],
        file: ".governance/specs/0024-context-architecture/reviews/events/c-co-enforcement-technical_audit-EV2.yml",
      },
    ],
    ...over,
  };
}

export function makeSubCheckpoints(): DecisionSubCheckpoint[] {
  return [
    { id: "CO-3.1", title: "Constraint + EnforcementBinding", state: "in-progress", line: 101 },
    { id: "CO-3.2", title: "knowledge:compile", state: "pending", line: 102 },
    { id: "CO-3.3", title: "migração legacy", state: "pending", line: 103 },
    { id: "CO-3.4", title: "dogfood do enforcement", state: "pending", line: 104 },
  ];
}

/**
 * Snapshot default = estado REAL desta sessão: close-dispositions DISPONÍVEL
 * (F1–F3 verificados, lane current), human-gate BLOQUEADO (Draft + CO-3.2–3.4).
 */
export function makeDecisionSnapshot(over: Partial<DecisionSnapshot> = {}): DecisionSnapshot {
  const facts = over.facts ?? makeHandoffFacts();
  const findings = over.openFindings ?? [
    makeFinding({ localId: "F1", qualified: "technical_audit#F1", fingerprint: "284894d6b794" }),
    makeFinding({
      localId: "F2",
      qualified: "technical_audit#F2",
      severity: "medium",
      blocking: false,
      fingerprint: "bad9a10cd59b",
      description: "source_ref pode escapar do repoRoot.",
    }),
    makeFinding({
      localId: "F3",
      qualified: "technical_audit#F3",
      severity: "medium",
      blocking: false,
      fingerprint: "fcc4f1136709",
      description: "Validacao de ancora nao prova heading canonico.",
    }),
  ];
  return {
    repoRoot: "/tmp/fake-repo",
    facts,
    handoffSnapshot: undefined as never,
    seal: "seal-aaaa",
    gitHead: facts.git.head,
    effectiveFunctionalHead: "1e95474",
    workingTreeState: "clean",
    functionalDirtyFiles: [],
    checkpoint: "checkpoint-co-enforcement",
    specId: "0024",
    specPath: ".governance/specs/0024-context-architecture",
    policy: loadRealDecisionPolicy(),
    policyError: null,
    consolidation: { errors: [], violations: [] },
    openFindings: findings,
    closedFindingsCount: 0,
    lanes: over.lanes ?? [makeLane()],
    gateExists: false,
    gateFile: null,
    subCheckpoints: over.subCheckpoints ?? makeSubCheckpoints(),
    subCheckpointDeliveryEvidence: {
      status: "present",
      activeId: "CO-3.1",
      activationCommit: "aaaaaaa",
      commitsAfterActivation: 1,
    },
    nextPlannedNode: facts.nextPlannedNode,
    prReady: null,
    gateDecidability: null,
    ...over,
  };
}
