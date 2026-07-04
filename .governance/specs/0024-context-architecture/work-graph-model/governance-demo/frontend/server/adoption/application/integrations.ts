// integrations.ts — backlog de integrações por workspace (R1/QRD-26).
// Projeta o catálogo versionado (dado neutro) + estado do workspace em status
// honesto: disponivel · release-1 · em-breve · adiado. "Em breve" é backlog
// priorizado, não mecanismo ativo.
import { loadIntegrationCatalog } from "@demo/backend";
import {
  normalizeWorkspace,
  projectIntegrationBacklog,
  type CatalogIntegrationItem,
  type IntegrationBacklogEntry,
} from "@demo/backend/domain";
import { readShellState } from "./use-cases";

export type IntegrationBacklog = {
  entries: IntegrationBacklogEntry[];
  honestyNote: string;
};

export async function integrationBacklog(workspaceId: string): Promise<IntegrationBacklog | null> {
  const state = await readShellState();
  const workspace = state.workspaces.find((item) => item.id === workspaceId);
  if (!workspace) return null;
  const catalog = loadIntegrationCatalog();
  const entries = projectIntegrationBacklog(
    catalog.integrations as unknown as CatalogIntegrationItem[],
    normalizeWorkspace(workspace).integrations
  );
  return {
    entries,
    honestyNote:
      "Em breve significa backlog priorizado, não mecanismo ativo. O app mostra o que já funciona sem cada integração.",
  };
}
