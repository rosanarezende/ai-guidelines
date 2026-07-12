import type { ConfidenceState } from "../confidence";

export type AttentionItem = {
  id: string;
  state: ConfidenceState;
  title: string;
  hint: string;
  actionLabel: string;
  actionHref: string;
};

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  detail: string;
  tag?: string;
};

export type WorkSource = {
  id: string;
  kind: string;
  state: ConfidenceState;
  detail: string;
};

export type NextStep = {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  meta: string;
};

export type AdoptionSummary = {
  attention: AttentionItem[];
  healthyCount: number;
  checklist: ChecklistItem[];
  doneCount: number;
  totalCount: number;
  setupPct: number;
  sources: WorkSource[];
  sourcesConnected: number;
  nextStep: NextStep;
  periods: string[];
};
