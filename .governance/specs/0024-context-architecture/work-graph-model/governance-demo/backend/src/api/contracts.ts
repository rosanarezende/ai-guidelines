// contracts.ts — contratos tipados da API local (BFF via Next route handlers).
// Cada rota declara request/response; o documento agregado é servido em
// /api/contract e conferido pelo smoke de integração — contrato verificável,
// não promessa em prosa.
import * as s from "./schema.ts";

export const COMMAND_TYPE_VALUES = [
  "proposal.create",
  "triage.save",
  "gate.decide",
  "intent.activate",
  "breakdown.apply",
  "repo-work.ack",
  "standalone.complete",
  "contract.propose-revision",
  "outcome.publish",
  "verdict.accept",
  "incident.declare",
  "policy.break-glass",
] as const;

export const governedCommandSchema = s.object({
  id: s.string({ minLength: 1 }),
  type: s.string({ enum: COMMAND_TYPE_VALUES }),
  envelope: s.object({
    actor: s.string({ minLength: 1 }),
    authority: s.string({ minLength: 1 }),
    "base-revision": s.string({ minLength: 1 }),
    "idempotency-key": s.string({ minLength: 1 }),
    "issued-at": s.string({ minLength: 1 }),
    nonce: s.string({ minLength: 1 }),
  }),
  payload: s.record(),
});

export const graphOverviewQuerySchema = s.object({
  type: s.optional(s.string({ minLength: 1 })),
  q: s.optional(s.string({ minLength: 1 })),
});

export const graphRefQuerySchema = s.object({
  ref: s.string({ minLength: 1 }),
});

export const graphAdjacencyQuerySchema = s.object({
  ref: s.string({ minLength: 1 }),
  depth: s.optional(s.integer({ min: 1, max: 5 })),
});

export const graphPathQuerySchema = s.object({
  from: s.string({ minLength: 1 }),
  to: s.string({ minLength: 1 }),
});

export const integrationTestRequestSchema = s.object({
  repo: s.optional(s.string({ minLength: 1 })),
});

export const assistantAdvisoryRequestSchema = s.object({
  prompt: s.string({ minLength: 1 }),
  model: s.optional(s.string({ minLength: 1 })),
});

type RouteContract = {
  method: "GET" | "POST";
  path: string;
  summary: string;
  request?: Record<string, unknown>;
  responses: Record<string, string>;
};

export function buildApiContractDocument(): {
  schema: string;
  authoritativeSource: string;
  readModelWarning: string;
  routes: RouteContract[];
} {
  return {
    schema: "acme.governance-api-contract/v1",
    authoritativeSource:
      "acme/governance (YAML + event-log). Toda mutação passa pelo command runtime com base-revision; projeções não autorizam ação.",
    readModelWarning:
      "Respostas de /api/graph/* são DERIVADAS (sourceRevision incluída); nunca use como base de mutação sem revalidar o SSOT.",
    routes: [
      {
        method: "GET",
        path: "/api/snapshot",
        summary: "snapshot completo do host demo (read-model + issues + dashboards)",
        responses: { "200": "GovernanceSnapshot" },
      },
      {
        method: "POST",
        path: "/api/commands/dry-run",
        summary: "valida um comando governado sem aplicar",
        request: governedCommandSchema.jsonSchema(),
        responses: {
          "200": "CommandResult ok",
          "422": "CommandResult com issues",
          "400": "request inválida",
        },
      },
      {
        method: "POST",
        path: "/api/commands/execute",
        summary: "executa comando governado (lock + transação + event-log)",
        request: governedCommandSchema.jsonSchema(),
        responses: {
          "200": "CommandResult ok",
          "422": "CommandResult com issues",
          "400": "request inválida",
        },
      },
      {
        method: "GET",
        path: "/api/graph",
        summary: "nós/arestas do grafo derivado com filtro por tipo/texto",
        request: graphOverviewQuerySchema.jsonSchema(),
        responses: { "200": "GraphOverview (derivado, com sourceRevision)" },
      },
      {
        method: "GET",
        path: "/api/graph/node",
        summary: "nó por id/GlobalRef com vizinhança imediata",
        request: graphRefQuerySchema.jsonSchema(),
        responses: { "200": "GraphNodeDetail", "404": "ref não resolve" },
      },
      {
        method: "GET",
        path: "/api/graph/adjacency",
        summary: "vizinhança até N saltos de um nó",
        request: graphAdjacencyQuerySchema.jsonSchema(),
        responses: { "200": "GraphAdjacency", "404": "ref não resolve" },
      },
      {
        method: "GET",
        path: "/api/graph/path",
        summary: "menor caminho entre dois nós (repo/objective/target/intent/...)",
        request: graphPathQuerySchema.jsonSchema(),
        responses: { "200": "GraphPath", "404": "sem caminho/ref não resolve" },
      },
      {
        method: "GET",
        path: "/api/graph/contract-impact",
        summary: "impacto de contrato: consumers, intents, outcomes citando revisão, targets",
        request: graphRefQuerySchema.jsonSchema(),
        responses: { "200": "ContractImpact", "404": "contrato não resolve" },
      },
      {
        method: "GET",
        path: "/api/graph/intent-deps",
        summary: "dependências diretas/transitivas e superfície da intent",
        request: graphRefQuerySchema.jsonSchema(),
        responses: { "200": "IntentDependencies", "404": "intent não resolve" },
      },
      {
        method: "GET",
        path: "/api/graph/conflicts",
        summary: "conflitos/contensões modelados (contrato, atestação, erros de validação)",
        responses: { "200": "GraphConflicts" },
      },
      {
        method: "GET",
        path: "/api/integrations",
        summary: "adapters mecanizados + status honesto de cada um",
        responses: { "200": "IntegrationStatusReport" },
      },
      {
        method: "POST",
        path: "/api/integrations/{id}/test",
        summary: "testa um adapter real (opcionalmente contra um repo)",
        request: integrationTestRequestSchema.jsonSchema(),
        responses: { "200": "IntegrationResult", "400": "request inválida" },
      },
      {
        method: "GET",
        path: "/api/integrations/assistant/ollama/health",
        summary: "health do runtime local (somente /api/tags, loopback)",
        responses: { "200": "AssistantConnectionResult" },
      },
      {
        method: "POST",
        path: "/api/integrations/assistant/advisory",
        summary: "conselho do assistente LOCAL (egress fail-closed + redação mínima)",
        request: assistantAdvisoryRequestSchema.jsonSchema(),
        responses: {
          "200": "AssistantAdvice",
          "400": "request inválida",
          "502": "runtime local indisponível",
        },
      },
      {
        method: "GET",
        path: "/api/contract",
        summary: "este documento (contrato verificável da API local)",
        responses: { "200": "ApiContractDocument" },
      },
    ],
  };
}
