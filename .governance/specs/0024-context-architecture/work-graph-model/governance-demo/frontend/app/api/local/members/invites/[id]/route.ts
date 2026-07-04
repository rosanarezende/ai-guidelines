// POST /api/local/members/invites/[id] — aceitar (com token), recusar ou
// revogar convite. Aceite cria a pessoa no workspace; papel continua à parte.
import { NextResponse } from "next/server";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { decideInvite } from "@/server/adoption/application/members";

const ACTIONS = ["accept", "decline", "revoke"] as const;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    action?: unknown;
    token?: unknown;
  } | null;
  const action = ACTIONS.find((item) => item === body?.action);
  if (!action) return NextResponse.json({ ok: false, error: "invalid-action" }, { status: 400 });
  const result = await decideInvite({
    ...check.session,
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
