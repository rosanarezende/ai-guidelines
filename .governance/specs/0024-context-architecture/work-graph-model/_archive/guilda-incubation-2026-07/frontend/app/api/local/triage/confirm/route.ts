import { NextResponse } from "next/server";
import { TriageConfirmRequestSchema } from "@demo/contracts";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { confirmTriageDecision } from "@/server/adoption/application/triage";
import { parseZodJson } from "../../_shared/parse-zod-request";

export async function POST(request: Request) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });

  const parsed = await parseZodJson(request, TriageConfirmRequestSchema);
  if (!parsed.ok) return parsed.response;

  const result = await confirmTriageDecision({
    principalId: check.session.principalId,
    workspaceId: check.session.workspaceId,
    decision: parsed.data,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, triage: result.value.triage });
}
