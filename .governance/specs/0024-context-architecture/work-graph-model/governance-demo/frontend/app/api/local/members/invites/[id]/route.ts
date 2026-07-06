// POST /api/local/members/invites/[id] — aceitar (com token), recusar ou
// revogar convite. Aceite cria a pessoa no workspace; papel continua à parte.
import { NextResponse } from "next/server";
import { InviteDecisionRequestSchema } from "@demo/contracts";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { decideInvite } from "@/server/adoption/application/members";
import { readSession } from "@/server/adoption/session";
import { parseZodJson } from "../../../_shared/parse-zod-request";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = await parseZodJson(request, InviteDecisionRequestSchema);
  if (!parsed.ok) return parsed.response;
  const { action } = parsed.data;
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
    token: parsed.data.token,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({
    ok: true,
    invites: result.value.invites.map(({ token: _token, ...invite }) => invite),
    people: result.value.people,
  });
}
