import type {
  BreakGlass,
  DashboardTarget,
  GovernanceIssue,
  GovernanceSnapshot,
} from "@demo/backend/domain";
import type {
  GovernanceMapEdge,
  GovernanceMapNode,
  GovernanceMapViewModel,
  MapConfidenceState,
  MapRiskLevel,
} from "./view-models";

export function buildGovernanceMaps(snapshot: GovernanceSnapshot): GovernanceMapViewModel[] {
  return snapshot.portfolio.objectives.map((objective) => {
    const nodes: GovernanceMapNode[] = [];
    const edges: GovernanceMapEdge[] = [];
    const seen = new Set<string>();
    const addNode = (node: GovernanceMapNode) => {
      if (seen.has(node.id)) return;
      seen.add(node.id);
      nodes.push(node);
    };
    const addEdge = (from: string, to: string, label?: string) => {
      const id = `${from}->${to}`;
      if (edges.some((edge) => edge.id === id)) return;
      edges.push({ id, from, to, ...(label ? { label } : {}) });
    };

    addNode({
      id: objective.id,
      kind: "objective",
      title: objective.title,
      subtitle: `${objective.period} · ${objective.owner}`,
      owner: objective.owner,
      confidence: issueRisk(objective.id, snapshot.issues) === "low" ? "verified" : "pending",
      risk: issueRisk(objective.id, snapshot.issues),
    });

    const targets = snapshot.targets.filter((target) => target["contributes-to"] === objective.id);
    for (const target of targets) {
      addTarget(target, snapshot, addNode);
      addEdge(objective.id, target.id, "mede");
      addDashboard(target, addNode, addEdge);
      addOutcomes(target, addNode, addEdge);
      for (const intent of snapshot.portfolio.intents.filter(
        (item) => item["primary-target"] === target.id
      )) {
        addIntent(intent, snapshot, addNode, addEdge);
        addEdge(target.id, intent.id, "autoriza");
      }
    }

    return {
      scopeId: objective.id,
      scopeTitle: objective.title,
      sourceRevision: snapshot.revision,
      derived: true,
      nodes,
      edges,
    };
  });
}

function addTarget(
  target: DashboardTarget,
  snapshot: GovernanceSnapshot,
  addNode: (node: GovernanceMapNode) => void
) {
  addNode({
    id: target.id,
    kind: "target",
    title: target.expected,
    subtitle: `${target.node} · ${target.metric?.id ?? "sem métrica"}`,
    owner: target.definer,
    team: target.node,
    confidence: targetConfidence(target, snapshot.operations.breakGlass),
    risk: targetRisk(target, snapshot.issues),
    evidence: target.actualCount > 0 ? target.actual : undefined,
    nextStep: target.actualCount === 0 ? "publicar outcome" : "acompanhar resultado",
    cta: { label: "Ver resultados", href: "/results" },
  });
}

function addIntent(
  intent: GovernanceSnapshot["portfolio"]["intents"][number],
  snapshot: GovernanceSnapshot,
  addNode: (node: GovernanceMapNode) => void,
  addEdge: (from: string, to: string, label?: string) => void
) {
  const verdict = snapshot.operations.verdicts.find((entry) => entry.intent === intent.id);
  addNode({
    id: intent.id,
    kind: "intent",
    title: intent.title,
    subtitle: `${intent.team} · ${intent.approach}`,
    owner: intent["authorized-by"],
    team: intent.team,
    touchesContract: (intent["contracts-changed"] ?? []).length > 0,
    confidence: verdict ? "verified" : "pending",
    risk: issueRisk(intent.id, snapshot.issues),
    evidence: verdict?.evidence?.join("; "),
    nextStep: intent.next?.[0] ? intent.next[0].then : "aguardar decisão",
    cta: { label: "Abrir trabalho", href: "/work" },
  });

  for (const work of intent.works) {
    const claim = findRepoWork(snapshot, intent.id, work.id);
    const id = `${intent.id}:${work.id}`;
    addNode({
      id,
      kind: "repo-work",
      title: `${work.repo} · ${work.purpose}`,
      subtitle: work.desc,
      owner: claim?.owner ?? work.review,
      team: intent.team,
      confidence: claim?.status === "done" ? "verified" : "pending",
      risk: claim?.["blocked-by"] ? "attention" : "low",
      evidence: [claim?.evidence?.command, claim?.verification?.result].filter(Boolean).join(" · "),
      nextStep: claim?.status === "done" ? "acompanhar outcome" : "executar repo-work",
    });
    addEdge(intent.id, id, "quebra em");
  }

  for (const contractId of intent["contracts-changed"] ?? []) {
    addContract(contractId, snapshot, addNode);
    addEdge(intent.id, contractId, "muda contrato");
  }
  for (const contractId of intent["contracts-consumed"] ?? []) {
    addContract(contractId, snapshot, addNode);
    addEdge(contractId, intent.id, "coordena");
  }
}

