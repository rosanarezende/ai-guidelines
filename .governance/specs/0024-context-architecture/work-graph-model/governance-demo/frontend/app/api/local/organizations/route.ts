// POST /api/local/organizations — cria organização vazia OU anexa a demo acme.
// A sessão passa a apontar para a organização criada/anexada.
import { NextResponse } from "next/server";
import { OrganizationRequestSchema } from "@demo/contracts";
import { attachDemoWorkspace, createWorkspace } from "@/server/adoption/application/use-cases";
import { readSession, writeSession } from "@/server/adoption/session";
import { parseZodJson } from "../_shared/parse-zod-request";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: "no-session" }, { status: 401 });
  const parsed = await parseZodJson(request, OrganizationRequestSchema);
  if (!parsed.ok) return parsed.response;

  const result =
    "mode" in parsed.data
      ? await attachDemoWorkspace({ principalId: session.principalId, companyName: "Acme" })
      : await createWorkspace({
          principalId: session.principalId,
          name: parsed.data.name,
          kind: parsed.data.kind,
        });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  await writeSession({ principalId: session.principalId, workspaceId: result.value.id });
  return NextResponse.json({
    ok: true,
    workspace: {
      id: result.value.id,
      name: result.value.name,
      kind: result.value.kind,
      onboardingStatus: result.value.onboardingStatus,
    },
  });
}
