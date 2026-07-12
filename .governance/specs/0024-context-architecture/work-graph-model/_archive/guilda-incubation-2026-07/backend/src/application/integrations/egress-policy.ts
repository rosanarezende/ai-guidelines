// egress-policy.ts — decisão de saída de rede dos adapters. FAIL-CLOSED:
// loopback é permitido; qualquer host externo é negado a menos que esteja
// explicitamente em GOVERNANCE_EGRESS_ALLOWLIST (decisão local do operador,
// nunca default). Não existe "cloud silencioso".
export type EgressDecision = {
  allowed: boolean;
  local: boolean;
  host: string;
  reason: string;
};

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

export function isLoopbackUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    return LOOPBACK_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function allowlistedHosts(env: NodeJS.ProcessEnv): Set<string> {
  return new Set(
    String(env["GOVERNANCE_EGRESS_ALLOWLIST"] || "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function resolveEgress(
  rawUrl: string,
  env: NodeJS.ProcessEnv = process.env
): EgressDecision {
  let host = "";
  try {
    host = new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return {
      allowed: false,
      local: false,
      host: String(rawUrl),
      reason: "endpoint inválido — fail-closed",
    };
  }
  if (LOOPBACK_HOSTS.has(host)) {
    return { allowed: true, local: true, host, reason: "endpoint loopback (sem egress externo)" };
  }
  if (allowlistedHosts(env).has(host)) {
    return {
      allowed: true,
      local: false,
      host,
      reason: `host "${host}" liberado explicitamente por GOVERNANCE_EGRESS_ALLOWLIST`,
    };
  }
  return {
    allowed: false,
    local: false,
    host,
    reason: `host "${host}" não é loopback e não há política de egress aprovada — fail-closed`,
  };
}
