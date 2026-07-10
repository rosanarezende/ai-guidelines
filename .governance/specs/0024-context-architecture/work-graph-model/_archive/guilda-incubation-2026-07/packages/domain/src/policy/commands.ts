// commands.ts — pipeline fail-closed de comandos da runtime v3.
import type {
  Authority,
  BreakGlass,
  ContractRevisionProposal,
  GovernanceIssue,
  GovernedCommand,
  Incident,
  IntentDef,
  IntentWork,
  OrgSnapshot,
  Outcome,
  Proposal,
  RepoWorkClaim,
  StandaloneWork,
  Triage,
  Verdict,
} from "../workspace/governance.ts";
import { validateOrg } from "./org-domain.ts";
import { REPO_WORK_STATUSES } from "../sources/repo-projections.ts";

export type CommandSpec = { mutates: boolean; payloadKey?: string };

export const COMMAND_TYPES: Map<string, CommandSpec> = new Map([
  ["breakdown.apply", { mutates: true, payloadKey: "breakdown" }],
  ["contract.propose-revision", { mutates: true, payloadKey: "proposal" }],
  ["gate.decide", { mutates: true, payloadKey: "gate" }],
  ["incident.declare", { mutates: true, payloadKey: "incident" }],
  ["intent.activate", { mutates: true, payloadKey: "intent" }],
  ["policy.break-glass", { mutates: true, payloadKey: "break-glass" }],
  ["proposal.create", { mutates: true, payloadKey: "proposal" }],
  ["read-model.rebuild", { mutates: false }],
  ["repo-work.ack", { mutates: true, payloadKey: "ack" }],
  ["standalone.complete", { mutates: true, payloadKey: "standalone" }],
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
] as const;

export type CommandValidationOptions = {
  currentRevision?: string;
  history?: GovernedCommand[];
};

export type CommandReceipt = {
  command: string;
  type: string;
  mutates: boolean;
  authority: string;
  baseRevision: string;
  // execução acrescenta write/previousRevision/newRevision ao recibo
  [key: string]: unknown;
};

export type DryRunResult = {
  ok: boolean;
  issues: GovernanceIssue[];
  receipt?: CommandReceipt;
};

function issue(rule: string, node: string, msg: string): GovernanceIssue {
  return { level: "error", rule, node, msg };
}

function domainErrorsFor(candidate: OrgSnapshot, nodePrefix: string): GovernanceIssue[] {
  return validateOrg(candidate).filter(
    (domainIssue) =>
      domainIssue.level === "error" &&
      (domainIssue.node === nodePrefix || String(domainIssue.node).startsWith(`${nodePrefix}::`))
  );
}

function gateDecisionFor(
  history: GovernedCommand[],
  proposalId: string | undefined
): GovernedCommand | undefined {
  return history.find(
    (previous) =>
      previous?.type === "gate.decide" &&
      (previous.payload?.["gate"] as { proposal?: string } | undefined)?.proposal === proposalId
  );
}

function findIntentWork(
  org: OrgSnapshot,
  intentId: string | undefined,
  workId: string | undefined
): { intent: IntentDef | undefined; work: IntentWork | undefined } {
  const intent = (org.intents || []).find((item) => item.id === intentId);
  const work = (intent?.works || []).find((item) => item.id === workId);
  return { intent, work };
}

function findStandalone(org: OrgSnapshot, standaloneId: string | undefined): StandaloneWork | null {
  return (org.standalone || []).find((item) => item.id === standaloneId) || null;
}

function hasText(value: unknown): boolean {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function authorityKind(authorities: Map<string, Authority>, id: string | undefined): string | null {
  return (id && authorities.get(id)?.kind) || null;
}

function resolveSubject(org: OrgSnapshot, ref: unknown): boolean {
  const [kind, id, ...rest] = String(ref || "").split(":");
  if (!kind || !id || rest.length) return false;
  const registries: Record<string, Array<{ id: string }>> = {
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

function domainErrorsForNodes(
  candidate: OrgSnapshot,
  nodes: Array<string | undefined>
): GovernanceIssue[] {
  const set = new Set(nodes.filter((node): node is string => Boolean(node)));
  return validateOrg(candidate).filter(
    (domainIssue) =>
      domainIssue.level === "error" &&
      [...set].some(
        (node) => domainIssue.node === node || String(domainIssue.node).startsWith(`${node}::`)
      )
  );
}

export function validateGovernedCommand(
  command: GovernedCommand,
  org: OrgSnapshot,
  options: CommandValidationOptions = {}
): GovernanceIssue[] {
  const { currentRevision, history = [] } = options;
  const issues: GovernanceIssue[] = [];
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

  const envelope = command.envelope || ({} as GovernedCommand["envelope"]);
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

  if (command.type === "triage.save" && command.payload?.["triage"]) {
    const triage = command.payload["triage"] as Triage;
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

  if (command.type === "repo-work.ack" && command.payload?.["ack"]) {
    const ack = command.payload["ack"] as RepoWorkClaim;
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
    if (
      ["active", "blocked", "done"].includes(ack.status || "") &&
      ack.owner !== envelope.authority
    ) {
      issues.push(
        issue(
          "repo-work-authority",
          node,
          `ack.owner precisa ser a authority do comando para status "${ack.status}"`
        )
      );
    }
    if (ack.status === "active") {
      for (const field of ["owner", "started-at", "base-revision"] as const)
        if (!hasText(ack[field]))
          issues.push(issue("repo-work-lifecycle", node, `status active exige "${field}"`));
    }
    if (ack.status === "done") {
      for (const field of [
        "owner",
        "started-at",
        "base-revision",
        "completed-at",
        "source-commit",
      ] as const)
        if (!hasText(ack[field]))
          issues.push(issue("repo-work-lifecycle", node, `status done exige "${field}"`));
      if (!ack.evidence)
        issues.push(issue("repo-work-lifecycle", node, "status done exige evidence"));
      if (!ack.verification)
        issues.push(issue("repo-work-lifecycle", node, "status done exige verification"));
      for (const field of ["kind", "command", "result"] as const) {
        if (!hasText(ack.evidence?.[field]))
          issues.push(issue("repo-work-lifecycle", node, `status done exige evidence.${field}`));
      }
      if (!Array.isArray(ack.evidence?.files) || ack.evidence.files.length === 0)
        issues.push(
          issue("repo-work-lifecycle", node, "status done exige evidence.files não-vazio")
        );
      for (const field of ["checked-by", "result"] as const) {
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
      for (const field of ["decision", "fate"] as const)
        if (!hasText(ack[field]))
          issues.push(issue("repo-work-lifecycle", node, `status dropped exige "${field}"`));
    }
  }

  if (command.type === "standalone.complete" && command.payload?.["standalone"]) {
    const standalone = command.payload["standalone"] as Partial<StandaloneWork> & { id?: string };
    const existing = findStandalone(org, standalone.id);
    if (!standalone.id)
      issues.push(issue("standalone-schema", node, "standalone.id é obrigatório"));
    if (!existing)
      issues.push(issue("standalone-ref", node, `standalone "${standalone.id}" não existe`));
    if (standalone.status !== "done")
      issues.push(issue("standalone-lifecycle", node, "standalone.complete exige status done"));
    if (standalone.repo && existing && standalone.repo !== existing.repo)
      issues.push(
        issue(
          "standalone-ref",
          node,
          `standalone.repo "${standalone.repo}" diverge do repo "${existing.repo}"`
        )
      );
    if (standalone.owner && !authorities.has(standalone.owner))
      issues.push(
        issue("standalone-authority", node, `standalone.owner "${standalone.owner}" não resolve`)
      );
    if (standalone.owner !== envelope.authority) {
      issues.push(
        issue(
          "standalone-authority",
          node,
          "standalone.owner precisa ser a authority do comando para status done"
        )
      );
    }
    for (const field of [
      "owner",
      "started-at",
      "base-revision",
      "completed-at",
      "source-commit",
    ] as const)
      if (!hasText(standalone[field]))
        issues.push(issue("standalone-lifecycle", node, `status done exige "${field}"`));
    if (!standalone.evidence)
      issues.push(issue("standalone-lifecycle", node, "status done exige evidence"));
    if (!standalone.verification)
      issues.push(issue("standalone-lifecycle", node, "status done exige verification"));
    for (const field of ["kind", "command", "result"] as const) {
      if (!hasText(standalone.evidence?.[field]))
        issues.push(issue("standalone-lifecycle", node, `status done exige evidence.${field}`));
    }
    if (!Array.isArray(standalone.evidence?.files) || standalone.evidence.files.length === 0)
      issues.push(
        issue("standalone-lifecycle", node, "status done exige evidence.files não-vazio")
      );
    for (const field of ["checked-by", "result"] as const) {
      if (!hasText(standalone.verification?.[field]))
        issues.push(issue("standalone-lifecycle", node, `status done exige verification.${field}`));
    }
    if (
      standalone.verification?.["checked-by"] &&
      !authorities.has(standalone.verification["checked-by"])
    )
      issues.push(
        issue(
          "standalone-authority",
          node,
          `verification.checked-by "${standalone.verification["checked-by"]}" não resolve`
        )
      );

    if (existing) {
      const candidate = structuredClone(org);
      candidate.standalone = (candidate.standalone || []).map((item) =>
        item.id === standalone.id ? { ...item, ...standalone } : item
      );
      issues.push(...domainErrorsForNodes(candidate, [standalone.id]));
    }
  }

  if (command.type === "contract.propose-revision" && command.payload?.["proposal"]) {
    const contractId = command.payload["contract"] as string | undefined;
    const proposal = command.payload["proposal"] as ContractRevisionProposal;
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
    ] as const) {
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

  if (command.type === "incident.declare" && command.payload?.["incident"]) {
    const incident = command.payload["incident"] as Incident;
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
    ] as const) {
      if (!hasText(incident[field]))
        issues.push(issue("incident-schema", node, `incident.${field} é obrigatório`));
    }
    if (incident.kind !== "incident-response")
      issues.push(issue("incident-schema", node, "incident.kind precisa ser incident-response"));
    if (!INCIDENT_STATUSES.includes(incident.status || ""))
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
    for (const field of ["source", "event", "observed-at"] as const) {
      if (!hasText(incident.telemetry?.[field]))
        issues.push(issue("incident-telemetry", node, `incident.telemetry.${field} é obrigatório`));
    }
    if (
      incident.telemetry?.source &&
      !(org.repos || []).some((repo) => repo.id === incident.telemetry?.source)
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
    const breakGlass = command.payload["break-glass"] as BreakGlass;
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
    ] as const) {
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
    for (const field of ["requested-by", "approved-by"] as const) {
      if (breakGlass[field] && !authorities.has(breakGlass[field] || ""))
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
    // Semântica do legado: comparação só decide quando ambos os lados existem
    // (undefined nunca dispara a janela; a ausência já cai em break-glass-schema).
    if (
      breakGlass["issued-at"] != null &&
      breakGlass["expires-at"] != null &&
      breakGlass["issued-at"] >= breakGlass["expires-at"]
    )
      issues.push(
        issue("break-glass-window", node, "expires-at precisa ser posterior a issued-at")
      );
    if (
      breakGlass["issued-at"] != null &&
      breakGlass["review-at"] != null &&
      breakGlass["issued-at"] > breakGlass["review-at"]
    )
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

  if (command.type === "verdict.accept" && command.payload?.["verdict"]) {
    const verdict = command.payload["verdict"] as Verdict;
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
    ] as const) {
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

  if (command.type === "gate.decide" && command.payload?.["gate"]) {
    const gate = command.payload["gate"] as {
      proposal?: string;
      decision?: string;
      reason?: string;
    };
    if (!gate.proposal) issues.push(issue("gate-schema", node, "gate.proposal é obrigatório"));
    if (!GATE_DECISIONS.includes(gate.decision || ""))
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

  if (command.type === "intent.activate" && command.payload?.["intent"]) {
    const intent = command.payload["intent"] as IntentDef;
    const proposalId = command.payload["proposal"] as string | undefined;
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
      const gateDecision = (gate?.payload?.["gate"] as { decision?: string } | undefined)?.decision;
      if (!gate)
        issues.push(
          issue(
            "gate-required",
            node,
            `intent.activate exige gate.decide prévio para "${proposalId}"`
          )
        );
      else if (gateDecision !== "activate")
        issues.push(
          issue(
            "gate-required",
            node,
            `gate de "${proposalId}" decidiu "${gateDecision}", não activate`
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

  if (command.type === "breakdown.apply" && command.payload?.["breakdown"]) {
    const breakdown = command.payload["breakdown"] as { intent?: string; works?: IntentWork[] };
    const intentId = breakdown.intent;
    const intent = (org.intents || []).find((item) => item.id === intentId);
    if (!intent) issues.push(issue("breakdown-intent", node, `intent "${intentId}" não existe`));
    if (!Array.isArray(breakdown.works) || breakdown.works.length === 0)
      issues.push(issue("breakdown-schema", node, "breakdown.works precisa ter ao menos uma peça"));
    if (intent && Array.isArray(breakdown.works) && breakdown.works.length) {
      const works = breakdown.works;
      const candidate = structuredClone(org);
      candidate.intents = candidate.intents.map((item) =>
        item.id === intentId ? { ...item, works } : item
      );
      issues.push(...domainErrorsFor(candidate, intentId || ""));
    }
  }

  if (command.type === "proposal.create" && command.payload?.["proposal"]) {
    const proposal = command.payload["proposal"] as Proposal;
    if ((org.proposals || []).some((item) => item.id === proposal.id)) {
      issues.push(issue("command-duplicate", node, `proposal "${proposal.id}" já existe`));
    } else {
      const candidate = structuredClone(org);
      candidate.proposals = [...(candidate.proposals || []), proposal];
      for (const domainIssue of validateOrg(candidate)) {
        if (domainIssue.level === "error" && domainIssue.node === proposal.id) {
          issues.push(domainIssue);
        }
      }
    }
  }

  if (command.type === "outcome.publish" && command.payload?.["outcome"]) {
    const outcome = command.payload["outcome"] as Outcome;
    if ((org.outcomes || []).some((item) => item.id === outcome.id)) {
      issues.push(issue("command-duplicate", node, `outcome "${outcome.id}" já existe`));
    } else {
      const candidate = structuredClone(org);
      candidate.outcomes = [...(candidate.outcomes || []), outcome];
      for (const domainIssue of validateOrg(candidate)) {
        if (domainIssue.level === "error" && domainIssue.node === outcome.id) {
          issues.push(domainIssue);
        }
      }
    }
  }

  return issues;
}

export function dryRunGovernedCommand(
  command: GovernedCommand,
  org: OrgSnapshot,
  options: CommandValidationOptions = {}
): DryRunResult {
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
