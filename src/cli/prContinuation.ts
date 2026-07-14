#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import YAML from "yaml";

import {
  resolveVersionedPullRequestDirectory,
  resolveVersionedPrBodyPath,
} from "./prBodyVersioned.js";
import {
  assertIsoDate,
  createPrCommand,
  defaultHeadBranch,
  formatPath,
  normalizeSlug,
  renderBody,
  renderBriefing,
  renderCommands,
  renderManifest,
  validateManifest,
  type ContinuationManifest,
} from "../app/continuation/continuationPackage.js";

export interface Logger {
  info(message: string): void;
  error(message: string): void;
}

const stdoutLogger: Logger = {
  info: (message) => process.stdout.write(`${message}\n`),
  error: (message) => process.stderr.write(`${message}\n`),
};

export interface PrContinuationGateway {
  createDraftPullRequest(input: {
    readonly repo?: string;
    readonly title: string;
    readonly bodyFile: string;
    readonly base: string;
    readonly head: string;
  }): void;
}

export class GhPrContinuationGateway implements PrContinuationGateway {
  createDraftPullRequest(input: {
    readonly repo?: string;
    readonly title: string;
    readonly bodyFile: string;
    readonly base: string;
    readonly head: string;
  }): void {
    const args = [
      "pr",
      "create",
      "--draft",
      "--title",
      input.title,
      "--body-file",
      input.bodyFile,
      "--base",
      input.base,
      "--head",
      input.head,
    ];
    if (input.repo) args.push("--repo", input.repo);
    execFileSync("gh", args, { stdio: ["ignore", "ignore", "pipe"] });
  }
}

interface CheckOptions {
  readonly repoRoot: string;
  readonly specId: string;
  readonly prNumber: number;
  readonly logger?: Logger;
}

interface PrepareOptions extends CheckOptions {
  readonly slug: string;
  readonly title: string;
  readonly target?: string;
  readonly date?: string;
  readonly base?: string;
  readonly head?: string;
  readonly overwrite?: boolean;
}

interface CreatePrOptions {
  readonly repoRoot: string;
  readonly packageDir: string;
  readonly repo?: string;
  readonly confirm?: boolean;
  readonly logger?: Logger;
  readonly gateway?: PrContinuationGateway;
}

function protocolPath(repoRoot: string): string {
  return path.join(
    repoRoot,
    ".governance",
    "specs",
    "0024-context-architecture",
    "research",
    "2026-07-07-pr-continuation-protocol.md"
  );
}

