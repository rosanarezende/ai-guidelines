// session.ts — interface adapter: sessão LOCAL via cookie httpOnly.
//
// HONESTIDADE: isto NÃO é autenticação. O cookie não é assinado nem cifrado;
// ele apenas lembra qual local-principal e qual organização estão ativos nesta
// máquina. Auth real (identity-provider, sessão stateless assinada) é adapter
// futuro — por isso o formato é um JSON opaco e versionado, fácil de trocar.
import { cookies } from "next/headers";

export const SESSION_COOKIE = "governance-local-session";

export type LocalSession = {
  principalId: string;
  workspaceId?: string;
};

export async function readSession(): Promise<LocalSession | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LocalSession;
    return parsed && typeof parsed.principalId === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export async function writeSession(session: LocalSession): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
