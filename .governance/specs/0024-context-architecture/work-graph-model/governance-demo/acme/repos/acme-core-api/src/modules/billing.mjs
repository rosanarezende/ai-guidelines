const invoices = new Map();

export function legacyPlanForAccount(accountId) {
  return accountId === "acct-growth" ? "starter" : "free";
}

export function createInvoice({ accountId, amount, reason }) {
  const id = `inv-${invoices.size + 1}`;
  const invoice = { id, accountId, amount, reason, status: "open" };
  invoices.set(id, invoice);
  return invoice;
}

export function listInvoices(accountId) {
  return [...invoices.values()].filter((invoice) => invoice.accountId === accountId);
}
