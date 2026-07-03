export const commandTypes = [
  "proposal.create",
  "triage.save",
  "gate.decide",
  "intent.activate",
  "breakdown.apply",
  "repo-work.ack",
  "contract.propose-revision",
  "outcome.publish",
];

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function makeEnvelope(snapshot, authority, type) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    actor: "ui:governance-next",
    authority,
    "base-revision": snapshot.revision,
    "idempotency-key": `${type}-${suffix}`,
    "issued-at": today(),
    nonce: `nonce-${type}-${suffix}`,
  };
}

function firstProposal(snapshot) {
  return (
    snapshot.operations.proposals.find((proposal) => proposal.status === "proposed") ||
    snapshot.operations.proposals[0]
  );
}

function firstOperationalTarget(snapshot) {
  return (
    snapshot.targets.find((target) => target.metric?.id === "incident-count") || snapshot.targets[0]
  );
}

function firstIntent(snapshot) {
  return snapshot.portfolio.intents[0];
}

function firstRepoWork(snapshot) {
  return snapshot.repos.flatMap((repo) => repo.works || [])[0];
}

function authorityForOwner(snapshot, owner) {
  return snapshot.authorities.find((authority) => authority.of === owner)?.id || "";
}

function authorityForRepo(snapshot, repoId) {
  const repo = snapshot.repos.find((item) => item.id === repoId);
  return authorityForOwner(snapshot, repo?.owner) || "pm-growth";
}

export function defaultAuthorityFor(type, snapshot) {
  if (type === "contract.propose-revision") return "head-platform";
  if (type === "repo-work.ack") {
    const work = firstRepoWork(snapshot);
    return authorityForRepo(snapshot, work?.repo);
  }
  if (type === "triage.save") return "lead-checkout";
  return (
    snapshot.authorities.find((authority) => authority.id === "pm-growth")?.id ||
    snapshot.authorities[0]?.id ||
    ""
  );
}

export function defaultPayloadFor(type, snapshot) {
  const proposal = firstProposal(snapshot);
  const target = firstOperationalTarget(snapshot);
  const intent = firstIntent(snapshot);
  const repoWork = firstRepoWork(snapshot);
  if (type === "proposal.create") {
    return {
      proposal: {
        id: "prop-new-growth-idea",
        title: "nova hipótese de growth",
        "raised-by": snapshot.operations.incidents[0]
          ? `incident:${snapshot.operations.incidents[0].id}`
          : `proposal:${proposal?.id || "prop-checkout-hardening"}`,
        "authorized-by": snapshot.portfolio.objectives[0]?.id || "obj-revenue",
        target: snapshot.targets[0]?.id || "tgt-billing-conv",
        status: "proposed",
        note: "registrada pelo app operacional Next/MUI",
      },
    };
  }
  if (type === "triage.save") {
    return {
      triage: {
        proposal: proposal?.id || "prop-checkout-hardening",
        "recorded-by": "lead-checkout",
        summary: "triagem técnica registrada pelo app operacional",
        items: [
          {
            id: "impacto-checkout",
            question: "qual repo deve responder pelo hardening pós-incidente?",
            disposition: "answer-direct",
            answer:
              "o fluxo crítico está em acme-checkout/acme-checkout-api; owners confirmam no breakdown",
          },
          {
            id: "medicao-incidentes",
            question: "como medir redução de incidentes sem outcome textual?",
            disposition: "explore",
            owner: "lead-sre",
            timebox: "3d",
          },
        ],
        "matcher-run": {
          matcher: "local-capability-matcher",
          query: "hardening checkout pós-incidente",
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
        reason: "proposta tem vínculo de negócio, target e caminho técnico suficientes para ativar",
      },
    };
  }
  if (type === "intent.activate") {
    const proposalId = proposal?.id || "prop-checkout-hardening";
    return {
      proposal: proposalId,
      intent: {
        id: "intent-ui-checkout-hardening",
        title: "hardening do checkout pós-incidente",
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
            desc: "endurece fluxo crítico do checkout com guardrails pós-incidente",
            review: "interno",
          },
        ],
        next: [
          {
            when: "peças done",
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
            desc: "peça de exemplo aplicada por comando governado",
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
        "started-at": today(),
        "base-revision": `${repoWork?.repo || "acme-api-billing"}@ctx-local`,
      },
    };
  }
  if (type === "contract.propose-revision") {
    return {
      contract: "acme-user-context",
      proposal: {
        id: `acme-user-context-v5-ui-${today().replaceAll("-", "")}`,
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
  const outcomeTarget =
    snapshot.targets.find((item) => item.id === intent?.["primary-target"]) || snapshot.targets[0];
  return {
    outcome: {
      id: `out-ui-${today().replaceAll("-", "")}`,
      "emitted-by": intent?.id || "intent-cta-upgrade",
      source: "acme-analytics/ui-published@warehouse-rev-local",
      window: { start: "2027-04-01", end: "2027-04-30" },
      metric: outcomeTarget?.metric?.id || outcomeTarget?.metric || "conversion-rate",
      value: "+0.1 %",
      aggregation: outcomeTarget?.metric?.aggregation || "avg",
      "attested-by": outcomeTarget?.metric?.source || "acme-analytics",
      revision: "warehouse@rev-local",
      "contract-revisions": [],
      "contributes-to": outcomeTarget?.id || "tgt-billing-conv",
    },
  };
}

function commandIdSource(type, payload) {
  if (type === "proposal.create") return payload.proposal?.id;
  if (type === "triage.save") return payload.triage?.proposal;
  if (type === "gate.decide") return payload.gate?.proposal;
  if (type === "intent.activate") return payload.intent?.id;
  if (type === "breakdown.apply") return payload.breakdown?.intent;
  if (type === "repo-work.ack") return `${payload.ack?.intent}-${payload.ack?.work}`;
  if (type === "contract.propose-revision") return `${payload.contract}-${payload.proposal?.id}`;
  if (type === "outcome.publish") return payload.outcome?.id;
  return type;
}

export function commandFromPayload({ type, payloadText, snapshot, authority }) {
  const payload = JSON.parse(payloadText);
  const envelope = makeEnvelope(snapshot, authority, type);
  if (payload.outcome) payload.outcome.envelope = envelope;
  const idSource = commandIdSource(type, payload) || type;
  return {
    id: `cmd-${type}-${String(idSource).replace(/[^A-Za-z0-9_.-]/g, "-")}`,
    type,
    envelope,
    payload,
  };
}
