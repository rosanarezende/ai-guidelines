import { z } from "zod";

const text = z.string().trim();

export const TriageConfirmRequestSchema = z
  .object({
    question: text.min(3).max(240),
    fate: z.enum(["exploration", "direct-answer", "missing-info"]),
    matcherScore: z.coerce.number().finite().min(0).max(1),
    unknowns: z.array(text.min(1).max(120)).max(10).default([]),
  })
  .strict();

export type TriageConfirmRequest = z.infer<typeof TriageConfirmRequestSchema>;

export const TRIAGE_ZOD_SCHEMA_IDS = ["TriageConfirmRequestSchema"] as const;
