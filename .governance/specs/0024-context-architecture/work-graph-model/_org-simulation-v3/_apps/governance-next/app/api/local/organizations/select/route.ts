// POST /api/local/organizations/select — troca a organização ativa da sessão.
import { NextResponse } from "next/server";
import { selectWorkspace } from "@/server/adoption/application/use-cases";
import { readSession, writeSession } from "@/server/adoption/session";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: "no-session" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { workspaceId?: unknown } | null;
  if (!body || typeof body.workspaceId !== "string") {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }
  const result = await selectWorkspace({
    principalId: session.principalId,
    workspaceId: body.workspaceId,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  await writeSession({ principalId: session.principalId, workspaceId: result.value.id });
  return NextResponse.json({
    ok: true,
    workspace: { id: result.value.id, onboardingStatus: result.value.onboardingStatus },
  });
}
