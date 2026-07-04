// POST /api/local/assistant/defaults — define provider default por função
// (explain-policy, suggest-matches, ... — QRD-24).
import { NextResponse } from "next/server";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { setAssistantDefault } from "@/server/adoption/application/assistant";

export async function POST(request: Request) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const body = (await request.json().catch(() => null)) as {
    function?: unknown;
    providerId?: unknown;
  } | null;
  if (!body) return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  const result = await setAssistantDefault({
    ...check.session,
    function: body.function,
    providerId: body.providerId,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, defaults: result.value.assistantConfig?.defaults || {} });
}
