// POST /api/local/onboarding/profile — persiste perfil de governança + regra
// de acúmulo sensível do workspace atual (comando local.profile.save).
import { NextResponse } from "next/server";
import { ProfileDeclarationRequestSchema } from "@demo/contracts";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { saveProfileDeclaration } from "@/server/adoption/application/configuration";
import { parseZodJson } from "../../_shared/parse-zod-request";

export async function POST(request: Request) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const parsed = await parseZodJson(request, ProfileDeclarationRequestSchema);
  if (!parsed.ok) return parsed.response;
  const result = await saveProfileDeclaration({
    ...check.session,
    profile: parsed.data.profile,
    sensitiveAccumulationPolicy: parsed.data.sensitiveAccumulationPolicy,
    reason: parsed.data.reason,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, profileDeclaration: result.value.profileDeclaration });
}
