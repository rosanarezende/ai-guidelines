import { NextResponse } from "next/server";
import { IntakeInitiativeRequestSchema } from "@demo/contracts";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { registerIntakeInitiative } from "@/server/adoption/application/intake";
import { parseZodJson } from "../../_shared/parse-zod-request";

export async function POST(request: Request) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });

  const parsed = await parseZodJson(request, IntakeInitiativeRequestSchema);
  if (!parsed.ok) return parsed.response;

  const result = await registerIntakeInitiative({
    principalId: check.session.principalId,
    workspaceId: check.session.workspaceId,
    initiative: parsed.data,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, intake: result.value.intake });
}
