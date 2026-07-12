#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import YAML from "yaml";

import {
  resolveVersionedPullRequestDirectory,
  resolveVersionedPrBodyPath,
} from "./prBodyVersioned.js";

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

interface SourcePrRef {
  readonly spec: string;
  readonly pr: number;
  readonly body: string;
}

interface ContinuationManifest {
  readonly schema_version: 1;
  readonly kind: "pr-continuation-package";
  readonly prepared_at: string;
  readonly source: SourcePrRef;
  readonly continuation: {
    readonly slug: string;
    readonly title: string;
    readonly target: string;
    readonly base: string;
    readonly head: string;
    readonly body_file: string;
  };
  readonly guardrails: {
    readonly creates_pr_without_confirm: false;
    readonly marks_ready: false;
    readonly records_human_gate: false;
    readonly merges: false;
    readonly advances_topology: false;
  };
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

function formatPath(repoRoot: string, file: string): string {
  const relative = path.relative(repoRoot, file);
  return relative.startsWith("..") ? file : relative.replace(/\\/g, "/");
}

function normalizeSlug(slug: string): string {
  const normalized = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!normalized) throw new Error("Informe --slug com ao menos uma letra ou numero.");
  return normalized;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function assertIsoDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Data invalida: ${value}. Use YYYY-MM-DD.`);
  }
  return value;
}

function currentBranch(repoRoot: string): string {
  return execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function defaultHeadBranch(specId: string, slug: string): string {
  return `feat/spec-${specId}-${slug}`;
}

function continuationPackagePath(options: PrepareOptions): string {
  const date = assertIsoDate(options.date ?? todayIso());
  return path.join(resolveContinuationDirectory(options), `${date}-${normalizeSlug(options.slug)}`);
}

function validateManifest(value: unknown, manifestPath: string): ContinuationManifest {
  const manifest = value as Partial<ContinuationManifest>;
  if (manifest.schema_version !== 1) {
    throw new Error(`${manifestPath}: schema_version deve ser 1.`);
  }
  if (manifest.kind !== "pr-continuation-package") {
    throw new Error(`${manifestPath}: kind invalido.`);
  }
  if (!manifest.source?.spec || !manifest.source.pr || !manifest.source.body) {
    throw new Error(`${manifestPath}: source incompleto.`);
  }
  if (
    !manifest.continuation?.slug ||
    !manifest.continuation.title ||
    !manifest.continuation.target ||
    !manifest.continuation.base ||
    !manifest.continuation.head ||
    !manifest.continuation.body_file
  ) {
    throw new Error(`${manifestPath}: continuation incompleta.`);
  }
  if (
    manifest.guardrails?.creates_pr_without_confirm !== false ||
    manifest.guardrails.marks_ready !== false ||
    manifest.guardrails.records_human_gate !== false ||
    manifest.guardrails.merges !== false ||
    manifest.guardrails.advances_topology !== false
  ) {
    throw new Error(`${manifestPath}: guardrails devem permanecer false.`);
  }
  return manifest as ContinuationManifest;
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

function renderManifest(manifest: ContinuationManifest): string {
  return YAML.stringify(manifest);
}

function renderBody(manifest: ContinuationManifest): string {
  return `# ${manifest.continuation.title}

> Draft gerado por \`continuation:prepare\`. Revise antes de publicar.

## Origem

- Spec: ${manifest.source.spec}
- PR de origem: #${manifest.source.pr}
- Body versionado de origem: \`${manifest.source.body}\`

## Intencao

Continua o trabalho governado a partir de \`${manifest.continuation.target}\`.

## Cross-ref

Continuacao governada de #${manifest.source.pr}.

## Guardrails

- Nao declara Ready.
- Nao executa Human Gate.
- Nao faz merge.
- Nao avanca topologia.
- Criacao de PR remoto exige confirmacao humana explicita.

## Test plan inicial

- \`npm run validate:changed\`
- Checks especificos do checkpoint antes de Ready.
`;
}

function renderBriefing(manifest: ContinuationManifest): string {
  return `# Briefing de continuacao — ${manifest.continuation.title}

## Fatos

- Origem: PR #${manifest.source.pr}
- Target sugerido: \`${manifest.continuation.target}\`
- Base sugerida: \`${manifest.continuation.base}\`
- Head sugerida: \`${manifest.continuation.head}\`
- Preparado em: ${manifest.prepared_at}

## Escopo

Este pacote prepara uma continuacao governada. Ele nao cria PR remoto por si so,
nao muda estado de Ready, nao registra Human Gate, nao faz merge e nao altera a
topologia.

## Proximo passo humano

1. Revisar \`body.md\` e este briefing.
2. Rodar \`continuation:create-pr -- --package <dir>\` para ver o comando.
3. Reexecutar com \`--confirm\` somente quando a criacao do Draft PR estiver autorizada.
`;
}

function shellQuote(value: string): string {
  if (/^[a-zA-Z0-9_./:@-]+$/.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}

function createPrCommand(
  manifest: ContinuationManifest,
  packageDir: string,
  repo?: string
): string {
  const bodyFile = path.join(packageDir, manifest.continuation.body_file);
  const args = [
    "gh",
    "pr",
    "create",
    "--draft",
    "--title",
    manifest.continuation.title,
    "--body-file",
    bodyFile,
    "--base",
    manifest.continuation.base,
    "--head",
    manifest.continuation.head,
  ];
  if (repo) args.push("--repo", repo);
  return args.map(shellQuote).join(" ");
}

function renderCommands(
  manifest: ContinuationManifest,
  packageDir: string,
  repoRoot: string
): string {
  return `# Comandos sugeridos

## Ver comando sem criar PR

\`\`\`bash
npm run continuation:create-pr -- --package ${shellQuote(formatPath(repoRoot, packageDir))}
\`\`\`

## Criar Draft PR com autorizacao humana explicita

\`\`\`bash
npm run continuation:create-pr -- --package ${shellQuote(
    formatPath(repoRoot, packageDir)
  )} --confirm
\`\`\`

## Comando gh equivalente

\`\`\`bash
${createPrCommand(manifest, packageDir)}
\`\`\`
`;
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
