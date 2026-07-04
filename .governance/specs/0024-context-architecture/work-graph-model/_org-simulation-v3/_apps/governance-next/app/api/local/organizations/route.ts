// POST /api/local/organizations — cria organização vazia OU anexa a demo acme.
// A sessão passa a apontar para a organização criada/anexada.
import { NextResponse } from "next/server";
import { attachDemoWorkspace, createWorkspace } from "@/server/adoption/application/use-cases";
import { readSession, writeSession } from "@/server/adoption/session";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: "no-session" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as {
    mode?: unknown;
    name?: unknown;
    kind?: unknown;
  } | null;
  if (!body) return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });

  const result =
    body.mode === "demo"
      ? await attachDemoWorkspace({ principalId: session.principalId, companyName: "Acme" })
      : await createWorkspace({
          principalId: session.principalId,
          name: body.name,
          kind: body.kind,
        });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  await writeSession({ principalId: session.principalId, workspaceId: result.value.id });
  return NextResponse.json({
    ok: true,
    workspace: {
      id: result.value.id,
      name: result.value.name,
      kind: result.value.kind,
      onboardingStatus: result.value.onboardingStatus,
    },
  });
}
