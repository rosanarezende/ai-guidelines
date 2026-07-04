// GET  /api/local/work-sources — fontes com sourceTrust/limitações visíveis.
// POST /api/local/work-sources — adiciona fonte (entra como "declared").
import { NextResponse } from "next/server";
import { normalizeWorkspace } from "@demo/backend/domain";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { readShellState } from "@/server/adoption/application/use-cases";
import { addWorkSource } from "@/server/adoption/application/work-sources";

export async function GET() {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const state = await readShellState();
  const workspace = state.workspaces.find((item) => item.id === check.session.workspaceId);
  if (!workspace)
    return NextResponse.json({ ok: false, error: "unknown-workspace" }, { status: 404 });
  return NextResponse.json({ ok: true, workSources: normalizeWorkspace(workspace).workSources });
}

export async function POST(request: Request) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const body = (await request.json().catch(() => null)) as {
    kind?: unknown;
    label?: unknown;
    pathOrUrl?: unknown;
  } | null;
  if (!body) return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  const result = await addWorkSource({
    ...check.session,
    kind: body.kind,
    label: body.label,
    pathOrUrl: body.pathOrUrl,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, source: result.value.source });
}
