import { CheckoutSummary } from "../../acme-design-system/src/index.mjs";
import { conversionEvent } from "../../acme-analytics/src/index.mjs";
import { createCheckoutOrder } from "../../acme-checkout-api/src/index.mjs";
import { resolveUserContext } from "../../acme-web-host/src/index.mjs";

export function renderCheckout({ items }) {
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return CheckoutSummary({ items, total: `$${total.toFixed(2)}` });
}

export function submitCheckout({ sessionId, items, postalCode, coupon }) {
  const context = resolveUserContext(sessionId);
  conversionEvent({ name: "checkout_started", accountId: context.accountId });
  const result = createCheckoutOrder({ accountId: context.accountId, items, postalCode, coupon });
  conversionEvent({
    name: "checkout_completed",
    accountId: context.accountId,
    value: result.pricing.total,
  });
  return result;
}
