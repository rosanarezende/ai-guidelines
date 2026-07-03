export type IssueLevel = "error" | "warn";

export type GovernanceIssue = {
  level: IssueLevel;
  rule: string;
  node: string;
  msg: string;
};

export type Authority = {
  id: string;
  kind: "sponsor" | "role" | string;
  of?: string;
  note?: string;
};

export type MetricDefinition = {
  id: string;
  unit: string;
  source: string;
  aggregation: "sum" | "avg" | "p99" | "last" | string;
  owner: string;
};

export type Target = {
  id: string;
  node: string;
  metric: string;
  period: string;
  expected: string;
  definer: string;
  attester: string;
  "contributes-to": string;
  status: string;
  "attestation-collapse"?: {
    reason: string;
    "approved-by": string;
    "review-at": string;
    visibility: string;
  };
};

export type DashboardTarget = Omit<Target, "metric"> & {
  metric: MetricDefinition | null;
  outcomes: OutcomeView[];
  actual: string;
  actualCount: number;
  invalidCount: number;
};

export type Objective = {
  id: string;
  level: string;
  title: string;
  period: string;
  owner: string;
  status: string;
  targets: Target[];
  issues: GovernanceIssue[];
};

export type IntentWork = {
  id: string;
  repo: string;
  purpose: "create" | "sustain" | "discover" | "operate" | string;
  desc: string;
  review: string;
  module?: string;
  timebox?: string;
  "blocked-by"?: string[];
  "delivery-after"?: string[];
};

export type Intent = {
  id: string;
  title: string;
  team: string;
  "authorized-by": string;
  "primary-target": string;
  approach: "validate-first" | "direct" | string;
  signal: "none" | "touches-contract" | "operational-target" | string;
  thesis?: string;
  hypothesis?: string;
  "decision-rule"?: string;
  "contracts-changed"?: string[];
  "contracts-consumed"?: string[];
  "depends-on"?: string[];
  works: IntentWork[];
  next: Array<{ when: string; then: string; gate?: string }>;
  target: Target | null;
  workCount: number;
  repos: string[];
};

export type RepoWorkClaim = {
  schema?: string;
  id: string;
  intent?: string;
  work?: string;
  repo: string;
  purpose?: string;
  desc?: string;
  review?: string;
  status?: "acknowledged" | "active" | "blocked" | "done" | "dropped" | string;
  owner?: string;
  "started-at"?: string;
  "completed-at"?: string;
  evidence?: Record<string, unknown>;
  verification?: Record<string, unknown>;
};

export type StandaloneWork = {
  schema?: string;
  id: string;
  kind: "fix" | "dep-bump" | string;
  repo: string;
  origin: string;
  review?: string;
  placar: string;
  status?: string;
  owner?: string;
  evidence?: Record<string, unknown>;
  verification?: Record<string, unknown>;
};

export type Contract = {
  id: string;
  revision: string;
  "owner-repo": string;
  consumers: string[];
  "compatibility-window"?: string;
  interface?: Record<string, unknown>;
  "revision-proposals"?: Array<{
    id: string;
    revision: string;
    breaking: boolean;
    intents: string[];
    consumers: string[];
    "owner-approval": string;
    decision: string;
    "compatibility-window"?: string;
  }>;
};

export type RepoContract = {
  id: string;
  revision: string;
  ownerRepo: string;
  consumers: string[];
};

export type RepoContext = {
  repo: string;
  generatedAt?: string;
  capabilities?: string[];
};

export type RepoStatus = {
  id: string;
  owner: string;
  kind?: string;
  caps?: string[];
  context: RepoContext | null;
  works: RepoWorkClaim[];
  contracts: RepoContract[];
};

export type Outcome = {
  id: string;
  "emitted-by": string;
  source: string;
  window: { start: string; end: string };
  metric: string;
  value: string;
  aggregation: string;
  "attested-by": string;
  revision: string;
  "contract-revisions": string[];
  "contributes-to": string;
  envelope?: Record<string, unknown>;
};

