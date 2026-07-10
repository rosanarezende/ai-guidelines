import type { CommandType } from "@demo/contracts";

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
