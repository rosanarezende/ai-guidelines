import { z } from "zod";

export const OnboardingStatusRequestSchema = z
  .object({
    status: z.enum(["partial", "finished"]),
    step: z.number().int().min(0).max(6).optional(),
  })
  .strict();

export type OnboardingStatusRequest = z.infer<typeof OnboardingStatusRequestSchema>;

export const OnboardingPathRequestSchema = z
  .object({
    path: z.enum(["guided", "advanced"]),
  })
  .strict();

export type OnboardingPathRequest = z.infer<typeof OnboardingPathRequestSchema>;

export const ProfileDeclarationRequestSchema = z
  .object({
    profile: z.enum(["full", "compact", "trio", "solo"]),
    sensitiveAccumulationPolicy: z.enum(["record", "warn-review", "block"]),
    reason: z.string().max(2000).optional(),
  })
  .strict();

export type ProfileDeclarationRequest = z.infer<typeof ProfileDeclarationRequestSchema>;

export const WorkspaceModeRequestSchema = z
  .object({
    mode: z.enum(["local", "shared", "controlled"]),
  })
  .strict();

export type WorkspaceModeRequest = z.infer<typeof WorkspaceModeRequestSchema>;

export const GraphReadModelConfigSchema = z
  .object({
    kind: z.enum(["none", "file-export", "neo4j"]),
    url: z.string().min(1).max(2048).optional(),
    status: z.enum(["not-configured", "configured-unverified", "healthy", "stale"]).optional(),
    sourceRevision: z.string().min(1).max(256).optional(),
    lastCheckedAt: z.string().min(1).max(128).optional(),
  })
  .strict();

export const WorkspaceStackPatchSchema = z
  .object({
    executionMode: z.enum(["local-process", "docker-compose", "self-hosted-server"]).optional(),
    operationalStore: z.enum(["files", "sqlite", "postgres"]).optional(),
    graphReadModel: GraphReadModelConfigSchema.optional(),
    identityProvider: z
      .enum([
        "none",
        "local-auth",
        "github-oauth",
        "google-oidc",
        "oidc",
        "gitlab-oauth",
        "bitbucket-oauth",
      ])
      .optional(),
    composeProfiles: z.array(z.string().min(1).max(80)).max(20).optional(),
  })
  .strict();

export type WorkspaceStackPatch = z.infer<typeof WorkspaceStackPatchSchema>;

export const WorkspaceStackRequestSchema = z
  .object({
    stack: WorkspaceStackPatchSchema,
  })
  .strict();

export type WorkspaceStackRequest = z.infer<typeof WorkspaceStackRequestSchema>;

export const ONBOARDING_ZOD_SCHEMA_IDS = [
  "OnboardingStatusRequestSchema",
  "OnboardingPathRequestSchema",
  "ProfileDeclarationRequestSchema",
  "WorkspaceModeRequestSchema",
  "WorkspaceStackRequestSchema",
] as const;
