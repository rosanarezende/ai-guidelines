import path from "node:path";
import { GovernanceError } from "../shared/errors.js";

const BOILERPLATE_SUFFIX = "-boilerplate.md";

export const DEFAULT_REQUIRED_TEMPLATE_RELATIVE_PATHS = Object.freeze([
  "spec-boilerplate.md",
  "plan-boilerplate.md",
  "tasks-boilerplate.md",
] as const);

export function normalizeTemplateRelativePath(relativePath: string): string {
  return relativePath.replaceAll(path.sep, path.posix.sep).replaceAll("\\", path.posix.sep);
}

export function deriveTemplateRecipeName(sourceFilename: string): string | null {
  if (!sourceFilename.endsWith(BOILERPLATE_SUFFIX)) {
    return null;
  }
  return sourceFilename.slice(0, -BOILERPLATE_SUFFIX.length);
}

export function normalizeTemplateContent(content: string): string {
  if (typeof content !== "string") {
    throw new TypeError("Template content must be a string.");
  }

  const normalizedLines = content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""));

  return `${normalizedLines.join("\n").replace(/\n+$/g, "")}\n`;
}

export function assertRequiredTemplatesPresent(
  sourceRelativePaths: readonly string[],
  requiredTemplateRelativePaths: readonly string[] = DEFAULT_REQUIRED_TEMPLATE_RELATIVE_PATHS
): void {
  if (requiredTemplateRelativePaths.length === 0) {
    return;
  }

  const present = new Set(sourceRelativePaths.map(normalizeTemplateRelativePath));
  const missing = requiredTemplateRelativePaths
    .map(normalizeTemplateRelativePath)
    .filter((relativePath) => !present.has(relativePath));

  if (missing.length > 0) {
    throw new GovernanceError(
      "PROVISIONING_TEMPLATE_MISSING",
      [
        `Template obrigatório ausente em .specify/templates: ${missing.join(", ")}.`,
        "Restaure os templates canônicos antes de provisionar consumidores.",
      ].join(" ")
    );
  }
}
