import type { AttentionItem, NextStep } from "./types";
import { format } from "./format";
import copy from "./locales/pt-br.json";

export function deriveNextStep(
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
      ctaHref: "/settings#fontes",
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
