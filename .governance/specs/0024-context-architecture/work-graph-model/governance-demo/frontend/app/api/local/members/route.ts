// GET  /api/local/members — visão de pessoas/grupos/convites/papéis/authority.
// POST /api/local/members — convida pessoa (token local, status pending).
// O token do convite só é devolvido na criação; a listagem nunca o expõe.
import { NextResponse } from "next/server";
import { InvitePersonRequestSchema } from "@demo/contracts";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { invitePerson, membersOverview } from "@/server/adoption/application/members";
import { parseZodJson } from "../_shared/parse-zod-request";

export async function GET() {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const overview = await membersOverview(check.session.workspaceId, check.session.principalId);
  if (!overview)
    return NextResponse.json({ ok: false, error: "unknown-workspace" }, { status: 404 });
  return NextResponse.json({ ok: true, ...overview });
}

export async function POST(request: Request) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const parsed = await parseZodJson(request, InvitePersonRequestSchema);
  if (!parsed.ok) return parsed.response;
  const result = await invitePerson({
    ...check.session,
    personName: parsed.data.personName,
    email: parsed.data.email,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, invite: result.value });
}
