// from-snapshot.ts — constrói os view-models a partir do read-model REAL da
// demo acme (GovernanceSnapshot). Roda no servidor; entrega dados serializáveis
// e independentes de renderer. Nada aqui escreve estado.
import type { GovernanceSnapshot, Intent } from "@demo/backend/domain";
import { cycleFromWindow, targetConfidence, targetRisk, issueRisk } from "./confidence";
import type {
  ConfidenceState,
  GovernanceDashboardViewModel,
  GovernanceMapViewModel,
  GovernanceMapNode,
  GovernanceMapEdge,
} from "./view-models";

// ── Mapa de governança: um recorte guiado por objetivo ──────────────────────

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

    const dashboards = snapshot.targets.filter((t) => t["contributes-to"] === objective.id);
    const breakGlass = snapshot.operations.breakGlass;

    addNode({
      id: objective.id,
      kind: "objective",
      title: objective.title,
      subtitle: `${objective.period} · ${objective.owner}`,
      confidence: dashboards.some((t) => t.actualCount > 0) ? "verified" : "pending",
      risk: issueRisk(objective.id, snapshot.issues),
      nextStep: objective.status === "active" ? "Acompanhar targets do ciclo" : objective.status,
    });

    const dashboardNodeId = `${objective.id}::dashboard`;
    addNode({
      id: dashboardNodeId,
      kind: "dashboard",
      title: "Dashboard do objetivo",
      subtitle: "Resultados derivados; ação governada relê a fonte",
      confidence: "verified",
      risk: "low",
      cta: { label: "Ver resultados", href: "/console?view=company" },
    });

    for (const target of dashboards) {
      const confidence = targetConfidence(target, breakGlass);
      addNode({
        id: target.id,
        kind: "target",
        title: target.expected,
        subtitle: `${target.node} · ${target.period}`,
        confidence,
        risk: targetRisk(target, snapshot.issues),
        riskNote: target["attestation-collapse"]?.reason,
        nextStep:
          target.actualCount === 0 ? "Publicar primeiro outcome" : "Comparar actual vs esperado",
        evidence:
          target.actualCount > 0
            ? `${target.actualCount} outcome(s) válido(s): ${target.actual}`
            : undefined,
      });
      addEdge(objective.id, target.id, "define alvo");

      for (const outcome of target.outcomes) {
        addNode({
          id: outcome.id,
          kind: "outcome",
          title: `${outcome.metric}: ${outcome.value}`,
          subtitle: cycleFromWindow(outcome.window.start, outcome.window.end),
          confidence: outcome.valid ? "verified" : "pending",
          risk: outcome.valid ? "low" : "high",
          evidence: `Fonte: ${outcome.source} · atestado por ${outcome["attested-by"]}`,
        });
        addEdge(outcome.id, dashboardNodeId, "alimenta");
      }
    }

    const intents = snapshot.portfolio.intents.filter(
      (intent) => intent.target && intent.target["contributes-to"] === objective.id
    );
    for (const intent of intents) appendIntentPath(intent, snapshot, addNode, addEdge);

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

function appendIntentPath(
  intent: Intent,
  snapshot: GovernanceSnapshot,
  addNode: (node: GovernanceMapNode) => void,
  addEdge: (from: string, to: string, label?: string) => void
): void {
  const verdict = snapshot.operations.verdicts.find((entry) => entry.intent === intent.id);
  const nextRule = intent.next?.[0];
  addNode({
    id: intent.id,
    kind: "intent",
    title: intent.title,
    subtitle: `${intent.team} · ${intent.approach}`,
    confidence: verdict ? "verified" : "pending",
    risk: issueRisk(intent.id, snapshot.issues),
    nextStep: nextRule ? `Se ${nextRule.when}: ${nextRule.then}` : "Aguardando decisão",
    evidence: intent.hypothesis,
    cta: { label: "Ver intent", href: "/console?view=execution" },
  });
  if (intent.target) addEdge(intent.target.id, intent.id, "orienta");

  if (verdict) {
    addNode({
      id: verdict.id,
      kind: "decision",
      title: `Decisão: ${verdict.verdict}`,
      subtitle: verdict["decided-by"] ? `por ${verdict["decided-by"]}` : undefined,
      confidence: verdict.override ? "break-glass" : "verified",
      risk: verdict.override ? "attention" : "low",
      nextStep: verdict.next,
      evidence: verdict.evidence?.join("; "),
    });
    addEdge(intent.id, verdict.id, "gate");
  }

  for (const work of intent.works ?? []) {
    const workId = `${intent.id}::${work.id}`;
    addNode({
      id: workId,
      kind: "repo-work",
      title: work.desc || work.id,
      subtitle: `${work.repo} · ${work.purpose}`,
      confidence: work.review ? "verified" : "pending",
      risk: (work["blocked-by"]?.length ?? 0) > 0 ? "attention" : "low",
      nextStep: work["blocked-by"]?.length
        ? `Bloqueado por ${work["blocked-by"]?.join(", ")}`
        : undefined,
      evidence: work.review ? `Review: ${work.review}` : undefined,
    });
    addEdge(intent.id, workId, "quebra em");
  }

  for (const contractId of intent["contracts-changed"] ?? []) {
    addContractNode(contractId, snapshot, addNode);
    addEdge(intent.id, contractId, "muda contrato");
  }
  for (const contractId of intent["contracts-consumed"] ?? []) {
    addContractNode(contractId, snapshot, addNode);
    addEdge(contractId, intent.id, "consome");
  }
}

