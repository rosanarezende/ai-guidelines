// synthetic-fixture.ts — fixture sintética TIPADA e REPRODUTÍVEL para os
// spikes de volume. Gerador determinístico (mulberry32 com seed fixa): a mesma
// seed produz exatamente o mesmo dataset em todos os candidatos e execuções.
// A fixture nunca representa governança real: é carga de teste de renderer.
import type {
  ConfidenceState,
  DashboardMetricSeries,
  GovernanceGraphEdge,
  GovernanceGraphNode,
  GovernanceGraphViewModel,
  GovernanceTableRow,
  GovernanceTableViewModel,
  RiskLevel,
} from "./view-models";

export const FIXTURE_SEED = 20260704;
export const FIXTURE_REVISION = "fixture@seed-20260704";

// PRNG determinístico (mulberry32) — proibido Math.random no app.
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)] as T;
}

const TEAMS = [
  "time-checkout",
  "time-billing",
  "time-onboarding",
  "time-sre",
  "time-data",
  "time-support",
  "time-identity",
  "time-growth",
] as const;
const OWNERS = [
  "pm-growth",
  "head-platform",
  "head-cx",
  "lead-sre",
  "sponsor-acme",
  "ana-dev",
  "bruno-dev",
  "carla-pm",
] as const;
const CYCLES = ["2026-Q1", "2026-Q2", "2026-Q3", "2026-Q4", "2027-Q1", "2027-Q2"] as const;
const STATUSES = ["active", "paused", "done", "blocked", "proposed"] as const;
const CONFIDENCES: readonly ConfidenceState[] = [
  "verified",
  "verified",
  "verified",
  "pending",
  "pending",
  "no-evidence",
  "self-declared",
  "break-glass",
  "stale",
];
const RISKS: readonly RiskLevel[] = ["low", "low", "low", "attention", "attention", "high"];
const NODE_TYPES = [
  "objective",
  "target",
  "intent",
  "work",
  "repo",
  "contract",
  "outcome",
  "metric",
  "team",
  "incident",
] as const;

// ── Grafo sintético em camadas (objective → … → outcome) ────────────────────

export function buildSyntheticGraph(nodeCount: number): GovernanceGraphViewModel {
  const random = mulberry32(FIXTURE_SEED + nodeCount);
  const nodes: GovernanceGraphNode[] = [];
  const edges: GovernanceGraphEdge[] = [];

  // proporção fixa por tipo, formando uma hierarquia plausível
  const share: Array<[(typeof NODE_TYPES)[number], number]> = [
    ["objective", 0.02],
    ["target", 0.08],
    ["intent", 0.12],
    ["work", 0.3],
    ["repo", 0.05],
    ["contract", 0.08],
    ["outcome", 0.15],
    ["metric", 0.05],
    ["team", 0.03],
    ["incident", 0.12],
  ];
  const byType = new Map<string, string[]>();
  let counter = 0;
  for (const [type, ratio] of share) {
    const total = Math.max(1, Math.round(nodeCount * ratio));
    const ids: string[] = [];
    for (let index = 0; index < total; index += 1) {
      counter += 1;
      const id = `syn-${type}-${index + 1}`;
      ids.push(id);
      nodes.push({
        id,
        type,
        label: `${type} sintético ${index + 1}`,
        owner: pick(random, OWNERS),
        team: pick(random, TEAMS),
        cycle: pick(random, CYCLES),
        status: pick(random, STATUSES),
        confidence: pick(random, CONFIDENCES),
        touchesContract: type === "contract" || random() < 0.18,
        source: `repo-sintetico-${1 + Math.floor(random() * 14)}`,
      });
    }
    byType.set(type, ids);
  }

  const connect = (fromType: string, toType: string, edgeType: string, perNode: number): void => {
    const fromIds = byType.get(fromType) ?? [];
    const toIds = byType.get(toType) ?? [];
    if (toIds.length === 0) return;
    for (const from of fromIds) {
      const links = 1 + Math.floor(random() * perNode);
      for (let index = 0; index < links; index += 1) {
        const to = pick(random, toIds);
        const id = `${edgeType}:${from}->${to}`;
        if (!edges.some((edge) => edge.id === id)) {
          edges.push({ id, source: from, target: to, type: edgeType });
        }
      }
    }
  };

  connect("target", "objective", "contributes-to", 1);
  connect("intent", "target", "primary-target", 1);
  connect("work", "intent", "piece-of", 1);
  connect("work", "repo", "in-repo", 1);
  connect("contract", "repo", "published-by", 1);
  connect("intent", "contract", "changes", 2);
  connect("outcome", "target", "contributes-to", 1);
  connect("outcome", "metric", "measures", 1);
  connect("team", "intent", "runs", 3);
  connect("incident", "repo", "hits", 1);
  connect("intent", "intent", "depends-on", 2);

  return {
    name: `fixture sintética (${nodes.length} nós)`,
    sourceRevision: FIXTURE_REVISION,
    derived: true,
    nodes,
    edges,
    nodeTypes: [...NODE_TYPES],
  };
}

