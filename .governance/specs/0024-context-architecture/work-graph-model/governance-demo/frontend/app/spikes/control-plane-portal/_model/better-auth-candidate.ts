import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

export type BetterAuthCandidateSummary = {
  library: "better-auth";
  organizationPluginLoaded: boolean;
  requiredEndpoints: Array<{ id: string; available: boolean }>;
  boundary: string[];
};

const REQUIRED_ENDPOINTS = [
  "signUpEmail",
  "signInEmail",
  "getSession",
  "createOrganization",
  "createInvitation",
  "acceptInvitation",
  "listMembers",
  "updateMemberRole",
];

export function describeBetterAuthCandidate(): BetterAuthCandidateSummary {
  const auth = betterAuth({
    secret: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    baseURL: "http://127.0.0.1:3024",
    emailAndPassword: { enabled: true },
    plugins: [organization()],
  });
  const api = auth.api as Record<string, unknown>;

  return {
    library: "better-auth",
    organizationPluginLoaded: REQUIRED_ENDPOINTS.every((endpoint) => endpoint in api),
    requiredEndpoints: REQUIRED_ENDPOINTS.map((endpoint) => ({
      id: endpoint,
      available: endpoint in api,
    })),
    boundary: [
      "conta, sessao e convite ficam no control plane",
      "authority efetiva continua no governance host",
      "provider secret nao aparece em payload publico",
      "GitHub App e ponte para proposta, nao segundo SSOT",
    ],
  };
}
