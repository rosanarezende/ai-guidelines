import type { GovernanceSnapshot } from "@/lib/types";
import type { ConfidenceState } from "../confidence";
import { profileChipLabel } from "../profiles";
import copy from "./locales/pt-br.json";

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

export function deriveAdoption(snapshot: GovernanceSnapshot): AdoptionSummary {
  const attention: AttentionItem[] = [];
  const acceptedOutcomes = new Set(snapshot.operations.verdicts.map((verdict) => verdict.outcome));

  for (const outcome of snapshot.outcomes) {
    if (outcome.valid && !acceptedOutcomes.has(outcome.id)) {
      attention.push({
        id: `verdict-pending-${outcome.id}`,
        state: "pending",
        title: format(copy.attention.verdictPending.title, { emitter: outcome["emitted-by"] }),
        hint: copy.attention.verdictPending.hint,
        actionLabel: copy.attention.verdictPending.action,
        actionHref: "/console?view=commands",
      });
    }
    if (!outcome.valid) {
      attention.push({
        id: `outcome-invalid-${outcome.id}`,
        state: "no-evidence",
        title: format(copy.attention.outcomeInvalid.title, { id: outcome.id }),
        hint: outcome.errors[0]?.msg || copy.attention.outcomeInvalid.fallbackHint,
        actionLabel: copy.attention.outcomeInvalid.action,
        actionHref: "/console?view=audit",
      });
    }
  }

  for (const proposal of snapshot.operations.proposals) {
    if (proposal.status === "proposed") {
      attention.push({
        id: `proposal-${proposal.id}`,
        state: "pending",
        title: format(copy.attention.proposal.title, { title: proposal.title }),
        hint: copy.attention.proposal.hint,
        actionLabel: copy.attention.proposal.action,
        actionHref: "/console?view=commands",
      });
    }
  }

  for (const entry of snapshot.operations.breakGlass) {
    attention.push({
      id: `break-glass-${entry.id}`,
      state: "break-glass",
      title: format(copy.attention.breakGlass.title, {
        id: entry.id,
        mutation: entry.mutation,
      }),
      hint: format(copy.attention.breakGlass.hint, { reviewAt: entry["review-at"] }),
      actionLabel: copy.attention.breakGlass.action,
      actionHref: "/console?view=audit",
    });
  }

  for (const issue of snapshot.issues) {
    if (issue.level === "warn" && issue.rule === "self-attested-target") {
      attention.push({
        id: `self-attested-${issue.node}`,
        state: "self-attested",
        title: format(copy.attention.selfAttested.title, { node: issue.node }),
        hint: copy.attention.selfAttested.hint,
        actionLabel: copy.attention.selfAttested.action,
        actionHref: "/console?view=company",
      });
    } else if (issue.level === "warn") {
      attention.push({
        id: `warn-${issue.rule}-${issue.node}`,
        state: issue.rule.includes("stale") ? "stale" : "pending",
        title: format(copy.attention.warning.title, { node: issue.node }),
        hint: issue.msg,
        actionLabel: copy.attention.warning.action,
        actionHref: "/console?view=audit",
      });
    } else {
      attention.push({
        id: `error-${issue.rule}-${issue.node}`,
        state: "no-evidence",
        title: format(copy.attention.error.title, { node: issue.node, rule: issue.rule }),
        hint: issue.msg,
        actionLabel: copy.attention.error.action,
        actionHref: "/console?view=audit",
      });
    }
  }

  for (const repo of snapshot.repos) {
    if (!repo.context) {
      attention.push({
        id: `source-no-context-${repo.id}`,
        state: "no-evidence",
        title: format(copy.attention.missingContext.title, { repo: repo.id }),
        hint: copy.attention.missingContext.hint,
        actionLabel: copy.attention.missingContext.action,
        actionHref: "/configuracoes#fontes",
      });
    }
  }

  const sources: WorkSource[] = snapshot.repos.map((repo) => ({
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

function deriveChecklist(
  snapshot: GovernanceSnapshot,
  sourcesConnected: number,
  sourcesTotal: number,
  periods: string[]
): ChecklistItem[] {
  const declaration = snapshot.profileDeclaration;
  return [
    {
      id: "profile",
      label: copy.checklist.profile.label,
      done: Boolean(declaration.profile),
      detail: format(copy.checklist.profile.detail, {
        profile: profileChipLabel(declaration.profile),
        approver: declaration["approved-by"] || copy.checklist.profile.unresolved,
        reviewAt: declaration["review-at"] || copy.checklist.profile.noDate,
      }),
    },
    {
      id: "roles",
      label: copy.checklist.roles.label,
      done: snapshot.authorities.length > 0,
      tag: copy.checklist.roles.tag,
      detail: format(copy.checklist.roles.detail, { count: String(snapshot.authorities.length) }),
    },
    {
      id: "cycle",
      label: format(copy.checklist.cycle.label, {
        period: periods[0] || copy.checklist.cycle.noPeriod,
      }),
      done: snapshot.portfolio.objectives.length > 0,
      detail: format(copy.checklist.cycle.detail, {
        objectives: String(snapshot.counts.objectives),
        targets: String(snapshot.counts.targets),
        periods: periods.join(", ") || copy.checklist.cycle.noPeriods,
      }),
    },
    {
      id: "sources",
      label: copy.checklist.sources.label,
      done: sourcesConnected === sourcesTotal && sourcesTotal > 0,
      tag: copy.checklist.sources.tag,
      detail:
        sourcesConnected === sourcesTotal
          ? format(copy.checklist.sources.allConnected, {
              connected: String(sourcesConnected),
              total: String(sourcesTotal),
            })
          : format(copy.checklist.sources.partial, {
              connected: String(sourcesConnected),
              total: String(sourcesTotal),
            }),
    },
    {
      id: "assistant",
      label: copy.checklist.assistant.label,
      done: false,
      tag: copy.checklist.assistant.tag,
      detail: copy.checklist.assistant.detail,
    },
  ];
}

function deriveNextStep(
  attention: AttentionItem[],
  sourcesConnected: number,
  sourcesTotal: number
): NextStep {
  const verdictPending = attention.find((item) => item.id.startsWith("verdict-pending-"));
  if (verdictPending) {
    return {
      title: verdictPending.title,
      body: copy.nextStep.verdictPending.body,
      ctaLabel: copy.attention.verdictPending.action,
      ctaHref: verdictPending.actionHref,
      meta: copy.nextStep.verdictPending.meta,
    };
  }
  const invalid = attention.find((item) => item.state === "no-evidence");
  if (invalid) {
    return {
      title: invalid.title,
      body: invalid.hint,
      ctaLabel: invalid.actionLabel,
      ctaHref: invalid.actionHref,
      meta: copy.nextStep.invalid.meta,
    };
  }
  if (sourcesConnected < sourcesTotal) {
    return {
      title: copy.nextStep.sources.title,
      body: format(copy.nextStep.sources.body, {
        connected: String(sourcesConnected),
        total: String(sourcesTotal),
      }),
      ctaLabel: copy.nextStep.sources.cta,
      ctaHref: "/configuracoes#fontes",
      meta: copy.nextStep.sources.meta,
    };
  }
  const first = attention[0];
  if (first) {
    return {
      title: first.title,
      body: first.hint,
      ctaLabel: first.actionLabel,
      ctaHref: first.actionHref,
      meta: copy.nextStep.fallback.meta,
    };
  }
  return {
    title: copy.nextStep.healthy.title,
    body: copy.nextStep.healthy.body,
    ctaLabel: copy.nextStep.healthy.cta,
    ctaHref: "/console?view=company",
    meta: copy.nextStep.healthy.meta,
  };
}

function format(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template
  );
}
