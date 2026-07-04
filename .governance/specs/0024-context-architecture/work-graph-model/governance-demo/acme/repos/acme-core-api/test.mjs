import { createLegacyOrder, getLegacyOrder, monolithModules } from "./src/index.mjs";

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(monolithModules().includes("mod-accounts"), "accounts module missing");
assert(monolithModules().includes("mod-orders"), "orders module missing");

const order = createLegacyOrder({
  accountId: "acct-growth",
  items: [{ sku: "plan-growth", qty: 1 }],
});

assert(order.status === "reserved", "legacy order was not reserved");
assert(getLegacyOrder(order.id)?.accountId === "acct-growth", "legacy order lookup failed");

console.log("acme-core-api local test: ok");
