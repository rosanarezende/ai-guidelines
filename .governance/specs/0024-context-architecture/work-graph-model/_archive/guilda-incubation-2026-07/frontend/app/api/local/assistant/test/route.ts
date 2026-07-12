// POST /api/local/assistant/test — testa provider real (Ollama /api/tags ou
// OpenAI-compatible /v1/models), loopback fail-closed pela política de egress.
import { NextResponse } from "next/server";
import { AssistantProviderTestRequestSchema } from "@demo/contracts";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { testAssistantProvider } from "@/server/adoption/application/assistant";
import { parseZodJson } from "../../_shared/parse-zod-request";

export async function POST(request: Request) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const parsed = await parseZodJson(request, AssistantProviderTestRequestSchema);
  if (!parsed.ok) return parsed.response;
  const result = await testAssistantProvider({
    kind: parsed.data.kind,
    endpoint: parsed.data.endpoint,
  });
  return NextResponse.json({ ok: result.status === "ok", ...result });
}
