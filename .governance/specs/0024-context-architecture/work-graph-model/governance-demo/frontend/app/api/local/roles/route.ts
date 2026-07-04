// GET  /api/local/roles — catálogo de papéis + atribuições do workspace.
// POST /api/local/roles — propõe papel para subject (pessoa/time/grupo/...).
// Papel para outra pessoa nasce proposed; authority só após aceite (QRD-10).
import { NextResponse } from "next/server";
import { WORKSPACE_ROLE_IDS, type SubjectRef } from "@demo/backend/domain";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { assignRole, membersOverview } from "@/server/adoption/application/members";

export async function GET() {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const overview = await membersOverview(check.session.workspaceId);
  if (!overview)
    return NextResponse.json({ ok: false, error: "unknown-workspace" }, { status: 404 });
  return NextResponse.json({
    ok: true,
    roleCatalog: WORKSPACE_ROLE_IDS,
    roleAssignments: overview.roleAssignments,
    authority: overview.authority,
    sensitiveAccumulations: overview.sensitiveAccumulations,
  });
}

export async function POST(request: Request) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const body = (await request.json().catch(() => null)) as {
    subject?: SubjectRef;
    roleId?: unknown;
    reason?: unknown;
  } | null;
  if (!body?.subject)
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  const result = await assignRole({
    ...check.session,
    subject: body.subject,
    roleId: body.roleId,
    reason: body.reason,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, roleAssignments: result.value.roleAssignments });
}
