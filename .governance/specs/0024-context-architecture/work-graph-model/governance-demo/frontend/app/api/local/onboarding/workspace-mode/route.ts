// POST /api/local/onboarding/workspace-mode — salva postura do workspace
// (local | shared | controlled). Modo não escolhe ferramenta (QRD-14).
import { NextResponse } from "next/server";
import { WorkspaceModeRequestSchema } from "@demo/contracts";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { saveWorkspaceMode } from "@/server/adoption/application/configuration";
import { parseZodJson } from "../../_shared/parse-zod-request";

export async function POST(request: Request) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const parsed = await parseZodJson(request, WorkspaceModeRequestSchema);
  if (!parsed.ok) return parsed.response;
  const result = await saveWorkspaceMode({ ...check.session, mode: parsed.data.mode });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, mode: result.value.mode });
}
