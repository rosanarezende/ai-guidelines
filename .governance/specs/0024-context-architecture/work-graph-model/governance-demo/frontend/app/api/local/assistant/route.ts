// GET  /api/local/assistant — configuração de providers/defaults do workspace.
// POST /api/local/assistant — salva provider (com teste real por default) ou
// dispensa o assistente ({action:"dismiss"}). Endpoint não-loopback sem egress
// aprovado é rejeitado fail-closed (QRD-18/24).
import { NextResponse } from "next/server";
import { normalizeWorkspace } from "@demo/backend/domain";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { dismissAssistant, saveAssistantProvider } from "@/server/adoption/application/assistant";
import { readShellState } from "@/server/adoption/application/use-cases";

export async function GET() {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const state = await readShellState();
  const workspace = state.workspaces.find((item) => item.id === check.session.workspaceId);
  if (!workspace)
    return NextResponse.json({ ok: false, error: "unknown-workspace" }, { status: 404 });
  return NextResponse.json({
    ok: true,
    assistantConfig: normalizeWorkspace(workspace).assistantConfig || {
      providers: [],
      defaults: {},
      dismissed: false,
    },
  });
}

export async function POST(request: Request) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  if (body.action === "dismiss") {
    const result = await dismissAssistant(check.session);
    if (!result.ok) return NextResponse.json(result, { status: 422 });
    return NextResponse.json({ ok: true, dismissed: true });
  }
  const result = await saveAssistantProvider({
    ...check.session,
    kind: body.kind,
    label: body.label,
    preset: body.preset,
    endpoint: body.endpoint,
    model: body.model,
    maxClassification: body.maxClassification,
    egressApproved: body.egressApproved,
    ...(body.runTest === false ? { runTest: false } : {}),
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, provider: result.value.provider });
}
