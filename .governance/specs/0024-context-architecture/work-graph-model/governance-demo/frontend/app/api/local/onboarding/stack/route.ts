// POST /api/local/onboarding/stack — salva execution-mode/operational-store/
// graph-read-model/identity-provider (parcial). Incompatibilidades voltam como
// warnings visíveis (QRD-15); neo4j sem sourceRevision nunca é silencioso.
import { NextResponse } from "next/server";
import type { WorkspaceStack } from "@demo/contracts";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { saveWorkspaceStack } from "@/server/adoption/application/configuration";

export async function POST(request: Request) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const body = (await request.json().catch(() => null)) as {
    stack?: Partial<WorkspaceStack>;
  } | null;
  if (!body?.stack) return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  const result = await saveWorkspaceStack({ ...check.session, stack: body.stack });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({
    ok: true,
    stack: result.value.workspace.stack,
    warnings: result.value.warnings,
  });
}
