// host.ts — use cases do governance host (R1): fit-check, criar/linkar,
// sandbox explícito. Workspace pode existir sem host; onboarding real não
// conclui sem host OU sandbox declarado (QRD-08).
import type { GovernanceHostKind, HostFitCheck, Workspace } from "@demo/backend/domain";
import { governanceHostDirName, workspaceSlugId } from "@demo/backend/domain";
import { resolveDataSource } from "../data-source";
import { runHostFitCheck, scaffoldHost } from "../infrastructure/host-scaffold";
import { dispatchForWorkspace, readShellState, type UseCaseResult } from "./use-cases";

const HOST_KINDS: GovernanceHostKind[] = ["dedicated-repo", "local-folder", "existing-repo-folder"];

function validKind(value: unknown): GovernanceHostKind | null {
  return HOST_KINDS.find((kind) => kind === value) || null;
}

// Em mock-api o filesystem não é a fonte: fit-check devolve resultado simulado
// coerente (a UX é validada; a governança real só no backend real).
function mockFitCheck(): HostFitCheck {
  return {
    checkedAt: new Date().toISOString(),
    pathExists: true,
    writable: true,
    manifestPresent: true,
    eventLogPresent: true,
    sourceRevision: "mock000000",
    warnings: ["mock-api: fit-check simulado — não é verificação real de governança"],
    ok: true,
  };
}

export function suggestHostPath(kind: GovernanceHostKind, workspaceName: string): string {
  const slug = workspaceSlugId(workspaceName, []);
  return governanceHostDirName(kind, slug);
}

export async function hostFitCheck(input: {
  kind: unknown;
  pathOrUrl: unknown;
}): Promise<UseCaseResult<HostFitCheck>> {
  const kind = validKind(input.kind);
  if (!kind) return { ok: false, error: "invalid-host-kind" };
  if (typeof input.pathOrUrl !== "string" || !input.pathOrUrl.trim())
    return { ok: false, error: "missing-path" };
  if (resolveDataSource() === "mock-api") return { ok: true, value: mockFitCheck() };
  try {
    return { ok: true, value: runHostFitCheck(kind, input.pathOrUrl.trim()) };
  } catch (error) {
    return { ok: false, error: String((error as Error).message) };
  }
}

export async function createOrLinkHost(input: {
  principalId: string;
  workspaceId: string;
  kind: unknown;
  pathOrUrl: unknown;
  fitReason?: unknown;
  scaffold: boolean;
}): Promise<UseCaseResult<{ workspace: Workspace; fitCheck: HostFitCheck }>> {
  const kind = validKind(input.kind);
  if (!kind) return { ok: false, error: "invalid-host-kind" };
  if (typeof input.pathOrUrl !== "string" || !input.pathOrUrl.trim())
    return { ok: false, error: "missing-path" };
  const pathOrUrl = input.pathOrUrl.trim();

  const state = await readShellState();
  const workspace = state.workspaces.find((item) => item.id === input.workspaceId);
  if (!workspace) return { ok: false, error: "unknown-workspace" };

  const isMock = resolveDataSource() === "mock-api";
  let fitCheck: HostFitCheck;
  try {
    fitCheck = isMock
      ? mockFitCheck()
      : input.scaffold
        ? scaffoldHost({
            kind,
            pathOrUrl,
            workspaceId: workspace.id,
            workspaceName: workspace.name,
          })
        : runHostFitCheck(kind, pathOrUrl);
  } catch (error) {
    return { ok: false, error: String((error as Error).message) };
  }
  if (!input.scaffold && (!fitCheck.manifestPresent || !fitCheck.eventLogPresent)) {
    return {
      ok: false,
      error: "host-incompleto: rode o fit-check e use scaffold=true para criar",
    };
  }

  const linked = await dispatchForWorkspace(
    "local.host.link",
    input.principalId,
    input.workspaceId,
    {
      host: {
        kind,
        pathOrUrl,
        status: input.scaffold ? "scaffolded" : "linked",
        ...(typeof input.fitReason === "string" && input.fitReason
          ? { fitReason: input.fitReason }
          : {}),
      },
    }
  );
  if (!linked.ok) return linked;
  const recorded = await dispatchForWorkspace(
    "local.host.record-fit-check",
    input.principalId,
    input.workspaceId,
    { fitCheck }
  );
  if (!recorded.ok) return recorded;
  return { ok: true, value: { workspace: recorded.value, fitCheck } };
}

export async function declareSandbox(input: {
  principalId: string;
  workspaceId: string;
}): Promise<UseCaseResult<Workspace>> {
  return dispatchForWorkspace("local.sandbox.declare", input.principalId, input.workspaceId, {});
}
