import type {
  CommandEnvelope,
  CommandType,
  GovernedCommand,
  GovernanceSnapshot,
} from "@/lib/types";
import { issuedAt, sanitize } from "./commandSelectors";

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
