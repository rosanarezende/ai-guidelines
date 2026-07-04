// POST /api/local/roles/[id] — aceitar/rejeitar/revogar atribuição de papel.
import { NextResponse } from "next/server";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { decideRole } from "@/server/adoption/application/members";

const ACTIONS = ["accept", "reject", "revoke"] as const;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    action?: unknown;
    reason?: unknown;
  } | null;
  const action = ACTIONS.find((item) => item === body?.action);
  if (!action) return NextResponse.json({ ok: false, error: "invalid-action" }, { status: 400 });
  const result = await decideRole({
    ...check.session,
    assignmentId: id,
    action,
    reason: body?.reason,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, roleAssignments: result.value.roleAssignments });
}
