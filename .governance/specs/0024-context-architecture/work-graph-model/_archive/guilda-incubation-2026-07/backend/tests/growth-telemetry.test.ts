import assert from "node:assert/strict";
import test from "node:test";
import { GrowthEventSchema } from "@demo/contracts";

test("growth telemetry accepts coarse journey events without governed content", () => {
  const event = GrowthEventSchema.parse({
    name: "auth_magic_link_requested",
    occurredAt: "2026-07-06T10:00:00.000Z",
    anonymousVisitorId: "visitor-local-1",
    route: "/login",
    source: "server",
    properties: {
      method: "magic-link",
      providerConfigured: true,
    },
  });

  assert.equal(event.name, "auth_magic_link_requested");
  assert.equal(event.properties.method, "magic-link");
});

test("growth telemetry rejects secrets and auth material", () => {
  assert.throws(() =>
    GrowthEventSchema.parse({
      name: "auth_magic_link_requested",
      occurredAt: "2026-07-06T10:00:00.000Z",
      accountId: "password-reset-token",
      route: "/login",
      source: "server",
    })
  );

  assert.throws(() =>
    GrowthEventSchema.parse({
      name: "demo_anonymous_started",
      occurredAt: "2026-07-06T10:00:00.000Z",
      anonymousVisitorId: "visitor-local-1",
      route: "/login",
      source: "client",
      properties: {
        authorization: "Bearer abc",
      },
    })
  );
});
