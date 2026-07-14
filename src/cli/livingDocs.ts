/**
 * CLI entrypoint para o drift guard do Living Documentation.
 *
 * Subcomandos:
 *   `generate`  — extrai entries do código + canonicaliza + serializa
 *                 + escreve em `.governance/living-docs.yml`.
 *   `check`     — regenera e compara com o arquivo commitado. Exit 0
 *                 se idêntico; exit 1 se drift detectado; stderr com
 *                 diff legível.
 *
 * Composition root: aqui (e somente aqui) instanciamos o
 * `TypeScriptRuleExtractor` (infra) e injetamos no use case.
 *
 * Aplica ADRs 0002 (enum fechado), 0003 (bypass auditável), 0004
 * (determinismo).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { CheckLivingDocs } from "../app/use-cases/CheckLivingDocs.js";
import { GenerateLivingDocs } from "../app/use-cases/GenerateLivingDocs.js";
import { TypeScriptRuleExtractor } from "../infrastructure/ast/TypeScriptRuleExtractor.js";
import { discoverTestFiles } from "../infrastructure/filesystem/discoverTestFiles.js";
import { serializeLivingDocs } from "../infrastructure/yaml/livingDocsSerializer.js";

export { discoverTestFiles } from "../infrastructure/filesystem/discoverTestFiles.js";

const ARTIFACT_PATH_REL = ".governance/living-docs.yml";

interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

const defaultLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

export interface RunOptions {
  readonly repoRoot: string;
  readonly logger?: Logger;
  readonly todayIso?: string;
}

export function runGenerate(options: RunOptions): number {
  const logger = options.logger ?? defaultLogger;
  const files = discoverTestFiles(options.repoRoot);
  const extractor = new TypeScriptRuleExtractor(options.repoRoot, {
    todayIso: options.todayIso,
  });
  const useCase = new GenerateLivingDocs({ extractor });
  const artifact = useCase.execute({ files });
  const yaml = serializeLivingDocs(artifact);

  const out = path.join(options.repoRoot, ARTIFACT_PATH_REL);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, yaml);
  logger.info(`✅ ${ARTIFACT_PATH_REL} written (${artifact.entries.length} entries).`);
  return 0;
}

export function runCheck(options: RunOptions): number {
  const logger = options.logger ?? defaultLogger;
  const files = discoverTestFiles(options.repoRoot);
  const extractor = new TypeScriptRuleExtractor(options.repoRoot, {
    todayIso: options.todayIso,
  });
  const useCase = new CheckLivingDocs({ extractor, serializer: serializeLivingDocs });

  const artifactFile = path.join(options.repoRoot, ARTIFACT_PATH_REL);
  const committed = fs.existsSync(artifactFile) ? fs.readFileSync(artifactFile, "utf-8") : "";

  const result = useCase.execute({ files, committedYaml: committed });
  if (!result.drift) {
    logger.info(`✅ ${ARTIFACT_PATH_REL} in sync (${result.artifact.entries.length} entries).`);
    return 0;
  }
  logger.error(`❌ Living Docs drift detected in ${ARTIFACT_PATH_REL}.`);
  logger.error("");
  logger.error(result.diff);
  logger.error("");
  logger.error(`Hint: run 'npm run living-docs:generate' to regenerate.`);
  return 1;
}

export function main(argv: readonly string[]): number {
  const subcommand = argv[0];
  const opts: RunOptions = { repoRoot: process.cwd() };
  switch (subcommand) {
    case "generate":
      return runGenerate(opts);
    case "check":
      return runCheck(opts);
    default:
      defaultLogger.error(`Usage: living-docs <generate|check>`);
      return 2;
  }
}

// O auto-execution `if (import.meta.url === ...) main()` foi extraído
// para `cli/living-docs.mjs` (composition root), pois `import.meta` não é
// suportável dentro do Jest com a config atual (`ts-jest` + CommonJS).
// Este módulo apenas exporta as funções; quem invoca é o script bin.
