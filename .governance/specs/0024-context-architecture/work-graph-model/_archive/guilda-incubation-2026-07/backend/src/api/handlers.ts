// handlers.ts — handlers agnósticos de framework: recebem input cru, validam
// pelo contrato e retornam { status, body }. As rotas Next são adapters finos;
// o smoke de integração exercita os mesmos handlers sem servidor HTTP.
import {
  assistantProvider,
  collectRepoEvidence,
  testIntegration,
} from "../application/integrations/service.ts";
import {
  integrationStatusReport,
  listMechanizedIntegrations,
} from "../application/integrations/service.ts";
import {
  queryContractImpact,
  queryGraphAdjacency,
  queryGraphConflicts,
  queryGraphNode,
  queryGraphOverview,
  queryGraphPath,
  queryIntentDependencies,
} from "../application/queries/graph.ts";
import { dryRunCommand, executeCommand } from "../application/queries/governance-snapshot.ts";
import type { GovernedCommand } from "@demo/domain/server";
import {
  assistantAdvisoryRequestSchema,
  buildApiContractDocument,
  governedCommandSchema,
  graphAdjacencyQuerySchema,
  graphOverviewQuerySchema,
  graphPathQuerySchema,
  graphRefQuerySchema,
  integrationTestRequestSchema,
} from "./contracts.ts";
import { SchemaError } from "./schema.ts";

export type ApiResponse = { status: number; body: unknown };

function badRequest(error: unknown): ApiResponse {
  if (error instanceof SchemaError) {
    return { status: 400, body: { error: "request inválida", issues: error.issues } };
  }
  return { status: 400, body: { error: String((error as Error)?.message || error) } };
}

export async function handleCommandDryRun(rawBody: unknown): Promise<ApiResponse> {
  try {
    const command = governedCommandSchema.parse(rawBody) as GovernedCommand;
    const result = dryRunCommand(command);
    return { status: result.ok ? 200 : 422, body: result };
  } catch (error) {
    if (error instanceof SchemaError) return badRequest(error);
    throw error;
  }
}

export async function handleCommandExecute(rawBody: unknown): Promise<ApiResponse> {
  try {
    const command = governedCommandSchema.parse(rawBody) as GovernedCommand;
    const result = executeCommand(command);
    return { status: result.ok ? 200 : 422, body: result };
  } catch (error) {
    if (error instanceof SchemaError) return badRequest(error);
    throw error;
  }
}

export async function handleGraphOverview(rawQuery: unknown): Promise<ApiResponse> {
  try {
    const query = graphOverviewQuerySchema.parse(rawQuery);
    return { status: 200, body: await queryGraphOverview(query) };
  } catch (error) {
    if (error instanceof SchemaError) return badRequest(error);
    throw error;
  }
}

export async function handleGraphNode(rawQuery: unknown): Promise<ApiResponse> {
  try {
    const { ref } = graphRefQuerySchema.parse(rawQuery);
    const detail = await queryGraphNode(ref);
    if (!detail) return { status: 404, body: { error: `ref "${ref}" não resolve no grafo` } };
    return { status: 200, body: detail };
  } catch (error) {
    if (error instanceof SchemaError) return badRequest(error);
    throw error;
  }
}

export async function handleGraphAdjacency(rawQuery: unknown): Promise<ApiResponse> {
  try {
    const { ref, depth } = graphAdjacencyQuerySchema.parse(rawQuery);
    const result = await queryGraphAdjacency(ref, depth ?? 1);
    if (!result) return { status: 404, body: { error: `ref "${ref}" não resolve no grafo` } };
    return { status: 200, body: result };
  } catch (error) {
    if (error instanceof SchemaError) return badRequest(error);
    throw error;
  }
}

export async function handleGraphPath(rawQuery: unknown): Promise<ApiResponse> {
  try {
    const { from, to } = graphPathQuerySchema.parse(rawQuery);
    const result = await queryGraphPath(from, to);
    if (!result) return { status: 404, body: { error: `sem caminho entre "${from}" e "${to}"` } };
    return { status: 200, body: result };
  } catch (error) {
    if (error instanceof SchemaError) return badRequest(error);
    throw error;
  }
}

export async function handleContractImpact(rawQuery: unknown): Promise<ApiResponse> {
  try {
    const { ref } = graphRefQuerySchema.parse(rawQuery);
    const impact = await queryContractImpact(ref);
    if (!impact) return { status: 404, body: { error: `contrato "${ref}" não resolve` } };
    return { status: 200, body: impact };
  } catch (error) {
    if (error instanceof SchemaError) return badRequest(error);
    throw error;
  }
}

export async function handleIntentDependencies(rawQuery: unknown): Promise<ApiResponse> {
  try {
    const { ref } = graphRefQuerySchema.parse(rawQuery);
    const deps = await queryIntentDependencies(ref);
    if (!deps) return { status: 404, body: { error: `intent "${ref}" não resolve` } };
    return { status: 200, body: deps };
  } catch (error) {
    if (error instanceof SchemaError) return badRequest(error);
    throw error;
  }
}

export async function handleGraphConflicts(): Promise<ApiResponse> {
  return { status: 200, body: await queryGraphConflicts() };
}

export async function handleIntegrationsList(): Promise<ApiResponse> {
  return {
    status: 200,
    body: {
      integrations: listMechanizedIntegrations(),
      statuses: await integrationStatusReport(),
    },
  };
}

export async function handleIntegrationTest(id: string, rawBody: unknown): Promise<ApiResponse> {
  try {
    const { repo } = integrationTestRequestSchema.parse(rawBody ?? {});
    const result = repo ? await collectRepoEvidence(id, repo) : await testIntegration(id);
    return { status: 200, body: result };
  } catch (error) {
    if (error instanceof SchemaError) return badRequest(error);
    throw error;
  }
}

export async function handleAssistantAdvisory(rawBody: unknown): Promise<ApiResponse> {
  try {
    const input = assistantAdvisoryRequestSchema.parse(rawBody);
    const advice = await assistantProvider().advise(input);
    const status = advice.status === "ok" || advice.status === "egress-blocked" ? 200 : 502;
    return { status, body: advice };
  } catch (error) {
    if (error instanceof SchemaError) return badRequest(error);
    throw error;
  }
}

export function handleApiContract(): ApiResponse {
  return { status: 200, body: buildApiContractDocument() };
}
