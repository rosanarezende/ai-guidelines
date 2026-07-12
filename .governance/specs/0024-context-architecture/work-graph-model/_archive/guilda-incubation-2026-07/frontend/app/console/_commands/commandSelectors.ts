import type { GovernanceSnapshot } from "@demo/contracts";

export const issuedAt = "2027-04-15";

export function sanitize(value: string): string {
  return value.replace(/[^A-Za-z0-9_.-]/g, "-");
}

export function firstProposal(snapshot: GovernanceSnapshot) {
  return (
    snapshot.operations.proposals.find((proposal) => proposal.status === "proposed") ||
    snapshot.operations.proposals[0]
  );
}

export function firstOperationalTarget(snapshot: GovernanceSnapshot) {
  return (
    snapshot.targets.find((target) => target.metric?.id === "incident-count") || snapshot.targets[0]
  );
}

export function firstIntent(snapshot: GovernanceSnapshot) {
  return snapshot.portfolio.intents[0];
}

export function firstOpenRepoWork(snapshot: GovernanceSnapshot) {
  return (
    snapshot.repos
      .flatMap((repo) => repo.works || [])
      .find((work) => work.status !== "done" && work.status !== "dropped") ||
    snapshot.repos.flatMap((repo) => repo.works || [])[0]
  );
}

export function firstStandalone(snapshot: GovernanceSnapshot) {
  return (
    snapshot.operations.standalone.find((work) => work.status !== "done") ||
    snapshot.operations.standalone[0]
  );
}

export function authorityForOwner(snapshot: GovernanceSnapshot, owner?: string): string {
  return snapshot.authorities.find((authority) => authority.of === owner)?.id || "";
}

export function authorityForRepo(snapshot: GovernanceSnapshot, repoId?: string): string {
  const repo = snapshot.repos.find((item) => item.id === repoId);
  return authorityForOwner(snapshot, repo?.owner) || "pm-growth";
}
