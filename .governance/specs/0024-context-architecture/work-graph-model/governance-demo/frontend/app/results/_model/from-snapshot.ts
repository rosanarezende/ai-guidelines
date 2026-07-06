import type { BreakGlass, DashboardTarget, GovernanceSnapshot } from "@demo/contracts";
import type { ResultConfidenceState, ResultsDashboardViewModel } from "./view-models";

export function buildResultsDashboard(snapshot: GovernanceSnapshot): ResultsDashboardViewModel {
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

  const confidenceOf = (ok: boolean): ResultConfidenceState => (ok ? "verified" : "pending");
  const scorecards = [
    {
      id: "objectives",
      label: "Objetivos ativos",
      value: String(snapshot.counts.objectives),
      confidence: confidenceOf(snapshot.counts.errors === 0),
    },
    {
      id: "measured-targets",
      label: "Metas com medição válida",
      value: `${targetCards.filter((card) => card.outcomeCount > 0).length}/${
        snapshot.counts.targets
      }`,
      confidence: confidenceOf(targetCards.every((card) => card.invalidCount === 0)),
    },
    {
      id: "self-declared",
      label: "Medições auto-declaradas",
      value: String(targetCards.filter((card) => card.confidence === "self-declared").length),
      detail: "attestation-collapse aprovado e visível",
      confidence: "self-declared" as const,
    },
    {
      id: "validation-errors",
      label: "Erros de validação",
      value: String(snapshot.counts.errors),
      confidence: confidenceOf(snapshot.counts.errors === 0),
    },
  ];

  const series = snapshot.targets
    .filter((target) => target.outcomes.length > 0)
    .map((target) => ({
      id: `series-${target.id}`,
      title: `${target.metric?.id ?? target.id} (${target.node})`,
      objectiveId: target["contributes-to"],
      targetId: target.id,
      metricId: target.metric?.id ?? "",
      unit: target.metric?.unit ?? "",
      confidence: targetConfidence(target, breakGlass),
      points: target.outcomes.map((outcome) => ({
        cycle: cycleFromWindow(outcome.window.start, outcome.window.end),
        expected: parseLooseNumber(target.expected),
        actual: parseLooseNumber(outcome.value),
        confidence: confidenceOf(outcome.valid),
      })),
      sources: target.outcomes.map((outcome) => ({
        outcomeId: outcome.id,
        value: outcome.value,
        valid: outcome.valid,
        source: outcome.source,
        window: `${outcome.window.start} -> ${outcome.window.end}`,
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

function targetConfidence(
  target: DashboardTarget,
  breakGlass: BreakGlass[]
): ResultConfidenceState {
  const touchedByBreakGlass = breakGlass.some((entry) => entry.subject.includes(target.id));
  if (touchedByBreakGlass) return "break-glass";
  if (target["attestation-collapse"]) return "self-declared";
  if (target.outcomes.length === 0) return "no-evidence";
  if (target.invalidCount > 0) return "pending";
  return "verified";
}

function parseLooseNumber(value: string): number | null {
  const match = String(value).match(/-?\d+(?:[.,]\d+)?/);
  return match ? Number(match[0].replace(",", ".")) : null;
}

function cycleFromWindow(start: string, end: string): string {
  const year = start.slice(0, 4);
  const startMonth = Number(start.slice(5, 7));
  const endMonth = Number(end.slice(5, 7));
  if (endMonth - startMonth >= 5) return `${year}-${startMonth <= 6 ? "H1" : "H2"}`;
  const quarter = Math.floor((startMonth - 1) / 3) + 1;
  return `${year}-Q${quarter}`;
}
