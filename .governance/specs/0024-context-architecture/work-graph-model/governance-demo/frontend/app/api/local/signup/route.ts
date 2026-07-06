// POST /api/local/signup — cria o local-principal e abre a sessão local.
// Não é auth real: veja server/adoption/session.ts.
import { NextResponse } from "next/server";
import { SignupRequestSchema } from "@demo/contracts";
import { signupLocalPrincipal } from "@/server/adoption/application/use-cases";
import { writeSession } from "@/server/adoption/session";
import { parseZodJson } from "../_shared/parse-zod-request";

export async function POST(request: Request) {
  const parsed = await parseZodJson(request, SignupRequestSchema);
  if (!parsed.ok) return parsed.response;
  const result = await signupLocalPrincipal({
    displayName: parsed.data.displayName,
    email: parsed.data.email,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  await writeSession({ principalId: result.value.id });
  return NextResponse.json({ ok: true, principal: result.value });
}
