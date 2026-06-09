import { promises as fs } from "node:fs";
import path from "node:path";

import { Rule } from "../../domain/rules/Rule.js";
import { ParsedRulesResult, RulesMarkdownSource } from "../../app/ports/RulesMarkdownSource.js";

const VALID_SCOPES = ["universal", "adapter", "opt-in"] as const;
const VALID_CATEGORIES = [
  "correctness",
  "security",
  "maintainability",
  "process",
  "editorial",
] as const;
const VALID_EVIDENCE_STRENGTHS = ["strong", "medium", "emerging", "declared_heuristic"] as const;
const REQUIRED_FIELDS = [
  "id",
  "scope",
  "category",
  "evidence_strength",
  "sources",
  "applicable_languages",
  "tags",
] as const;
const ADAPTER_VALUES = ["claude", "codex", "gemini"] as const;

type ParsedYaml = Record<string, unknown>;

export class MarkdownRulesDirectorySource implements RulesMarkdownSource {
  constructor(
    private readonly dirPath: string,
    private readonly options: { readonly storedFilePath?: (filePath: string) => string } = {}
  ) {}

  async load(): Promise<ParsedRulesResult> {
    return parseRulesFromDirectory(this.dirPath, this.options);
  }
}

export async function parseRulesFromDirectory(
  dirPath: string,
  options: { readonly storedFilePath?: (filePath: string) => string } = {}
): Promise<ParsedRulesResult> {
  const rules: Rule[] = [];
  const errors: string[] = [];
  const seenIds = new Set<string>();

  try {
    await walkDirectory(dirPath, async (filePath) => {
      if (shouldIgnoreFile(filePath)) return;

      try {
        const content = await fs.readFile(filePath, "utf-8");
        const fileResult = parseRuleFile(filePath, content, {
          storedFilePath: options.storedFilePath?.(filePath) ?? filePath,
        });
        for (const rule of fileResult.rules) {
          if (seenIds.has(rule.id)) {
            errors.push(
              `[DUPLICATE_ID] ID "${rule.id}" is duplicated across files. ` +
                `First seen in previous file, now in ${path.relative(dirPath, filePath)}`
            );
          } else {
            seenIds.add(rule.id);
            rules.push(rule);
          }
        }
        errors.push(...fileResult.errors);
      } catch (err) {
        errors.push(
          `[FILE_READ_ERROR] Failed to read file ${path.relative(dirPath, filePath)}: ${
            (err as Error).message
          }`
        );
      }
    });
  } catch (err) {
    errors.push(`[DIRECTORY_ERROR] Failed to read directory ${dirPath}: ${(err as Error).message}`);
  }

  return { rules, errors };
}

