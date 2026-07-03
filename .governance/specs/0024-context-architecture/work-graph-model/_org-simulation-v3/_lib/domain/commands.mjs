// commands.mjs — pipeline fail-closed de comandos da runtime v3.
import { validateOrg } from "./org-domain.mjs";

export const COMMAND_TYPES = new Map([
  ["proposal.create", { mutates: true, payloadKey: "proposal" }],
  ["read-model.rebuild", { mutates: false }],
  ["outcome.publish", { mutates: true, payloadKey: "outcome" }],
]);

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
