const samples = [];

export function recordTrace({ service, route, durationMs, status = 200 }) {
  const sample = { service, route, durationMs, status, observedAt: "2026-07-02T00:00:00.000Z" };
  samples.push(sample);
  return sample;
}

export function p99Latency({ service }) {
  const durations = samples
    .filter((sample) => sample.service === service)
    .map((sample) => sample.durationMs)
    .sort((a, b) => a - b);
  if (durations.length === 0) return null;
  return durations[Math.min(durations.length - 1, Math.ceil(durations.length * 0.99) - 1)];
}

export function incidentAlert({ service, severity, summary }) {
  return {
    id: `inc-${service}-${severity}`.toLowerCase(),
    service,
    severity,
    summary,
    source: "acme-obs-stack",
  };
}

export function sloSnapshot({ service }) {
  return {
    service,
    p99Ms: p99Latency({ service }),
    revision: `obs-${service}-2026-07-02`,
    source: "acme-obs-stack",
  };
}
