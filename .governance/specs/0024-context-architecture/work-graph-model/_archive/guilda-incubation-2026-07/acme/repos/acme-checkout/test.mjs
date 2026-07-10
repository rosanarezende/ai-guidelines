import { inMemoryEventSink } from "../acme-analytics/src/index.mjs";
import { renderCheckout, submitCheckout } from "./src/index.mjs";

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const items = [{ sku: "plan-growth", name: "Growth plan", price: 99, qty: 1 }];
const html = renderCheckout({ items });
assert(html.includes("checkout-summary"), "checkout summary did not render");

const result = submitCheckout({
  sessionId: "sess-100",
  items,
  postalCode: "90000",
  coupon: "GROWTH10",
});

assert(result.orderId, "checkout order id missing");
const events = inMemoryEventSink().filter((event) => event.accountId === "acct-growth");
assert(
  events.some((event) => event.name === "checkout_started"),
  "checkout_started not tracked"
);
assert(
  events.some((event) => event.name === "checkout_completed"),
  "checkout_completed not tracked"
);

console.log("acme-checkout local test: ok");
