// POST /api/local/signup — cria o local-principal e abre a sessão local.
// Não é auth real: veja server/adoption/session.ts.
import { NextResponse } from "next/server";
import { signupLocalPrincipal } from "@/server/adoption/application/use-cases";
import { writeSession } from "@/server/adoption/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    displayName?: unknown;
    email?: unknown;
  } | null;
  if (!body) return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  const result = await signupLocalPrincipal({ displayName: body.displayName, email: body.email });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  await writeSession({ principalId: result.value.id });
  return NextResponse.json({ ok: true, principal: result.value });
}
