import type { GovernanceSnapshot } from "@/lib/types";
import assistantPtBr from "./locales/pt-br.json";
import type { ProfileId } from "../profiles";

export type AssistantChoice = "local" | "cloud" | "none";

export function assistantSystems(snapshot: GovernanceSnapshot): string[] {
  const runtime = snapshot.integrationCatalog.integrations.find(
    (item) => item.id === "assistant-runtime-local-cloud"
  );
  const systems = runtime?.systems || ["ollama"];
  return [...systems].sort((a, b) => {
    if (a === "ollama") return -1;
    if (b === "ollama") return 1;
    return a.localeCompare(b);
  });
}

export function providerIsLocal(provider: string): boolean {
  return ["ollama", "lm-studio", "localai", "llama-cpp-server", "vllm"].includes(provider);
}

export function assistantCloudNote(profile: ProfileId): string {
  return assistantPtBr.cloudNotes[profile] || assistantPtBr.cloudNotes.compact;
}
