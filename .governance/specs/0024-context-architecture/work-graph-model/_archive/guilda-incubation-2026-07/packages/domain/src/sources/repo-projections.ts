// repo-projections.ts — derivações puras compartilhadas entre runtime e scripts.
import { digest12 } from "../policy/stable-digest.ts";
import type {
  Contract,
  ContractRevisionProposal,
  IntentDef,
  IntentWork,
  OrgSnapshot,
  RepoWorkClaim,
} from "../workspace/governance.ts";

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
] as const;
export const REPO_CONTRACT_SCHEMA = "acme.repo-contract/v1";

export const digest = digest12;

function moduleTouchpoint(moduleId: string | undefined): string {
  const base = String(moduleId || "").replace(/^mod-/, "");
  return base ? `src/modules/${base}.mjs` : "src/index.mjs";
}

function codeTouchpoints(work: IntentWork): string[] {
  return [work.module ? moduleTouchpoint(work.module) : "src/index.mjs"];
}

export function breakdownPayload(intent: IntentDef, work: IntentWork): Record<string, unknown> {
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

export function expectedRepoWorkClaim(intent: IntentDef, work: IntentWork): RepoWorkClaim {
  const claim: RepoWorkClaim = {
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

export function deriveExpectedRepoWorks(org: OrgSnapshot): RepoWorkClaim[] {
  return (org.intents || [])
    .flatMap((intent) => (intent.works || []).map((work) => expectedRepoWorkClaim(intent, work)))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function contractPayload(contract: Contract): Record<string, unknown> {
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

export type ExpectedRepoContract = {
  schema: string;
  id: string;
  revision: string;
  ownerRepo: string;
  consumers: string[];
  compatibilityWindow: string | null;
  interface: Record<string, unknown> | null;
  revisionProposals: ContractRevisionProposal[];
  source: { kind: string; file: string; contractHash: string };
  code: { touchpoints: string[] };
};

export function expectedRepoContract(contract: Contract): ExpectedRepoContract {
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

export function deriveExpectedRepoContracts(org: OrgSnapshot): ExpectedRepoContract[] {
  return (org.contracts || []).map(expectedRepoContract).sort((a, b) => a.id.localeCompare(b.id));
}
