// POST /api/local/organizations/select — troca a organização ativa da sessão.
import { NextResponse } from "next/server";
import { SelectOrganizationRequestSchema } from "@demo/contracts";
import { selectWorkspace } from "@/server/adoption/application/use-cases";
import { readSession, writeSession } from "@/server/adoption/session";
import { parseZodJson } from "../../_shared/parse-zod-request";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: "no-session" }, { status: 401 });
  const parsed = await parseZodJson(request, SelectOrganizationRequestSchema);
  if (!parsed.ok) return parsed.response;
  const result = await selectWorkspace({
    principalId: session.principalId,
    workspaceId: parsed.data.workspaceId,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  await writeSession({ principalId: session.principalId, workspaceId: result.value.id });
  return NextResponse.json({
    ok: true,
    workspace: { id: result.value.id, onboardingStatus: result.value.onboardingStatus },
  });
}
