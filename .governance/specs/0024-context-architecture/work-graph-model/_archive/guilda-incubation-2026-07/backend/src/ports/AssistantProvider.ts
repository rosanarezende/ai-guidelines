// AssistantProvider.ts — porta do runtime assistivo (local-first).
// Distinção local × cloud é parte do contrato: prompt só sai do processo com
// decisão de egress permitida + redação mínima aplicada; caso contrário, fail-closed.
import type { IntegrationResult } from "./IntegrationAdapter.ts";

export type AssistantHealth = {
  status: "ok" | "unreachable" | "egress-blocked";
  endpoint: string;
  local: boolean;
  models: string[];
  error?: string;
};

export type AssistantAdvice = {
  status: "ok" | "egress-blocked" | "unreachable" | "not-configured";
  model?: string;
  advice?: string;
  redactions: number;
  // registro honesto: o que foi decidido e por quê (sem conteúdo sensível)
  policy: { endpoint: string; local: boolean; allowed: boolean; reason: string };
  error?: string;
};

export interface AssistantProvider {
  readonly id: string;
  health(): Promise<AssistantHealth>;
  listModels(): Promise<string[]>;
  // Advisory apenas: a resposta NUNCA vira mutação governada automaticamente.
  advise(input: { prompt: string; model?: string }): Promise<AssistantAdvice>;
  test(): Promise<IntegrationResult>;
}
