// POST /api/local/onboarding/status — marca partial/finished por organização.
import { NextResponse } from "next/server";
import { setOnboardingStatus } from "@/server/adoption/application/use-cases";
import { readSession } from "@/server/adoption/session";
import type { OnboardingStatus } from "@demo/contracts";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session?.workspaceId) {
    return NextResponse.json({ ok: false, error: "no-active-workspace" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    status?: unknown;
    step?: unknown;
  } | null;
  const status = body?.status;
  if (status !== "partial" && status !== "finished") {
    return NextResponse.json({ ok: false, error: "invalid-status" }, { status: 400 });
  }
  const step = typeof body?.step === "number" ? Math.floor(body.step) : undefined;
  const result = await setOnboardingStatus({
    principalId: session.principalId,
    workspaceId: session.workspaceId,
    status: status as OnboardingStatus,
    ...(step !== undefined ? { step } : {}),
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, onboardingStatus: result.value.onboardingStatus });
}
