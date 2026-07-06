// governance.ts — shared domain DTOs for the v3 simulation.
//
// These types are intentionally framework-free. The Next app, command handlers,
// and adapters share this contract instead of duplicating app-local shapes.
// A seção "raw org snapshot" descreve a forma autoritativa carregada do host
// file-first; chaves extras continuam possíveis em runtime (o schema fechado é
// validado dinamicamente pelo validador de domínio).

export type IssueLevel = "error" | "warn";

export type GovernanceIssue = {
  level: IssueLevel;
  rule: string;
  node: string;
  msg: string;
  messageKey?: string;
  params?: Record<string, string | number | boolean | null>;
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

export type ObjectiveDef = {
  id: string;
  level: string;
  title: string;
  period: string;
  owner: string;
  status: string;
  "continues-from"?: string;
};

export type Objective = ObjectiveDef & {
  targets: Target[];
  issues: GovernanceIssue[];
};

export type Area = {
  id: string;
  title: string;
  "cascades-from": string | string[];
  driver: string;
  owner: string;
};

export type Team = {
  id: string;
  area: string;
  lead: string;
};

export type Thesis = {
  id: string;
  frames: string;
  says: string;
  owner: string;
};

export type RepoModule = {
  id: string;
  owner: string;
  caps?: string[];
};

export type RepoDef = {
  id: string;
  owner: string;
  caps?: string[];
  kind?: string;
  note?: string;
  modules?: RepoModule[];
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

export type IntentDef = {
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
};

export type Intent = IntentDef & {
  target: Target | null;
  workCount: number;
  repos: string[];
};

export type WorkEvidence = {
  kind?: string;
  command?: string;
  result?: string;
  files?: string[];
};

export type WorkVerification = {
  "checked-by"?: string;
  result?: string;
};

export type RepoWorkSource = {
  kind?: string;
  file?: string;
  breakdownHash?: string;
};

export type RepoWorkClaim = {
  schema?: string;
  id: string;
  intent?: string;
  work?: string;
  repo: string;
  module?: string;
  purpose?: string;
  desc?: string;
  review?: string;
  status?: "acknowledged" | "active" | "blocked" | "done" | "dropped" | string;
  owner?: string;
  "started-at"?: string;
  "base-revision"?: string;
  "completed-at"?: string;
  "source-commit"?: string;
  evidence?: WorkEvidence;
  verification?: WorkVerification;
  "blocked-by"?: string;
  reason?: string;
  decision?: string;
  fate?: string;
  source?: RepoWorkSource;
  code?: { touchpoints?: string[] };
  _file?: string;
  _repo?: string;
};

export type MatcherSuggestion = {
  repo: string;
  score?: number;
  unknown?: boolean;
  evidence?: string[];
};

export type StandaloneRouting = {
  matcher: string;
  query: string;
  "selected-repo": string;
  decision: "followed" | "overrode" | string;
  "decided-by": string;
  suggestions: MatcherSuggestion[];
  reason?: string;
  egress?: {
    classification: "public" | "internal" | "restricted" | string;
    allowed: boolean;
    provider?: string;
  };
  fallback?: {
    mode: "local-index" | "manual-triage" | "break-glass" | string;
    "recorded-by": string;
    reason: string;
  };
};

export type StandaloneWork = {
  schema?: string;
  id: string;
  kind: "fix" | "dep-bump" | string;
  repo: string;
  origin: string;
  review?: string;
  placar: string;
  routing?: StandaloneRouting;
  source?: { kind?: string };
  status?: string;
  owner?: string;
  "started-at"?: string;
  "base-revision"?: string;
  "completed-at"?: string;
  "source-commit"?: string;
  evidence?: WorkEvidence;
  verification?: WorkVerification;
  "blocked-by"?: string;
  reason?: string;
  decision?: string;
  fate?: string;
  _file?: string;
  _repo?: string;
};

export type ContractRevisionProposal = {
  id: string;
  revision: string;
  breaking: boolean;
  intents: string[];
  consumers: string[];
  "owner-approval": string;
  decision: string;
  "compatibility-window"?: string;
};

export type Contract = {
  id: string;
  revision: string;
  "owner-repo": string;
  consumers: string[];
  "compatibility-window"?: string;
  interface?: Record<string, unknown>;
  "revision-proposals"?: ContractRevisionProposal[];
};

export type RepoContract = {
  schema?: string;
  id: string;
  revision: string;
  ownerRepo: string;
  consumers: string[];
  compatibilityWindow?: string | null;
  interface?: Record<string, unknown> | null;
  revisionProposals?: ContractRevisionProposal[];
  source?: { kind?: string; file?: string; contractHash?: string };
  code?: { touchpoints?: string[] };
  _file?: string;
  _repo?: string;
};

export type RepoContext = {
  repo: string;
  generatedAt?: string;
  capabilities?: Array<Record<string, unknown>>;
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

export type OutcomeEnvelope = {
  actor?: string;
  authority?: string;
  "idempotency-key"?: string;
  "issued-at"?: string;
  nonce?: string;
  "base-revision"?: string;
  "source-commit"?: string;
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
  envelope?: OutcomeEnvelope;
};

export type OutcomeView = Outcome & {
  valid: boolean;
  errors: GovernanceIssue[];
};

export type IncidentTelemetry = {
  source?: string;
  event?: string;
  "observed-at"?: string;
  query?: string;
  snapshot?: string;
};

export type Incident = {
  id: string;
  kind: string;
  repo: string;
  origin: string;
  severity: string;
  placar?: string;
  status?: string;
  "declared-by"?: string;
  "detected-at"?: string;
  telemetry?: IncidentTelemetry;
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

export type TriageItem = {
  id: string;
  question: string;
  disposition: string;
  note?: string;
};

export type Triage = {
  proposal: string;
  "recorded-by": string;
  summary: string;
  items?: TriageItem[];
  "matcher-run"?: { suggestions?: MatcherSuggestion[] };
};

export type Verdict = {
  id: string;
  intent: string;
  outcome: string;
  verdict: string;
  next: string;
  "decided-by"?: string;
  "decided-at"?: string;
  "decision-rule"?: string;
  evidence?: string[];
  override?: boolean;
  "break-glass-ref"?: string;
  supersedes?: string;
  reason?: string;
};

export type BreakGlass = {
  id: string;
  mutation: string;
  subject: string;
  reason: string;
  "review-at": string;
  "requested-by"?: string;
  "approved-by"?: string;
  "issued-at"?: string;
  "expires-at"?: string;
  evidence?: string[];
};

export type AccessRequest = {
  id: string;
  actor: string;
  action: string;
  repo: string;
  decision: "allow" | "deny" | string;
  reason: string;
  via?: string;
};

export type AuthorityRevocation = {
  authority: string;
  "revoked-at": string;
  reason: string;
};

export type SecretQuarantine = {
  hash: string;
  reason: string;
  "approved-by": string;
};

export type OracleIndependence = {
  "attack-by": string;
  "expected-by": string;
  "approved-by": string;
  corpus?: string;
};

export type TrustPolicy = {
  "access-requests"?: AccessRequest[];
  "authority-revocations"?: AuthorityRevocation[];
  "secret-quarantine"?: SecretQuarantine[];
  "break-glass"?: BreakGlass[];
  "oracle-independence"?: OracleIndependence;
};

export type ProfileDeclaration = {
  scope: string;
  profile: string;
  eligibility?: string;
  "approved-by"?: string;
  ttl?: string;
  "review-at"?: string;
  badge?: string;
};

// A forma autoritativa carregada do host file-first (acme/governance + sidecars).
export type OrgSnapshot = {
  org: { company: string; "profile-declaration": ProfileDeclaration };
  authorities: Authority[];
  objectives: ObjectiveDef[];
  areas: Area[];
  teams: Team[];
  theses: Thesis[];
  metrics: MetricDefinition[];
  targets: Target[];
  repos: RepoDef[];
  contracts: Contract[];
  proposals: Proposal[];
  triages: Triage[];
  incidents: Incident[];
  policy: TrustPolicy;
  intents: IntentDef[];
  verdicts: Verdict[];
  standalone: StandaloneWork[];
  repoWorkClaims: RepoWorkClaim[];
  repoContracts: RepoContract[];
  outcomes: Outcome[];
};

export type DerivedIntent = {
  observedApproach: "validate-first" | "direct";
  observedSignal: "none" | "touches-contract" | "operational-target";
  observedForm: string;
  collapse: "unit" | "collapsed";
  repoCount: number;
  reason: string;
};

export type GraphNode = {
  id: string;
  type: string;
  label?: string;
  data?: unknown;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  type: string;
};

export type GraphReadModel = {
  company?: string;
  profileDeclaration?: ProfileDeclaration;
  nodes: GraphNode[];
  edges: GraphEdge[];
  issues?: GovernanceIssue[];
  profiles?: unknown;
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
  profileDeclaration: ProfileDeclaration;
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
