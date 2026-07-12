import { z } from "zod";

const hostKind = z.enum(["dedicated-repo", "local-folder", "existing-repo-folder"]);
const pathOrUrl = z.string().trim().min(1).max(2048);
const fitReason = z.string().trim().min(1).max(1000).optional();

export const GovernanceHostRequestSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("fit-check"),
      kind: hostKind,
      pathOrUrl,
    })
    .strict(),
  z
    .object({
      action: z.literal("link"),
      kind: hostKind,
      pathOrUrl,
      fitReason,
    })
    .strict(),
  z
    .object({
      action: z.literal("create"),
      kind: hostKind,
      pathOrUrl,
      fitReason,
    })
    .strict(),
  z
    .object({
      action: z.literal("sandbox"),
    })
    .strict(),
]);

export type GovernanceHostRequest = z.infer<typeof GovernanceHostRequestSchema>;

export const HOST_ZOD_SCHEMA_IDS = ["GovernanceHostRequestSchema"] as const;
