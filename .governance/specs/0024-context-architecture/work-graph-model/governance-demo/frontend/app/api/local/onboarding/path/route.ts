// POST /api/local/onboarding/path — registra caminho escolhido (guided|advanced).
import { NextResponse } from "next/server";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { setOnboardingPath } from "@/server/adoption/application/configuration";

export async function POST(request: Request) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const body = (await request.json().catch(() => null)) as { path?: unknown } | null;
  if (!body) return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  const result = await setOnboardingPath({ ...check.session, path: body.path });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, onboardingPath: result.value.onboardingPath });
}
