import { z } from "zod";

export const IntegrationStatusRequestSchema = z
  .object({
    status: z.enum(["configured", "disabled"]),
    note: z.string().trim().min(1).max(1000).optional(),
  })
  .strict();

export type IntegrationStatusRequest = z.infer<typeof IntegrationStatusRequestSchema>;

export const INTEGRATIONS_ZOD_SCHEMA_IDS = ["IntegrationStatusRequestSchema"] as const;
