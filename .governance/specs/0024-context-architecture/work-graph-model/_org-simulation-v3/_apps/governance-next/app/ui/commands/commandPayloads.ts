import type {
  CommandEnvelope,
  CommandType,
  GovernedCommand,
  GovernanceSnapshot,
} from "@/lib/types";

export const commandTypes: CommandType[] = [
  "proposal.create",
  "triage.save",
  "gate.decide",
  "intent.activate",
  "breakdown.apply",
  "repo-work.ack",
  "standalone.complete",
  "contract.propose-revision",
  "outcome.publish",
  "verdict.accept",
  "incident.declare",
  "policy.break-glass",
];

const issuedAt = "2027-04-15";

function sanitize(value: string): string {
  return value.replace(/[^A-Za-z0-9_.-]/g, "-");
}

function firstProposal(snapshot: GovernanceSnapshot) {
  return (
    snapshot.operations.proposals.find((proposal) => proposal.status === "proposed") ||
    snapshot.operations.proposals[0]
  );
}

function firstOperationalTarget(snapshot: GovernanceSnapshot) {
  return (
    snapshot.targets.find((target) => target.metric?.id === "incident-count") || snapshot.targets[0]
  );
}

function firstIntent(snapshot: GovernanceSnapshot) {
  return snapshot.portfolio.intents[0];
}

function firstOpenRepoWork(snapshot: GovernanceSnapshot) {
  return (
    snapshot.repos
      .flatMap((repo) => repo.works || [])
      .find((work) => work.status !== "done" && work.status !== "dropped") ||
    snapshot.repos.flatMap((repo) => repo.works || [])[0]
  );
}

function firstStandalone(snapshot: GovernanceSnapshot) {
  return (
    snapshot.operations.standalone.find((work) => work.status !== "done") ||
    snapshot.operations.standalone[0]
  );
}

function authorityForOwner(snapshot: GovernanceSnapshot, owner?: string): string {
  return snapshot.authorities.find((authority) => authority.of === owner)?.id || "";
}

function authorityForRepo(snapshot: GovernanceSnapshot, repoId?: string): string {
  const repo = snapshot.repos.find((item) => item.id === repoId);
  return authorityForOwner(snapshot, repo?.owner) || "pm-growth";
}

export function defaultAuthorityFor(type: CommandType, snapshot: GovernanceSnapshot): string {
  if (type === "contract.propose-revision") return "head-platform";
  if (type === "incident.declare") return "lead-sre";
  if (type === "policy.break-glass") return "sponsor-acme";
  if (type === "verdict.accept") return "pm-growth";
  if (type === "triage.save") return "lead-checkout";
  if (type === "standalone.complete") {
    const work = firstStandalone(snapshot);
    return authorityForRepo(snapshot, work?.repo);
  }
  if (type === "repo-work.ack") {
    const work = firstOpenRepoWork(snapshot);
    return authorityForRepo(snapshot, work?.repo);
  }
  return snapshot.authorities.find((authority) => authority.id === "pm-growth")?.id || "";
}

