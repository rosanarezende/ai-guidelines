import type { CommandType, GovernanceSnapshot } from "@demo/contracts";
import {
  authorityForRepo,
  firstIntent,
  firstOpenRepoWork,
  firstOperationalTarget,
  firstProposal,
  firstStandalone,
  issuedAt,
} from "./commandSelectors";

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
          command: `node tools/checks/check-code-fixtures.ts --repo ${standalone?.repo || "acme-checkout"}`,
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

  return defaultOutcomePayload(snapshot, intent);
}

function defaultOutcomePayload(
  snapshot: GovernanceSnapshot,
  intent: GovernanceSnapshot["portfolio"]["intents"][number]
) {
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
