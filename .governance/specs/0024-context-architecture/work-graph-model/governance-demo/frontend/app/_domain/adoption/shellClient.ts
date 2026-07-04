// shellClient.ts — gateway client do shell local de adoção.
//
// Toda escrita passa pelas rotas /api/local/* (que aplicam comando + event-log
// no backend file-first). A UI não usa storage do navegador: a sessão vive em
// cookie httpOnly e o estado vive em arquivo no servidor local.
import type { OnboardingStatus, WorkspaceKind } from "@demo/backend/domain";

export type ShellWorkspaceSummary = {
  id: string;
  name?: string;
  kind?: WorkspaceKind;
  onboardingStatus: OnboardingStatus;
};

type ShellResponse<T> = ({ ok: true } & T) | { ok: false; error: string };

async function postJson<T>(url: string, body: unknown): Promise<ShellResponse<T>> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await response.json()) as ShellResponse<T>;
  } catch {
    return { ok: false, error: "network" };
  }
}

export function signupLocal(input: { displayName: string; email?: string }) {
  return postJson<{ principal: { id: string; displayName: string } }>("/api/local/signup", input);
}

export function createOrganization(input: { name: string; kind: WorkspaceKind }) {
  return postJson<{ workspace: ShellWorkspaceSummary }>("/api/local/organizations", input);
}

export function attachDemoOrganization() {
  return postJson<{ workspace: ShellWorkspaceSummary }>("/api/local/organizations", {
    mode: "demo",
  });
}

export function selectOrganization(workspaceId: string) {
  return postJson<{ workspace: ShellWorkspaceSummary }>("/api/local/organizations/select", {
    workspaceId,
  });
}

export function reportOnboardingStatus(status: Extract<OnboardingStatus, "partial" | "finished">) {
  return postJson<{ onboardingStatus: OnboardingStatus }>("/api/local/onboarding/status", {
    status,
  });
}

// ── persistência das ESCOLHAS do onboarding (R1) ───────────────────────────

export function saveProfileChoice(input: {
  profile: string;
  sensitiveAccumulationPolicy: string;
  reason: string;
}) {
  return postJson<{ profileDeclaration: unknown }>("/api/local/onboarding/profile", input);
}

export function saveOnboardingPath(path: "guided" | "advanced") {
  return postJson<{ onboardingPath: string }>("/api/local/onboarding/path", { path });
}

export function addDeclaredWorkSource(input: { kind: string; label: string; pathOrUrl?: string }) {
  return postJson<{ source: unknown }>("/api/local/work-sources", input);
}

export async function listWorkSources(): Promise<Array<{ id: string; kind: string }>> {
  try {
    const response = await fetch("/api/local/work-sources");
    const body = (await response.json()) as {
      ok: boolean;
      workSources?: Array<{ id: string; kind: string }>;
    };
    return body.ok ? body.workSources || [] : [];
  } catch {
    return [];
  }
}

export function saveAssistantProviderChoice(input: {
  kind: string;
  label?: string;
  endpoint?: string;
  runTest?: boolean;
}) {
  return postJson<{ provider: unknown }>("/api/local/assistant", input);
}

export function dismissAssistantChoice() {
  return postJson<{ dismissed: boolean }>("/api/local/assistant", { action: "dismiss" });
}

export function routeAfterSelect(workspace: ShellWorkspaceSummary): string {
  return workspace.onboardingStatus === "not-started" ? "/onboarding" : "/";
}
