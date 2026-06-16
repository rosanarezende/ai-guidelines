import { hasDependency, hasScriptToken, PackageJsonObject } from "./PackageJson.js";

export interface FormatterRivalSnapshot {
  readonly id: string;
  readonly label: string;
}

export interface FormatterContextSnapshot {
  readonly rival: FormatterRivalSnapshot | null;
  readonly hasPrettier: boolean;
  readonly shouldSkipPrettier: boolean;
}

export interface FormatterContextInput {
  readonly existingFiles: readonly string[];
  readonly packageJson: PackageJsonObject | null;
}

interface FormatterDescriptor {
  readonly id: string;
  readonly label: string;
  readonly files: readonly string[];
  readonly deps: readonly string[];
  readonly scriptRegex: RegExp;
}

export const FORMATTER_RIVALS: readonly FormatterDescriptor[] = [
  {
    id: "biome",
    label: "Biome",
    files: ["biome.json", "biome.jsonc"],
    deps: ["@biomejs/biome", "biome"],
    scriptRegex: /\bbiome\b/i,
  },
  {
    id: "dprint",
    label: "dprint",
    files: ["dprint.json", "dprint.jsonc", ".dprint.json"],
    deps: ["dprint"],
    scriptRegex: /\bdprint\b/i,
  },
  {
    id: "rome",
    label: "Rome",
    files: ["rome.json", ".romerc", ".romerc.json", ".romerc.js"],
    deps: ["rome"],
    scriptRegex: /\brome\b/i,
  },
  {
    id: "standard",
    label: "Standard.js",
    files: [".standardrc", ".standard.json"],
    deps: ["standard"],
    scriptRegex: /\bstandard\b/i,
  },
];

export const PRETTIER_CONFIG_FILES: readonly string[] = [
  ".prettierrc",
  ".prettierrc.json",
  ".prettierrc.yml",
  ".prettierrc.yaml",
  ".prettierrc.js",
  "prettier.config.js",
  "prettier.config.cjs",
  "prettier.config.mjs",
  ".prettierignore",
];

export const FORMATTER_CONTEXT_FILES: readonly string[] = [
  ...FORMATTER_RIVALS.flatMap((formatter) => formatter.files),
  ...PRETTIER_CONFIG_FILES,
];

export function detectFormatterContext(input: FormatterContextInput): FormatterContextSnapshot {
  const existingFiles = new Set(input.existingFiles);
  let rival: FormatterRivalSnapshot | null = null;

  for (const formatter of FORMATTER_RIVALS) {
    const detected =
      formatter.files.some((file) => existingFiles.has(file)) ||
      formatter.deps.some((dep) => hasDependency(input.packageJson, dep)) ||
      hasScriptToken(input.packageJson, formatter.scriptRegex);

    if (detected) {
      rival = { id: formatter.id, label: formatter.label };
      break;
    }
  }

  const hasPrettier =
    hasDependency(input.packageJson, "prettier") ||
    PRETTIER_CONFIG_FILES.some((file) => existingFiles.has(file)) ||
    hasScriptToken(input.packageJson, /\bprettier\b/i);

  return {
    rival,
    hasPrettier,
    shouldSkipPrettier: Boolean(rival && !hasPrettier),
  };
}
