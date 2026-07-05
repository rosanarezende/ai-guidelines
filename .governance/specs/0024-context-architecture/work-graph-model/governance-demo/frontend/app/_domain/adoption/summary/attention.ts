import type { GovernanceSnapshot } from "@/lib/types";
import type { AttentionItem } from "./types";
import { format } from "./format";
import copy from "./_locales/pt-br.json";

export function deriveAttention(snapshot: GovernanceSnapshot): AttentionItem[] {
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
        actionHref: "/sources",
      });
    }
  }

  return attention;
}
