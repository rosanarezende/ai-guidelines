// POST /api/local/onboarding/workspace-mode — salva postura do workspace
// (local | shared | controlled). Modo não escolhe ferramenta (QRD-14).
import { NextResponse } from "next/server";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { saveWorkspaceMode } from "@/server/adoption/application/configuration";

export async function POST(request: Request) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const body = (await request.json().catch(() => null)) as { mode?: unknown } | null;
  if (!body) return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  const result = await saveWorkspaceMode({ ...check.session, mode: body.mode });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, mode: result.value.mode });
}
