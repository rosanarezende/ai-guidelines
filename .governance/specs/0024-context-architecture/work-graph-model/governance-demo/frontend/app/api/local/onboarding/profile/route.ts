// POST /api/local/onboarding/profile — persiste perfil de governança + regra
// de acúmulo sensível do workspace atual (comando local.profile.save).
import { NextResponse } from "next/server";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { saveProfileDeclaration } from "@/server/adoption/application/configuration";

export async function POST(request: Request) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const body = (await request.json().catch(() => null)) as {
    profile?: unknown;
    sensitiveAccumulationPolicy?: unknown;
    reason?: unknown;
  } | null;
  if (!body) return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  const result = await saveProfileDeclaration({
    ...check.session,
    profile: body.profile,
    sensitiveAccumulationPolicy: body.sensitiveAccumulationPolicy,
    reason: body.reason,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, profileDeclaration: result.value.profileDeclaration });
}
