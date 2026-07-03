import { buildGraphReadModel, openFileGovernanceRuntime } from "../../../_lib/index.mjs";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  loadPublishedRepoContracts,
  validateRepoContracts,
} from "../../../_tools/repo-contracts.mjs";
import { loadPublishedContexts, validateRepoContexts } from "../../../_tools/repo-contexts.mjs";
import { loadPublishedRepoWorks, validateRepoWorks } from "../../../_tools/repo-works.mjs";
import { parse } from "yaml";
import type {
  Authority,
  BreakGlass,
  CommandResult,
  Contract,
  DashboardTarget,
  GovernedCommand,
  GovernanceIssue,
  GovernanceSnapshot,
  GraphReadModel,
  IntegrationCatalog,
  Incident,
  Intent,
  MetricDefinition,
  Objective,
  Outcome,
  OutcomeView,
  Proposal,
  RepoContract,
  RepoContext,
  RepoStatus,
  RepoWorkClaim,
  StandaloneWork,
  Target,
  Triage,
  Verdict,
} from "./types";

const integrationCatalogFile = path.resolve(process.cwd(), "../../../integration-catalog.yml");

type RawOrg = {
  org: {
    company: string;
    "profile-declaration": GovernanceSnapshot["profileDeclaration"];
  };
  objectives: Array<Omit<Objective, "targets" | "issues">>;
  targets: Target[];
  metrics: MetricDefinition[];
  intents: Array<Omit<Intent, "target" | "workCount" | "repos">>;
  outcomes: Outcome[];
  repos: Array<{ id: string; owner: string; kind?: string; caps?: string[] }>;
  contracts: Contract[];
  authorities?: Authority[];
  incidents?: Incident[];
  standalone?: StandaloneWork[];
  proposals?: Proposal[];
  triages?: Triage[];
  verdicts?: Verdict[];
  policy?: { "break-glass"?: BreakGlass[] };
};

function asOrg(value: Record<string, unknown>): RawOrg {
  return value as unknown as RawOrg;
}