export function parseRuleFile(
  filePath: string,
  content: string,
  options: { readonly storedFilePath?: string } = {}
): { readonly rules: Rule[]; readonly errors: string[] } {
  const rules: Rule[] = [];
  const errors: string[] = [];
  const headingRegex = /^####\s+\[([^\]]+)\]\s+(.+)$/gm;
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(content)) !== null) {
    const ruleId = match[1];
    const ruleTitle = match[2];
    const ruleStartIndex = match.index + match[0].length;
    const nextHeadingMatch = headingRegex.exec(content);
    const ruleEndIndex = nextHeadingMatch ? nextHeadingMatch.index : content.length;
    headingRegex.lastIndex = ruleStartIndex;

    const ruleContent = content.slice(ruleStartIndex, ruleEndIndex);
    const yamlBlockRegex = /```yaml\s*\n([\s\S]*?)```/;
    const yamlMatch = yamlBlockRegex.exec(ruleContent);
    if (!yamlMatch) {
      errors.push(
        `[MISSING_YAML_BLOCK] Rule [${ruleId}] in ${path.basename(filePath)}: ` +
          "No ```yaml block found after heading."
      );
      continue;
    }

    const yamlContent = yamlMatch[1];
    const bodyContentStartIndex = yamlMatch.index + yamlMatch[0].length;
    const bodyContent = ruleContent.slice(bodyContentStartIndex).trim();
    const instructionMarker = "**Instruction (en):**";
    const documentationMarker = "**Documentação (pt-br):**";
    const instructionCount = bodyContent.split(instructionMarker).length - 1;
    const documentationCount = bodyContent.split(documentationMarker).length - 1;

    if (instructionCount > 1 || documentationCount > 1) {
      errors.push(
        `[DUPLICATE_SECTION] Rule [${ruleId}] in ${path.basename(filePath)}: ` +
          "Multiple '**Instruction (en):**' or '**Documentação (pt-br):**' blocks found."
      );
      continue;
    }

    const instructionIndex = findMarkerOutsideCodeFences(bodyContent, instructionMarker);
    const documentationIndex = findMarkerOutsideCodeFences(bodyContent, documentationMarker);
    let instructionEn = "";
    let documentationPt = "";

    if (instructionIndex !== -1) {
      const instructionStart = instructionIndex + instructionMarker.length;
      const instructionEnd = documentationIndex !== -1 ? documentationIndex : bodyContent.length;
      instructionEn = extractSectionUntilBoundary(
        bodyContent.slice(instructionStart, instructionEnd)
      ).trim();
    }

    if (documentationIndex !== -1) {
      const documentationStart = documentationIndex + documentationMarker.length;
      documentationPt = extractSectionUntilBoundary(bodyContent.slice(documentationStart)).trim();
    }

    if (documentationIndex !== -1 && documentationIndex < instructionIndex) {
      errors.push(
        `[INVALID_RULE] Rule [${ruleId}] in ${path.basename(filePath)}: ` +
          "'**Documentação (pt-br):**' appears before '**Instruction (en):**'."
      );
      continue;
    }

    if (!instructionEn || instructionEn.length < 10) {
      errors.push(
        `[INVALID_CONTENT] Rule [${ruleId}] in ${path.basename(filePath)}: ` +
          "The '**Instruction (en):**' content is missing or too short (minimum 10 characters)."
      );
      continue;
    }

    let parsedYaml: ParsedYaml;
    try {
      parsedYaml = parseYamlSubset(yamlContent);
    } catch (err) {
      errors.push(
        `[INVALID_RULE] Rule [${ruleId}] in ${path.basename(filePath)}: YAML_PARSE_ERROR - ${
          (err as Error).message
        }`
      );
      continue;
    }

    const validation = validateRule(parsedYaml);
    if (!validation.valid) {
      errors.push(
        `[INVALID_SCHEMA] Rule [${ruleId}] in ${path.basename(filePath)}: ` +
          validation.errors.join("; ")
      );
      continue;
    }

    rules.push({
      ...(parsedYaml as Omit<Rule, "file" | "title" | "instruction_en" | "documentation_pt">),
      file: options.storedFilePath ?? filePath,
      title: ruleTitle,
      instruction_en: instructionEn,
      documentation_pt: documentationPt,
    });
  }

  return { rules, errors };
}

