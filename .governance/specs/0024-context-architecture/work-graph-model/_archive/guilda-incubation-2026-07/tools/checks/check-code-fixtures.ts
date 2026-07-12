import { renderDesignSystemCatalog } from "../../acme/repos/acme-design-system/src/index.mjs";
import {
  resolveUserContext,
  publishUserContextContract,
} from "../../acme/repos/acme-web-host/src/index.mjs";
import {
  renderBillingUpgrade,
  previewUpgrade,
} from "../../acme/repos/acme-mfe-billing/src/index.mjs";
import { renderCheckout, submitCheckout } from "../../acme/repos/acme-checkout/src/index.mjs";
import {
  renderOnboardingTour,
  completeOnboardingStep,
} from "../../acme/repos/acme-mfe-onboarding/src/index.mjs";
import { searchArticles, openTicket } from "../../acme/repos/acme-help-center/src/index.mjs";
import { currentSubscription } from "../../acme/repos/acme-api-billing/src/index.mjs";
import {
  materializeDailyMetrics,
  targetActualSnapshot,
} from "../../acme/repos/acme-data-pipeline/src/index.mjs";
import {
  recordTrace,
  sloSnapshot,
  incidentAlert,
} from "../../acme/repos/acme-obs-stack/src/index.mjs";
import { monolithModules } from "../../acme/repos/acme-core-api/src/index.mjs";

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const sessionId = "sess-100";
const items = [{ sku: "plan-growth", name: "Growth plan", price: 99, qty: 1 }];

assert(
  renderDesignSystemCatalog().includes("plan-card"),
  "design system catalog did not render plan-card"
);
assert(
  resolveUserContext(sessionId).userContextVersion === "v3",
  "web host did not publish user context v3"
);
assert(
  publishUserContextContract().contract === "acme-user-context",
  "user context contract missing"
);
assert(
  renderBillingUpgrade({ sessionId }).includes("billing-upgrade"),
  "billing MFE did not render"
);
assert(
  previewUpgrade({ sessionId, targetPlan: "growth" }).dueNow === 99,
  "billing API quote mismatch"
);
assert(
  currentSubscription("acct-growth").plan === "starter",
  "billing API did not use legacy billing seam"
);
assert(renderCheckout({ items }).includes("checkout-summary"), "checkout UI did not render");
assert(
  submitCheckout({ sessionId, items, postalCode: "90000", coupon: "GROWTH10" }).orderId,
  "checkout API did not create order"
);
assert(
  renderOnboardingTour({ step: 2 }).includes("Invite the team"),
  "onboarding MFE did not render step"
);
assert(completeOnboardingStep({ sessionId, step: 3 }).completed, "onboarding did not complete");
assert(searchArticles("coupon").length === 1, "help center search mismatch");
assert(
  openTicket({ sessionId, subject: "Coupon failed" }).accountId === "acct-growth",
  "ticket did not bind account"
);

recordTrace({ service: "acme-checkout-api", route: "/checkout", durationMs: 120 });
recordTrace({ service: "acme-checkout-api", route: "/checkout", durationMs: 210 });
assert(sloSnapshot({ service: "acme-checkout-api" }).p99Ms === 210, "obs stack p99 mismatch");
assert(
  incidentAlert({ service: "acme-checkout-api", severity: "sev2", summary: "payment failures" })
    .source === "acme-obs-stack",
  "incident alert source mismatch"
);

const daily = materializeDailyMetrics({ day: "2026-07-02" });
assert(daily.events > 0, "data pipeline saw no events");
assert(
  targetActualSnapshot({ targetId: "target-cross-sell", day: "2026-07-02" }).source ===
    "acme-data-pipeline",
  "target actual source mismatch"
);
assert(monolithModules().includes("mod-orders"), "monolith module inventory missing orders");

console.log("code-fixtures: ok (13 repo MVP surfaces import and cooperate)");
