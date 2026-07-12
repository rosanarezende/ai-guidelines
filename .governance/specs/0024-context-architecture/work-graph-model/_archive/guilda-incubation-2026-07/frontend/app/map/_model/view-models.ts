export const MAP_NODE_KINDS = [
  "objective",
  "target",
  "intent",
  "repo-work",
  "contract",
  "outcome",
  "dashboard",
] as const;

export const MAP_CONFIDENCE_STATES = [
  "verified",
  "pending",
  "no-evidence",
  "self-declared",
  "break-glass",
  "stale",
] as const;

export const MAP_RISK_LEVELS = ["low", "attention", "high"] as const;

export type MapNodeKind = (typeof MAP_NODE_KINDS)[number];
export type MapConfidenceState = (typeof MAP_CONFIDENCE_STATES)[number];
export type MapRiskLevel = (typeof MAP_RISK_LEVELS)[number];

export type GovernanceMapNode = {
  id: string;
  kind: MapNodeKind;
  title: string;
  subtitle?: string;
  owner?: string;
  team?: string;
  touchesContract?: boolean;
  confidence: MapConfidenceState;
  risk: MapRiskLevel;
  riskNote?: string;
  nextStep?: string;
  evidence?: string;
  cta?: { label: string; href: string };
};

export type GovernanceMapEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
};

export type GovernanceMapViewModel = {
  scopeId: string;
  scopeTitle: string;
  sourceRevision: string;
  derived: true;
  nodes: GovernanceMapNode[];
  edges: GovernanceMapEdge[];
};

export type MapFilterState = {
  kind: MapNodeKind | "";
  confidence: MapConfidenceState | "";
  risk: MapRiskLevel | "";
  onlyContract: boolean;
  text: string;
};

export type GovernanceMapsResponse =
  | {
      ok: true;
      workspace: { id: string; name: string; demo: boolean };
      maps: GovernanceMapViewModel[] | null;
      unavailableReason?: string;
    }
  | { ok: false; error: string };
