import { buildGraphReadModel, openFileGovernanceRuntime } from "../../../_lib/index.mjs";
import {
  validateRepoContracts,
  loadPublishedRepoContracts,
} from "../../../_tools/repo-contracts.mjs";
import { validateRepoContexts, loadPublishedContexts } from "../../../_tools/repo-contexts.mjs";
import { validateRepoWorks, loadPublishedRepoWorks } from "../../../_tools/repo-works.mjs";

function byId(items = []) {
  return new Map(items.map((item) => [item.id, item]));
}

function sortById(items = []) {
  return [...items].sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

function errorsForNode(issues, node) {
  return issues.filter((issue) => issue.level === "error" && issue.node === node);
}

function buildTargetDashboard(org, issues) {
  const metrics = byId(org.metrics);
  const outcomesByTarget = new Map();
  for (const outcome of org.outcomes || []) {
    const errors = errorsForNode(issues, outcome.id);
    const entry = { ...outcome, valid: errors.length === 0, errors };
    const key = outcome["contributes-to"] || "unassigned";
    outcomesByTarget.set(key, [...(outcomesByTarget.get(key) || []), entry]);
  }

  return sortById(org.targets).map((target) => {
    const outcomes = outcomesByTarget.get(target.id) || [];
    const validOutcomes = outcomes.filter((outcome) => outcome.valid);
    return {
      ...target,
      metric: metrics.get(target.metric) || null,
      outcomes,
      actual: validOutcomes.length
        ? validOutcomes.map((outcome) => `${outcome.value} (${outcome.id})`).join(" · ")
        : "sem actual válido",
      actualCount: validOutcomes.length,
      invalidCount: outcomes.length - validOutcomes.length,
    };
  });
}

function buildPortfolio(org, issues) {
  const targets = byId(org.targets);
  const objectives = sortById(org.objectives).map((objective) => ({
    ...objective,
    targets: sortById(org.targets.filter((target) => target["contributes-to"] === objective.id)),
    issues: issues.filter((issue) => issue.node === objective.id),
  }));
  const intents = sortById(org.intents).map((intent) => ({
    ...intent,
    target: targets.get(intent["primary-target"]) || null,
    workCount: (intent.works || []).length,
    repos: [...new Set((intent.works || []).map((work) => work.repo))].sort(),
  }));
  return { objectives, intents };
}

function buildOperationalBucket(org) {
  return {
    incidents: sortById(org.incidents || []),
    standalone: sortById(org.standalone || []),
    proposals: sortById(org.proposals || []),
    triages: sortById(org.triages || []),
  };
}

function buildRepoStatus(org, repoContexts, repoWorks, repoContracts) {
  const contextsByRepo = new Map(repoContexts.map((context) => [context.repo, context]));
  const worksByRepo = new Map();
  for (const work of repoWorks)
    worksByRepo.set(work.repo, [...(worksByRepo.get(work.repo) || []), work]);
  const contractsByRepo = new Map();
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

export async function loadGovernanceSnapshot() {
  const runtime = openFileGovernanceRuntime();
  const org = runtime.loadOrg();
  const repoContexts = loadPublishedContexts();
  const repoWorks = loadPublishedRepoWorks();
  const repoContracts = loadPublishedRepoContracts();
  const issues = [
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
      proposals: org.proposals.length,
      intents: org.intents.length,
      repos: org.repos.length,
      contracts: org.contracts.length,
      outcomes: org.outcomes.length,
      incidents: (org.incidents || []).length,
      triages: (org.triages || []).length,
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
    outcomes: sortById(org.outcomes || []).map((outcome) => ({
      ...outcome,
      valid: errorsForNode(issues, outcome.id).length === 0,
      errors: errorsForNode(issues, outcome.id),
    })),
  };
}

export function dryRunCommand(command) {
  const runtime = openFileGovernanceRuntime();
  return runtime.dryRunGovernedCommand(command, {
    currentRevision: runtime.currentRevision(),
    history: runtime.repository.loadCommandHistory(),
  });
}

export function executeCommand(command) {
  return openFileGovernanceRuntime().executeGovernedCommand(command);
}
