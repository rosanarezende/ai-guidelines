// POST /api/local/work-sources/[id]/scan — varredura local real da fonte:
// git head/dirty, hash de inventário, detecção de pasta sincronizada; o trust
// é derivado no domínio (fail-closed: erro de scan => untrusted).
import { NextResponse } from "next/server";
import { WorkSourceScanRequestSchema } from "@demo/contracts";
import { normalizeWorkspace } from "@demo/domain";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { readShellState } from "@/server/adoption/application/use-cases";
import { scanWorkSource } from "@/server/adoption/application/work-sources";
import { parseZodJson } from "../../../_shared/parse-zod-request";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const parsed = await parseZodJson(request, WorkSourceScanRequestSchema);
  if (!parsed.ok) return parsed.response;
  const { id } = await context.params;
  const state = await readShellState();
  const workspace = state.workspaces.find((item) => item.id === check.session.workspaceId);
  const source = workspace
    ? normalizeWorkspace(workspace).workSources.find((item) => item.id === id)
    : undefined;
  if (!source)
    return NextResponse.json({ ok: false, error: "unknown-work-source" }, { status: 404 });
  const result = await scanWorkSource({
    ...check.session,
    sourceId: id,
    ...(source.pathOrUrl ? { pathOrUrl: source.pathOrUrl } : {}),
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  const updated = result.value.workSources.find((item) => item.id === id);
  return NextResponse.json({ ok: true, source: updated });
}
