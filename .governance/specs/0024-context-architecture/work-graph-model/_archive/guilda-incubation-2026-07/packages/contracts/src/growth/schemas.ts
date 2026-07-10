import { z } from "zod";

const safeEventId = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .refine((value) => !/token|secret|password|bearer|cookie|authorization/i.test(value), {
    message: "growth telemetry ids must be opaque non-secret ids",
  });

export const GrowthEventNameSchema = z.enum([
  "auth_magic_link_requested",
  "auth_social_started",
  "demo_anonymous_started",
  "workspace_created",
  "workspace_selected",
  "onboarding_step_viewed",
  "onboarding_step_completed",
  "governance_host_fit_checked",
  "work_source_added",
  "assistant_provider_tested",
]);

export type GrowthEventName = z.infer<typeof GrowthEventNameSchema>;

export const GrowthEventPropertySchema = z.union([
  z.string().max(200),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const GrowthEventSchema = z
  .object({
    name: GrowthEventNameSchema,
    occurredAt: z.string().datetime(),
    anonymousVisitorId: safeEventId.optional(),
    accountId: safeEventId.optional(),
    workspaceId: safeEventId.optional(),
    route: z.string().trim().max(120).startsWith("/").optional(),
    source: z.enum(["client", "server"]).default("server"),
    properties: z.record(z.string().max(80), GrowthEventPropertySchema).default({}),
  })
  .strict()
  .superRefine((event, ctx) => {
    const serialized = JSON.stringify(event.properties).toLowerCase();
    if (/token|secret|password|bearer|cookie|authorization/.test(serialized)) {
      ctx.addIssue({
        code: "custom",
        path: ["properties"],
        message: "growth telemetry properties must not contain secrets or auth material",
      });
    }
  });

export type GrowthEvent = z.infer<typeof GrowthEventSchema>;

export const GrowthAdapterKindSchema = z.enum([
  "posthog",
  "plausible",
  "matomo",
  "umami",
  "google-analytics",
  "segment",
  "amplitude",
  "mixpanel",
  "local-jsonl",
]);

export type GrowthAdapterKind = z.infer<typeof GrowthAdapterKindSchema>;

export const GROWTH_TELEMETRY_ZOD_SCHEMA_IDS = [
  "GrowthEventNameSchema",
  "GrowthEventSchema",
  "GrowthAdapterKindSchema",
] as const;
