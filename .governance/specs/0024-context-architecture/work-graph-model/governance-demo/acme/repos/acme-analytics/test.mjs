import {
  conversionEvent,
  eventSchema,
  experimentExposure,
  inMemoryEventSink,
} from "./src/index.mjs";

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(eventSchema.revision === "v1", "event schema revision drifted");
assert(eventSchema.knownEvents.includes("experiment_exposure"), "experiment event missing");

experimentExposure({ experimentId: "exp-cta-upgrade", variant: "treatment", accountId: "acct-1" });
conversionEvent({ name: "billing_upgrade_viewed", accountId: "acct-1" });

const events = inMemoryEventSink().filter((event) => event.accountId === "acct-1");
assert(events.length === 2, "analytics sink did not retain events");
assert(
  events.every((event) => event.schemaRevision === "v1"),
  "event schema revision not applied"
);

console.log("acme-analytics local test: ok");
