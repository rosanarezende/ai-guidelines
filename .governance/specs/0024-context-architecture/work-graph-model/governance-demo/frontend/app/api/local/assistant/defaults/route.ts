// POST /api/local/assistant/defaults — define provider default por função
// (explain-policy, suggest-matches, ... — QRD-24).
import { NextResponse } from "next/server";
import { AssistantDefaultRequestSchema } from "@demo/contracts";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { setAssistantDefault } from "@/server/adoption/application/assistant";
import { parseZodJson } from "../../_shared/parse-zod-request";

export async function POST(request: Request) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const parsed = await parseZodJson(request, AssistantDefaultRequestSchema);
  if (!parsed.ok) return parsed.response;
  const result = await setAssistantDefault({
    ...check.session,
    function: parsed.data.function,
    providerId: parsed.data.providerId,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, defaults: result.value.assistantConfig?.defaults || {} });
}
