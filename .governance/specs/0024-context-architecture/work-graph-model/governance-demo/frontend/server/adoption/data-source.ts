// data-source.ts — switch explícito da fonte de dados do shell (QRD-01).
//
// A fonte NUNCA vem de storage do navegador: é configuração de ambiente do servidor.
//   real-runtime → file-first local (.local-state) — governança de verdade
//   mock-api     → HTTP para governance-demo/mock-api (lowdb) — valida UX/e2e
//   demo-acme    → file-first, mas mutações de configuração são bloqueadas
// Em produção, mock-api é proibida (fail-closed na inicialização do store).

export type GovernanceDataSource = "real-runtime" | "mock-api" | "demo-acme";

export type GovernanceAppEnv = "development" | "test" | "production";

export function resolveAppEnv(): GovernanceAppEnv {
  const raw = process.env.GOVERNANCE_APP_ENV || process.env.NODE_ENV || "development";
  if (raw === "production") return "production";
  if (raw === "test") return "test";
  return "development";
}

export function resolveDataSource(): GovernanceDataSource {
  const raw = (process.env.GOVERNANCE_DATA_SOURCE || "real-runtime").trim();
  if (raw === "mock-api" || raw === "demo-acme" || raw === "real-runtime") {
    if (raw === "mock-api" && resolveAppEnv() === "production") {
      throw new Error("GOVERNANCE_DATA_SOURCE=mock-api é proibida em produção (QRD-01)");
    }
    return raw;
  }
  throw new Error(
    `GOVERNANCE_DATA_SOURCE inválida: "${raw}" (aceitas: real-runtime | mock-api | demo-acme)`
  );
}

export function mockApiBaseUrl(): string {
  return (process.env.GOVERNANCE_API_BASE_URL || "http://127.0.0.1:3025").replace(/\/+$/, "");
}
