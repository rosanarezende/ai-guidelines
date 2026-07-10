// GET  /api/local/roles — catálogo de papéis + atribuições do workspace.
// POST /api/local/roles — propõe papel para subject (pessoa/time/grupo/...).
// Papel para outra pessoa nasce proposed; authority só após aceite (QRD-10).
import { NextResponse } from "next/server";
import { AssignRoleRequestSchema } from "@demo/contracts";
import { WORKSPACE_ROLE_IDS } from "@demo/domain";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { assignRole, membersOverview } from "@/server/adoption/application/members";
import { parseZodJson } from "../_shared/parse-zod-request";

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
  const parsed = await parseZodJson(request, AssignRoleRequestSchema);
  if (!parsed.ok) return parsed.response;
  const result = await assignRole({
    ...check.session,
    subject: parsed.data.subject,
    roleId: parsed.data.roleId,
    reason: parsed.data.reason,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, roleAssignments: result.value.roleAssignments });
}