// ── Linhas sintéticas para o spike de tabela ────────────────────────────────

export function buildSyntheticTable(rowCount: number): GovernanceTableViewModel {
  const random = mulberry32(FIXTURE_SEED + rowCount * 7);
  const kinds = ["intent", "proposal", "standalone", "target", "incident"] as const;
  const rows: GovernanceTableRow[] = [];
  for (let index = 0; index < rowCount; index += 1) {
    const kind = pick(random, kinds);
    rows.push({
      id: `syn-row-${index + 1}`,
      kind,
      title: `${kind} sintético ${index + 1} — carga de volume para o grid`,
      owner: pick(random, OWNERS),
      team: pick(random, TEAMS),
      repos: [`repo-sintetico-${1 + Math.floor(random() * 14)}`],
      cycle: pick(random, CYCLES),
      status: pick(random, STATUSES),
      confidence: pick(random, CONFIDENCES),
      risk: pick(random, RISKS),
      nextStep: pick(random, [
        "publicar outcome",
        "decidir gate",
        "aguardando aceite",
        "revisar contrato",
        "desbloquear dependência",
      ]),
      contract: random() < 0.25 ? `contrato-sintetico-${1 + Math.floor(random() * 9)}` : "",
      source: "fixture sintética",
    });
  }
  return {
    name: `fixture sintética (${rowCount} linhas)`,
    sourceRevision: FIXTURE_REVISION,
    derived: true,
    rows,
  };
}

// ── Séries sintéticas para o spike de dashboards ────────────────────────────
// O read-model real da acme tem poucos valores numéricos ("+X%" simbólico);
// a densidade de série vem daqui, com confiança variando por ponto.

export function buildSyntheticSeries(): DashboardMetricSeries[] {
  const random = mulberry32(FIXTURE_SEED + 99);
  const metrics = [
    { id: "conversion-rate", unit: "%", base: 3.2 },
    { id: "activation-rate", unit: "%", base: 41 },
    { id: "churn-rate", unit: "p.p.", base: 6.5 },
    { id: "cost-to-serve", unit: "R$/pedido", base: 48 },
    { id: "p99-latency", unit: "ms", base: 420 },
    { id: "incident-count", unit: "incidentes", base: 14 },
  ];
  return metrics.map((metric, metricIndex) => {
    let actual = metric.base;
    const points = CYCLES.map((cycle, cycleIndex) => {
      const drift = (random() - 0.45) * metric.base * 0.14;
      actual = Math.max(0, actual + drift);
      const expected = metric.base * (1 + 0.03 * cycleIndex);
      return {
        cycle,
        expected: Number(expected.toFixed(1)),
        actual: Number(actual.toFixed(1)),
        confidence: pick(random, CONFIDENCES),
      };
    });
    return {
      id: `syn-serie-${metric.id}`,
      title: `${metric.id} (fixture)`,
      objectiveId: `syn-objective-${(metricIndex % 3) + 1}`,
      targetId: `syn-target-${metricIndex + 1}`,
      metricId: metric.id,
      unit: metric.unit,
      confidence: pick(random, CONFIDENCES),
      points,
      sources: points.map((point, pointIndex) => ({
        outcomeId: `syn-outcome-${metric.id}-${pointIndex + 1}`,
        value: `${point.actual} ${metric.unit}`,
        valid: point.confidence !== "pending" && point.confidence !== "no-evidence",
        source: `warehouse-sintetico/${metric.id}@rev${pointIndex + 10}`,
        window: point.cycle,
      })),
    };
  });
}