export function defaultPayloadFor(type: CommandType, snapshot: GovernanceSnapshot) {
  const proposal = firstProposal(snapshot);
  const target = firstOperationalTarget(snapshot);
  const intent = firstIntent(snapshot);
  const repoWork = firstOpenRepoWork(snapshot);
  const standalone = firstStandalone(snapshot);

  if (type === "proposal.create") {
    return {
      proposal: {
        id: "prop-new-growth-idea",
        title: "nova hipotese de growth",
        "raised-by": snapshot.operations.incidents[0]
          ? `incident:${snapshot.operations.incidents[0].id}`
          : `proposal:${proposal?.id || "prop-checkout-hardening"}`,
        "authorized-by": snapshot.portfolio.objectives[0]?.id || "obj-revenue",
        target: snapshot.targets[0]?.id || "tgt-billing-conv",
        status: "proposed",
        note: "registrada pelo app operacional Next/MUI v2",
      },
    };
  }

  if (type === "triage.save") {
    return {
      triage: {
        proposal: proposal?.id || "prop-checkout-hardening",
        "recorded-by": "lead-checkout",
        summary: "triagem tecnica registrada pelo app operacional",
        items: [
          {
            id: "impacto-checkout",
            question: "qual repo deve responder pelo hardening pos-incidente?",
            disposition: "answer-direct",
            answer:
              "o fluxo critico esta em acme-checkout/acme-checkout-api; owners confirmam no breakdown",
          },
          {
            id: "medicao-incidentes",
            question: "como medir reducao de incidentes sem outcome textual?",
            disposition: "explore",
            owner: "lead-sre",
            timebox: "3d",
          },
        ],
        "matcher-run": {
          matcher: "local-capability-matcher",
          query: "hardening checkout pos-incidente",
          suggestions: [
            {
              repo: "acme-checkout",
              score: 0.91,
              unknown: false,
              evidence: ["cap:checkout-ui", "owner:time-checkout"],
            },
            {
              repo: "acme-checkout-api",
              score: 0.87,
              unknown: false,
              evidence: ["cap:pedidos", "owner:time-checkout"],
            },
          ],
        },
      },
    };
  }

  if (type === "gate.decide") {
    return {
      gate: {
        proposal: proposal?.id || "prop-checkout-hardening",
        decision: "activate",
        reason: "proposta tem vinculo de negocio, target e caminho tecnico suficientes para ativar",
      },
    };
  }

  if (type === "intent.activate") {
    return {
      proposal: proposal?.id || "prop-checkout-hardening",
      intent: {
        id: "intent-ui-checkout-hardening",
        title: "hardening do checkout pos-incidente",
        team: "time-checkout",
        "authorized-by": proposal?.["authorized-by"] || "obj-efficiency",
        "primary-target": proposal?.target || target?.id || "tgt-sre-incidents",
        approach: "direct",
        signal: "operational-target",
        works: [
          {
            id: "checkout-guardrails",
            repo: "acme-checkout",
            purpose: "sustain",
            desc: "endurece fluxo critico do checkout com guardrails pos-incidente",
            review: "interno",
          },
        ],
        next: [
          {
            when: "pecas done",
            then: "publicar outcome operacional no target de incidentes",
            gate: "accept-verdict",
          },
        ],
      },
    };
  }

  if (type === "breakdown.apply") {
    return {
      breakdown: {
        intent: intent?.id || "intent-cta-upgrade",
        works: intent?.works || [
          {
            id: "work-ui-example",
            repo: "acme-checkout",
            purpose: "sustain",
            desc: "peca de exemplo aplicada por comando governado",
            review: "interno",
          },
        ],
      },
    };
  }

  if (type === "repo-work.ack") {
    return {
      ack: {
        intent: repoWork?.intent || "intent-cta-upgrade",
        work: repoWork?.work || "api-elegibilidade",
        repo: repoWork?.repo || "acme-api-billing",
        status: "active",
        owner: authorityForRepo(snapshot, repoWork?.repo || "acme-api-billing") || "lead-billing",
        "started-at": issuedAt,
        "base-revision": `${repoWork?.repo || "acme-api-billing"}@ctx-local`,
      },
    };
  }

  if (type === "standalone.complete") {
    return {
      standalone: {
        id: standalone?.id || "bug-frete",
        repo: standalone?.repo || "acme-checkout",
        status: "done",
        owner: authorityForRepo(snapshot, standalone?.repo || "acme-checkout") || "lead-checkout",
        "started-at": "2027-04-14",
        "base-revision": `${standalone?.repo || "acme-checkout"}@ctx-local`,
        "completed-at": issuedAt,
        "source-commit": `${standalone?.repo || "acme-checkout"}@ui-local`,
        evidence: {
          kind: "code-fixture",
          command: `node _tools/check-code-fixtures.mjs --repo ${standalone?.repo || "acme-checkout"}`,
          result: "passed",
          files: ["src/index.mjs"],
        },
        verification: {
          "checked-by": authorityForRepo(snapshot, standalone?.repo || "acme-checkout"),
          result: "passed",
        },
      },
    };
  }

  if (type === "contract.propose-revision") {
    return {
      contract: "acme-user-context",
      proposal: {
        id: "acme-user-context-v5-ui",
        revision: "v5",
        breaking: true,
        intents: ["intent-checkout-stack", "intent-consent-center"],
        consumers: ["acme-mfe-billing", "acme-mfe-onboarding", "acme-checkout"],
        "owner-approval": "head-platform",
        decision: "sequenced-windows",
        "compatibility-window": "v4+v5 durante rollout coordenado dos consumidores",
      },
    };
  }

  if (type === "verdict.accept") {
    const outcome = snapshot.outcomes.find((item) => item.valid) || snapshot.outcomes[0];
    const outcomeIntent = snapshot.portfolio.intents.find(
      (item) => item.id === outcome?.["emitted-by"]
    );
    return {
      verdict: {
        id: `verdict-${outcome?.["emitted-by"] || "intent"}-ui`,
        intent: outcome?.["emitted-by"] || outcomeIntent?.id || "intent-cta-upgrade",
        outcome: outcome?.id || "out-cta-upgrade-2027q1",
        verdict: "won",
        "decided-by": "pm-growth",
        "decided-at": issuedAt,
        "decision-rule": outcomeIntent?.["decision-rule"] || "decision-rule da intent aplicada",
        evidence: [`outcome:${outcome?.id || "out-cta-upgrade-2027q1"}`, "resolver:valid-outcome"],
        next: "graduation",
      },
    };
  }

  if (type === "incident.declare") {
    return {
      incident: {
        id: "inc-ui-checkout",
        kind: "incident-response",
        repo: "acme-checkout-api",
        origin: "alerta do acme-obs-stack — erro elevado no checkout",
        severity: "alta",
        status: "declared",
        "declared-by": "lead-sre",
        "detected-at": issuedAt,
        telemetry: {
          source: "acme-obs-stack",
          event: "checkout.error-rate",
          "observed-at": issuedAt,
          query: "service=acme-checkout-api severity>=sev2",
        },
        placar: "operational-bucket + MTTR pendente",
      },
    };
  }

  if (type === "policy.break-glass") {
    return {
      "break-glass": {
        id: "bg-verdict-override-ui",
        mutation: "verdict-override",
        subject: "intent:intent-cta-upgrade",
        reason: "janela operacional exige override rastreavel em vez de bypass invisivel",
        "requested-by": "pm-growth",
        "approved-by": "sponsor-acme",
        "issued-at": issuedAt,
        "expires-at": "2027-04-16",
        "review-at": "2027-04-17",
        evidence: ["incident-review:manual", "fallback-law:break-glass"],
      },
    };
  }

  const outcomeTarget =
    snapshot.targets.find((item) => item.id === intent?.["primary-target"]) || snapshot.targets[0];
  return {
    outcome: {
      id: "out-ui-example",
      "emitted-by": intent?.id || "intent-cta-upgrade",
      source: "acme-analytics/ui-published@warehouse-rev-local",
      window: { start: "2027-04-01", end: "2027-04-30" },
      metric: outcomeTarget?.metric?.id || "conversion-rate",
      value: "+0.1 %",
      aggregation: outcomeTarget?.metric?.aggregation || "avg",
      "attested-by": outcomeTarget?.metric?.source || "acme-analytics",
      revision: "warehouse@rev-local",
      "contract-revisions": [],
      "contributes-to": outcomeTarget?.id || "tgt-billing-conv",
    },
  };
}

