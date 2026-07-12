import { z } from "zod";

const text = z.string().trim();

export const PlanningTargetRequestSchema = z
  .object({
    objectiveTitle: text.min(3).max(160),
    metricId: text
      .min(1)
      .max(80)
      .regex(/^[a-z0-9][a-z0-9._-]*$/i),
    targetValue: z.coerce.number().finite(),
    cycle: text.min(1).max(32).default("2026-Q3"),
  })
  .strict();

export type PlanningTargetRequest = z.infer<typeof PlanningTargetRequestSchema>;

export const PLANNING_ZOD_SCHEMA_IDS = ["PlanningTargetRequestSchema"] as const;
