// confidence.ts — derivação pura de estado de confiança e risco por nó.
// Regras espelham o modelo: outcome válido = verified; attestation-collapse =
// self-declared; break-glass visível; sem outcome = pending/no-evidence.
import type { BreakGlass, DashboardTarget, GovernanceIssue } from "@demo/backend/domain";
import type { ConfidenceState, RiskLevel } from "./view-models";

export function targetConfidence(
  target: DashboardTarget,
  breakGlass: BreakGlass[]
): ConfidenceState {
  const touchedByBreakGlass = breakGlass.some((entry) => entry.subject.includes(target.id));
  if (touchedByBreakGlass) return "break-glass";
  if (target["attestation-collapse"]) return "self-declared";
  if (target.outcomes.length === 0) return "no-evidence";
  if (target.invalidCount > 0) return "pending";
  return "verified";
}

export function targetRisk(target: DashboardTarget, issues: GovernanceIssue[]): RiskLevel {
  if (target.invalidCount > 0) return "high";
  if (issues.some((issue) => issue.level === "error" && issue.node === target.id)) return "high";
  if (target["attestation-collapse"]) return "attention";
  if (issues.some((issue) => issue.node === target.id)) return "attention";
  return "low";
}

export function issueRisk(nodeId: string, issues: GovernanceIssue[]): RiskLevel {
  if (issues.some((issue) => issue.level === "error" && issue.node === nodeId)) return "high";
  if (issues.some((issue) => issue.node === nodeId)) return "attention";
  return "low";
}

export function confidenceLabelKey(state: ConfidenceState): string {
  return `spikes.confidence.${state}`;
}

// Ciclo legível a partir de datas ISO (2027-01-01..2027-03-31 -> 2027-Q1).
export function cycleFromWindow(start: string, end: string): string {
  const year = start.slice(0, 4);
  const startMonth = Number(start.slice(5, 7));
  const endMonth = Number(end.slice(5, 7));
  if (endMonth - startMonth >= 5) return `${year}-${startMonth <= 6 ? "H1" : "H2"}`;
  const quarter = Math.floor((startMonth - 1) / 3) + 1;
  return `${year}-Q${quarter}`;
}
