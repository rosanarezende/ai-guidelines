import type { CommandType, GovernanceSnapshot } from "@demo/contracts";
import { authorityForRepo, firstOpenRepoWork, firstStandalone } from "./commandSelectors";

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
