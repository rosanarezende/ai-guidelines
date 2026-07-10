// api-session.ts — helper de interface: sessão + workspace atuais para as
// rotas de produto /api/local/*. Sem sessão → 401; sem workspace → 400.
import { readSession } from "./session";

export type WorkspaceSession = { principalId: string; workspaceId: string };

export type SessionCheck =
  | { ok: true; session: WorkspaceSession }
  | { ok: false; status: number; error: string };

export async function requireWorkspaceSession(): Promise<SessionCheck> {
  const session = await readSession();
  if (!session) return { ok: false, status: 401, error: "no-session" };
  if (!session.workspaceId) return { ok: false, status: 400, error: "no-workspace-selected" };
  return {
    ok: true,
    session: { principalId: session.principalId, workspaceId: session.workspaceId },
  };
}
