// work-sources.ts — fontes de trabalho com sourceTrust explícito (R1/QRD-22).
// Adicionar registra a fonte como declarada; escanear coleta evidência local
// real (git head, hash, cloud-sync) e o reducer deriva o trust honesto.
// GitHub work-source: contrato modelado (kind "github" + provider fields);
// a conexão cloud real é fatia seguinte — status fica draft, nunca "connected".
import { randomUUID } from "node:crypto";
import type { Workspace, WorkSource, WorkSourceKind, WorkSourceScan } from "@demo/backend/domain";
import { resolveDataSource } from "../data-source";
import { scanLocalSource } from "../infrastructure/source-scan";
import { dispatchForWorkspace, type UseCaseResult } from "./use-cases";

const ADDABLE_KINDS: WorkSourceKind[] = [
  "git-repo",
  "local-folder",
  "cloud-synced-folder",
  "manual-upload",
  "external-link",
  "github",
  "monorepo-module",
];

export async function addWorkSource(input: {
  principalId: string;
  workspaceId: string;
  kind: unknown;
  label: unknown;
  pathOrUrl?: unknown;
}): Promise<UseCaseResult<{ workspace: Workspace; source: WorkSource }>> {
  const kind = ADDABLE_KINDS.find((item) => item === input.kind);
  if (!kind) return { ok: false, error: "invalid-source-kind" };
  if (typeof input.label !== "string" || input.label.trim().length < 2)
    return { ok: false, error: "invalid-source-label" };
  const source: WorkSource = {
    id: `src-${randomUUID()}`,
    kind,
    label: input.label.trim(),
    ...(typeof input.pathOrUrl === "string" && input.pathOrUrl.trim()
      ? { pathOrUrl: input.pathOrUrl.trim() }
      : {}),
    status: kind === "manual-upload" || kind === "external-link" ? "manual-evidence" : "draft",
    sourceTrust: "declared",
    ...(kind === "github" ? { provider: "github", adapterId: "git-provider" } : {}),
  };
  const result = await dispatchForWorkspace(
    "local.work-source.add",
    input.principalId,
    input.workspaceId,
    { source }
  );
  if (!result.ok) return result;
  const saved = result.value.workSources.find((item) => item.id === source.id);
  return { ok: true, value: { workspace: result.value, source: saved || source } };
}

export async function scanWorkSource(input: {
  principalId: string;
  workspaceId: string;
  sourceId: string;
  pathOrUrl?: string;
}): Promise<UseCaseResult<Workspace>> {
  if (resolveDataSource() === "mock-api") {
    // mock: registra um scan simulado marcado como tal (UX apenas)
    return dispatchForWorkspace(
      "local.work-source.record-scan",
      input.principalId,
      input.workspaceId,
      {
        sourceId: input.sourceId,
        scan: {
          scannedAt: new Date().toISOString(),
          fileCount: 42,
          contentHash: "mock000000",
          errors: [],
        },
      }
    );
  }
  if (!input.pathOrUrl) return { ok: false, error: "missing-path" };
  const scan = scanLocalSource(input.pathOrUrl);
  return dispatchForWorkspace(
    "local.work-source.record-scan",
    input.principalId,
    input.workspaceId,
    { sourceId: input.sourceId, scan }
  );
}

export async function recordBrowserWorkSourceScan(input: {
  principalId: string;
  workspaceId: string;
  sourceId: string;
  scan: unknown;
}): Promise<UseCaseResult<Workspace>> {
  const raw = input.scan as Partial<WorkSourceScan> | null;
  if (!raw || typeof raw !== "object") return { ok: false, error: "missing-scan" };
  if (typeof raw.fileCount !== "number" || raw.fileCount < 0)
    return { ok: false, error: "invalid-file-count" };
  if (typeof raw.contentHash !== "string" || !/^[a-z0-9+.-]{6,48}$/i.test(raw.contentHash)) {
    return { ok: false, error: "invalid-content-hash" };
  }
  const scan: WorkSourceScan = {
    scannedAt: new Date().toISOString(),
    fileCount: Math.floor(raw.fileCount),
    contentHash: raw.contentHash,
    errors: [],
  };
  return dispatchForWorkspace(
    "local.work-source.record-scan",
    input.principalId,
    input.workspaceId,
    { sourceId: input.sourceId, scan }
  );
}
