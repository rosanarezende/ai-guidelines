import type { IntegrationItem } from "@/lib/types";
import copy from "./locales/pt-br.json";

export const SECTIONS = copy.sections;

export function integrationStatus(item: IntegrationItem): {
  label: string;
  color: "default" | "info" | "success" | "warning";
} {
  if (item.id === "assistant-runtime-local-cloud")
    return { label: copy.integrationStatus.localAssistant, color: "success" };
  if (item.id === "graph-export")
    return { label: copy.integrationStatus.graphExport, color: "info" };
  if (item.priority === "deferred")
    return { label: copy.integrationStatus.deferred, color: "warning" };
  return { label: copy.integrationStatus.futureAdapter, color: "default" };
}

export function priorityWeight(priority: string): number {
  if (priority === "P0") return 0;
  if (priority === "P1") return 1;
  if (priority === "P2") return 2;
  return 3;
}
