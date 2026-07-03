// commands.mjs — pipeline fail-closed de comandos da runtime v3.
import { validateOrg } from "./org-domain.mjs";

export const COMMAND_TYPES = new Map([
  ["breakdown.apply", { mutates: true, payloadKey: "breakdown" }],
  ["gate.decide", { mutates: true, payloadKey: "gate" }],
  ["intent.activate", { mutates: true, payloadKey: "intent" }],
  ["proposal.create", { mutates: true, payloadKey: "proposal" }],
  ["read-model.rebuild", { mutates: false }],
  ["outcome.publish", { mutates: true, payloadKey: "outcome" }],
]);

const GATE_DECISIONS = ["activate", "discard"];

const requiredEnvelope = [
  "actor",
  "authority",
  "base-revision",
  "idempotency-key",
  "issued-at",
  "nonce",
];

function issue(rule, node, msg) {
  return { level: "error", rule, node, msg };
}

function domainErrorsFor(candidate, nodePrefix) {
  return validateOrg(candidate).filter(
    (domainIssue) =>
      domainIssue.level === "error" &&
      (domainIssue.node === nodePrefix || String(domainIssue.node).startsWith(`${nodePrefix}::`))
  );
}

function gateDecisionFor(history, proposalId) {
  return history.find(
    (previous) =>
      previous?.type === "gate.decide" && previous.payload?.gate?.proposal === proposalId
  );
}

