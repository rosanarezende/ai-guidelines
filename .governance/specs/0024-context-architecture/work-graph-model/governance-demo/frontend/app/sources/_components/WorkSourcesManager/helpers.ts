import type { WorkSource, WorkSourceKind } from "@demo/backend/domain";

export const ADDABLE_SOURCE_KINDS: WorkSourceKind[] = [
  "git-repo",
  "local-folder",
  "cloud-synced-folder",
  "monorepo-module",
  "manual-upload",
  "external-link",
  "github",
];

export const PATH_REQUIRED_KINDS = new Set<WorkSourceKind>([
  "git-repo",
  "local-folder",
  "cloud-synced-folder",
  "monorepo-module",
]);

export function requiresPath(kind: WorkSourceKind): boolean {
  return PATH_REQUIRED_KINDS.has(kind);
}

export function canScanSource(source: WorkSource): boolean {
  return Boolean(source.pathOrUrl) && PATH_REQUIRED_KINDS.has(source.kind);
}

export function shouldScanAfterCreate(kind: WorkSourceKind, pathOrUrl: string): boolean {
  return requiresPath(kind) && pathOrUrl.trim().length > 0;
}

export function supportsBrowserSnapshot(kind: WorkSourceKind): boolean {
  return (
    kind === "git-repo" ||
    kind === "local-folder" ||
    kind === "cloud-synced-folder" ||
    kind === "monorepo-module"
  );
}

export function trustColor(source: WorkSource): "default" | "success" | "warning" | "error" {
  if (source.sourceTrust === "provider-versioned" || source.sourceTrust === "provider-audited") {
    return "success";
  }
  if (source.sourceTrust === "untrusted") return "error";
  if (source.sourceTrust === "declared" || source.sourceTrust === "cloud-sync-unverified") {
    return "warning";
  }
  return "default";
}

export function statusColor(source: WorkSource): "default" | "success" | "warning" {
  if (source.status === "connected") return "success";
  if (source.status === "manual-evidence") return "warning";
  return "default";
}

export function shortHash(value?: string): string {
  if (!value) return "";
  return value.length > 14 ? `${value.slice(0, 14)}…` : value;
}
