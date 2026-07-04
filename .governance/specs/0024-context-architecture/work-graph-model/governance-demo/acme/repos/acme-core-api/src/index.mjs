export * from "./modules/accounts.mjs";
export * from "./modules/billing.mjs";
export * from "./modules/orders.mjs";
export * from "./modules/reports.mjs";

export function monolithModules() {
  return ["mod-billing", "mod-orders", "mod-accounts", "mod-reports"];
}
