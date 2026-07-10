import type {
  AssistantFunction,
  AssistantProviderConfig,
  AssistantProviderKindId,
  DataClassification,
  WorkspaceAssistantConfig,
} from "@demo/contracts";
import copy from "./_locales/pt-br.json";

export const m = copy.messages;

export type ProviderOption = {
  kind: AssistantProviderKindId;
  label: string;
  desc: string;
  endpoint?: string;
  model?: string;
  maxClassification: DataClassification;
  egressApproved: boolean;
};

export const PROVIDERS: ProviderOption[] = [
  {
    kind: "lexical-deterministic",
    label: m["provider.lexical.label"],
    desc: m["provider.lexical.desc"],
    maxClassification: "internal",
    egressApproved: false,
  },
  {
    kind: "ollama",
    label: m["provider.ollama.label"],
    desc: m["provider.ollama.desc"],
    endpoint: "http://127.0.0.1:11434",
    model: "llama3.2",
    maxClassification: "internal",
    egressApproved: false,
  },
  {
    kind: "cloud-approved",
    label: m["provider.cloud.label"],
    desc: m["provider.cloud.desc"],
    endpoint: "https://api.example.invalid",
    model: "gpt-compatible",
    maxClassification: "public",
    egressApproved: false,
  },
];

export const DEFAULT_FUNCTIONS: AssistantFunction[] = [
  "explain-policy",
  "suggest-triage-questions",
  "suggest-matches",
];

export function functionLabel(fn: AssistantFunction): string {
  return m[`function.${fn}` as keyof typeof m] || fn;
}

export function healthLabel(
  status?: "ok" | "unreachable" | "egress-blocked",
  error?: string
): string {
  if (status === "ok") return m["status.health.ok"];
  if (status === "egress-blocked") return m["status.health.limited"];
  if (status === "unreachable") return m["status.health.unavailable"];
  if (error) return m["status.health.network"];
  return m["status.localPending"];
}

export function latestProvider(
  config: WorkspaceAssistantConfig | null
): AssistantProviderConfig | null {
  const providers = config?.providers || [];
  return providers.length ? providers[providers.length - 1] : null;
}

export function providerTestId(kind: AssistantProviderKindId): string {
  if (kind === "ollama") return "assistant-provider-ollama";
  if (kind === "cloud-approved") return "assistant-provider-cloud";
  return `assistant-provider-${kind}`;
}