export function validateRule(rule: ParsedYaml): {
  readonly valid: boolean;
  readonly errors: string[];
} {
  const errors: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (!(field in rule)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (typeof rule.scope === "string" && !VALID_SCOPES.includes(rule.scope as never)) {
    errors.push(`Invalid scope "${rule.scope}". Allowed: ${VALID_SCOPES.join(", ")}`);
  }

  if (typeof rule.category === "string" && !VALID_CATEGORIES.includes(rule.category as never)) {
    errors.push(`Invalid category "${rule.category}". Allowed: ${VALID_CATEGORIES.join(", ")}`);
  }

  if (
    typeof rule.evidence_strength === "string" &&
    !VALID_EVIDENCE_STRENGTHS.includes(rule.evidence_strength as never)
  ) {
    errors.push(
      `Invalid evidence_strength "${rule.evidence_strength}". ` +
        `Allowed: ${VALID_EVIDENCE_STRENGTHS.join(", ")}`
    );
  }

  if ("sources" in rule && !Array.isArray(rule.sources)) {
    errors.push('Field "sources" must be an array (even if it contains external evidence).');
  }

  if (
    ["correctness", "security"].includes(String(rule.category)) &&
    ["strong", "medium"].includes(String(rule.evidence_strength)) &&
    (!Array.isArray(rule.sources) || rule.sources.length === 0)
  ) {
    errors.push(
      `Category "${String(rule.category)}" with evidence_strength "${String(
        rule.evidence_strength
      )}" requires non-empty "sources" field.`
    );
  }

  if (rule.scope === "opt-in" && !rule.opt_in_feature) {
    errors.push('Scope "opt-in" requires "opt_in_feature" field.');
  }

  if (rule.scope === "adapter" && !rule.adapter) {
    errors.push('Scope "adapter" requires "adapter" field.');
  }

  if (typeof rule.adapter === "string" && !ADAPTER_VALUES.includes(rule.adapter as never)) {
    errors.push(`Invalid adapter "${rule.adapter}". Allowed: ${ADAPTER_VALUES.join(", ")}`);
  }

  if ("validated_by_benchmark" in rule && typeof rule.validated_by_benchmark !== "boolean") {
    if (rule.validated_by_benchmark === "true" || rule.validated_by_benchmark === "false") {
      rule.validated_by_benchmark = rule.validated_by_benchmark === "true";
    } else {
      errors.push(
        `Invalid validated_by_benchmark "${String(
          rule.validated_by_benchmark
        )}". Must be true or false.`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

function extractSectionUntilBoundary(text: string): string {
  const result: string[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("---") || trimmed.startsWith("## ") || trimmed.startsWith("#### ")) {
      break;
    }
    result.push(line);
  }
  return result.join("\n");
}

function shouldIgnoreFile(filePath: string): boolean {
  const basename = path.basename(filePath);
  const normalized = filePath.replace(/\\/g, "/");
  return (
    normalized.includes("/_meta/") ||
    basename === "catalog.md" ||
    basename.endsWith("-ledger.md") ||
    basename.startsWith("_") ||
    !basename.endsWith(".md")
  );
}

async function walkDirectory(
  dirPath: string,
  callback: (filePath: string) => Promise<void>
): Promise<void> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".git") {
        await walkDirectory(fullPath, callback);
      }
    } else if (entry.isFile()) {
      await callback(fullPath);
    }
  }
}

function parseYamlSubset(yamlContent: string): ParsedYaml {
  const result: ParsedYaml = {};
  const lines = yamlContent.split("\n");
  let currentArray: unknown[] | null = null;
  let currentKey: string | null = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.replace(/#.*$/, "").trim();
    if (!trimmed) continue;

    const match = /^( *)/.exec(line);
    const leadingSpaces = match ? match[1].length : 0;
    if (leadingSpaces > 0 && leadingSpaces % 2 !== 0) {
      throw new Error(
        `YAML indentation error at line ${i + 1}: expected 2-space indent, got ${leadingSpaces} spaces`
      );
    }

    if (trimmed.startsWith("- ")) {
      if (!currentArray) {
        throw new Error(`Unexpected array item at line ${i + 1}: no array started`);
      }
      currentArray.push(parseScalar(trimmed.slice(2).trim()));
    } else if (trimmed.includes(":")) {
      const colonIndex = trimmed.indexOf(":");
      const key = trimmed.slice(0, colonIndex).trim();
      const value = trimmed.slice(colonIndex + 1).trim();

      if (currentArray && currentKey) {
        result[currentKey] = currentArray;
        currentArray = null;
        currentKey = null;
      }

      if (value.startsWith("[") && value.endsWith("]")) {
        result[key] = value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim())
          .map(parseScalar)
          .filter((v): v is string => v !== null);
      } else if (value === "") {
        currentKey = key;
        currentArray = [];
      } else {
        result[key] = parseScalar(value);
      }
    } else {
      throw new Error(`Unexpected YAML at line ${i + 1}: "${trimmed}"`);
    }
  }

  if (currentArray && currentKey) {
    result[currentKey] = currentArray;
  }

  return result;
}

function parseScalar(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function findMarkerOutsideCodeFences(text: string, marker: string): number {
  const lines = text.split("\n");
  let inFence = false;
  let offset = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inFence = !inFence;
    }

    if (!inFence) {
      const idx = line.indexOf(marker);
      if (idx !== -1) return offset + idx;
    }
    offset += line.length + 1;
  }

  return -1;
}
