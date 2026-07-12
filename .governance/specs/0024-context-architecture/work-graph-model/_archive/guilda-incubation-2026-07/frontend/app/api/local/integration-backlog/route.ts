// GET /api/local/integration-backlog — catálogo projetado com status honesto
// (disponivel · release-1 · em-breve · adiado) + estado do workspace (QRD-26).
import { NextResponse } from "next/server";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { integrationBacklog } from "@/server/adoption/application/integrations";

export async function GET() {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const backlog = await integrationBacklog(check.session.workspaceId);
  if (!backlog)
    return NextResponse.json({ ok: false, error: "unknown-workspace" }, { status: 404 });
  return NextResponse.json({ ok: true, ...backlog });
}
