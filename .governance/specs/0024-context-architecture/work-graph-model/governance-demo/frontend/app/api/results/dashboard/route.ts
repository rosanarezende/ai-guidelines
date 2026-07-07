import { NextResponse } from "next/server";
import { loadGovernanceSnapshot } from "@demo/backend";
import type { PlannedTarget, Workspace } from "@demo/domain";
import { resolveAdoptionGate } from "@/server/adoption/gate";
import { buildResultsDashboard } from "@/app/results/_model/from-snapshot";
import type {
  ResultMetricSeries,
  ResultScorecard,
  ResultTargetCard,
  ResultsDashboardResponse,
  ResultsDashboardViewModel,
} from "@/app/results/_model/view-models";

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

  if (!gate.isDemo && plannedTargets(gate.currentWorkspace).length === 0) {
    return NextResponse.json({
      ok: true,
      workspace,
      dashboard: null,
      unavailableReason: "governance-host-not-linked",
    } satisfies ResultsDashboardResponse);
  }

  if (!gate.isDemo) {
    return NextResponse.json({
      ok: true,
      workspace,
      dashboard: buildPlanningDashboard(gate.currentWorkspace),
    } satisfies ResultsDashboardResponse);
  }

  const snapshot = await loadGovernanceSnapshot();
  return NextResponse.json({
    ok: true,
    workspace,
    dashboard: buildResultsDashboard(snapshot),
  } satisfies ResultsDashboardResponse);
}

function plannedTargets(workspace: Workspace): PlannedTarget[] {
  return workspace.planning?.targets || [];
}

function buildPlanningDashboard(workspace: Workspace): ResultsDashboardViewModel {
  const targets = plannedTargets(workspace);
  const cycles = [...new Set(targets.map((target) => target.cycle))].sort();
  const targetCards: ResultTargetCard[] = targets.map((target) => ({
    targetId: target.id,
    objectiveId: `objective-${target.id}`,
    title: `${target.objectiveTitle} · ${target.metricId}`,
    expected: String(target.targetValue),
    actual: "sem actual valido",
    period: target.cycle,
    confidence: "no-evidence",
    outcomeCount: 0,
    invalidCount: 0,
  }));
  const scorecards: ResultScorecard[] = [
    {
      id: "planned-targets",
      label: "Metas planejadas",
      value: String(targets.length),
      detail: "Criadas no shell local; ainda sem outcome publicado",
      confidence: "pending",
    },
    {
      id: "measured-targets",
      label: "Metas com medição válida",
      value: `0/${targets.length}`,
      confidence: "no-evidence",
    },
  ];
  const series: ResultMetricSeries[] = targets.map((target) => ({
    id: `series-${target.id}`,
    title: `${target.metricId} (${target.objectiveTitle})`,
    objectiveId: `objective-${target.id}`,
    targetId: target.id,
    metricId: target.metricId,
    unit: "",
    confidence: "no-evidence",
    points: [
      {
        cycle: target.cycle,
        expected: target.targetValue,
        actual: null,
        confidence: "no-evidence",
      },
    ],
    sources: [],
  }));
  return {
    sourceRevision: `local-planning:${workspace.id}`,
    derived: true,
    cycles,
    scorecards,
    targetCards,
    series,
  };
}
