import { inMemoryEventSink } from "../../acme-analytics/src/index.mjs";

export function materializeDailyMetrics({ day }) {
  const events = inMemoryEventSink().filter((event) => event.occurredAt.startsWith(day));
  const conversions = events.filter(
    (event) => event.name.endsWith("completed") || event.name.endsWith("viewed")
  );
  return {
    day,
    events: events.length,
    conversions: conversions.length,
    conversionRate: events.length === 0 ? 0 : conversions.length / events.length,
    revision: `warehouse-${day}`,
  };
}

export function targetActualSnapshot({ targetId, day }) {
  const metrics = materializeDailyMetrics({ day });
  return {
    targetId,
    revision: metrics.revision,
    value: `${Math.round(metrics.conversionRate * 100)}%`,
    source: "acme-data-pipeline",
  };
}
