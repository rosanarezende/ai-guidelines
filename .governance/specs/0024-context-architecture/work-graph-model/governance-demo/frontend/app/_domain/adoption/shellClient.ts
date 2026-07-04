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

export function routeAfterSelect(workspace: ShellWorkspaceSummary): string {
  return workspace.onboardingStatus === "not-started" ? "/onboarding" : "/";
}
