// POST /api/local/members/groups — cria time/grupo local (QRD-11).
import { NextResponse } from "next/server";
import { CreateGroupRequestSchema } from "@demo/contracts";
import { requireWorkspaceSession } from "@/server/adoption/api-session";
import { createGroup } from "@/server/adoption/application/members";
import { parseZodJson } from "../../_shared/parse-zod-request";

export async function POST(request: Request) {
  const check = await requireWorkspaceSession();
  if (!check.ok)
    return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
  const parsed = await parseZodJson(request, CreateGroupRequestSchema);
  if (!parsed.ok) return parsed.response;
  const result = await createGroup({
    ...check.session,
    kind: parsed.data.kind,
    name: parsed.data.name,
    memberPersonIds: parsed.data.memberPersonIds,
  });
  if (!result.ok) return NextResponse.json(result, { status: 422 });
  return NextResponse.json({ ok: true, groups: result.value.groups });
}
