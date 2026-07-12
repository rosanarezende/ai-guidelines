import {
  ReviewArtifact,
  ReviewEventArtifact,
} from "../infrastructure/yaml/reviewArtifactsReader.js";
import {
  buildReviewTypeRegistry,
  deriveEffectiveReviewStatuses,
} from "../app/reviews/reviewRequirements.js";
import { consolidate, observedReviewStates, SpecArtifacts } from "./reviewCheck.js";

function finding(id: string) {
  return {
    id,
    severity: "medium" as const,
    location: "global",
    description: `Achado ${id}`,
    disposition: "open" as const,
    fingerprint: `fp-${id}`,
  };
}

const EVIDENCE = {
  coverage: ["src/cli/reviewCheck.ts"],
  scope: "Auditoria final.",
  basis: "Sem findings remanescentes.",
};

function review(over: Partial<ReviewArtifact> = {}): ReviewArtifact {
  return {
    checkpoint: "checkpoint-co-enforcement",
    role: "technical_audit",
    executor: { platform: "antigravity", model: "gemini-3.5-flash-high" },
    decision: "changes_requested",
    findingsEmitted: 2,
    findings: [finding("F1"), finding("F2")],
    auditEvidence: EVIDENCE,
    subjectRef: "1e95474",
    reviewFingerprint: "2c0140608c8a",
    file: ".governance/specs/0024-context-architecture/reviews/c-co-enforcement-technical_audit.yml",
    ...over,
  };
}

function event(over: Partial<ReviewEventArtifact> = {}): ReviewEventArtifact {
  return {
    checkpoint: "checkpoint-co-enforcement",
    role: "technical_audit",
    eventId: "EV3",
    kind: "verification",
    executor: { platform: "antigravity", model: "gemini-3.5-flash-high" },
    decision: "approved",
    scope: "review",
    verifies: [],
    auditEvidence: EVIDENCE,
    reviewFingerprint: "2c0140608c8a",
    previousSubjectRef: "e2c98d6..1e95474",
    subjectRef: "1e95474..17b04f9",
    file: ".governance/specs/0024-context-architecture/reviews/events/c-co-enforcement-technical_audit-EV3.yml",
    ...over,
  };
}

function artifacts(
  reviews: readonly ReviewArtifact[],
  reviewEvents: readonly ReviewEventArtifact[] = []
): SpecArtifacts {
  return {
    reviews,
    reviewEvents,
    resolutions: [],
    gates: [],
    allowedCheckpoints: ["checkpoint-co-enforcement"],
  };
}

