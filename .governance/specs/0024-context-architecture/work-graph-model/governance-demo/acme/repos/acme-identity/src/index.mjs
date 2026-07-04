const sessions = new Map([
  [
    "sess-100",
    {
      userId: "user-100",
      accountId: "acct-growth",
      plan: "starter",
      roles: ["admin"],
      consent: { analytics: true, marketing: false },
    },
  ],
]);

export function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return { authenticated: false, scopes: [] };
  return { authenticated: true, scopes: session.roles, ...session };
}

export function getUserContext(sessionId) {
  const session = getSession(sessionId);
  if (!session.authenticated) return { authenticated: false };
  return {
    authenticated: true,
    userId: session.userId,
    accountId: session.accountId,
    plan: session.plan,
    consent: session.consent,
  };
}

export function updateConsent(sessionId, patch) {
  const session = sessions.get(sessionId);
  if (!session) throw new Error(`unknown session: ${sessionId}`);
  session.consent = { ...session.consent, ...patch };
  return getUserContext(sessionId);
}

export function requireScope(sessionId, scope) {
  const session = getSession(sessionId);
  if (!session.authenticated || !session.scopes.includes(scope)) {
    throw new Error(`missing scope: ${scope}`);
  }
  return session;
}
