// onboardingStorage.ts — browser-local adapter for the adoption shell.
//
// This is UX state only. Governed configuration still requires commands and
// file-first persistence. The adapter uses the shared domain contract so the UI
// does not create an app-only ontology.

import type {
  LocalAccount,
  OnboardingStatus as DomainOnboardingStatus,
  Workspace,
  WorkspaceState,
} from "../../../../../_lib/domain";
import {
  DEMO_WORKSPACE_ID,
  LOCAL_STORAGE_KEYS,
  normalizeOnboardingStatus,
  workspaceStatusKey,
} from "../../../../../_lib/domain";

export type OnboardingStatus = Extract<DomainOnboardingStatus, "partial" | "finished">;

export const ONBOARDING_STORAGE_KEY = LOCAL_STORAGE_KEYS.legacyOnboardingStatus;

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readJson<T>(key: string, fallback: T): T {
  const store = storage();
  if (!store) return fallback;
  const raw = store.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    // Sem localStorage, o app continua funcional; apenas nao lembra o onboarding.
  }
}

function readRawStatus(key: string): OnboardingStatus | null {
  const store = storage();
  if (!store) return null;
  const normalized = normalizeOnboardingStatus(store.getItem(key));
  return normalized === "partial" || normalized === "finished" ? normalized : null;
}

export function readOnboardingStatus(workspaceId?: string): OnboardingStatus | null {
  if (workspaceId) {
    const workspaceStatus = readRawStatus(workspaceStatusKey(workspaceId));
    if (workspaceStatus) return workspaceStatus;
  }
  return readRawStatus(ONBOARDING_STORAGE_KEY);
}

export function writeOnboardingStatus(status: OnboardingStatus, workspaceId?: string): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(ONBOARDING_STORAGE_KEY, status);
    if (workspaceId) store.setItem(workspaceStatusKey(workspaceId), status);
  } catch {
    // Sem localStorage, o app continua funcional; apenas nao lembra o onboarding.
  }
}

export function markOnboardingPartialIfNeeded(workspaceId?: string): void {
  if (readOnboardingStatus(workspaceId) !== "finished") {
    writeOnboardingStatus("partial", workspaceId);
  }
}

export function readAccount(): LocalAccount | null {
  return readJson<LocalAccount | null>(LOCAL_STORAGE_KEYS.account, null);
}

export function writeAccount(account: LocalAccount): void {
  writeJson(LOCAL_STORAGE_KEYS.account, account);
}

export function readWorkspaces(): Workspace[] {
  return readJson<Workspace[]>(LOCAL_STORAGE_KEYS.workspaces, []);
}

export function writeWorkspaces(workspaces: Workspace[]): void {
  writeJson(LOCAL_STORAGE_KEYS.workspaces, workspaces);
}

export function activeWorkspaceId(): string | null {
  const account = readAccount();
  const store = storage();
  return account?.activeWorkspaceId || store?.getItem(LOCAL_STORAGE_KEYS.lastWorkspaceId) || null;
}

export function setActiveWorkspace(workspaceId: string): void {
  const store = storage();
  const account = readAccount();
  if (store) {
    try {
      store.setItem(LOCAL_STORAGE_KEYS.lastWorkspaceId, workspaceId);
    } catch {
      // Best effort only.
    }
  }
  if (account) writeAccount({ ...account, activeWorkspaceId: workspaceId });
}

export function upsertWorkspace(workspace: Workspace): void {
  const current = readWorkspaces();
  const next = current.some((item) => item.id === workspace.id)
    ? current.map((item) => (item.id === workspace.id ? workspace : item))
    : [...current, workspace];
  writeWorkspaces(next);
  setActiveWorkspace(workspace.id);
  const status =
    workspace.onboardingStatus === "finished" || workspace.onboardingStatus === "partial"
      ? workspace.onboardingStatus
      : "partial";
  writeOnboardingStatus(status, workspace.id);
}

export function readWorkspaceState(): WorkspaceState {
  const account = readAccount();
  const workspaces = readWorkspaces();
  const id = activeWorkspaceId();
  const activeWorkspace = workspaces.find((workspace) => workspace.id === id) || null;
  return { account, workspaces, activeWorkspace };
}

export function createWorkspaceId(name: string, existing: Workspace[] = []): string {
  const slug =
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "workspace";
  if (!existing.some((workspace) => workspace.id === slug)) return slug;
  let counter = existing.length + 1;
  while (existing.some((workspace) => workspace.id === `${slug}-${counter}`)) {
    counter += 1;
  }
  return `${slug}-${counter}`;
}

export function demoWorkspaceFromSnapshot(company: string): Workspace {
  return {
    id: DEMO_WORKSPACE_ID,
    name: company || "Acme",
    kind: "sandbox-demo",
    locale: "pt-br",
    governanceHost: {
      kind: "dedicated-repo",
      pathOrUrl: "acme-governance/",
      label: "Host demo acme-governance",
    },
    people: [],
    memberships: [],
    workSources: [],
    onboardingStatus: readOnboardingStatus(DEMO_WORKSPACE_ID) || "not-started",
  };
}
