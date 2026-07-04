// POST /api/local/members/invites/[id] — aceitar (com token), recusar ou
// revogar convite. Aceite cria a pessoa no workspace; papel continua à parte.
import { NextResponse } from "next/server";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { decideInvite } from "@/server/adoption/application/members";
import { readSession } from "@/server/adoption/session";

const ACTIONS = ["accept", "decline", "revoke"] as const;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    action?: unknown;
    token?: unknown;
  } | null;
  const action = ACTIONS.find((item) => item === body?.action);
  if (!action) return NextResponse.json({ ok: false, error: "invalid-action" }, { status: 400 });
  const session =
    action === "revoke"
      ? await requireWorkspaceSession()
      : { ok: true as const, session: await readSession() };
  if (!session.ok)
    return NextResponse.json({ ok: false, error: session.error }, { status: session.status });
  if (!session.session) {
    return NextResponse.json({ ok: false, error: "no-session" }, { status: 401 });
  }
  const result = await decideInvite({
    principalId: session.session.principalId,
    ...(action === "revoke" ? { workspaceId: session.session.workspaceId } : {}),
    inviteId: id,
    action,
    token: body?.token,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({
    ok: true,
    invites: result.value.invites.map(({ token: _token, ...invite }) => invite),
    people: result.value.people,
  });
}
