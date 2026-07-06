// POST /api/local/roles/[id] — aceitar/rejeitar/revogar atribuição de papel.
import { NextResponse } from "next/server";
import { RoleDecisionRequestSchema } from "@demo/contracts";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { decideRole } from "@/server/adoption/application/members";
import { parseZodJson } from "../../_shared/parse-zod-request";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const { id } = await context.params;
  const parsed = await parseZodJson(request, RoleDecisionRequestSchema);
  if (!parsed.ok) return parsed.response;
  const result = await decideRole({
    ...check.session,
    assignmentId: id,
    action: parsed.data.action,
    reason: parsed.data.reason,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, roleAssignments: result.value.roleAssignments });
}