function addContractNode(
  contractId: string,
  snapshot: GovernanceSnapshot,
  addNode: (node: GovernanceMapNode) => void
): void {
  const contract = snapshot.contracts.find((entry) => entry.id === contractId);
  addNode({
    id: contractId,
    kind: "contract",
    title: contract ? `${contract.id}@${contract.revision}` : contractId,
    subtitle: contract ? `dono: ${contract["owner-repo"]}` : undefined,
    confidence: contract ? "verified" : "no-evidence",
    risk: issueRisk(contractId, snapshot.issues),
  });
}

// ── Dashboard view-model (dados reais; séries densas vêm da fixture) ────────

export function buildDashboardViewModel(
  snapshot: GovernanceSnapshot
): GovernanceDashboardViewModel {
  const breakGlass = snapshot.operations.breakGlass;
  const cycles = [
    ...new Set(
      snapshot.outcomes.map((outcome) => cycleFromWindow(outcome.window.start, outcome.window.end))
    ),
  ].sort();

  const targetCards = snapshot.targets.map((target) => ({
    targetId: target.id,
    objectiveId: target["contributes-to"],
    title: `${target.node} · ${target.metric?.id ?? "sem métrica"}`,
    expected: target.expected,
    actual: target.actual || "sem outcome válido",
    period: target.period,
    confidence: targetConfidence(target, breakGlass),
    outcomeCount: target.actualCount,
    invalidCount: target.invalidCount,
  }));

  const counts = snapshot.counts;
  const confidenceOf = (ok: boolean): ConfidenceState => (ok ? "verified" : "pending");
  const scorecards = [
    {
      id: "objectives",
      label: "Objetivos ativos",
      value: String(counts.objectives),
      confidence: confidenceOf(counts.errors === 0),
    },
    {
      id: "targets",
      label: "Targets com outcome válido",
      value: `${targetCards.filter((card) => card.outcomeCount > 0).length}/${counts.targets}`,
      confidence: confidenceOf(targetCards.every((card) => card.invalidCount === 0)),
    },
    {
      id: "self-declared",
      label: "Medições auto-declaradas",
      value: String(targetCards.filter((card) => card.confidence === "self-declared").length),
      hint: "attestation-collapse aprovado e visível",
      confidence: "self-declared" as ConfidenceState,
    },
    {
      id: "issues",
      label: "Erros de validação",
      value: String(counts.errors),
      confidence: confidenceOf(counts.errors === 0),
    },
  ];

  const series = snapshot.targets
    .filter((target) => target.outcomes.length > 0)
    .map((target) => ({
      id: `serie-${target.id}`,
      title: `${target.metric?.id ?? target.id} (${target.node})`,
      objectiveId: target["contributes-to"],
      targetId: target.id,
      metricId: target.metric?.id ?? "",
      unit: target.metric?.unit ?? "",
      confidence: targetConfidence(target, breakGlass),
      points: target.outcomes.map((outcome) => ({
        cycle: cycleFromWindow(outcome.window.start, outcome.window.end),
        expected: null,
        actual: parseLooseNumber(outcome.value),
        confidence: confidenceOf(outcome.valid),
      })),
      sources: target.outcomes.map((outcome) => ({
        outcomeId: outcome.id,
        value: outcome.value,
        valid: outcome.valid,
        source: outcome.source,
        window: `${outcome.window.start} → ${outcome.window.end}`,
      })),
    }));

  return {
    sourceRevision: snapshot.revision,
    derived: true,
    cycles,
    scorecards,
    targetCards,
    series,
  };
}

function parseLooseNumber(value: string): number | null {
  const match = String(value).match(/-?\d+(?:[.,]\d+)?/);
  return match ? Number(match[0].replace(",", ".")) : null;
}

// A tabela operacional real mora em ./table-from-snapshot.ts (limite de linhas).
export { buildTableViewModel } from "./table-from-snapshot";
