// POST /api/local/organizations — cria organização vazia OU anexa a demo acme.
// A sessão passa a apontar para a organização criada/anexada.
import { NextResponse } from "next/server";
import { OrganizationRequestSchema } from "@demo/contracts";
import { workspaceSlugId } from "@demo/domain";
import {
  attachDemoWorkspace,
  createWorkspace,
  readShellState,
} from "@/server/adoption/application/use-cases";
import { readSession, writeSession } from "@/server/adoption/session";
import { ensurePortalOrganization, readPortalSession } from "@/server/auth/portal-bridge";
import { parseZodJson } from "../_shared/parse-zod-request";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: "no-session" }, { status: 401 });
  const parsed = await parseZodJson(request, OrganizationRequestSchema);
  if (!parsed.ok) return parsed.response;

  const result =
    "mode" in parsed.data
      ? await attachDemoWorkspace({ principalId: session.principalId, companyName: "Acme" })
      : await createWorkspaceWithOptionalPortal(request, session.principalId, {
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

async function createWorkspaceWithOptionalPortal(
  request: Request,
  principalId: string,
  input: { name: string; kind: string }
) {
  const state = await readShellState();
  const workspaceId = workspaceSlugId(
    input.name,
    state.workspaces.map((workspace) => workspace.id)
  );
  const portal = await readPortalSession(request);
  if (portal.ok) {
    const portalOrg = await ensurePortalOrganization(request, {
      name: input.name,
      slug: workspaceId,
    });
    if (!portalOrg.ok) return { ok: false as const, error: portalOrg.error };
  }
  return createWorkspace({
    principalId,
    name: input.name,
    kind: input.kind,
    workspaceId,
  });
}