describe("reviewCheck · observedReviewStates", () => {
  it("review aprovado no HEAD X + commit posterior só de review event projeta current/approved", () => {
    const { registry } = buildReviewTypeRegistry(null);
    const observed = observedReviewStates(artifacts([review()], [event()]), "co-enforcement");
    const statuses = deriveEffectiveReviewStatuses({
      registry,
      policy: null,
      ctx: { prProfile: "execution", labels: [], changedPaths: [] },
      observed,
      functionalHead: "17b04f9",
    });

    const technicalAudit = statuses.find((s) => s.typeId === "technical_audit");
    expect(technicalAudit?.state).toBe("current");
    expect(technicalAudit?.decision).toBe("approved");
    expect(technicalAudit?.blocking).toBe(false);
  });

  it("commit funcional posterior ao subject do evento deixa a lane stale", () => {
    const { registry } = buildReviewTypeRegistry(null);
    const observed = observedReviewStates(artifacts([review()], [event()]), "co-enforcement");
    const statuses = deriveEffectiveReviewStatuses({
      registry,
      policy: null,
      ctx: { prProfile: "execution", labels: [], changedPaths: [] },
      observed,
      functionalHead: "700a00c",
    });

    const technicalAudit = statuses.find((s) => s.typeId === "technical_audit");
    expect(technicalAudit?.state).toBe("stale");
    expect(technicalAudit?.decision).toBe("approved");
  });

  it("review antigo changes_requested não domina verification approved mais recente", () => {
    const observed = observedReviewStates(artifacts([review()], [event()]), "co-enforcement");
    expect(observed.technical_audit).toEqual({
      latestSubjectRef: "1e95474..17b04f9",
      decision: "approved",
    });
  });

  it("event scope=findings aprovado cobrindo todos os findings substitui a decisão efetiva da lane", () => {
    const findingsEvent = event({
      scope: "findings",
      verifies: ["technical_audit#F1", "technical_audit#F2"],
    });
    delete (findingsEvent as { reviewFingerprint?: string }).reviewFingerprint;
    delete (findingsEvent as { previousSubjectRef?: string }).previousSubjectRef;
    const observed = observedReviewStates(artifacts([review()], [findingsEvent]), "co-enforcement");
    expect(observed.technical_audit).toEqual({
      latestSubjectRef: "1e95474..17b04f9",
      decision: "approved",
    });
  });

  it("event scope=findings não aprova review sem findings emitidos", () => {
    const findingsEvent = event({
      scope: "findings",
      verifies: [],
    });
    delete (findingsEvent as { reviewFingerprint?: string }).reviewFingerprint;
    delete (findingsEvent as { previousSubjectRef?: string }).previousSubjectRef;
    const observed = observedReviewStates(
      artifacts([review({ findingsEmitted: 0, findings: [] })], [findingsEvent]),
      "co-enforcement"
    );

    expect(observed.technical_audit).toEqual({
      latestSubjectRef: "1e95474..17b04f9",
      decision: "changes_requested",
    });
  });

  it("event scope=findings parcial não substitui a decisão do review inteiro", () => {
    const findingsEvent = event({ scope: "findings", verifies: ["technical_audit#F1"] });
    delete (findingsEvent as { reviewFingerprint?: string }).reviewFingerprint;
    delete (findingsEvent as { previousSubjectRef?: string }).previousSubjectRef;
    const observed = observedReviewStates(artifacts([review()], [findingsEvent]), "co-enforcement");
    expect(observed.technical_audit).toEqual({
      latestSubjectRef: "1e95474..17b04f9",
      decision: "changes_requested",
    });
  });

  it("event scope=findings posterior não-aprovado reabre a decisão efetiva da lane", () => {
    const approved = event({
      eventId: "EV1",
      scope: "findings",
      verifies: ["technical_audit#F1", "technical_audit#F2"],
    });
    const reopened = event({
      eventId: "EV2",
      scope: "findings",
      verifies: ["technical_audit#F2"],
      decision: "changes_requested",
      subjectRef: "17b04f9..700a00c",
    });
    for (const e of [approved, reopened]) {
      delete (e as { reviewFingerprint?: string }).reviewFingerprint;
      delete (e as { previousSubjectRef?: string }).previousSubjectRef;
    }
    const observed = observedReviewStates(
      artifacts([review()], [approved, reopened]),
      "co-enforcement"
    );
    expect(observed.technical_audit).toEqual({
      latestSubjectRef: "17b04f9..700a00c",
      decision: "changes_requested",
    });
  });

  it("review:check consolida decisão declarada e decisão efetiva derivada", () => {
    const result = consolidate(
      artifacts(
        [review()],
        [
          event({
            eventId: "EV1",
            scope: "findings",
            verifies: ["technical_audit#F1", "technical_audit#F2"],
          }),
        ]
      )
    );

    expect(result.byCheckpoint[0]?.effectiveReviewDecisions).toEqual([
      {
        role: "technical_audit",
        declared: "changes_requested",
        effective: "approved",
      },
    ]);
  });

  it("review:check consolida verification de review sem violação", () => {
    expect(consolidate(artifacts([review()], [event({ eventId: "EV1" })])).violations).toHaveLength(
      0
    );
  });
});
