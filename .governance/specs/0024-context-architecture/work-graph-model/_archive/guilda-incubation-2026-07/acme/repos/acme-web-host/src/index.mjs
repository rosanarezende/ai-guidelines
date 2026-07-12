import { getUserContext } from "../../acme-identity/src/index.mjs";

const routes = {
  billing: "/billing",
  onboarding: "/onboarding",
  checkout: "/checkout",
  support: "/help",
};

export function resolveUserContext(sessionId) {
  const context = getUserContext(sessionId);
  return {
    ...context,
    userContextVersion: "v3",
    shellFeatures: ["mf-routing", "user-context", "experiment-slot"],
  };
}

export function routeFor(appId) {
  const route = routes[appId];
  if (!route) throw new Error(`unknown app: ${appId}`);
  return route;
}

export function mountMicroFrontend({ appId, sessionId, html }) {
  const context = resolveUserContext(sessionId);
  return {
    route: routeFor(appId),
    userContextVersion: context.userContextVersion,
    html: `<main data-app="${appId}" data-account="${context.accountId ?? "anonymous"}">${html}</main>`,
  };
}

export function publishUserContextContract() {
  return {
    contract: "acme-user-context",
    revision: "v3",
    fields: ["authenticated", "userId", "accountId", "plan", "consent"],
  };
}
