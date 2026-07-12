import { NextResponse } from "next/server";
import { loadGovernanceSnapshot } from "@demo/backend";
import { resolveAdoptionGate } from "@/server/adoption/gate";
import { buildGovernanceMaps } from "@/app/map/_model/from-snapshot";
import type { GovernanceMapsResponse } from "@/app/map/_model/view-models";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await resolveAdoptionGate();
  if (!gate.principal) {
    return NextResponse.json(
      { ok: false, error: "signup-required" } satisfies GovernanceMapsResponse,
      { status: 401 }
    );
  }
  if (!gate.currentWorkspace) {
    return NextResponse.json(
      { ok: false, error: "workspace-required" } satisfies GovernanceMapsResponse,
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
      maps: null,
      unavailableReason: "governance-host-not-linked",
    } satisfies GovernanceMapsResponse);
  }

  const snapshot = await loadGovernanceSnapshot();
  return NextResponse.json({
    ok: true,
    workspace,
    maps: buildGovernanceMaps(snapshot),
  } satisfies GovernanceMapsResponse);
}
