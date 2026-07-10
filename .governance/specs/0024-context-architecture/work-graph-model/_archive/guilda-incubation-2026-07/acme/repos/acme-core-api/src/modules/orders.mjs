const orders = new Map();

export function reserveInventory({ sku, qty }) {
  if (qty <= 0) throw new Error("qty must be positive");
  return { sku, qty, reservationId: `res-${sku}-${qty}` };
}

export function createLegacyOrder({ accountId, items }) {
  const id = `ord-${orders.size + 1}`;
  const reservations = items.map((item) => reserveInventory(item));
  const order = { id, accountId, items, reservations, status: "reserved" };
  orders.set(id, order);
  return order;
}

export function getLegacyOrder(orderId) {
  return orders.get(orderId) ?? null;
}
