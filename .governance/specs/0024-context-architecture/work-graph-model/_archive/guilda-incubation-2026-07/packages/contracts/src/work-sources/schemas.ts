import { z } from "zod";

const pathOrUrl = z.string().trim().min(1).max(2048);
const localLabel = z.string().trim().min(2).max(160);

export const WorkSourceKindSchema = z.enum([
  "git-repo",
  "local-folder",
  "cloud-synced-folder",
  "manual-upload",
  "external-link",
  "github",
  "monorepo-module",
]);

export const AddWorkSourceRequestSchema = z
  .object({
    kind: WorkSourceKindSchema,
    label: localLabel,
    pathOrUrl: pathOrUrl.optional(),
  })
  .strict();

export type AddWorkSourceRequest = z.infer<typeof AddWorkSourceRequestSchema>;

export const WorkSourceScanRequestSchema = z.object({}).strict();

export type WorkSourceScanRequest = z.infer<typeof WorkSourceScanRequestSchema>;

export const BrowserWorkSourceScanRequestSchema = z
  .object({
    scan: z
      .object({
        fileCount: z.number().int().min(0).max(1_000_000),
        contentHash: z
          .string()
          .trim()
          .regex(/^[a-z0-9+.-]{6,48}$/i),
      })
      .strict(),
  })
  .strict();

export type BrowserWorkSourceScanRequest = z.infer<typeof BrowserWorkSourceScanRequestSchema>;

export const WORK_SOURCES_ZOD_SCHEMA_IDS = [
  "AddWorkSourceRequestSchema",
  "WorkSourceScanRequestSchema",
  "BrowserWorkSourceScanRequestSchema",
] as const;