export function resolveContinuationDirectory(input: {
  readonly repoRoot: string;
  readonly specId: string;
  readonly prNumber: number;
}): string {
  return path.join(resolveVersionedPullRequestDirectory(input), "continuations");
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentBranch(repoRoot: string): string {
  return execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function continuationPackagePath(options: PrepareOptions): string {
  const date = assertIsoDate(options.date ?? todayIso());
  return path.join(resolveContinuationDirectory(options), `${date}-${normalizeSlug(options.slug)}`);
}

function readManifest(packageDir: string): ContinuationManifest {
  const manifestPath = path.join(packageDir, "manifest.yml");
  if (!existsSync(manifestPath)) {
    throw new Error(`Pacote de continuacao sem manifest.yml: ${packageDir}`);
  }
  return validateManifest(YAML.parse(readFileSync(manifestPath, "utf8")), manifestPath);
}

function listPackages(continuationsDir: string): readonly string[] {
  if (!existsSync(continuationsDir)) return [];
  return readdirSync(continuationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(continuationsDir, entry.name))
    .sort();
}

export function runContinuationCheck(options: CheckOptions): number {
  const logger = options.logger ?? stdoutLogger;
  const violations: string[] = [];
  const prDir = resolveVersionedPullRequestDirectory(options);
  const bodyFile = resolveVersionedPrBodyPath({
    repoRoot: options.repoRoot,
    specId: options.specId,
    prNumber: options.prNumber,
  });
  const continuationsDir = resolveContinuationDirectory(options);
  const protocol = protocolPath(options.repoRoot);

  if (!existsSync(prDir))
    violations.push(`diretorio do PR nao existe: ${formatPath(options.repoRoot, prDir)}`);
  if (!existsSync(bodyFile)) {
    violations.push(`body versionado nao existe: ${formatPath(options.repoRoot, bodyFile)}`);
  }
  if (!existsSync(protocol)) {
    violations.push(`protocolo interino nao existe: ${formatPath(options.repoRoot, protocol)}`);
  }

  for (const packageDir of listPackages(continuationsDir)) {
    try {
      const manifest = readManifest(packageDir);
      const body = path.join(packageDir, manifest.continuation.body_file);
      if (!existsSync(body))
        violations.push(`pacote sem body: ${formatPath(options.repoRoot, body)}`);
    } catch (error) {
      violations.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (violations.length > 0) {
    logger.error("❌ continuation:check — contrato de continuacao divergente:");
    for (const violation of violations) logger.error(`  - ${violation}`);
    return 1;
  }

  logger.info(
    `✅ continuation:check — PR #${options.prNumber} tem casa versionada em ${formatPath(
      options.repoRoot,
      prDir
    )}.`
  );
  const packages = listPackages(continuationsDir);
  if (packages.length === 0) {
    logger.info("   Nenhum pacote de continuacao preparado ainda.");
  } else {
    logger.info(`   Pacotes preparados: ${packages.length}.`);
  }
  return 0;
}

export function runContinuationPrepare(options: PrepareOptions): number {
  const logger = options.logger ?? stdoutLogger;
  const check = runContinuationCheck(options);
  if (check !== 0) return check;

  const packageDir = continuationPackagePath(options);
  if (existsSync(packageDir) && !options.overwrite) {
    logger.error(
      `❌ continuation:prepare — pacote ja existe: ${formatPath(options.repoRoot, packageDir)}. Use --overwrite se quiser regravar.`
    );
    return 1;
  }

  const slug = normalizeSlug(options.slug);
  const base = options.base ?? currentBranch(options.repoRoot);
  const manifest: ContinuationManifest = {
    schema_version: 1,
    kind: "pr-continuation-package",
    prepared_at: assertIsoDate(options.date ?? todayIso()),
    source: {
      spec: options.specId,
      pr: options.prNumber,
      body: path
        .relative(
          packageDir,
          resolveVersionedPrBodyPath({
            repoRoot: options.repoRoot,
            specId: options.specId,
            prNumber: options.prNumber,
          })
        )
        .replace(/\\/g, "/"),
    },
    continuation: {
      slug,
      title: options.title,
      target: options.target ?? slug,
      base,
      head: options.head ?? defaultHeadBranch(options.specId, slug),
      body_file: "body.md",
    },
    guardrails: {
      creates_pr_without_confirm: false,
      marks_ready: false,
      records_human_gate: false,
      merges: false,
      advances_topology: false,
    },
  };

  mkdirSync(packageDir, { recursive: true });
  writeFileSync(path.join(packageDir, "manifest.yml"), renderManifest(manifest), "utf8");
  writeFileSync(path.join(packageDir, "body.md"), renderBody(manifest), "utf8");
  writeFileSync(path.join(packageDir, "briefing.md"), renderBriefing(manifest), "utf8");
  writeFileSync(
    path.join(packageDir, "commands.md"),
    renderCommands(manifest, packageDir, options.repoRoot),
    "utf8"
  );

  logger.info(
    `✅ continuation:prepare — pacote criado em ${formatPath(options.repoRoot, packageDir)}.`
  );
  logger.info("   Revise body.md/briefing.md antes de criar qualquer PR remoto.");
  return 0;
}

export function runContinuationCreatePr(options: CreatePrOptions): number {
  const logger = options.logger ?? stdoutLogger;
  const packageDir = path.resolve(options.repoRoot, options.packageDir);
  const manifest = readManifest(packageDir);
  const bodyFile = path.join(packageDir, manifest.continuation.body_file);
  if (!existsSync(bodyFile)) {
    logger.error(
      `❌ continuation:create-pr — body nao encontrado: ${formatPath(options.repoRoot, bodyFile)}`
    );
    return 1;
  }

  const command = createPrCommand(manifest, packageDir, options.repo);
  if (!options.confirm) {
    logger.info("ℹ️ continuation:create-pr — dry-run: nenhum PR remoto foi criado.");
    logger.info(`   ${command}`);
    logger.info("   Reexecute com --confirm somente apos autorizacao humana explicita.");
    return 0;
  }

  const gateway = options.gateway ?? new GhPrContinuationGateway();
  gateway.createDraftPullRequest({
    repo: options.repo,
    title: manifest.continuation.title,
    bodyFile,
    base: manifest.continuation.base,
    head: manifest.continuation.head,
  });
  logger.info("✅ continuation:create-pr — Draft PR criado via gh.");
  logger.info("   Ready/Human Gate/merge/topologia continuam proibidos por este comando.");
  return 0;
}

interface ParsedArgs {
  readonly specId?: string;
  readonly prNumber?: number;
  readonly slug?: string;
  readonly title?: string;
  readonly target?: string;
  readonly date?: string;
  readonly base?: string;
  readonly head?: string;
  readonly packageDir?: string;
  readonly repo?: string;
  readonly confirm?: boolean;
  readonly overwrite?: boolean;
}

function normalizeCliValue(value: string): string {
  return value.replace(/\^/g, "").trim();
}

function readCliValue(argv: readonly string[], index: number, name: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Informe valor para ${name}.`);
  return normalizeCliValue(value);
}

function parseCliArgs(argv: readonly string[]): ParsedArgs {
  const parsed: Record<string, string | number | boolean | undefined> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = normalizeCliValue(argv[i]);
    const equals = arg.match(/^--([a-z-]+)=(.+)$/);
    if (equals) {
      const [, key, rawValue] = equals;
      const value = normalizeCliValue(rawValue);
      if (key === "spec") parsed.specId = value;
      else if (key === "pr") parsed.prNumber = Number(value);
      else if (key === "slug") parsed.slug = value;
      else if (key === "title") parsed.title = value;
      else if (key === "target") parsed.target = value;
      else if (key === "date") parsed.date = value;
      else if (key === "base") parsed.base = value;
      else if (key === "head") parsed.head = value;
      else if (key === "package") parsed.packageDir = value;
      else if (key === "repo") parsed.repo = value;
      else throw new Error(`Argumento desconhecido: ${arg}`);
    } else if (arg === "--spec") parsed.specId = readCliValue(argv, i++, arg);
    else if (arg === "--pr") parsed.prNumber = Number(readCliValue(argv, i++, arg));
    else if (arg === "--slug") parsed.slug = readCliValue(argv, i++, arg);
    else if (arg === "--title") parsed.title = readCliValue(argv, i++, arg);
    else if (arg === "--target") parsed.target = readCliValue(argv, i++, arg);
    else if (arg === "--date") parsed.date = readCliValue(argv, i++, arg);
    else if (arg === "--base") parsed.base = readCliValue(argv, i++, arg);
    else if (arg === "--head") parsed.head = readCliValue(argv, i++, arg);
    else if (arg === "--package") parsed.packageDir = readCliValue(argv, i++, arg);
    else if (arg === "--repo") parsed.repo = readCliValue(argv, i++, arg);
    else if (arg === "--confirm") parsed.confirm = true;
    else if (arg === "--overwrite") parsed.overwrite = true;
    else throw new Error(`Argumento desconhecido: ${arg}`);
  }
  return parsed as ParsedArgs;
}

function requirePrCoordinates(parsed: ParsedArgs): { specId: string; prNumber: number } {
  if (!parsed.specId || !parsed.prNumber || !Number.isInteger(parsed.prNumber)) {
    throw new Error("Uso: continuation:<check|prepare> -- --spec <id> --pr <n>");
  }
  return { specId: parsed.specId, prNumber: parsed.prNumber };
}

export interface MainOptions {
  readonly repoRoot?: string;
  readonly logger?: Logger;
  readonly gateway?: PrContinuationGateway;
}

function runWithCliErrors(
  argv: readonly string[],
  options: MainOptions,
  runner: (parsed: ParsedArgs, repoRoot: string, logger: Logger) => number
): number {
  const logger = options.logger ?? stdoutLogger;
  const repoRoot = options.repoRoot ?? process.cwd();
  try {
    return runner(parseCliArgs(argv), repoRoot, logger);
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    return 2;
  }
}

export function mainCheck(argv: readonly string[] = [], options: MainOptions = {}): number {
  return runWithCliErrors(argv, options, (parsed, repoRoot, logger) => {
    const coords = requirePrCoordinates(parsed);
    return runContinuationCheck({ ...coords, repoRoot, logger });
  });
}

export function mainPrepare(argv: readonly string[] = [], options: MainOptions = {}): number {
  return runWithCliErrors(argv, options, (parsed, repoRoot, logger) => {
    const coords = requirePrCoordinates(parsed);
    if (!parsed.slug || !parsed.title) {
      throw new Error(
        "Uso: continuation:prepare -- --spec <id> --pr <n> --slug <slug> --title <titulo> [--target <id>] [--date YYYY-MM-DD] [--base <branch>] [--head <branch>] [--overwrite]"
      );
    }
    return runContinuationPrepare({
      ...coords,
      repoRoot,
      logger,
      slug: parsed.slug,
      title: parsed.title,
      target: parsed.target,
      date: parsed.date,
      base: parsed.base,
      head: parsed.head,
      overwrite: parsed.overwrite,
    });
  });
}

export function mainCreatePr(argv: readonly string[] = [], options: MainOptions = {}): number {
  return runWithCliErrors(argv, options, (parsed, repoRoot, logger) => {
    if (!parsed.packageDir) {
      throw new Error(
        "Uso: continuation:create-pr -- --package <dir> [--repo owner/repo] [--confirm]"
      );
    }
    return runContinuationCreatePr({
      repoRoot,
      logger,
      gateway: options.gateway,
      packageDir: parsed.packageDir,
      repo: parsed.repo,
      confirm: parsed.confirm,
    });
  });
}
