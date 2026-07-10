// POST /api/local/onboarding/status — marca partial/finished por organização.
import { NextResponse } from "next/server";
import { OnboardingStatusRequestSchema } from "@demo/contracts";
import { setOnboardingStatus } from "@/server/adoption/application/use-cases";
import { readSession } from "@/server/adoption/session";
import { parseZodJson } from "../../_shared/parse-zod-request";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session?.workspaceId) {
    return NextResponse.json({ ok: false, error: "no-active-workspace" }, { status: 401 });
  }
  const parsed = await parseZodJson(request, OnboardingStatusRequestSchema);
  if (!parsed.ok) return parsed.response;
  const result = await setOnboardingStatus({
    principalId: session.principalId,
    workspaceId: session.workspaceId,
    status: parsed.data.status,
    ...(parsed.data.step !== undefined ? { step: parsed.data.step } : {}),
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, onboardingStatus: result.value.onboardingStatus });
}
