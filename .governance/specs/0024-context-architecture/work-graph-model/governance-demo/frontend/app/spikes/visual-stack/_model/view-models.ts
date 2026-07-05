// view-models.ts — contratos de dados independentes de renderer (QRD-27).
// Nenhuma biblioteca visual lê YAML/event-log: os candidatos consomem SOMENTE
// estes view-models, derivados do read-model no servidor ou de fixture tipada.
// Trocar renderer não pode alterar domínio, comandos, resolver nem SSOT.

export type ConfidenceState =
  | "verified"
  | "pending"
  | "no-evidence"
  | "self-declared"
  | "break-glass"
  | "stale";

export type RiskLevel = "low" | "attention" | "high";

export const CONFIDENCE_STATES: ConfidenceState[] = [
  "verified",
  "pending",
  "no-evidence",
  "self-declared",
  "break-glass",
  "stale",
];

// ── Mapa de governança (experiência guiada para stakeholders) ───────────────

export type MapNodeKind =
  | "decision"
  | "objective"
  | "target"
  | "intent"
  | "repo-work"
  | "contract"
  | "outcome"
  | "dashboard";

export type GovernanceMapNode = {
  id: string;
  kind: MapNodeKind;
  title: string;
  subtitle?: string;
  owner?: string;
  team?: string;
  touchesContract?: boolean;
  confidence: ConfidenceState;
  risk: RiskLevel;
  riskNote?: string;
  nextStep?: string;
  evidence?: string;
  cta?: { label: string; href: string };
};

export type MapFilterState = {
  kinds: MapNodeKind[];
  confidence: string;
  risk: string;
  team: string;
  onlyContract: boolean;
  text: string;
};

export const EMPTY_MAP_FILTER: MapFilterState = {
  kinds: [],
  confidence: "",
  risk: "",
  team: "",
  onlyContract: false,
  text: "",
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

// ── Dashboards (resultados derivados; ação governada relê a fonte) ──────────

export type DashboardScorecard = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  confidence: ConfidenceState;
};

export type DashboardSeriesPoint = {
  cycle: string;
  expected: number | null;
  actual: number | null;
  confidence: ConfidenceState;
};

export type DashboardDrillSource = {
  outcomeId: string;
  value: string;
  valid: boolean;
  source: string;
  window: string;
};

export type DashboardMetricSeries = {
  id: string;
  title: string;
  objectiveId: string;
  targetId: string;
  metricId: string;
  unit: string;
  confidence: ConfidenceState;
  points: DashboardSeriesPoint[];
  sources: DashboardDrillSource[];
};

export type DashboardTargetCard = {
  targetId: string;
  objectiveId: string;
  title: string;
  expected: string;
  actual: string;
  period: string;
  confidence: ConfidenceState;
  outcomeCount: number;
  invalidCount: number;
};

export type GovernanceDashboardViewModel = {
  sourceRevision: string;
  derived: true;
  cycles: string[];
  scorecards: DashboardScorecard[];
  targetCards: DashboardTargetCard[];
  series: DashboardMetricSeries[];
};

// ── Tabelas / data grids (listas operacionais densas) ───────────────────────

export type TableRowKind = "intent" | "proposal" | "standalone" | "target" | "incident";

export type GovernanceTableRow = {
  id: string;
  kind: TableRowKind;
  title: string;
  owner: string;
  team: string;
  repos: string[];
  cycle: string;
  status: string;
  confidence: ConfidenceState;
  risk: RiskLevel;
  evidence: string;
  nextStep: string;
  contract: string;
  source: string;
};

export type GovernanceTableViewModel = {
  name: string;
  sourceRevision: string;
  derived: true;
  rows: GovernanceTableRow[];
};

// ── Grafo técnico / console (exploração avançada, nunca a Home) ─────────────

export type GovernanceGraphNode = {
  id: string;
  type: string;
  label: string;
  owner: string;
  team: string;
  cycle: string;
  status: string;
  confidence: ConfidenceState;
  touchesContract: boolean;
  source: string;
};

export type GovernanceGraphEdge = {
  id: string;
  source: string;
  target: string;
  type: string;
};

export type GovernanceGraphViewModel = {
  name: string;
  sourceRevision: string;
  derived: true;
  nodes: GovernanceGraphNode[];
  edges: GovernanceGraphEdge[];
  nodeTypes: string[];
};

export type GraphFilterState = {
  types: string[];
  owner: string;
  team: string;
  cycle: string;
  confidence: string;
  status: string;
  onlyContract: boolean;
  source: string;
};

export const EMPTY_GRAPH_FILTER: GraphFilterState = {
  types: [],
  owner: "",
  team: "",
  cycle: "",
  confidence: "",
  status: "",
  onlyContract: false,
  source: "",
};
