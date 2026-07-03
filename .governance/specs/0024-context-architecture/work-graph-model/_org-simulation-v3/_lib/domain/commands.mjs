// commands.mjs — pipeline fail-closed de comandos da runtime v3.
import { validateOrg } from "./org-domain.mjs";
import { REPO_WORK_STATUSES } from "./repo-projections.mjs";

export const COMMAND_TYPES = new Map([
  ["breakdown.apply", { mutates: true, payloadKey: "breakdown" }],
  ["contract.propose-revision", { mutates: true, payloadKey: "proposal" }],
  ["gate.decide", { mutates: true, payloadKey: "gate" }],
  ["incident.declare", { mutates: true, payloadKey: "incident" }],
  ["intent.activate", { mutates: true, payloadKey: "intent" }],
  ["policy.break-glass", { mutates: true, payloadKey: "break-glass" }],
  ["proposal.create", { mutates: true, payloadKey: "proposal" }],
  ["read-model.rebuild", { mutates: false }],
  ["repo-work.ack", { mutates: true, payloadKey: "ack" }],
  ["triage.save", { mutates: true, payloadKey: "triage" }],
  ["outcome.publish", { mutates: true, payloadKey: "outcome" }],
  ["verdict.accept", { mutates: true, payloadKey: "verdict" }],
]);

const GATE_DECISIONS = ["activate", "discard"];
const CONTRACT_DECISIONS = ["single-revision", "sequenced-windows", "split", "rejected", "pending"];
const TRIAGE_DISPOSITIONS = ["explore", "answer-direct", "needs-info"];
const INCIDENT_STATUSES = ["declared", "mitigating", "resolved", "postmortem-complete"];
const INCIDENT_SEVERITIES = ["baixa", "media", "alta", "critica"];
const VERDICTS = ["won", "lost", "inconclusive"];
const VERDICT_NEXT = ["graduation", "cleanup", "parked", "none"];
const BREAK_GLASS_MUTATIONS = [
  "target-change",
  "rollup-change",
  "compat-window-change",
  "verdict-override",
  "break-glass",
  "profile-change",
  "metric-definition-change",
  "aggregation-change",
  "business-link-change",
];

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

function findIntentWork(org, intentId, workId) {
  const intent = (org.intents || []).find((item) => item.id === intentId);
  const work = (intent?.works || []).find((item) => item.id === workId);
  return { intent, work };
}

