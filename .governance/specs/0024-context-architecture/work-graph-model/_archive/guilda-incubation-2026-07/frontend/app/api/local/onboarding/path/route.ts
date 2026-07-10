// POST /api/local/onboarding/path — registra caminho escolhido (guided|advanced).
import { NextResponse } from "next/server";
import { OnboardingPathRequestSchema } from "@demo/contracts";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { setOnboardingPath } from "@/server/adoption/application/configuration";
import { parseZodJson } from "../../_shared/parse-zod-request";

export async function POST(request: Request) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const parsed = await parseZodJson(request, OnboardingPathRequestSchema);
  if (!parsed.ok) return parsed.response;
  const result = await setOnboardingPath({ ...check.session, path: parsed.data.path });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, onboardingPath: result.value.onboardingPath });
}
