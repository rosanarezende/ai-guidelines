export const WORK_CONFIDENCE_STATES = [
  "verified",
  "pending",
  "no-evidence",
  "self-declared",
  "break-glass",
  "stale",
] as const;

export const WORK_RISK_LEVELS = ["low", "attention", "high"] as const;

export type WorkConfidenceState = (typeof WORK_CONFIDENCE_STATES)[number];
export type WorkRiskLevel = (typeof WORK_RISK_LEVELS)[number];
export type WorkItemKind = "intent" | "proposal" | "standalone" | "target";

export type WorkItemRow = {
  id: string;
  kind: WorkItemKind;
  title: string;
  owner: string;
  team: string;
  repos: string[];
  cycle: string;
  status: string;
  confidence: WorkConfidenceState;
  risk: WorkRiskLevel;
  evidence: string;
  nextStep: string;
  contract: string;
  source: string;
};

export type WorkItemsViewModel = {
  sourceRevision: string;
  derived: true;
  name: string;
  rows: WorkItemRow[];
};

export type WorkItemsResponse =
  | {
      ok: true;
      workspace: { id: string; name: string; demo: boolean };
      work: WorkItemsViewModel | null;
      unavailableReason?: string;
    }
  | { ok: false; error: string };
