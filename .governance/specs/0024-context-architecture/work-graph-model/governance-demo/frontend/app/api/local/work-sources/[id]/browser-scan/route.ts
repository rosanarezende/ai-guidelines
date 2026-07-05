// POST /api/local/work-sources/[id]/browser-scan — registra um snapshot
// escolhido no navegador. Não há caminho absoluto nem Git real aqui; o trust
// resultante é snapshot-only.
import { NextResponse } from "next/server";
import { recordBrowserWorkSourceScan } from "@/server/adoption/application/work-sources";
import { requireWorkspaceSession } from "@/server/adoption/api-session";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const body = (await request.json().catch(() => null)) as { scan?: unknown } | null;
  if (!body) return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  const params = await context.params;
  const result = await recordBrowserWorkSourceScan({
    ...check.session,
    sourceId: params.id,
    scan: body.scan,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  const source = result.value.workSources.find((item) => item.id === params.id);
  return NextResponse.json({ ok: true, source });
}
