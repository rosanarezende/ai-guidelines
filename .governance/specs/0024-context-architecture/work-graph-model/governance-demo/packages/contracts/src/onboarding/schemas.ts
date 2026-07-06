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

export const ONBOARDING_ZOD_SCHEMA_IDS = [
  "OnboardingStatusRequestSchema",
  "OnboardingPathRequestSchema",
  "ProfileDeclarationRequestSchema",
  "WorkspaceModeRequestSchema",
] as const;
