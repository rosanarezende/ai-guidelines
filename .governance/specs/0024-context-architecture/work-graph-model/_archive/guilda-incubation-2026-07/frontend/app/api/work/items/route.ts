import { NextResponse } from "next/server";
import { loadGovernanceSnapshot } from "@demo/backend";
import { resolveAdoptionGate } from "@/server/adoption/gate";
import { buildWorkItems } from "@/app/work/_model/from-snapshot";
import type { WorkItemsResponse } from "@/app/work/_model/view-models";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await resolveAdoptionGate();
  if (!gate.principal) {
    return NextResponse.json({ ok: false, error: "signup-required" } satisfies WorkItemsResponse, {
      status: 401,
    });
  }
  if (!gate.currentWorkspace) {
    return NextResponse.json(
      { ok: false, error: "workspace-required" } satisfies WorkItemsResponse,
      { status: 404 }
    );
  }

  const workspace = {
    id: gate.currentWorkspace.id,
    name: gate.currentWorkspace.name,
    demo: gate.isDemo,
  };

  if (!gate.isDemo) {
    return NextResponse.json({
      ok: true,
      workspace,
      work: null,
      unavailableReason: "governance-host-not-linked",
    } satisfies WorkItemsResponse);
  }

  const snapshot = await loadGovernanceSnapshot();
  return NextResponse.json({
    ok: true,
    workspace,
    work: buildWorkItems(snapshot),
  } satisfies WorkItemsResponse);
}
