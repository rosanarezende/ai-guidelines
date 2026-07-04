// assistant.ts — providers de assistente configuráveis por função (R1/QRD-18/24).
// Ollama e OpenAI-compatible têm teste REAL (loopback fail-closed via política
// de egress do backend); cloud-approved exige egress aprovado explícito.
// Provider salvo nunca vira "capaz" sem teste — lastHealth registra o fato.
import { randomUUID } from "node:crypto";
import { isLoopbackUrl, OllamaAssistantProvider, resolveEgress } from "@demo/backend";
import type {
  AssistantProviderConfig,
  AssistantProviderKindId,
  DataClassification,
  Workspace,
} from "@demo/backend/domain";
import { dispatchForWorkspace, type UseCaseResult } from "./use-cases";

const PROVIDER_KINDS: AssistantProviderKindId[] = [
  "lexical-deterministic",
  "ollama",
  "openai-compatible",
  "cloud-approved",
];
const CLASSIFICATIONS: DataClassification[] = ["public", "internal", "confidential", "restricted"];

export type ProviderTestResult = {
  status: "ok" | "unreachable" | "egress-blocked";
  checkedAt: string;
  models?: string[];
  detail?: string;
};

export async function testAssistantProvider(input: {
  kind: unknown;
  endpoint?: unknown;
}): Promise<ProviderTestResult> {
  const checkedAt = new Date().toISOString();
  if (input.kind === "lexical-deterministic") {
    return { status: "ok", checkedAt, detail: "baseline local determinístico — sempre disponível" };
  }
  const endpoint = typeof input.endpoint === "string" ? input.endpoint.trim() : "";
  if (!endpoint) return { status: "unreachable", checkedAt, detail: "endpoint ausente" };
  const egress = resolveEgress(endpoint);
  if (!egress.allowed) return { status: "egress-blocked", checkedAt, detail: egress.reason };
  if (input.kind === "ollama") {
    const health = await new OllamaAssistantProvider({ endpoint }).health();
    return {
      status: health.status === "ok" ? "ok" : health.status,
      checkedAt,
      ...(health.models.length ? { models: health.models } : {}),
      ...(health.error ? { detail: health.error } : {}),
    };
  }
  // openai-compatible/cloud-approved: GET /v1/models (descoberta quando suportada)
  try {
    const response = await fetch(`${endpoint.replace(/\/+$/, "")}/v1/models`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok)
      return { status: "unreachable", checkedAt, detail: `HTTP ${response.status}` };
    const body = (await response.json().catch(() => null)) as {
      data?: Array<{ id?: string }>;
    } | null;
    const models = (body?.data || []).map((model) => String(model.id || "")).filter(Boolean);
    return { status: "ok", checkedAt, ...(models.length ? { models } : {}) };
  } catch (error) {
    return { status: "unreachable", checkedAt, detail: String((error as Error).message) };
  }
}

export async function saveAssistantProvider(input: {
  principalId: string;
  workspaceId: string;
  kind: unknown;
  label?: unknown;
  preset?: unknown;
  endpoint?: unknown;
  model?: unknown;
  maxClassification?: unknown;
  egressApproved?: unknown;
  runTest?: boolean;
}): Promise<UseCaseResult<{ workspace: Workspace; provider: AssistantProviderConfig }>> {
  const kind = PROVIDER_KINDS.find((item) => item === input.kind);
  if (!kind) return { ok: false, error: "invalid-provider-kind" };
  const endpoint =
    typeof input.endpoint === "string" && input.endpoint.trim() ? input.endpoint.trim() : undefined;
  if (kind !== "lexical-deterministic" && !endpoint)
    return { ok: false, error: "missing-endpoint" };
  const maxClassification =
    CLASSIFICATIONS.find((item) => item === input.maxClassification) || "internal";
  // fail-closed: endpoint não-loopback sem egress aprovado não pode ser salvo
  // como utilizável; cloud-approved exige aprovação explícita
  const egressApproved = input.egressApproved === true;
  if (endpoint && !isLoopbackUrl(endpoint) && !egressApproved) {
    return { ok: false, error: "egress-approval-required" };
  }
  const provider: AssistantProviderConfig = {
    id: `prov-${randomUUID()}`,
    kind,
    label:
      typeof input.label === "string" && input.label.trim()
        ? input.label.trim()
        : kind === "ollama"
          ? "Ollama local"
          : kind,
    ...(typeof input.preset === "string" && input.preset ? { preset: input.preset } : {}),
    ...(endpoint ? { endpoint } : {}),
    ...(typeof input.model === "string" && input.model ? { model: input.model } : {}),
    maxClassification,
    egressApproved,
  };
  if (input.runTest !== false) {
    const test = await testAssistantProvider({ kind, endpoint });
    provider.lastHealth = {
      status: test.status,
      checkedAt: test.checkedAt,
      ...(test.models ? { models: test.models } : {}),
    };
  }
  const result = await dispatchForWorkspace(
    "local.assistant.save-provider",
    input.principalId,
    input.workspaceId,
    { provider }
  );
  if (!result.ok) return result;
  return { ok: true, value: { workspace: result.value, provider } };
}

export async function setAssistantDefault(input: {
  principalId: string;
  workspaceId: string;
  function: unknown;
  providerId: unknown;
}): Promise<UseCaseResult<Workspace>> {
  return dispatchForWorkspace("local.assistant.set-default", input.principalId, input.workspaceId, {
    function: input.function,
    providerId: input.providerId,
  });
}

export async function dismissAssistant(input: {
  principalId: string;
  workspaceId: string;
}): Promise<UseCaseResult<Workspace>> {
  return dispatchForWorkspace("local.assistant.dismiss", input.principalId, input.workspaceId, {});
}
