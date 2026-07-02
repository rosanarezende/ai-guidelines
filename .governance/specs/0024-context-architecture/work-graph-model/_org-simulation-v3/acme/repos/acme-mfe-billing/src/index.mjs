import { PlanCard } from "../../acme-design-system/src/index.mjs";
import { conversionEvent, experimentExposure } from "../../acme-analytics/src/index.mjs";
import { listPlans, quoteUpgrade } from "../../acme-api-billing/src/index.mjs";
import { resolveUserContext } from "../../acme-web-host/src/index.mjs";

export function renderBillingUpgrade({ sessionId, experimentVariant = "control" }) {
  const context = resolveUserContext(sessionId);
  experimentExposure({
    experimentId: "billing-cross-sell",
    variant: experimentVariant,
    accountId: context.accountId,
  });
  const plans = listPlans();
  const cards = plans
    .map((plan) => PlanCard({ name: plan.id, price: `$${plan.price}/mo`, cta: "Upgrade" }))
    .join("\n");
  return `<section data-mfe="billing-upgrade" data-variant="${experimentVariant}">${cards}</section>`;
}

export function previewUpgrade({ sessionId, targetPlan }) {
  const context = resolveUserContext(sessionId);
  const quote = quoteUpgrade({ accountId: context.accountId, targetPlan });
  conversionEvent({ name: "billing_upgrade_viewed", accountId: context.accountId });
  return quote;
}