function sortById<T extends { id: string }>(items: T[] = []): T[] {
  return [...items].sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

function sortTriages(items: Triage[] = []): Triage[] {
  return [...items].sort((a, b) => String(a.proposal).localeCompare(String(b.proposal)));
}

function byId<T extends { id: string }>(items: T[] = []): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

function errorsForNode(issues: GovernanceIssue[], node: string): GovernanceIssue[] {
  return issues.filter((issue) => issue.level === "error" && issue.node === node);
}

function issuesForNode(issues: GovernanceIssue[], node: string): GovernanceIssue[] {
  return issues.filter((issue) => issue.node === node);
}

function buildTargetDashboard(org: RawOrg, issues: GovernanceIssue[]): DashboardTarget[] {
  const metrics = byId(org.metrics);
  const outcomesByTarget = new Map<string, OutcomeView[]>();

  for (const outcome of org.outcomes || []) {
    const errors = errorsForNode(issues, outcome.id);
    const entry: OutcomeView = { ...outcome, valid: errors.length === 0, errors };
    const key = outcome["contributes-to"] || "unassigned";
    outcomesByTarget.set(key, [...(outcomesByTarget.get(key) || []), entry]);
  }

  return sortById(org.targets).map((target) => {
    const outcomes = outcomesByTarget.get(target.id) || [];
    const validOutcomes = outcomes.filter((outcome) => outcome.valid);
    const metric = metrics.get(target.metric) || null;
    return {
      ...target,
      metric,
      outcomes,
      actual: validOutcomes.length
        ? validOutcomes.map((outcome) => `${outcome.value} (${outcome.id})`).join(" · ")
        : "sem actual valido",
      actualCount: validOutcomes.length,
      invalidCount: outcomes.length - validOutcomes.length,
    };
  });
}

function buildPortfolio(org: RawOrg, issues: GovernanceIssue[]): GovernanceSnapshot["portfolio"] {
  const targets = byId(org.targets);
  const objectives = sortById(org.objectives).map<Objective>((objective) => ({
    ...objective,
    targets: sortById(org.targets.filter((target) => target["contributes-to"] === objective.id)),
    issues: issuesForNode(issues, objective.id),
  }));
  const intents = sortById(org.intents).map<Intent>((intent) => ({
    ...intent,
    target: targets.get(intent["primary-target"]) || null,
    workCount: (intent.works || []).length,
    repos: [...new Set((intent.works || []).map((work) => work.repo))].sort(),
  }));
  return { objectives, intents };
}

function buildOperationalBucket(org: RawOrg): GovernanceSnapshot["operations"] {
  return {
    incidents: sortById(org.incidents || []),
    standalone: sortById(org.standalone || []),
    proposals: sortById(org.proposals || []),
    triages: sortTriages(org.triages || []),
    verdicts: sortById(org.verdicts || []),
    breakGlass: sortById(org.policy?.["break-glass"] || []),
  };
}

function asRepoContexts(value: unknown[]): RepoContext[] {
  return value as RepoContext[];
}

function asRepoWorks(value: unknown[]): RepoWorkClaim[] {
  return value as RepoWorkClaim[];
}

function asRepoContracts(value: unknown[]): RepoContract[] {
  return value as RepoContract[];
}

function buildRepoStatus(
  org: RawOrg,
  repoContexts: RepoContext[],
  repoWorks: RepoWorkClaim[],
  repoContracts: RepoContract[]
): RepoStatus[] {
  const contextsByRepo = new Map(repoContexts.map((context) => [context.repo, context]));
  const worksByRepo = new Map<string, RepoWorkClaim[]>();
  for (const work of repoWorks) {
    worksByRepo.set(work.repo, [...(worksByRepo.get(work.repo) || []), work]);
  }

  const contractsByRepo = new Map<string, RepoContract[]>();
  for (const contract of repoContracts) {
    contractsByRepo.set(contract.ownerRepo, [
      ...(contractsByRepo.get(contract.ownerRepo) || []),
      contract,
    ]);
  }

  return sortById(org.repos).map((repo) => ({
    ...repo,
    context: contextsByRepo.get(repo.id) || null,
    works: sortById(worksByRepo.get(repo.id) || []),
    contracts: sortById(contractsByRepo.get(repo.id) || []),
  }));
}

function loadIntegrationCatalog(): IntegrationCatalog {
  return parse(readFileSync(integrationCatalogFile, "utf8")) as IntegrationCatalog;
}

export async function loadGovernanceSnapshot(): Promise<GovernanceSnapshot> {
  const runtime = openFileGovernanceRuntime();
  const org = asOrg(runtime.loadOrg());
  const repoContexts = asRepoContexts(loadPublishedContexts());
  const repoWorks = asRepoWorks(loadPublishedRepoWorks());
  const repoContracts = asRepoContracts(loadPublishedRepoContracts());
  const issues: GovernanceIssue[] = [
    ...runtime.validateOrg(org as unknown as Record<string, unknown>),
    ...(await validateRepoContexts(org, { publishedContexts: repoContexts })),
    ...validateRepoWorks(org, { publishedClaims: repoWorks }),
    ...validateRepoContracts(org, { publishedContracts: repoContracts }),
  ];
  const graph = buildGraphReadModel({
    org,
    issues,
    repoContexts,
    repoWorks,
    repoContracts,
  }) as GraphReadModel;
  const errors = issues.filter((issue) => issue.level === "error");
  const warnings = issues.filter((issue) => issue.level === "warn");

  return {
    revision: runtime.currentRevision(),
    company: org.org.company,
    profileDeclaration: org.org["profile-declaration"],
    counts: {
      objectives: org.objectives.length,
      targets: org.targets.length,
      proposals: org.proposals?.length || 0,
      intents: org.intents.length,
      repos: org.repos.length,
      contracts: org.contracts.length,
      outcomes: org.outcomes.length,
      incidents: org.incidents?.length || 0,
      triages: org.triages?.length || 0,
      verdicts: org.verdicts?.length || 0,
      breakGlass: org.policy?.["break-glass"]?.length || 0,
      graphNodes: graph.nodes.length,
      graphEdges: graph.edges.length,
      errors: errors.length,
      warnings: warnings.length,
    },
    issues,
    graph,
    portfolio: buildPortfolio(org, issues),
    targets: buildTargetDashboard(org, issues),
    operations: buildOperationalBucket(org),
    repos: buildRepoStatus(org, repoContexts, repoWorks, repoContracts),
    authorities: sortById(org.authorities || []),
    contracts: sortById(org.contracts || []),
    metrics: sortById(org.metrics || []),
    integrationCatalog: loadIntegrationCatalog(),
    outcomes: sortById(org.outcomes || []).map((outcome) => ({
      ...outcome,
      valid: errorsForNode(issues, outcome.id).length === 0,
      errors: errorsForNode(issues, outcome.id),
    })),
  };
}

export function dryRunCommand(command: GovernedCommand): CommandResult {
  const runtime = openFileGovernanceRuntime();
  return runtime.dryRunGovernedCommand(command, {
    currentRevision: runtime.currentRevision(),
    history: runtime.repository.loadCommandHistory(),
  });
}

export function executeCommand(command: GovernedCommand): CommandResult {
  return openFileGovernanceRuntime().executeGovernedCommand(command);
}
