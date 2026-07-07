import { z } from "zod";

const text = z.string().trim();

export const IntakeInitiativeRequestSchema = z
  .object({
    problem: text.min(8).max(280),
    bet: text.min(4).max(220),
    question: text.min(4).max(220),
    linkedTargetId: text.min(1).max(120).optional(),
  })
  .strict();

export type IntakeInitiativeRequest = z.infer<typeof IntakeInitiativeRequestSchema>;

export const INTAKE_ZOD_SCHEMA_IDS = ["IntakeInitiativeRequestSchema"] as const;
