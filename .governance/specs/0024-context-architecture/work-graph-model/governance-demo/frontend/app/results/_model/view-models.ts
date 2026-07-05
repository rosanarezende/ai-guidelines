export const RESULT_CONFIDENCE_STATES = [
  "verified",
  "pending",
  "no-evidence",
  "self-declared",
  "break-glass",
  "stale",
] as const;

export type ResultConfidenceState = (typeof RESULT_CONFIDENCE_STATES)[number];

export type ResultScorecard = {
  id: string;
  label: string;
  value: string;
  detail?: string;
  confidence: ResultConfidenceState;
};

export type ResultSeriesPoint = {
  cycle: string;
  expected: number | null;
  actual: number | null;
  confidence: ResultConfidenceState;
};

export type ResultSource = {
  outcomeId: string;
  value: string;
  valid: boolean;
  source: string;
  window: string;
};

export type ResultMetricSeries = {
  id: string;
  title: string;
  objectiveId: string;
  targetId: string;
  metricId: string;
  unit: string;
  confidence: ResultConfidenceState;
  points: ResultSeriesPoint[];
  sources: ResultSource[];
};

export type ResultTargetCard = {
  targetId: string;
  objectiveId: string;
  title: string;
  expected: string;
  actual: string;
  period: string;
  confidence: ResultConfidenceState;
  outcomeCount: number;
  invalidCount: number;
};

export type ResultsDashboardViewModel = {
  sourceRevision: string;
  derived: true;
  cycles: string[];
  scorecards: ResultScorecard[];
  targetCards: ResultTargetCard[];
  series: ResultMetricSeries[];
};

export type ResultsDashboardResponse =
  | {
      ok: true;
      workspace: { id: string; name: string; demo: boolean };
      dashboard: ResultsDashboardViewModel | null;
      unavailableReason?: string;
    }
  | { ok: false; error: string };
