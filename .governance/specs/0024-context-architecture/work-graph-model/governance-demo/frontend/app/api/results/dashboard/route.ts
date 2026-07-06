import { NextResponse } from "next/server";
import { loadGovernanceSnapshot } from "@demo/backend";
import { resolveAdoptionGate } from "@/server/adoption/gate";
import { buildResultsDashboard } from "@/app/results/_model/from-snapshot";
import type { ResultsDashboardResponse } from "@/app/results/_model/view-models";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await resolveAdoptionGate();
  if (!gate.principal) {
    return NextResponse.json(
      { ok: false, error: "signup-required" } satisfies ResultsDashboardResponse,
      { status: 401 }
    );
  }
  if (!gate.currentWorkspace) {
    return NextResponse.json(
      { ok: false, error: "workspace-required" } satisfies ResultsDashboardResponse,
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
      dashboard: null,
      unavailableReason: "governance-host-not-linked",
    } satisfies ResultsDashboardResponse);
  }

  const snapshot = await loadGovernanceSnapshot();
  return NextResponse.json({
    ok: true,
    workspace,
    dashboard: buildResultsDashboard(snapshot),
  } satisfies ResultsDashboardResponse);
}
