import type { GovernanceSnapshot } from "@demo/contracts";
import type { AdoptionSummary, WorkSource } from "./types";
import { deriveAttention } from "./attention";
import { deriveChecklist } from "./checklist";
import { deriveNextStep } from "./next-step";
import { format } from "./format";
import copy from "./_locales/pt-br.json";

export type { AdoptionSummary, AttentionItem, ChecklistItem, NextStep, WorkSource } from "./types";

export function deriveAdoption(snapshot: GovernanceSnapshot): AdoptionSummary {
  const attention = deriveAttention(snapshot);
  const sources = deriveSources(snapshot);
  const sourcesConnected = sources.filter((source) => source.state === "valid").length;
  const validOutcomes = snapshot.outcomes.filter((outcome) => outcome.valid).length;
  const healthyCount =
    validOutcomes +
    sourcesConnected +
    snapshot.targets.filter((target) => !snapshot.issues.some((issue) => issue.node === target.id))
      .length;
  const periods = [...new Set(snapshot.targets.map((target) => target.period))].sort();
  const checklist = deriveChecklist(snapshot, sourcesConnected, sources.length, periods);
  const doneCount = checklist.filter((item) => item.done).length;

  return {
    attention,
    healthyCount,
    checklist,
    doneCount,
    totalCount: checklist.length,
    setupPct: Math.round((doneCount / checklist.length) * 100),
    sources,
    sourcesConnected,
    nextStep: deriveNextStep(attention, sourcesConnected, sources.length),
    periods,
  };
}

function deriveSources(snapshot: GovernanceSnapshot): WorkSource[] {
  return snapshot.repos.map((repo) => ({
    id: repo.id,
    kind: format(copy.sources.kind, { owner: repo.owner }),
    state: repo.context ? "valid" : "no-evidence",
    detail: repo.context
      ? format(copy.sources.published, {
          works: String(repo.works.length),
          contracts: String(repo.contracts.length),
        })
      : copy.sources.missing,
  }));
}