export function validateGovernedCommand(command, org, options = {}) {
  const { currentRevision, history = [] } = options;
  const issues = [];
  const node = command?.id || command?.type || "command";
  if (!command || typeof command !== "object") {
    return [issue("command-schema", "command", "comando precisa ser objeto")];
  }
  if (!command.id) issues.push(issue("command-schema", node, "comando sem id"));
  if (!command.type) issues.push(issue("command-schema", node, "comando sem type"));
  const spec = COMMAND_TYPES.get(command.type);
  if (command.type && !spec)
    issues.push(
      issue("command-type", node, `command.type "${command.type}" desconhecido — fail-closed`)
    );

  const envelope = command.envelope || {};
  for (const field of requiredEnvelope) {
    if (!envelope[field]) issues.push(issue("command-envelope", node, `envelope sem "${field}"`));
  }
  if (currentRevision && envelope["base-revision"] !== currentRevision) {
    issues.push(
      issue(
        "command-stale",
        node,
        `base-revision "${envelope["base-revision"]}" diverge da revisão atual "${currentRevision}"`
      )
    );
  }

  const authorities = new Map(
    (org.authorities || []).map((authority) => [authority.id, authority])
  );
  if (envelope.authority && !authorities.has(envelope.authority)) {
    issues.push(
      issue(
        "command-authority",
        node,
        `envelope.authority "${envelope.authority}" não resolve no registry`
      )
    );
  }

  const revokedAt = new Map(
    (org.policy?.["authority-revocations"] || []).map((revocation) => [
      revocation.authority,
      revocation["revoked-at"],
    ])
  );
  if (envelope.authority && envelope["issued-at"] && revokedAt.has(envelope.authority)) {
    const revoked = revokedAt.get(envelope.authority);
    if (String(envelope["issued-at"]) >= String(revoked)) {
      issues.push(
        issue(
          "command-authority-revoked",
          node,
          `authority "${envelope.authority}" foi revogada em ${revoked}`
        )
      );
    }
  }

  for (const previous of history) {
    if (previous?.envelope?.["idempotency-key"] === envelope["idempotency-key"])
      issues.push(
        issue(
          "command-replay",
          node,
          `idempotency-key reutilizada por "${previous.id || previous.type}"`
        )
      );
    if (previous?.envelope?.nonce === envelope.nonce)
      issues.push(
        issue("command-replay", node, `nonce reutilizado por "${previous.id || previous.type}"`)
      );
  }

  if (spec?.payloadKey && !command.payload?.[spec.payloadKey]) {
    issues.push(issue("command-payload", node, `payload sem "${spec.payloadKey}"`));
  }

  if (command.type === "gate.decide" && command.payload?.gate) {
    const gate = command.payload.gate;
    if (!gate.proposal) issues.push(issue("gate-schema", node, "gate.proposal é obrigatório"));
    if (!GATE_DECISIONS.includes(gate.decision))
      issues.push(
        issue(
          "gate-schema",
          node,
          `gate.decision "${gate.decision}" inválida (aceitas: ${GATE_DECISIONS.join(" · ")})`
        )
      );
    if (!gate.reason)
      issues.push(issue("gate-schema", node, "gate.reason é obrigatório e auditável"));
    const proposal = (org.proposals || []).find((item) => item.id === gate.proposal);
    if (gate.proposal && !proposal)
      issues.push(issue("gate-proposal", node, `proposal "${gate.proposal}" não existe`));
    if (proposal && proposal.status !== "proposed")
      issues.push(
        issue(
          "gate-proposal",
          node,
          `proposal "${proposal.id}" está "${proposal.status}" — gate só decide proposed`
        )
      );
    const previousGate = gateDecisionFor(history, gate.proposal);
    if (previousGate) {
      issues.push(
        issue(
          "gate-duplicate",
          node,
          `proposal "${gate.proposal}" já teve gate em "${previousGate.id || previousGate.type}"`
        )
      );
    }
  }

  if (command.type === "intent.activate" && command.payload?.intent) {
    const intent = command.payload.intent;
    const proposalId = command.payload.proposal;
    if (!proposalId) {
      issues.push(issue("gate-required", node, "intent.activate exige payload.proposal"));
    }
    if ((org.intents || []).some((item) => item.id === intent.id)) {
      issues.push(issue("command-duplicate", node, `intent "${intent.id}" já existe`));
    }
    if (proposalId) {
      const proposal = (org.proposals || []).find((item) => item.id === proposalId);
      if (!proposal)
        issues.push(issue("gate-required", node, `proposal "${proposalId}" não existe`));
      const gate = gateDecisionFor(history, proposalId);
      if (!gate)
        issues.push(
          issue(
            "gate-required",
            node,
            `intent.activate exige gate.decide prévio para "${proposalId}"`
          )
        );
      else if (gate.payload?.gate?.decision !== "activate")
        issues.push(
          issue(
            "gate-required",
            node,
            `gate de "${proposalId}" decidiu "${gate.payload?.gate?.decision}", não activate`
          )
        );
      if (proposal && intent["authorized-by"] !== proposal["authorized-by"])
        issues.push(
          issue(
            "gate-coherence",
            node,
            `intent.authorized-by "${intent["authorized-by"]}" diverge da proposal "${proposal["authorized-by"]}"`
          )
        );
      if (proposal?.target && intent["primary-target"] !== proposal.target)
        issues.push(
          issue(
            "gate-coherence",
            node,
            `intent.primary-target "${intent["primary-target"]}" diverge da proposal target "${proposal.target}"`
          )
        );
    }
    if (!issues.some((item) => item.rule === "command-duplicate")) {
      const candidate = structuredClone(org);
      candidate.intents = [...(candidate.intents || []), intent];
      issues.push(...domainErrorsFor(candidate, intent.id));
    }
  }

  if (command.type === "breakdown.apply" && command.payload?.breakdown) {
    const breakdown = command.payload.breakdown;
    const intentId = breakdown.intent;
    const intent = (org.intents || []).find((item) => item.id === intentId);
    if (!intent) issues.push(issue("breakdown-intent", node, `intent "${intentId}" não existe`));
    if (!Array.isArray(breakdown.works) || breakdown.works.length === 0)
      issues.push(issue("breakdown-schema", node, "breakdown.works precisa ter ao menos uma peça"));
    if (intent && Array.isArray(breakdown.works) && breakdown.works.length) {
      const candidate = structuredClone(org);
      candidate.intents = candidate.intents.map((item) =>
        item.id === intentId ? { ...item, works: breakdown.works } : item
      );
      issues.push(...domainErrorsFor(candidate, intentId));
    }
  }

  if (command.type === "proposal.create" && command.payload?.proposal) {
    if ((org.proposals || []).some((proposal) => proposal.id === command.payload.proposal.id)) {
      issues.push(
        issue("command-duplicate", node, `proposal "${command.payload.proposal.id}" já existe`)
      );
    } else {
      const candidate = structuredClone(org);
      candidate.proposals = [...(candidate.proposals || []), command.payload.proposal];
      for (const domainIssue of validateOrg(candidate)) {
        if (domainIssue.level === "error" && domainIssue.node === command.payload.proposal.id) {
          issues.push(domainIssue);
        }
      }
    }
  }

  if (command.type === "outcome.publish" && command.payload?.outcome) {
    if ((org.outcomes || []).some((outcome) => outcome.id === command.payload.outcome.id)) {
      issues.push(
        issue("command-duplicate", node, `outcome "${command.payload.outcome.id}" já existe`)
      );
    } else {
      const candidate = structuredClone(org);
      candidate.outcomes = [...(candidate.outcomes || []), command.payload.outcome];
      for (const domainIssue of validateOrg(candidate)) {
        if (domainIssue.level === "error" && domainIssue.node === command.payload.outcome.id) {
          issues.push(domainIssue);
        }
      }
    }
  }

  return issues;
}

export function dryRunGovernedCommand(command, org, options = {}) {
  const issues = validateGovernedCommand(command, org, options);
  const errors = issues.filter((item) => item.level === "error");
  if (errors.length) {
    return { ok: false, issues };
  }
  return {
    ok: true,
    issues,
    receipt: {
      command: command.id,
      type: command.type,
      mutates: COMMAND_TYPES.get(command.type)?.mutates === true,
      authority: command.envelope.authority,
      baseRevision: command.envelope["base-revision"],
    },
  };
}
