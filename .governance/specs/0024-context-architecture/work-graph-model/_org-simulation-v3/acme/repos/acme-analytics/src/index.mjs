export const eventSchema = {
  revision: "v1",
  required: ["name", "accountId", "occurredAt"],
  knownEvents: [
    "billing_upgrade_viewed",
    "checkout_started",
    "checkout_completed",
    "onboarding_step_seen",
    "experiment_exposure",
  ],
};

const events = [];

export function track(event) {
  for (const field of eventSchema.required) {
    if (!event[field]) throw new Error(`event missing ${field}`);
  }
  const normalized = {
    ...event,
    schemaRevision: eventSchema.revision,
    receivedAt: "2026-07-02T00:00:00.000Z",
  };
  events.push(normalized);
  return normalized;
}

export function experimentExposure({ experimentId, variant, accountId }) {
  return track({
    name: "experiment_exposure",
    accountId,
    occurredAt: "2026-07-02T00:00:00.000Z",
    properties: { experimentId, variant },
  });
}

export function conversionEvent({ name, accountId, value = 1 }) {
  return track({
    name,
    accountId,
    occurredAt: "2026-07-02T00:00:00.000Z",
    properties: { value },
  });
}

export function inMemoryEventSink() {
  return events.slice();
}