export type OutcomeView = Outcome & {
  valid: boolean;
  errors: GovernanceIssue[];
};

export type Incident = {
  id: string;
  kind: string;
  repo: string;
  origin: string;
  severity: string;
  status?: string;
  mttr?: string;
  postmortem?: string;
  "follow-ups"?: Array<{ ref: string; kind: string; reason: string }>;
};

export type Proposal = {
  id: string;
  title: string;
  "raised-by": string;
  "authorized-by": string;
  target?: string;
  status: string;
  note?: string;
};

export type Triage = {
  proposal: string;
  "recorded-by": string;
  summary: string;
  items?: Array<Record<string, unknown>>;
};

export type Verdict = {
  id: string;
  intent: string;
  outcome: string;
  verdict: string;
  next: string;
};

export type BreakGlass = {
  id: string;
  mutation: string;
  subject: string;
  reason: string;
  "review-at": string;
};

export type GraphReadModel = {
  nodes: Array<{ id: string; type: string; label?: string; data?: unknown }>;
  edges: Array<{ id: string; source: string; target: string; type: string }>;
};

export type IntegrationAdapterKind = {
  purpose: string;
  "may-write-authoritative-state": boolean | string;
};

export type IntegrationItem = {
  id: string;
  category: string;
  systems: string[];
  "adapter-kind": string;
  feeds: string[];
  "framework-works-without-it": boolean;
  "value-add": string;
  authority: string;
  priority: "P0" | "P1" | "P2" | "deferred" | string;
};

export type IntegrationCatalog = {
  schema: string;
  status: string;
  authority: string;
  principle: string;
  "adapter-kinds": Record<string, IntegrationAdapterKind>;
  "common-contract": {
    "required-fields": string[];
    "fail-closed-when": string[];
    never: string[];
  };
  integrations: IntegrationItem[];
};

export type GovernanceSnapshot = {
  revision: string;
  company: string;
  profileDeclaration: {
    scope: string;
    profile: string;
    eligibility?: string;
    "approved-by"?: string;
    ttl?: string;
    "review-at"?: string;
  };
  counts: {
    objectives: number;
    targets: number;
    proposals: number;
    intents: number;
    repos: number;
    contracts: number;
    outcomes: number;
    incidents: number;
    triages: number;
    verdicts: number;
    breakGlass: number;
    graphNodes: number;
    graphEdges: number;
    errors: number;
    warnings: number;
  };
  issues: GovernanceIssue[];
  graph: GraphReadModel;
  portfolio: {
    objectives: Objective[];
    intents: Intent[];
  };
  targets: DashboardTarget[];
  operations: {
    incidents: Incident[];
    standalone: StandaloneWork[];
    proposals: Proposal[];
    triages: Triage[];
    verdicts: Verdict[];
    breakGlass: BreakGlass[];
  };
  repos: RepoStatus[];
  authorities: Authority[];
  contracts: Contract[];
  metrics: MetricDefinition[];
  outcomes: OutcomeView[];
  integrationCatalog: IntegrationCatalog;
};

export type CommandType =
  | "proposal.create"
  | "triage.save"
  | "gate.decide"
  | "intent.activate"
  | "breakdown.apply"
  | "repo-work.ack"
  | "standalone.complete"
  | "contract.propose-revision"
  | "outcome.publish"
  | "verdict.accept"
  | "incident.declare"
  | "policy.break-glass";

export type CommandEnvelope = {
  actor: string;
  authority: string;
  "base-revision": string;
  "idempotency-key": string;
  "issued-at": string;
  nonce: string;
};

export type GovernedCommand = {
  id: string;
  type: CommandType;
  envelope: CommandEnvelope;
  payload: Record<string, unknown>;
};

export type CommandResult = {
  ok: boolean;
  issues: GovernanceIssue[];
  receipt?: Record<string, unknown>;
};
