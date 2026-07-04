// repo-projections.mjs — derivacoes puras compartilhadas entre runtime e scripts.
import { createHash } from "node:crypto";

export const REPO_WORK_SCHEMA = "acme.repo-work/v1";
export const REPO_WORK_STATUSES = ["acknowledged", "active", "blocked", "done", "dropped"];
export const REPO_WORK_LIFECYCLE_KEYS = [
  "owner",
  "started-at",
  "base-revision",
  "completed-at",
  "source-commit",
  "evidence",
  "verification",
  "blocked-by",
  "reason",
  "decision",
  "fate",
];
export const REPO_CONTRACT_SCHEMA = "acme.repo-contract/v1";

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stable(value[key])])
    );
  }
  return value;
}

export function digest(value) {
  return createHash("sha256")
    .update(JSON.stringify(stable(value)))
    .digest("hex")
    .slice(0, 12);
}

function moduleTouchpoint(moduleId) {
  const base = String(moduleId || "").replace(/^mod-/, "");
  return base ? `src/modules/${base}.mjs` : "src/index.mjs";
}

function codeTouchpoints(work) {
  return [work.module ? moduleTouchpoint(work.module) : "src/index.mjs"];
}

export function breakdownPayload(intent, work) {
  return {
    intent: intent.id,
    work: {
      id: work.id,
      repo: work.repo,
      module: work.module || null,
      purpose: work.purpose,
      desc: work.desc,
      review: work.review,
      timebox: work.timebox || null,
      blockedBy: work["blocked-by"] || [],
      deliveryAfter: work["delivery-after"] || [],
    },
  };
}

export function expectedRepoWorkClaim(intent, work) {
  const claim = {
    schema: REPO_WORK_SCHEMA,
    id: `${intent.id}::${work.id}`,
    intent: intent.id,
    work: work.id,
    repo: work.repo,
    purpose: work.purpose,
    desc: work.desc,
    review: work.review,
    status: "acknowledged",
    source: {
      kind: "central-breakdown",
      file: `acme/governance/intents/${intent.id}.yml`,
      breakdownHash: digest(breakdownPayload(intent, work)),
    },
    code: {
      touchpoints: codeTouchpoints(work),
    },
  };
  if (work.module) claim.module = work.module;
  return claim;
}

export function deriveExpectedRepoWorks(org) {
  return (org.intents || [])
    .flatMap((intent) => (intent.works || []).map((work) => expectedRepoWorkClaim(intent, work)))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function contractPayload(contract) {
  return {
    id: contract.id,
    revision: contract.revision,
    ownerRepo: contract["owner-repo"],
    consumers: contract.consumers || [],
    compatibilityWindow: contract["compatibility-window"] ?? null,
    interface: contract.interface || null,
    revisionProposals: contract["revision-proposals"] || [],
  };
}

export function expectedRepoContract(contract) {
  return {
    schema: REPO_CONTRACT_SCHEMA,
    id: contract.id,
    revision: contract.revision,
    ownerRepo: contract["owner-repo"],
    consumers: contract.consumers || [],
    compatibilityWindow: contract["compatibility-window"] ?? null,
    interface: contract.interface || null,
    revisionProposals: contract["revision-proposals"] || [],
    source: {
      kind: "central-contract",
      file: "acme/governance/contracts/contracts.yml",
      contractHash: digest(contractPayload(contract)),
    },
    code: {
      touchpoints: ["src/index.mjs"],
    },
  };
}

export function deriveExpectedRepoContracts(org) {
  return (org.contracts || []).map(expectedRepoContract).sort((a, b) => a.id.localeCompare(b.id));
}
