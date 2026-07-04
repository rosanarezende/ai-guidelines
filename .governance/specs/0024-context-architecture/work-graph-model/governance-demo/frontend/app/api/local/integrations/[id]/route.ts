// POST /api/local/integrations/[id] — marca integração como configured/disabled
// no workspace (estado de produto; mecanismo real continua nos adapters).
import { NextResponse } from "next/server";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { setIntegrationStatus } from "@/server/adoption/application/configuration";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    status?: unknown;
    note?: unknown;
  } | null;
  if (!body) return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  const result = await setIntegrationStatus({
    ...check.session,
    integrationId: id,
    status: body.status,
    note: body.note,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, integrations: result.value.integrations });
}
