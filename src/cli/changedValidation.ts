import { execFileSync } from "node:child_process";

import { Logger } from "./registry/Command.js";

export interface ChangedValidationOptions {
  readonly base?: string;
  readonly fix?: boolean;
}

export interface ChangedValidationStep {
  readonly label: string;
  readonly command: string;
  readonly args: readonly string[];
}

export interface ChangedValidationRunner {
  run(command: string, args: readonly string[], cwd: string): void;
}

export interface ChangedValidationDeps {
  readonly logger: Logger;
  readonly runner?: ChangedValidationRunner;
  readonly collectChangedPaths?: (repoRoot: string, base?: string) => readonly string[];
}

const FORMAT_EXTENSIONS = new Set([".ts", ".mjs", ".js", ".cjs", ".md", ".json", ".yml", ".yaml"]);
const PRETTIER_ARG_BUDGET = 6000;

function binary(name: "npm" | "npx"): string {
  return name;
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\.\//, "");
}

function unique(paths: readonly string[]): string[] {
  return [...new Set(paths.map(normalizePath).filter(Boolean))].sort();
}

function lines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function gitOutput(repoRoot: string, args: readonly string[]): string {
  return execFileSync("git", [...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

export function collectChangedPaths(repoRoot: string, base?: string): readonly string[] {
  if (base) {
    return unique(
      lines(
        gitOutput(repoRoot, ["diff", "--name-only", "--diff-filter=ACMR", `${base}...HEAD`, "--"])
      )
    );
  }
  return unique([
    ...lines(gitOutput(repoRoot, ["diff", "--name-only", "--diff-filter=ACMR", "HEAD", "--"])),
    ...lines(
      gitOutput(repoRoot, ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "HEAD", "--"])
    ),
    ...lines(gitOutput(repoRoot, ["ls-files", "--others", "--exclude-standard"])),
  ]);
}

function extension(path: string): string {
  const match = path.match(/(\.[^.\/]+)$/);
  return match?.[1] ?? "";
}

function hasAny(paths: readonly string[], predicate: (path: string) => boolean): boolean {
  return paths.some((path) => predicate(normalizePath(path)));
}

function formatCandidates(paths: readonly string[]): string[] {
  return paths.filter((path) => FORMAT_EXTENSIONS.has(extension(path)));
}

function approxCommandLength(command: string, args: readonly string[]): number {
  return [command, ...args].reduce((sum, arg) => sum + windowsShellArg(arg).length + 1, 0);
}

function planPrettierSteps(
  formattable: readonly string[],
  options: ChangedValidationOptions
): ChangedValidationStep[] {
  if (formattable.length === 0) return [];
  const baseArgs = ["prettier", options.fix ? "--write" : "--check", "--"];
  const chunks: string[][] = [];
  let current: string[] = [];

  for (const file of formattable) {
    const candidate = [...current, file];
    const length = approxCommandLength(binary("npx"), [...baseArgs, ...candidate]);
    if (current.length > 0 && length > PRETTIER_ARG_BUDGET) {
      chunks.push(current);
      current = [file];
    } else {
      current = candidate;
    }
  }
  if (current.length > 0) chunks.push(current);

  const label = options.fix
    ? "Formatar arquivos alterados"
    : "Checar formatação dos arquivos alterados";
  return chunks.map((chunk, index) => ({
    label: chunks.length === 1 ? label : `${label} (${index + 1}/${chunks.length})`,
    command: binary("npx"),
    args: [...baseArgs, ...chunk],
  }));
}

function windowsShellArg(arg: string): string {
  if (/^[A-Za-z0-9_./:=@%{}$+,\-]+$/.test(arg)) return arg;
  return `"${arg.replace(/"/g, '\\"')}"`;
}

function runProcess(command: string, args: readonly string[], cwd: string): void {
  if (process.platform === "win32") {
    execFileSync([command, ...args.map(windowsShellArg)].join(" "), {
      cwd,
      shell: true,
      stdio: "inherit",
    });
    return;
  }
  execFileSync(command, [...args], { cwd, stdio: "inherit" });
}

export function planChangedValidation(
  changedPaths: readonly string[],
  options: ChangedValidationOptions = {}
): readonly ChangedValidationStep[] {
  const paths = unique(changedPaths);
  const steps: ChangedValidationStep[] = [
    { label: "Verificar whitespace do diff", command: "git", args: ["diff", "--check"] },
    {
      label: "Verificar drift de governança",
      command: binary("npm"),
      args: ["run", "drift:check"],
    },
  ];

  const formattable = formatCandidates(paths);
  steps.push(...planPrettierSteps(formattable, options));

  if (
    hasAny(paths, (p) => p.startsWith("src/") && p.endsWith(".ts")) ||
    paths.includes("package.json")
  ) {
    steps.push({ label: "Compilar TypeScript", command: binary("npm"), args: ["run", "build"] });
  }

  if (
    hasAny(
      paths,
      (p) =>
        p === "package.json" ||
        p === ".core/governance/script-contracts.yml" ||
        p === "docs/scripts.md" ||
        p.startsWith(".github/workflows/") ||
        p.startsWith(".core/templates/")
    )
  ) {
    steps.push({
      label: "Verificar contrato de scripts",
      command: binary("npm"),
      args: ["run", "script-contracts:check"],
    });
  }

  if (
    hasAny(
      paths,
      (p) =>
        p.endsWith("/state.yml") ||
        p === ".governance/runtime/specs/active.yml" ||
        p === ".governance/runtime/specs/history.yml"
    )
  ) {
    steps.push({
      label: "Verificar state.yml operacional",
      command: binary("npm"),
      args: ["run", "state-yml:check"],
    });
    steps.push({
      label: "Verificar projection active specs",
      command: binary("npm"),
      args: ["run", "active-specs:check"],
    });
  }

  if (hasAny(paths, (p) => p.includes("/reviews/") || p.includes("/gates/"))) {
    steps.push({
      label: "Verificar reviews/gates",
      command: binary("npm"),
      args: ["run", "review:check"],
    });
  }

  return steps;
}

export function runChangedValidation(
  repoRoot: string,
  options: ChangedValidationOptions,
  deps: ChangedValidationDeps
): number {
  const changedPaths =
    deps.collectChangedPaths?.(repoRoot, options.base) ??
    collectChangedPaths(repoRoot, options.base);
  const paths = unique(changedPaths);
  deps.logger.info("# Validação intermediária do diff");
  deps.logger.info(`- base: ${options.base ?? "working tree"}`);
  deps.logger.info(`- modo: ${options.fix ? "corrigir formatação local" : "somente verificar"}`);

  if (paths.length === 0) {
    deps.logger.info("- arquivos alterados: nenhum");
    deps.logger.info("✅ Nada para validar no diff.");
    return 0;
  }

  deps.logger.info(`- arquivos alterados: ${paths.length}`);
  for (const path of paths) deps.logger.info(`  - ${path}`);

  const steps = planChangedValidation(paths, options);
  const runner = deps.runner ?? {
    run(command: string, args: readonly string[], cwd: string): void {
      runProcess(command, args, cwd);
    },
  };

  for (const step of steps) {
    deps.logger.info(`\n▶ ${step.label}`);
    runner.run(step.command, step.args, repoRoot);
  }

  deps.logger.info("\n✅ Validação intermediária concluída.");
  return 0;
}
