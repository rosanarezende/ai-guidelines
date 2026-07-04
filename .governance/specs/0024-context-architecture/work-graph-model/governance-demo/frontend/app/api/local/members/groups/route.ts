// POST /api/local/members/groups — cria time/grupo local (QRD-11).
import { NextResponse } from "next/server";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { createGroup } from "@/server/adoption/application/members";

export async function POST(request: Request) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const body = (await request.json().catch(() => null)) as {
    kind?: unknown;
    name?: unknown;
    memberPersonIds?: unknown;
  } | null;
  if (!body) return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  const result = await createGroup({
    ...check.session,
    kind: body.kind,
    name: body.name,
    memberPersonIds: body.memberPersonIds,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, groups: result.value.groups });
}
