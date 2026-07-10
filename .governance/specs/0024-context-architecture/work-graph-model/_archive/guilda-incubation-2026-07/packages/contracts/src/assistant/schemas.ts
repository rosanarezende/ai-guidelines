import { ASSISTANT_FUNCTIONS, type AssistantFunction } from "@demo/domain";
import { z } from "zod";

const assistantFunctions = ASSISTANT_FUNCTIONS as [AssistantFunction, ...AssistantFunction[]];
const endpoint = z.string().trim().url().max(2048);
const label = z.string().trim().min(1).max(160).optional();
const providerId = z.string().trim().min(1).max(160);

export const AssistantProviderKindSchema = z.enum([
  "lexical-deterministic",
  "ollama",
  "openai-compatible",
  "cloud-approved",
]);

export const SaveAssistantProviderRequestSchema = z.union([
  z
    .object({
      action: z.literal("dismiss"),
    })
    .strict(),
  z
    .object({
      kind: AssistantProviderKindSchema,
      label,
      preset: z.string().trim().min(1).max(160).optional(),
      endpoint: endpoint.optional(),
      model: z.string().trim().min(1).max(160).optional(),
      maxClassification: z.enum(["public", "internal", "confidential", "restricted"]).optional(),
      egressApproved: z.boolean().optional(),
      runTest: z.boolean().optional(),
    })
    .strict(),
]);

export type SaveAssistantProviderRequest = z.infer<typeof SaveAssistantProviderRequestSchema>;

export const AssistantDefaultRequestSchema = z
  .object({
    function: z.enum(assistantFunctions),
    providerId,
  })
  .strict();

export type AssistantDefaultRequest = z.infer<typeof AssistantDefaultRequestSchema>;

export const AssistantProviderTestRequestSchema = z
  .object({
    kind: AssistantProviderKindSchema,
    endpoint: endpoint.optional(),
  })
  .strict();

export type AssistantProviderTestRequest = z.infer<typeof AssistantProviderTestRequestSchema>;

export const ASSISTANT_ZOD_SCHEMA_IDS = [
  "SaveAssistantProviderRequestSchema",
  "AssistantDefaultRequestSchema",
  "AssistantProviderTestRequestSchema",
] as const;
