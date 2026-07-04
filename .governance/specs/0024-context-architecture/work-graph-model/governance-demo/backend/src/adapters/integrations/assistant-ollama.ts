// assistant-ollama.ts — primeiro assistant runtime local/open-source mecanizado.
// health/listModels consultam SOMENTE /api/tags. advise envia prompt APENAS quando
// a decisão de egress permite (loopback por padrão) e depois da redação mínima.
// Endpoint não-local falha fechado; nunca inventamos resposta.
import type {
  AssistantAdvice,
  AssistantHealth,
  AssistantProvider,
} from "../../ports/AssistantProvider.ts";
import type { IntegrationResult } from "../../ports/IntegrationAdapter.ts";
import { resolveEgress } from "../../application/integrations/egress-policy.ts";
import { redactSensitiveText } from "../../application/integrations/redaction.ts";

export const OLLAMA_DEFAULT_ENDPOINT = "http://127.0.0.1:11434";
export const OLLAMA_TAGS_PATH = "/api/tags";
export const OLLAMA_GENERATE_PATH = "/api/generate";

export function isAllowedLocalEndpoint(endpoint: string): boolean {
  return resolveEgress(endpoint).local;
}

type TagsResponse = { models?: Array<{ name?: string }> };

export class OllamaAssistantProvider implements AssistantProvider {
  readonly id = "assistant-ollama";
  private readonly endpoint: string;
  private readonly timeoutMs: number;

  constructor(options: { endpoint?: string; timeoutMs?: number } = {}) {
    this.endpoint =
      options.endpoint || process.env["GOVERNANCE_OLLAMA_ENDPOINT"] || OLLAMA_DEFAULT_ENDPOINT;
    this.timeoutMs = options.timeoutMs ?? 3000;
  }

  private async fetchTags(): Promise<TagsResponse> {
    const response = await fetch(`${this.endpoint.replace(/\/+$/, "")}${OLLAMA_TAGS_PATH}`, {
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} em ${OLLAMA_TAGS_PATH}`);
    return (await response.json()) as TagsResponse;
  }

  async health(): Promise<AssistantHealth> {
    const egress = resolveEgress(this.endpoint);
    if (!egress.local) {
      return {
        status: "egress-blocked",
        endpoint: this.endpoint,
        local: false,
        models: [],
        error: egress.reason,
      };
    }
    try {
      const tags = await this.fetchTags();
      const models = (tags.models || [])
        .map((model) => String(model.name || ""))
        .filter(Boolean)
        .sort();
      return { status: "ok", endpoint: this.endpoint, local: true, models };
    } catch (error) {
      return {
        status: "unreachable",
        endpoint: this.endpoint,
        local: true,
        models: [],
        error: String((error as Error)?.message || error),
      };
    }
  }

  async listModels(): Promise<string[]> {
    return (await this.health()).models;
  }

  async advise(input: { prompt: string; model?: string }): Promise<AssistantAdvice> {
    const egress = resolveEgress(this.endpoint);
    const policy = {
      endpoint: this.endpoint,
      local: egress.local,
      allowed: egress.allowed,
      reason: egress.reason,
    };
    if (!egress.allowed) {
      return { status: "egress-blocked", redactions: 0, policy, error: egress.reason };
    }
    const redacted = redactSensitiveText(input.prompt);
    const health = await this.health();
    if (health.status !== "ok") {
      return {
        status: "unreachable",
        redactions: redacted.redactions,
        policy,
        error: health.error || "assistant local indisponível",
      };
    }
    const model = input.model || health.models[0];
    if (!model) {
      return {
        status: "not-configured",
        redactions: redacted.redactions,
        policy,
        error: "nenhum modelo instalado no runtime local",
      };
    }
    try {
      const response = await fetch(`${this.endpoint.replace(/\/+$/, "")}${OLLAMA_GENERATE_PATH}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt: redacted.text, stream: false }),
        signal: AbortSignal.timeout(Math.max(this.timeoutMs, 30_000)),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} em ${OLLAMA_GENERATE_PATH}`);
      const body = (await response.json()) as { response?: string };
      return {
        status: "ok",
        model,
        advice: String(body.response || ""),
        redactions: redacted.redactions,
        policy,
      };
    } catch (error) {
      return {
        status: "unreachable",
        model,
        redactions: redacted.redactions,
        policy,
        error: String((error as Error)?.message || error),
      };
    }
  }

  async test(): Promise<IntegrationResult> {
    const health = await this.health();
    const observedAt = new Date().toISOString();
    if (health.status === "egress-blocked") {
      return {
        adapter: this.id,
        status: "egress-blocked",
        summary: `endpoint "${health.endpoint}" bloqueado pela política de egress`,
        evidence: [],
        error: health.error,
      };
    }
    if (health.status === "unreachable") {
      return {
        adapter: this.id,
        status: "unavailable",
        summary: `runtime local não respondeu em ${health.endpoint}`,
        evidence: [],
        error: health.error,
      };
    }
    return {
      adapter: this.id,
      status: "ok",
      summary: `ollama local com ${health.models.length} modelo(s)`,
      evidence: [
        {
          kind: "assistant-health",
          source: `${health.endpoint}${OLLAMA_TAGS_PATH}`,
          observedAt,
          detail: { models: health.models },
        },
      ],
    };
  }
}
