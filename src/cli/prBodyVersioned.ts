#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export interface Logger {
  info(message: string): void;
  error(message: string): void;
}

const stdoutLogger: Logger = {
  info: (message) => process.stdout.write(`${message}\n`),
  error: (message) => process.stderr.write(`${message}\n`),
};

export interface PrBodyGateway {
  fetchBody(input: { readonly prNumber: number; readonly repo?: string }): string;
  publishBody(input: {
    readonly prNumber: number;
    readonly repo?: string;
    readonly body: string;
  }): void;
}

export class GhPrBodyVersionedGateway implements PrBodyGateway {
  fetchBody(input: { readonly prNumber: number; readonly repo?: string }): string {
    const args = ["pr", "view", String(input.prNumber), "--json", "body", "--jq", ".body"];
    if (input.repo) args.push("--repo", input.repo);
    return execFileSync("gh", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  }

  publishBody(input: { readonly prNumber: number; readonly repo?: string; readonly body: string }) {
    const file = path.join(mkdtempSync(path.join(tmpdir(), "pr-body-publish-")), "body.md");
    writeFileSync(file, input.body, "utf8");
    const args = ["pr", "edit", String(input.prNumber), "--body-file", file];
    if (input.repo) args.push("--repo", input.repo);
    execFileSync("gh", args, { stdio: ["ignore", "ignore", "pipe"] });
  }
}

export function normalizePrBody(body: string): string {
  const normalized = body.replace(/\r\n/g, "\n").trimEnd();
  return normalized === "" ? "" : `${normalized}\n`;
}

export function findSpecDirectory(input: {
  readonly repoRoot: string;
  readonly specId: string;
}): string {
  const specsRoot = path.join(input.repoRoot, ".governance", "specs");
  const prefix = `${input.specId}-`;
  const matches = readdirSync(specsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(prefix))
    .map((entry) => path.join(specsRoot, entry.name));

  if (matches.length === 1) return matches[0];
  if (matches.length === 0) throw new Error(`Spec ${input.specId} não encontrada em ${specsRoot}.`);
  throw new Error(`Spec ${input.specId} ambígua em ${specsRoot}: ${matches.join(", ")}.`);
}

export function resolveVersionedPrBodyPath(input: {
  readonly repoRoot: string;
  readonly prNumber: number;
  readonly file?: string;
  readonly specId?: string;
}): string {
  if (input.file) return path.resolve(input.repoRoot, input.file);
  if (!input.specId) {
    throw new Error("Informe --file ou --spec para localizar o PR body versionado.");
  }
  return path.join(
    findSpecDirectory({ repoRoot: input.repoRoot, specId: input.specId }),
    "pr-bodies",
    `pr-${input.prNumber}.md`
  );
}

export interface PrBodyVersionedOptions {
  readonly prNumber: number;
  readonly file?: string;
  readonly specId?: string;
  readonly repo?: string;
  readonly repoRoot?: string;
  readonly gateway: PrBodyGateway;
  readonly logger?: Logger;
}

function readVersionedBody(file: string): string {
  if (!existsSync(file)) {
    throw new Error(`PR body versionado não encontrado: ${file}`);
  }
  return readFileSync(file, "utf8");
}

function formatBodyPath(repoRoot: string, file: string): string {
  const relative = path.relative(repoRoot, file);
  return relative.startsWith("..") ? file : relative;
}

export function runPrBodyCheck(options: PrBodyVersionedOptions): number {
  const repoRoot = options.repoRoot ?? process.cwd();
  const logger = options.logger ?? stdoutLogger;
  const file = resolveVersionedPrBodyPath({
    repoRoot,
    prNumber: options.prNumber,
    file: options.file,
    specId: options.specId,
  });
  const local = normalizePrBody(readVersionedBody(file));
  const remote = normalizePrBody(
    options.gateway.fetchBody({ prNumber: options.prNumber, repo: options.repo })
  );

  if (local === remote) {
    logger.info(
      `✅ pr-body:check — PR #${options.prNumber} está sincronizado com ${formatBodyPath(
        repoRoot,
        file
      )}.`
    );
    return 0;
  }

  logger.error(`❌ pr-body:check — PR #${options.prNumber} diverge do body versionado.`);
  logger.error(`   Fonte versionada: ${formatBodyPath(repoRoot, file)}`);
  logger.error(
    "   Atualize o arquivo no repo e rode pr-body:publish, ou copie o body remoto para o arquivo se o GitHub estiver correto."
  );
  return 1;
}

export function runPrBodyPublish(options: PrBodyVersionedOptions): number {
  const repoRoot = options.repoRoot ?? process.cwd();
  const logger = options.logger ?? stdoutLogger;
  const file = resolveVersionedPrBodyPath({
    repoRoot,
    prNumber: options.prNumber,
    file: options.file,
    specId: options.specId,
  });
  const local = normalizePrBody(readVersionedBody(file));

  options.gateway.publishBody({ prNumber: options.prNumber, repo: options.repo, body: local });
  const remote = normalizePrBody(
    options.gateway.fetchBody({ prNumber: options.prNumber, repo: options.repo })
  );

  if (remote !== local) {
    logger.error(
      `❌ pr-body:publish — PR #${options.prNumber} foi publicado, mas a releitura diverge do arquivo versionado.`
    );
    return 1;
  }

  logger.info(
    `✅ pr-body:publish — PR #${options.prNumber} publicado a partir de ${formatBodyPath(
      repoRoot,
      file
    )}.`
  );
  return 0;
}

interface ParsedArgs {
  readonly prNumber: number;
  readonly file?: string;
  readonly specId?: string;
  readonly repo?: string;
}

function parseCliArgs(argv: ReadonlyArray<string>): ParsedArgs {
  let prNumber: number | undefined;
  let file: string | undefined;
  let specId: string | undefined;
  let repo: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--pr") prNumber = Number(argv[++i]);
    else if (arg === "--file") file = argv[++i];
    else if (arg === "--spec") specId = argv[++i];
    else if (arg === "--repo") repo = argv[++i];
    else throw new Error(`Argumento desconhecido: ${arg}`);
  }

  if (!prNumber || !Number.isInteger(prNumber)) {
    throw new Error("Uso: npm run pr-body:check -- --pr <n> (--spec <id>|--file <arquivo.md>)");
  }

  return { prNumber, file, specId, repo };
}

export interface MainOptions {
  readonly logger?: Logger;
  readonly gateway?: PrBodyGateway;
  readonly repoRoot?: string;
}

function runWithCliErrors(
  argv: ReadonlyArray<string>,
  options: MainOptions,
  runner: (opts: PrBodyVersionedOptions) => number
): number {
  const logger = options.logger ?? stdoutLogger;
  try {
    const parsed = parseCliArgs(argv);
    return runner({
      ...parsed,
      repoRoot: options.repoRoot,
      gateway: options.gateway ?? new GhPrBodyVersionedGateway(),
      logger,
    });
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    return 2;
  }
}

export function mainCheck(argv: ReadonlyArray<string> = [], options: MainOptions = {}): number {
  return runWithCliErrors(argv, options, runPrBodyCheck);
}

export function mainPublish(argv: ReadonlyArray<string> = [], options: MainOptions = {}): number {
  return runWithCliErrors(argv, options, runPrBodyPublish);
}
