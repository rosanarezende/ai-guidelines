import {
  createInvoice,
  legacyPlanForAccount,
  listInvoices,
} from "../../acme-core-api/src/modules/billing.mjs";

const planCatalog = [
  { id: "starter", price: 29, seats: 3 },
  { id: "growth", price: 99, seats: 10 },
  { id: "scale", price: 249, seats: 50 },
];

export function listPlans() {
  return planCatalog.slice();
}

export function currentSubscription(accountId) {
  return {
    accountId,
    plan: legacyPlanForAccount(accountId),
    invoices: listInvoices(accountId),
  };
}

export function quoteUpgrade({ accountId, targetPlan }) {
  const plan = planCatalog.find((p) => p.id === targetPlan);
  if (!plan) throw new Error(`unknown plan: ${targetPlan}`);
  return {
    accountId,
    targetPlan,
    dueNow: plan.price,
    currency: "USD",
  };
}

export function upgradeSubscription({ accountId, targetPlan }) {
  const quote = quoteUpgrade({ accountId, targetPlan });
  const invoice = createInvoice({
    accountId,
    amount: quote.dueNow,
    reason: `upgrade:${targetPlan}`,
  });
  return { ...quote, invoice };
}
