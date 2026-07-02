import { createLegacyOrder } from "../../acme-core-api/src/modules/orders.mjs";
import { getAccount } from "../../acme-core-api/src/modules/accounts.mjs";

export function calculateFreight({ postalCode, items }) {
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  return {
    postalCode,
    service: postalCode.startsWith("9") ? "priority" : "standard",
    price: itemCount * 4.5,
  };
}

export function applyCoupon({ subtotal, coupon }) {
  if (!coupon) return { subtotal, discount: 0, total: subtotal };
  const discount = coupon === "GROWTH10" ? subtotal * 0.1 : 0;
  return { subtotal, discount, total: subtotal - discount };
}

export function createCheckoutOrder({ accountId, items, postalCode, coupon }) {
  const account = getAccount(accountId);
  if (account.status !== "active") throw new Error(`inactive account: ${accountId}`);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const freight = calculateFreight({ postalCode, items });
  const pricing = applyCoupon({ subtotal: subtotal + freight.price, coupon });
  const order = createLegacyOrder({ accountId, items });
  return { orderId: order.id, accountId, pricing, freight };
}
