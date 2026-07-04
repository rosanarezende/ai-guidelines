// POST /api/local/assistant/test — testa provider real (Ollama /api/tags ou
// OpenAI-compatible /v1/models), loopback fail-closed pela política de egress.
import { NextResponse } from "next/server";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { testAssistantProvider } from "@/server/adoption/application/assistant";

export async function POST(request: Request) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const body = (await request.json().catch(() => null)) as {
    kind?: unknown;
    endpoint?: unknown;
  } | null;
  if (!body) return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  const result = await testAssistantProvider({ kind: body.kind, endpoint: body.endpoint });
  return NextResponse.json({ ok: result.status === "ok", ...result });
}
