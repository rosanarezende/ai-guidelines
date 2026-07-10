// POST /api/local/demo — inicia a sandbox Acme sem conta no portal.
//
// Isto e uma sessao local anonima para experimentar a UI. Nao cria usuario no
// Better Auth, nao envia e-mail e nao concede autoridade governada fora da demo.
import { NextResponse } from "next/server";
import { startAnonymousDemoSession } from "@/server/adoption/application/use-cases";
import { writeSession } from "@/server/adoption/session";

export async function POST() {
  const result = await startAnonymousDemoSession();
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  await writeSession({
    principalId: result.value.principal.id,
    workspaceId: result.value.workspace.id,
  });
  return NextResponse.json({
    ok: true,
    principal: result.value.principal,
    workspace: {
      id: result.value.workspace.id,
      name: result.value.workspace.name,
      kind: result.value.workspace.kind,
      onboardingStatus: result.value.workspace.onboardingStatus,
    },
  });
}