function addContract(
  contractId: string,
  snapshot: GovernanceSnapshot,
  addNode: (node: GovernanceMapNode) => void
) {
  const contract = snapshot.contracts.find((entry) => entry.id === contractId);
  addNode({
    id: contractId,
    kind: "contract",
    title: contract ? `${contract.id}@${contract.revision}` : contractId,
    subtitle: contract ? `dono: ${contract["owner-repo"]}` : "contrato não resolvido",
    owner: contract?.["owner-repo"],
    touchesContract: true,
    confidence: contract ? "verified" : "no-evidence",
    risk: contract ? issueRisk(contractId, snapshot.issues) : "attention",
  });
}

function addOutcomes(
  target: DashboardTarget,
  addNode: (node: GovernanceMapNode) => void,
  addEdge: (from: string, to: string, label?: string) => void
) {
  for (const outcome of target.outcomes) {
    addNode({
      id: outcome.id,
      kind: "outcome",
      title: outcome.value,
      subtitle: `${outcome.metric} · ${outcome.window.start}..${outcome.window.end}`,
      owner: outcome["attested-by"],
      confidence: outcome.valid ? "verified" : "pending",
      risk: outcome.valid ? "low" : "high",
      evidence: outcome.source,
    });
    addEdge(outcome.id, target.id, "contribui");
  }
}

function addDashboard(
  target: DashboardTarget,
  addNode: (node: GovernanceMapNode) => void,
  addEdge: (from: string, to: string, label?: string) => void
) {
  const id = `dashboard:${target.id}`;
  addNode({
    id,
    kind: "dashboard",
    title: "Dashboard",
    subtitle: target.actual || "sem medição válida",
    confidence: target.actualCount > 0 ? "verified" : "no-evidence",
    risk: target.invalidCount > 0 ? "attention" : "low",
    cta: { label: "Abrir resultados", href: "/results" },
  });
  addEdge(target.id, id, "rollup");
}

function findRepoWork(snapshot: GovernanceSnapshot, intentId: string, workId: string) {
  return snapshot.repos
    .flatMap((repo) => repo.works)
    .find((work) => work.intent === intentId && work.work === workId);
}

function targetConfidence(target: DashboardTarget, breakGlass: BreakGlass[]): MapConfidenceState {
  const touchedByBreakGlass = breakGlass.some((entry) => entry.subject.includes(target.id));
  if (touchedByBreakGlass) return "break-glass";
  if (target["attestation-collapse"]) return "self-declared";
  if (target.outcomes.length === 0) return "no-evidence";
  if (target.invalidCount > 0) return "pending";
  return "verified";
}

function targetRisk(target: DashboardTarget, issues: GovernanceIssue[]): MapRiskLevel {
  if (target.invalidCount > 0) return "high";
  if (issues.some((issue) => issue.level === "error" && issue.node === target.id)) return "high";
  if (target["attestation-collapse"]) return "attention";
  if (issues.some((issue) => issue.node === target.id)) return "attention";
  return "low";
}

function issueRisk(nodeId: string, issues: GovernanceIssue[]): MapRiskLevel {
  if (issues.some((issue) => issue.level === "error" && issue.node === nodeId)) return "high";
  if (issues.some((issue) => issue.node === nodeId)) return "attention";
  return "low";
}
