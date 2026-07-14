import * as fs from "node:fs";
import * as path from "node:path";

const SOURCE_EXTENSIONS = [".ts", ".mts", ".cts"] as const;
const IGNORED_DIRECTORIES = new Set(["node_modules", "dist", "coverage"]);

export type SourceDependencyKind = "static" | "side-effect" | "dynamic" | "require";

export interface SourceDependencyReference {
  readonly sourceFile: string;
  readonly specifier: string;
  readonly kind: SourceDependencyKind;
  readonly targetFile: string | null;
}

export interface SourceDependencyGraph {
  readonly sourceRoot: string;
  readonly files: readonly string[];
  readonly references: readonly SourceDependencyReference[];
}

export interface SourceDependencyGraphOptions {
  readonly excludeTests?: boolean;
}

interface ExtractedReference {
  readonly specifier: string;
  readonly kind: SourceDependencyKind;
}

const REFERENCE_PATTERNS: ReadonlyArray<{
  readonly kind: SourceDependencyKind;
  readonly pattern: RegExp;
}> = [
  {
    kind: "static",
    pattern: /\b(?:import|export)\s+(?:type\s+)?[^;]*?\bfrom\s*["']([^"']+)["']/g,
  },
  { kind: "side-effect", pattern: /\bimport\s*["']([^"']+)["']/g },
  { kind: "dynamic", pattern: /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g },
  { kind: "require", pattern: /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g },
];

export function extractSourceDependencyReferences(content: string): readonly ExtractedReference[] {
  const references = new Map<string, ExtractedReference>();
  for (const { kind, pattern } of REFERENCE_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) {
      const specifier = match[1];
      if (!specifier) continue;
      references.set(`${kind}:${specifier}`, { kind, specifier });
    }
  }
  return [...references.values()];
}

function listSourceFiles(sourceRoot: string, options: SourceDependencyGraphOptions): string[] {
  const files: string[] = [];
  const walk = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) walk(path.join(directory, entry.name));
        continue;
      }
      if (!entry.isFile()) continue;
      if (
        !SOURCE_EXTENSIONS.includes(path.extname(entry.name) as (typeof SOURCE_EXTENSIONS)[number])
      ) {
        continue;
      }
      if (options.excludeTests && /\.test\.(?:ts|mts|cts)$/.test(entry.name)) continue;
      files.push(path.resolve(directory, entry.name));
    }
  };
  walk(path.resolve(sourceRoot));
  return files.sort();
}

function resolveRelativeTarget(sourceFile: string, specifier: string): string | null {
  if (!specifier.startsWith(".")) return null;
  const rawTarget = path.resolve(path.dirname(sourceFile), specifier);
  const extension = path.extname(rawTarget);
  const base =
    extension === ".js" || extension === ".mjs" || extension === ".cjs"
      ? rawTarget.slice(0, -extension.length)
      : rawTarget;
  const candidates = [
    ...(SOURCE_EXTENSIONS.some((candidate) => base.endsWith(candidate)) ? [base] : []),
    ...SOURCE_EXTENSIONS.map((candidate) => `${base}${candidate}`),
    ...SOURCE_EXTENSIONS.map((candidate) => path.join(base, `index${candidate}`)),
  ];
  return (
    candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ??
    null
  );
}

export function collectSourceDependencyGraph(
  sourceRoot: string,
  options: SourceDependencyGraphOptions = {}
): SourceDependencyGraph {
  const files = listSourceFiles(sourceRoot, options);
  const references: SourceDependencyReference[] = [];
  for (const sourceFile of files) {
    const content = fs.readFileSync(sourceFile, "utf8");
    for (const reference of extractSourceDependencyReferences(content)) {
      references.push({
        sourceFile,
        specifier: reference.specifier,
        kind: reference.kind,
        targetFile: resolveRelativeTarget(sourceFile, reference.specifier),
      });
    }
  }
  return { sourceRoot: path.resolve(sourceRoot), files, references };
}

export function transitiveSourceFiles(
  graph: SourceDependencyGraph,
  entryFile: string
): readonly string[] {
  const entry = path.resolve(entryFile);
  const knownFiles = new Set(graph.files.map((file) => path.resolve(file)));
  if (!knownFiles.has(entry)) throw new Error(`Entry file is outside the source graph: ${entry}`);

  const targetsBySource = new Map<string, string[]>();
  for (const reference of graph.references) {
    if (!reference.targetFile || !knownFiles.has(reference.targetFile)) continue;
    const targets = targetsBySource.get(reference.sourceFile) ?? [];
    targets.push(reference.targetFile);
    targetsBySource.set(reference.sourceFile, targets);
  }

  const visited = new Set<string>();
  const pending = [entry];
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    for (const target of targetsBySource.get(current) ?? []) pending.push(target);
  }
  return [...visited].sort();
}