function hasText(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function authorityKind(authorities, id) {
  return authorities.get(id)?.kind || null;
}

function resolveSubject(org, ref) {
  const [kind, id, ...rest] = String(ref || "").split(":");
  if (!kind || !id || rest.length) return false;
  const registries = {
    objective: org.objectives || [],
    target: org.targets || [],
    metric: org.metrics || [],
    contract: org.contracts || [],
    intent: org.intents || [],
    proposal: org.proposals || [],
    incident: org.incidents || [],
    standalone: org.standalone || [],
    repo: org.repos || [],
    team: org.teams || [],
    verdict: org.verdicts || [],
    outcome: org.outcomes || [],
  };
  return (registries[kind] || []).some((item) => item.id === id);
}

function domainErrorsForNodes(candidate, nodes) {
  const set = new Set(nodes.filter(Boolean));
  return validateOrg(candidate).filter(
    (domainIssue) =>
      domainIssue.level === "error" &&
      [...set].some(
        (node) => domainIssue.node === node || String(domainIssue.node).startsWith(`${node}::`)
      )
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

  if (command.type === "triage.save" && command.payload?.triage) {
    const triage = command.payload.triage;
    if (!triage.proposal)
      issues.push(issue("triage-schema", node, "triage.proposal é obrigatório"));
    if (
      triage.proposal &&
      !(org.proposals || []).some((proposal) => proposal.id === triage.proposal)
    )
      issues.push(issue("triage-proposal", node, `proposal "${triage.proposal}" não existe`));
    if (!triage["recorded-by"])
      issues.push(issue("triage-schema", node, "triage.recorded-by é obrigatório"));
    if (triage["recorded-by"] && !authorities.has(triage["recorded-by"]))
      issues.push(
        issue(
          "triage-authority",
          node,
          `triage.recorded-by "${triage["recorded-by"]}" não resolve no registry`
        )
      );
    if (triage["recorded-by"] && triage["recorded-by"] !== envelope.authority)
      issues.push(
        issue(
          "triage-authority",
          node,
          `triage.recorded-by precisa ser a authority do comando (${envelope.authority})`
        )
      );
    if (!Array.isArray(triage.items) || triage.items.length === 0)
      issues.push(issue("triage-schema", node, "triage.items precisa ter ao menos um item"));
    for (const [index, item] of (triage.items || []).entries()) {
      const itemNode = `${node}::items[${index}]`;
      if (!item.id) issues.push(issue("triage-schema", itemNode, "item.id é obrigatório"));
      if (!item.question)
        issues.push(issue("triage-schema", itemNode, "item.question é obrigatório"));
      if (!TRIAGE_DISPOSITIONS.includes(item.disposition))
        issues.push(
          issue(
            "triage-schema",
            itemNode,
            `item.disposition "${item.disposition}" inválida (aceitas: ${TRIAGE_DISPOSITIONS.join(" · ")})`
          )
        );
    }
    for (const [index, suggestion] of (triage["matcher-run"]?.suggestions || []).entries()) {
      const suggestionNode = `${node}::matcher-run.suggestions[${index}]`;
      if (!suggestion.repo)
        issues.push(issue("triage-matcher", suggestionNode, "suggestion.repo é obrigatório"));
      else if (!(org.repos || []).some((repo) => repo.id === suggestion.repo))
        issues.push(
          issue("triage-matcher", suggestionNode, `suggestion.repo "${suggestion.repo}" não existe`)
        );
      if (!Array.isArray(suggestion.evidence) || suggestion.evidence.length === 0)
        issues.push(
          issue("triage-matcher", suggestionNode, "suggestion.evidence precisa ser não-vazia")
        );
    }
  }

  if (command.type === "repo-work.ack" && command.payload?.ack) {
    const ack = command.payload.ack;
    const { intent, work } = findIntentWork(org, ack.intent, ack.work);
    if (!ack.intent) issues.push(issue("repo-work-schema", node, "ack.intent é obrigatório"));
    if (!ack.work) issues.push(issue("repo-work-schema", node, "ack.work é obrigatório"));
    if (!intent) issues.push(issue("repo-work-ref", node, `intent "${ack.intent}" não existe`));
    else if (!work)
      issues.push(issue("repo-work-ref", node, `work "${ack.work}" não existe em "${ack.intent}"`));
    if (ack.status && !REPO_WORK_STATUSES.includes(ack.status))
      issues.push(
        issue(
          "repo-work-schema",
          node,
          `ack.status "${ack.status}" inválido (aceitos: ${REPO_WORK_STATUSES.join(" · ")})`
        )
      );
    if (ack.repo && work && ack.repo !== work.repo)
      issues.push(
        issue("repo-work-ref", node, `ack.repo "${ack.repo}" diverge do breakdown "${work.repo}"`)
      );
    if (ack.owner && !authorities.has(ack.owner))
      issues.push(issue("repo-work-authority", node, `ack.owner "${ack.owner}" não resolve`));
    if (["active", "blocked", "done"].includes(ack.status) && ack.owner !== envelope.authority) {
      issues.push(
        issue(
          "repo-work-authority",
          node,
          `ack.owner precisa ser a authority do comando para status "${ack.status}"`
        )
      );
    }
    if (ack.status === "active") {
      for (const field of ["owner", "started-at", "base-revision"])
        if (!hasText(ack[field]))
          issues.push(issue("repo-work-lifecycle", node, `status active exige "${field}"`));
    }
    if (ack.status === "done") {
      for (const field of ["owner", "started-at", "base-revision", "completed-at", "source-commit"])
        if (!hasText(ack[field]))
          issues.push(issue("repo-work-lifecycle", node, `status done exige "${field}"`));
      if (!ack.evidence)
        issues.push(issue("repo-work-lifecycle", node, "status done exige evidence"));
      if (!ack.verification)
        issues.push(issue("repo-work-lifecycle", node, "status done exige verification"));
      for (const field of ["kind", "command", "result"]) {
        if (!hasText(ack.evidence?.[field]))
          issues.push(issue("repo-work-lifecycle", node, `status done exige evidence.${field}`));
      }
      if (!Array.isArray(ack.evidence?.files) || ack.evidence.files.length === 0)
        issues.push(
          issue("repo-work-lifecycle", node, "status done exige evidence.files não-vazio")
        );
      for (const field of ["checked-by", "result"]) {
        if (!hasText(ack.verification?.[field]))
          issues.push(
            issue("repo-work-lifecycle", node, `status done exige verification.${field}`)
          );
      }
      if (ack.verification?.["checked-by"] && !authorities.has(ack.verification["checked-by"]))
        issues.push(
          issue(
            "repo-work-authority",
            node,
            `verification.checked-by "${ack.verification["checked-by"]}" não resolve`
          )
        );
    }
    if (ack.status === "blocked") {
      if (!hasText(ack.owner))
        issues.push(issue("repo-work-lifecycle", node, "status blocked exige owner"));
      if (!hasText(ack["blocked-by"]) && !hasText(ack.reason))
        issues.push(
          issue("repo-work-lifecycle", node, "status blocked exige blocked-by ou reason")
        );
    }
    if (ack.status === "dropped") {
      for (const field of ["decision", "fate"])
        if (!hasText(ack[field]))
          issues.push(issue("repo-work-lifecycle", node, `status dropped exige "${field}"`));
    }
  }

  if (command.type === "contract.propose-revision" && command.payload?.proposal) {
    const contractId = command.payload.contract;
    const proposal = command.payload.proposal;
    const contract = (org.contracts || []).find((item) => item.id === contractId);
    if (!contractId)
      issues.push(issue("contract-proposal-schema", node, "payload.contract é obrigatório"));
    if (contractId && !contract)
      issues.push(issue("contract-proposal-ref", node, `contract "${contractId}" não existe`));
    for (const field of [
      "id",
      "revision",
      "breaking",
      "intents",
      "consumers",
      "owner-approval",
      "decision",
    ]) {
      if (proposal[field] === undefined || proposal[field] === null || proposal[field] === "")
        issues.push(issue("contract-proposal-schema", node, `proposal.${field} é obrigatório`));
    }
    if (!Array.isArray(proposal.intents) || proposal.intents.length === 0)
      issues.push(
        issue("contract-proposal-schema", node, "proposal.intents precisa ser lista não-vazia")
      );
    if (!Array.isArray(proposal.consumers))
      issues.push(issue("contract-proposal-schema", node, "proposal.consumers precisa ser lista"));
    if (!CONTRACT_DECISIONS.includes(proposal.decision))
      issues.push(
        issue(
          "contract-proposal-schema",
          node,
          `proposal.decision "${proposal.decision}" inválida (aceitas: ${CONTRACT_DECISIONS.join(" · ")})`
        )
      );
    if (contract?.["revision-proposals"]?.some((item) => item.id === proposal.id))
      issues.push(
        issue(
          "command-duplicate",
          node,
          `revision-proposal "${proposal.id}" já existe em "${contractId}"`
        )
      );
    if (proposal["owner-approval"] !== envelope.authority)
      issues.push(
        issue(
          "contract-owner-approval",
          node,
          `proposal.owner-approval precisa ser a authority do comando (${envelope.authority})`
        )
      );
    if (contract && !issues.some((item) => item.rule === "command-duplicate")) {
      const candidate = structuredClone(org);
      candidate.contracts = candidate.contracts.map((item) =>
        item.id === contractId
          ? { ...item, "revision-proposals": [...(item["revision-proposals"] || []), proposal] }
          : item
      );
      issues.push(
        ...validateOrg(candidate).filter(
          (domainIssue) =>
            domainIssue.level === "error" &&
            (domainIssue.node === contractId ||
              domainIssue.node === `${contractId}::${proposal.id}` ||
              String(domainIssue.node).startsWith(`${contractId}::${proposal.id}::`))
        )
      );
    }
  }

  if (command.type === "incident.declare" && command.payload?.incident) {
    const incident = command.payload.incident;
    for (const field of [
      "id",
      "kind",
      "repo",
      "origin",
      "severity",
      "status",
      "declared-by",
      "detected-at",
      "telemetry",
      "placar",
    ]) {
      if (!hasText(incident[field]))
        issues.push(issue("incident-schema", node, `incident.${field} é obrigatório`));
    }
    if (incident.kind !== "incident-response")
      issues.push(issue("incident-schema", node, "incident.kind precisa ser incident-response"));
    if (!INCIDENT_STATUSES.includes(incident.status))
      issues.push(
        issue(
          "incident-schema",
          node,
          `incident.status "${incident.status}" inválido (aceitos: ${INCIDENT_STATUSES.join(" · ")})`
        )
      );
    if (!INCIDENT_SEVERITIES.includes(incident.severity))
      issues.push(
        issue(
          "incident-schema",
          node,
          `incident.severity "${incident.severity}" inválida (aceitas: ${INCIDENT_SEVERITIES.join(" · ")})`
        )
      );
    if ((org.incidents || []).some((item) => item.id === incident.id))
      issues.push(issue("command-duplicate", node, `incident "${incident.id}" já existe`));
    if (incident.repo && !(org.repos || []).some((repo) => repo.id === incident.repo))
      issues.push(issue("incident-ref", node, `incident.repo "${incident.repo}" não existe`));
    if (incident["declared-by"] && !authorities.has(incident["declared-by"]))
      issues.push(
        issue("incident-authority", node, `declared-by "${incident["declared-by"]}" não resolve`)
      );
    if (incident["declared-by"] && incident["declared-by"] !== envelope.authority)
      issues.push(
        issue(
          "incident-authority",
          node,
          `incident.declared-by precisa ser a authority do comando (${envelope.authority})`
        )
      );
    for (const field of ["source", "event", "observed-at"]) {
      if (!hasText(incident.telemetry?.[field]))
        issues.push(issue("incident-telemetry", node, `incident.telemetry.${field} é obrigatório`));
    }
    if (
      incident.telemetry?.source &&
      !(org.repos || []).some((repo) => repo.id === incident.telemetry.source)
    )
      issues.push(
        issue(
          "incident-telemetry",
          node,
          `incident.telemetry.source "${incident.telemetry.source}" não é repo publicado`
        )
      );
    if (!issues.some((item) => item.rule === "command-duplicate")) {
      const candidate = structuredClone(org);
      candidate.incidents = [...(candidate.incidents || []), incident];
      issues.push(...domainErrorsForNodes(candidate, [incident.id]));
    }
  }

  if (command.type === "policy.break-glass" && command.payload?.["break-glass"]) {
    const breakGlass = command.payload["break-glass"];
    for (const field of [
      "id",
      "mutation",
      "subject",
      "reason",
      "requested-by",
      "approved-by",
      "issued-at",
      "expires-at",
      "review-at",
      "evidence",
    ]) {
      if (!hasText(breakGlass[field]))
        issues.push(issue("break-glass-schema", node, `break-glass.${field} é obrigatório`));
    }
    if (!BREAK_GLASS_MUTATIONS.includes(breakGlass.mutation))
      issues.push(
        issue(
          "break-glass-schema",
          node,
          `break-glass.mutation "${breakGlass.mutation}" inválida (aceitas: ${BREAK_GLASS_MUTATIONS.join(" · ")})`
        )
      );
    if ((org.policy?.["break-glass"] || []).some((item) => item.id === breakGlass.id))
      issues.push(issue("command-duplicate", node, `break-glass "${breakGlass.id}" já existe`));
    if (breakGlass.subject && !resolveSubject(org, breakGlass.subject))
      issues.push(
        issue(
          "break-glass-subject",
          node,
          `break-glass.subject "${breakGlass.subject}" não resolve`
        )
      );
    for (const field of ["requested-by", "approved-by"]) {
      if (breakGlass[field] && !authorities.has(breakGlass[field]))
        issues.push(
          issue("break-glass-authority", node, `${field} "${breakGlass[field]}" não resolve`)
        );
    }
    if (breakGlass["approved-by"] && breakGlass["approved-by"] !== envelope.authority)
      issues.push(
        issue(
          "break-glass-authority",
          node,
          `break-glass.approved-by precisa ser a authority do comando (${envelope.authority})`
        )
      );
    if (
      breakGlass["requested-by"] &&
      breakGlass["approved-by"] &&
      breakGlass["requested-by"] === breakGlass["approved-by"]
    )
      issues.push(
        issue("break-glass-sod", node, "requested-by e approved-by precisam ser distintos")
      );
    if (
      breakGlass["approved-by"] &&
      authorityKind(authorities, breakGlass["approved-by"]) !== "sponsor"
    )
      issues.push(issue("break-glass-authority", node, "perfil full exige sponsor em approved-by"));
    if (breakGlass["issued-at"] >= breakGlass["expires-at"])
      issues.push(
        issue("break-glass-window", node, "expires-at precisa ser posterior a issued-at")
      );
    if (breakGlass["issued-at"] > breakGlass["review-at"])
      issues.push(issue("break-glass-window", node, "review-at precisa ser em ou após issued-at"));
    if (!Array.isArray(breakGlass.evidence) || breakGlass.evidence.length === 0)
      issues.push(
        issue("break-glass-evidence", node, "break-glass.evidence precisa ser não-vazio")
      );
    if (!issues.some((item) => item.rule === "command-duplicate")) {
      const candidate = structuredClone(org);
      candidate.policy = {
        ...(candidate.policy || {}),
        "break-glass": [...(candidate.policy?.["break-glass"] || []), breakGlass],
      };
      issues.push(...domainErrorsForNodes(candidate, [breakGlass.id]));
    }
  }

  if (command.type === "verdict.accept" && command.payload?.verdict) {
    const verdict = command.payload.verdict;
    const intent = (org.intents || []).find((item) => item.id === verdict.intent);
    const outcome = (org.outcomes || []).find((item) => item.id === verdict.outcome);
    for (const field of [
      "id",
      "intent",
      "outcome",
      "verdict",
      "decided-by",
      "decided-at",
      "decision-rule",
      "evidence",
      "next",
    ]) {
      if (!hasText(verdict[field]))
        issues.push(issue("verdict-schema", node, `verdict.${field} é obrigatório`));
    }
    if (!VERDICTS.includes(verdict.verdict))
      issues.push(
        issue(
          "verdict-schema",
          node,
          `verdict.verdict "${verdict.verdict}" inválido (aceitos: ${VERDICTS.join(" · ")})`
        )
      );
    if (!VERDICT_NEXT.includes(verdict.next))
      issues.push(
        issue(
          "verdict-schema",
          node,
          `verdict.next "${verdict.next}" inválido (aceitos: ${VERDICT_NEXT.join(" · ")})`
        )
      );
    if ((org.verdicts || []).some((item) => item.id === verdict.id))
      issues.push(issue("command-duplicate", node, `verdict "${verdict.id}" já existe`));
    if (verdict.intent && !intent)
      issues.push(issue("verdict-ref", node, `intent "${verdict.intent}" não existe`));
    if (verdict.outcome && !outcome)
      issues.push(issue("verdict-ref", node, `outcome "${verdict.outcome}" não existe`));
    if (intent && !(intent.next || []).some((next) => next.gate === "accept-verdict"))
      issues.push(
        issue("verdict-gate", node, `intent "${intent.id}" não declara gate accept-verdict`)
      );
    if (intent && outcome && outcome["emitted-by"] !== intent.id)
      issues.push(
        issue(
          "verdict-outcome",
          node,
          `outcome "${outcome.id}" não pertence à intent "${intent.id}"`
        )
      );
    if (outcome) {
      const outcomeErrors = validateOrg(org).filter(
        (domainIssue) => domainIssue.level === "error" && domainIssue.node === outcome.id
      );
      if (outcomeErrors.length)
        issues.push(
          issue(
            "verdict-outcome",
            node,
            `outcome "${outcome.id}" tem erro(s) e não pode sustentar verdict`
          )
        );
    }
    if (verdict["decided-by"] && !authorities.has(verdict["decided-by"]))
      issues.push(
        issue("verdict-authority", node, `decided-by "${verdict["decided-by"]}" não resolve`)
      );
    if (verdict["decided-by"] && verdict["decided-by"] !== envelope.authority)
      issues.push(
        issue(
          "verdict-authority",
          node,
          `verdict.decided-by precisa ser a authority do comando (${envelope.authority})`
        )
      );
    if (!Array.isArray(verdict.evidence) || verdict.evidence.length === 0)
      issues.push(issue("verdict-evidence", node, "verdict.evidence precisa ser não-vazio"));
    if (verdict.override === true) {
      if (!verdict["break-glass-ref"])
        issues.push(issue("verdict-override", node, "override exige break-glass-ref"));
      else if (
        !(org.policy?.["break-glass"] || []).some(
          (breakGlass) => breakGlass.id === verdict["break-glass-ref"]
        )
      )
        issues.push(
          issue(
            "verdict-override",
            node,
            `break-glass-ref "${verdict["break-glass-ref"]}" não resolve`
          )
        );
    }
    if (!issues.some((item) => item.rule === "command-duplicate")) {
      const candidate = structuredClone(org);
      candidate.verdicts = [...(candidate.verdicts || []), verdict];
      issues.push(...domainErrorsForNodes(candidate, [verdict.id]));
    }
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