function commandIdSource(type: CommandType, payload: Record<string, any>): string {
  if (type === "proposal.create") return payload.proposal?.id;
  if (type === "triage.save") return payload.triage?.proposal;
  if (type === "gate.decide") return payload.gate?.proposal;
  if (type === "intent.activate") return payload.intent?.id;
  if (type === "breakdown.apply") return payload.breakdown?.intent;
  if (type === "repo-work.ack") return `${payload.ack?.intent}-${payload.ack?.work}`;
  if (type === "standalone.complete") return payload.standalone?.id;
  if (type === "contract.propose-revision") return `${payload.contract}-${payload.proposal?.id}`;
  if (type === "outcome.publish") return payload.outcome?.id;
  if (type === "verdict.accept") return payload.verdict?.id;
  if (type === "incident.declare") return payload.incident?.id;
  if (type === "policy.break-glass") return payload["break-glass"]?.id;
  return type;
}

function makeEnvelope(
  snapshot: GovernanceSnapshot,
  authority: string,
  type: CommandType,
  idSource: string
): CommandEnvelope {
  const suffix = sanitize(`${type}-${idSource}-${snapshot.revision}`);
  return {
    actor: "ui:governance-next-v2",
    authority,
    "base-revision": snapshot.revision,
    "idempotency-key": suffix,
    "issued-at": issuedAt,
    nonce: `nonce-${suffix}`,
  };
}

export function commandFromPayload({
  type,
  payloadText,
  snapshot,
  authority,
}: {
  type: CommandType;
  payloadText: string;
  snapshot: GovernanceSnapshot;
  authority: string;
}): GovernedCommand {
  const payload = JSON.parse(payloadText) as Record<string, any>;
  const idSource = commandIdSource(type, payload) || type;
  const envelope = makeEnvelope(snapshot, authority, type, idSource);
  if (payload.outcome) payload.outcome.envelope = envelope;
  return {
    id: `cmd-${sanitize(`${type}-${idSource}`)}`,
    type,
    envelope,
    payload,
  };
}
