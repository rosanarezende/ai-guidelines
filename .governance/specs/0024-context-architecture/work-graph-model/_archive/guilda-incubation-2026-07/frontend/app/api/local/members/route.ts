// GET  /api/local/members — visão de pessoas/grupos/convites/papéis/authority.
// POST /api/local/members — convida pessoa (token local, status pending).
// O token do convite só é devolvido na criação; a listagem nunca o expõe.
import { NextResponse } from "next/server";
import { InvitePersonRequestSchema } from "@demo/contracts";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { invitePerson, membersOverview } from "@/server/adoption/application/members";
import { invitePortalMember, readPortalSession } from "@/server/auth/portal-bridge";
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
  const email = parsed.data.email?.trim();
  const portal = await readPortalSession(request);
  const portalInvite =
    portal.ok && email
      ? await invitePortalMember(request, { workspaceId: check.session.workspaceId, email })
      : null;
  if (portalInvite && !portalInvite.ok) {
    return NextResponse.json(
      { ok: false, error: portalInvite.error },
      { status: portalInvite.status === 422 ? 422 : 502 }
    );
  }
  const result = await invitePerson({
    ...check.session,
    personName: parsed.data.personName,
    email,
    ...(portalInvite?.ok && portalInvite.value.organizationId
      ? { portalOrganizationId: portalInvite.value.organizationId }
      : {}),
    ...(portalInvite?.ok ? { portalInvitationId: portalInvite.value.id } : {}),
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, invite: result.value });
}
