// POST /api/local/onboarding/stack — salva execution-mode/operational-store/
// graph-read-model/identity-provider (parcial). Incompatibilidades voltam como
// warnings visíveis (QRD-15); neo4j sem sourceRevision nunca é silencioso.
import { NextResponse } from "next/server";
import { WorkspaceStackRequestSchema } from "@demo/contracts";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { saveWorkspaceStack } from "@/server/adoption/application/configuration";
import { parseZodJson } from "../../_shared/parse-zod-request";

export async function POST(request: Request) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const parsed = await parseZodJson(request, WorkspaceStackRequestSchema);
  if (!parsed.ok) return parsed.response;
  const result = await saveWorkspaceStack({ ...check.session, stack: parsed.data.stack });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({
    ok: true,
    stack: result.value.workspace.stack,
    warnings: result.value.warnings,
  });
}
