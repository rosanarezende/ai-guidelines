// POST /api/local/work-sources/[id]/browser-scan — registra um snapshot
// escolhido no navegador. Não há caminho absoluto nem Git real aqui; o trust
// resultante é snapshot-only.
import { NextResponse } from "next/server";
import { BrowserWorkSourceScanRequestSchema } from "@demo/contracts";
import { recordBrowserWorkSourceScan } from "@/server/adoption/application/work-sources";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { parseZodJson } from "../../../_shared/parse-zod-request";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const parsed = await parseZodJson(request, BrowserWorkSourceScanRequestSchema);
  if (!parsed.ok) return parsed.response;
  const params = await context.params;
  const result = await recordBrowserWorkSourceScan({
    ...check.session,
    sourceId: params.id,
    scan: parsed.data.scan,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  const source = result.value.workSources.find((item) => item.id === params.id);
  return NextResponse.json({ ok: true, source });
}
