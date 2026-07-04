// governance-snapshot.ts — use case de leitura: snapshot completo do host demo.
// Movido do frontend para a camada de aplicação: o app consome via SDK/API,
// sem importar implementação interna do backend.
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import {
  loadPublishedRepoContracts,
  validateRepoContracts,
} from "../../adapters/repo-first/repo-contracts.ts";
import {
  loadPublishedContexts,
  validateRepoContexts,
} from "../../adapters/repo-first/repo-contexts.ts";
import { loadPublishedRepoWorks, validateRepoWorks } from "../../adapters/repo-first/repo-works.ts";
import { buildGraphReadModel } from "../../domain/graph/build.ts";
import type {
  DashboardTarget,
  GovernanceIssue,
  GovernanceSnapshot,
  GovernedCommand,
  IntegrationCatalog,
  Intent,
  Objective,
  OrgSnapshot,
  OutcomeView,
  RepoContract,
  RepoStatus,
  RepoWorkClaim,
  Triage,
} from "../../domain/index.ts";
import type { DryRunResult } from "../../domain/commands.ts";
import { INTEGRATION_CATALOG_FILE } from "../../shared/paths.ts";
import { openFileGovernanceRuntime } from "../runtime.ts";

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

function buildTargetDashboard(org: OrgSnapshot, issues: GovernanceIssue[]): DashboardTarget[] {
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

function buildPortfolio(
  org: OrgSnapshot,
  issues: GovernanceIssue[]
): GovernanceSnapshot["portfolio"] {
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

function buildOperationalBucket(org: OrgSnapshot): GovernanceSnapshot["operations"] {
  return {
    incidents: sortById(org.incidents || []),
    standalone: sortById(org.standalone || []),
    proposals: sortById(org.proposals || []),
    triages: sortTriages(org.triages || []),
    verdicts: sortById(org.verdicts || []),
    breakGlass: sortById(org.policy?.["break-glass"] || []),
  };
}

function buildRepoStatus(
  org: OrgSnapshot,
  repoContexts: Array<{ repo: string }>,
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
    context: (contextsByRepo.get(repo.id) as RepoStatus["context"]) || null,
    works: sortById(worksByRepo.get(repo.id) || []),
    contracts: sortById(contractsByRepo.get(repo.id) || []),
  }));
}

// Catálogo de integrações é dado NEUTRO (adapter kinds), não dado da org acme:
// pode alimentar onboarding/settings de qualquer organização sem vazar a demo.
export function loadIntegrationCatalog(): IntegrationCatalog {
  return parse(readFileSync(INTEGRATION_CATALOG_FILE, "utf8")) as IntegrationCatalog;
}

export async function loadGovernanceSnapshot(): Promise<GovernanceSnapshot> {
  const runtime = openFileGovernanceRuntime();
  const org = runtime.loadOrg();
  const repoContexts = loadPublishedContexts();
  const repoWorks = loadPublishedRepoWorks();
  const repoContracts = loadPublishedRepoContracts();
  const issues: GovernanceIssue[] = [
    ...runtime.validateOrg(org),
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
  });
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

export function dryRunCommand(command: GovernedCommand): DryRunResult {
  const runtime = openFileGovernanceRuntime();
  return runtime.dryRunGovernedCommand(command, {
    currentRevision: runtime.currentRevision(),
    history: runtime.repository.loadCommandHistory(),
  });
}

export function executeCommand(command: GovernedCommand): DryRunResult {
  return openFileGovernanceRuntime().executeGovernedCommand(command);
}
