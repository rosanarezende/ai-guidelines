import { z } from "zod";

const displayName = z.string().trim().min(2).max(80);
const workspaceName = z.string().trim().min(2).max(80);
const localId = z.string().trim().min(1).max(160);

export const SignupRequestSchema = z
  .object({
    displayName,
    email: z.string().trim().email().max(320).optional(),
  })
  .strict();

export type SignupRequest = z.infer<typeof SignupRequestSchema>;

export const OrganizationRequestSchema = z.union([
  z
    .object({
      mode: z.literal("demo"),
    })
    .strict(),
  z
    .object({
      name: workspaceName,
      kind: z.enum(["company", "personal", "client"]),
    })
    .strict(),
]);

export type OrganizationRequest = z.infer<typeof OrganizationRequestSchema>;

export const SelectOrganizationRequestSchema = z
  .object({
    workspaceId: localId,
  })
  .strict();

export type SelectOrganizationRequest = z.infer<typeof SelectOrganizationRequestSchema>;

export const WORKSPACE_ZOD_SCHEMA_IDS = [
  "SignupRequestSchema",
  "OrganizationRequestSchema",
  "SelectOrganizationRequestSchema",
] as const;
