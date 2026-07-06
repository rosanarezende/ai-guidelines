// GET  /api/local/work-sources — fontes com sourceTrust/limitações visíveis.
// POST /api/local/work-sources — adiciona fonte (entra como "declared").
import { NextResponse } from "next/server";
import { AddWorkSourceRequestSchema } from "@demo/contracts";
import { normalizeWorkspace } from "@demo/domain";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { readShellState } from "@/server/adoption/application/use-cases";
import { addWorkSource } from "@/server/adoption/application/work-sources";
import { parseZodJson } from "../_shared/parse-zod-request";

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
  const parsed = await parseZodJson(request, AddWorkSourceRequestSchema);
  if (!parsed.ok) return parsed.response;
  const result = await addWorkSource({
    ...check.session,
    kind: parsed.data.kind,
    label: parsed.data.label,
    pathOrUrl: parsed.data.pathOrUrl,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, source: result.value.source });
}
