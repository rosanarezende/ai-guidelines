// GET  /api/local/governance-host — host atual + fit-check + sugestões de path.
// POST /api/local/governance-host — {action: fit-check|link|create|sandbox}.
// Três distribuições físicas + sandbox explícito (QRD-08/09/21); create faz
// scaffold real (host.yml, members/, events/events.jsonl, sourceRevision).
import { NextResponse } from "next/server";
import { GovernanceHostRequestSchema } from "@demo/contracts";
import { normalizeWorkspace } from "@demo/domain";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import {
  createOrLinkHost,
  declareSandbox,
  hostFitCheck,
  suggestHostPath,
} from "@/server/adoption/application/host";
import { readShellState } from "@/server/adoption/application/use-cases";
import { parseZodJson } from "../_shared/parse-zod-request";

export async function GET() {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const state = await readShellState();
  const workspace = state.workspaces.find((item) => item.id === check.session.workspaceId);
  if (!workspace)
    return NextResponse.json({ ok: false, error: "unknown-workspace" }, { status: 404 });
  const ws = normalizeWorkspace(workspace);
  return NextResponse.json({
    ok: true,
    governanceHost: ws.governanceHost || null,
    sandboxDeclared: Boolean(ws.sandboxDeclared),
    suggestions: {
      "dedicated-repo": suggestHostPath("dedicated-repo", ws.name),
      "local-folder": suggestHostPath("local-folder", ws.name),
      "existing-repo-folder": suggestHostPath("existing-repo-folder", ws.name),
    },
  });
}

export async function POST(request: Request) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const parsed = await parseZodJson(request, GovernanceHostRequestSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  if (body.action === "fit-check") {
    const result = await hostFitCheck({ kind: body.kind, pathOrUrl: body.pathOrUrl });
    if (!result.ok) return NextResponse.json(result, { status: 422 });
    return NextResponse.json({ ok: true, fitCheck: result.value });
  }
  if (body.action === "link" || body.action === "create") {
    const result = await createOrLinkHost({
      ...check.session,
      kind: body.kind,
      pathOrUrl: body.pathOrUrl,
      fitReason: body.fitReason,
      scaffold: body.action === "create",
    });
    if (!result.ok) return NextResponse.json(result, { status: 422 });
    return NextResponse.json({
      ok: true,
      governanceHost: result.value.workspace.governanceHost,
      fitCheck: result.value.fitCheck,
    });
  }
  if (body.action === "sandbox") {
    const result = await declareSandbox(check.session);
    if (!result.ok) return NextResponse.json(result, { status: 422 });
    return NextResponse.json({ ok: true, sandboxDeclared: true });
  }
}
