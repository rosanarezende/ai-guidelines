import { WORKSPACE_ROLE_IDS, type WorkspaceRoleId } from "@demo/domain";
import { z } from "zod";

const workspaceRoleIds = WORKSPACE_ROLE_IDS as [WorkspaceRoleId, ...WorkspaceRoleId[]];

export const SubjectRefSchema = z
  .object({
    kind: z.enum(["person", "team", "group", "service-account", "external-group"]),
    id: z.string().trim().min(1).max(160),
  })
  .strict();

export const InvitePersonRequestSchema = z
  .object({
    personName: z.string().trim().min(1).max(160),
    email: z.string().trim().email().max(320).optional(),
  })
  .strict();

export type InvitePersonRequest = z.infer<typeof InvitePersonRequestSchema>;

export const CreateGroupRequestSchema = z
  .object({
    kind: z.enum(["team", "group"]),
    name: z.string().trim().min(1).max(160),
    memberPersonIds: z.array(z.string().trim().min(1).max(160)).max(200).optional(),
  })
  .strict();

export type CreateGroupRequest = z.infer<typeof CreateGroupRequestSchema>;

export const InviteDecisionRequestSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("accept"),
      token: z.string().trim().min(8).max(256),
    })
    .strict(),
  z
    .object({
      action: z.literal("decline"),
      token: z.string().trim().min(8).max(256),
    })
    .strict(),
  z
    .object({
      action: z.literal("revoke"),
      token: z.string().trim().min(8).max(256).optional(),
    })
    .strict(),
]);

export type InviteDecisionRequest = z.infer<typeof InviteDecisionRequestSchema>;

export const AssignRoleRequestSchema = z
  .object({
    subject: SubjectRefSchema,
    roleId: z.enum(workspaceRoleIds),
    reason: z.string().trim().min(1).max(1000).optional(),
  })
  .strict();

export type AssignRoleRequest = z.infer<typeof AssignRoleRequestSchema>;

export const RoleDecisionRequestSchema = z
  .object({
    action: z.enum(["accept", "reject", "revoke"]),
    reason: z.string().trim().min(1).max(1000).optional(),
  })
  .strict();

export type RoleDecisionRequest = z.infer<typeof RoleDecisionRequestSchema>;

export const MEMBERS_ZOD_SCHEMA_IDS = [
  "InvitePersonRequestSchema",
  "CreateGroupRequestSchema",
  "InviteDecisionRequestSchema",
  "AssignRoleRequestSchema",
  "RoleDecisionRequestSchema",
] as const;
