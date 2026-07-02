const accounts = new Map([
  [
    "acct-growth",
    { accountId: "acct-growth", status: "active", permissions: ["billing", "checkout", "support"] },
  ],
]);

export function getAccount(accountId) {
  return accounts.get(accountId) ?? { accountId, status: "unknown", permissions: [] };
}

export function canAccess(accountId, permission) {
  return getAccount(accountId).permissions.includes(permission);
}

export function addPermission(accountId, permission) {
  const account = getAccount(accountId);
  const permissions = new Set(account.permissions);
  permissions.add(permission);
  accounts.set(accountId, { ...account, permissions: [...permissions] });
  return getAccount(accountId);
}
