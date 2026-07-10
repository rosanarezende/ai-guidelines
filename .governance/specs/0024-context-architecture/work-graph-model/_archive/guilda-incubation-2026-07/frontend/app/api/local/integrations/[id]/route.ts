// POST /api/local/integrations/[id] — marca integração como configured/disabled
// no workspace (estado de produto; mecanismo real continua nos adapters).
import { NextResponse } from "next/server";
import { IntegrationStatusRequestSchema } from "@demo/contracts";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { setIntegrationStatus } from "@/server/adoption/application/configuration";
import { parseZodJson } from "../../_shared/parse-zod-request";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const { id } = await context.params;
  const parsed = await parseZodJson(request, IntegrationStatusRequestSchema);
  if (!parsed.ok) return parsed.response;
  const result = await setIntegrationStatus({
    ...check.session,
    integrationId: id,
    status: parsed.data.status,
    note: parsed.data.note,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, integrations: result.value.integrations });
}
