import { NextResponse } from "next/server";
import { PlanningTargetRequestSchema } from "@demo/contracts";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { savePlanningTarget } from "@/server/adoption/application/planning";
import { parseZodJson } from "../../_shared/parse-zod-request";

export async function POST(request: Request) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });

  const parsed = await parseZodJson(request, PlanningTargetRequestSchema);
  if (!parsed.ok) return parsed.response;

  const result = await savePlanningTarget({
    principalId: check.session.principalId,
    workspaceId: check.session.workspaceId,
    target: parsed.data,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, planning: result.value.planning });
}
