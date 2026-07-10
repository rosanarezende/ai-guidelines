// POST /api/local/auth/bridge — liga a sessao Better Auth ao shell local.
//
// A identidade real vive no portal/control plane. O shell local ganha um
// principal deterministico `portal-*` para escopo de workspace, sem conceder
// authority governada.
import { NextResponse } from "next/server";
import { ensurePortalPrincipal } from "@/server/adoption/application/use-cases";
import { readSession, writeSession } from "@/server/adoption/session";
import { readPortalSession } from "@/server/auth/portal-bridge";

export async function POST(request: Request) {
  const portal = await readPortalSession(request);
  if (!portal.ok) return NextResponse.json(portal, { status: portal.status });

  const principal = await ensurePortalPrincipal({
    portalUserId: portal.value.user.id,
    displayName: portal.value.user.name || portal.value.user.email || "Usuario do portal",
    email: portal.value.user.email,
  });
  if (!principal.ok) return NextResponse.json(principal, { status: 422 });

  const current = await readSession();
  await writeSession({
    principalId: principal.value.id,
    ...(current?.principalId === principal.value.id && current.workspaceId
      ? { workspaceId: current.workspaceId }
      : {}),
  });
  return NextResponse.json({ ok: true, principal: principal.value });
}
