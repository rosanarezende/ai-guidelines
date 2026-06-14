/**
 * `knowledge:compile` — entrypoint HUMANO que orquestra o compilador TS de
 * conhecimento governado (CO-3.2 / Spec 0024 — co-enforcement).
 *
 * Dois modos sobre o mesmo compilador determinístico (`compileConstraints`,
 * CO-3.1):
 *   - `compile` (escrita): compila as fontes reais de constraints e PERSISTE o
 *     manifesto runtime (`.governance/runtime/constraints/manifest.json`);
 *     orquestra também o compilador de regras (`build:rules`) — `knowledge:compile`
 *     é o guarda-chuva, `build:rules` permanece alias compatível standalone.
 *   - `check` (paridade derivada): verifica o artefato persistido em três
 *     dimensões — EXISTÊNCIA (artefato presente), CLASSE (parse + versão + forma)
 *     e SYNC (recompilar as fontes vivas reproduz BYTE-A-BYTE o manifesto). Entra
 *     no `validate` como invariante de estado contínuo.
 *
 * NÃO é `constraints:check` (CO-3.1): aquele valida as INVARIANTES do modelo em
 * memória (schema/paridade-de-fonte/resolução), REQUIRED, sem persistir nada.
 * Este persiste o artefato e gateia sua paridade. Zero network, zero LLM.
 *
 * NÃO é `co-knowledge:*` (CO-2): aqueles cobrem o backfill do grafo de Knowledge
 * tipado; aqui o objeto é o manifesto compilado de constraints/bindings.
 *
 * Exit codes: 0 ok · 1 inconsistência/drift · 2 fonte core ausente / uso inválido.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { CompileResult } from "../app/constraints/compileConstraints.js";
import {
  CONSTRAINT_MANIFEST_PATH,
  parseConstraintManifest,
  serializeConstraintManifest,
} from "../app/constraints/constraintManifest.js";
import {
  ConstraintRoots,
  normalizeConstraintRoots,
  runConstraintsCheck,
} from "./constraintsCheck.js";

/**
 * Compilador de regras reusado pelo guarda-chuva. Import DINÂMICO (lazy): o
 * módulo `buildRules` puxa o prettier transitivamente, que quebra sob o runner
 * de testes sem `--experimental-vm-modules`. Carregar só quando o dep default é
 * efetivamente usado mantém os testes (que injetam `buildRules`) puros.
 */
async function defaultBuildRules(packageRoot: string): Promise<number> {
  const { main } = await import("./buildRules.js");
  return main(packageRoot);
}

interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

const defaultLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

export interface KnowledgeCompileDeps {
  readonly logger?: Logger;
  /** Compilação das fontes reais (default: `runConstraintsCheck`). */
  readonly compile?: (roots: string | ConstraintRoots) => CompileResult;
  /** Bytes do manifesto persistido, ou `null` quando ausente (default: fs). */
  readonly readManifest?: () => string | null;
  /** Persiste os bytes do manifesto (default: fs, criando o diretório). */
  readonly writeManifest?: (text: string) => void;
  /** Compilador de regras reusado pelo guarda-chuva (default: `build:rules`). */
  readonly buildRules?: (packageRoot: string) => Promise<number>;
}

function manifestAbsPath(consumerRoot: string): string {
  return path.join(consumerRoot, CONSTRAINT_MANIFEST_PATH);
}

function defaultReadManifest(consumerRoot: string): string | null {
  const abs = manifestAbsPath(consumerRoot);
  return fs.existsSync(abs) ? fs.readFileSync(abs, "utf-8") : null;
}

function defaultWriteManifest(consumerRoot: string, text: string): void {
  const abs = manifestAbsPath(consumerRoot);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, text, "utf-8");
}

/** Mapeia erro da compilação para exit code (core ausente ⟹ 2; demais ⟹ 1). */
function compileExitCode(e: unknown): number {
  return e instanceof Error && /fonte core ausente/.test(e.message) ? 2 : 1;
}

function reportViolations(result: CompileResult, logger: Logger, prefix: string): void {
  logger.error(
    `❌ ${prefix} — ${result.violations.length} inconsistência(s) em ` +
      `${result.manifest.constraints.length} constraint(s):`
  );
  for (const v of result.violations) {
    const where = v.surface ? `${v.constraintId} → ${v.surface}` : v.constraintId;
    logger.error(`  [${v.code}] ${where}: ${v.message}`);
  }
}

function compiledSummary(result: CompileResult): string {
  const surfaces = new Set(result.manifest.bindings.map((b) => b.surface)).size;
  return (
    `${result.manifest.constraints.length} constraints · ` +
    `${result.manifest.bindings.length} bindings · ${surfaces} superfícies`
  );
}

async function runCompile(
  roots: string | ConstraintRoots,
  deps: KnowledgeCompileDeps,
  logger: Logger
): Promise<number> {
  const { packageRoot, consumerRoot } = normalizeConstraintRoots(roots);
  const compile = deps.compile ?? runConstraintsCheck;
  const writeManifest =
    deps.writeManifest ?? ((text: string) => defaultWriteManifest(consumerRoot, text));
  const buildRules = deps.buildRules ?? defaultBuildRules;

  let result: CompileResult;
  try {
    result = compile(roots);
  } catch (e: unknown) {
    logger.error(`❌ knowledge:compile — ${e instanceof Error ? e.message : String(e)}`);
    return compileExitCode(e);
  }
  // Fonte inconsistente ⟹ não persistir um manifesto derivado de fonte inválida.
  if (result.violations.length > 0) {
    reportViolations(result, logger, "knowledge:compile");
    logger.error("  Nada foi persistido (corrija as fontes e recompile).");
    return 1;
  }

  writeManifest(serializeConstraintManifest(result.manifest));
  logger.info(`✅ knowledge:compile — manifesto persistido (${compiledSummary(result)})`);
  logger.info(`   ${CONSTRAINT_MANIFEST_PATH}`);

  // Guarda-chuva: reusa o compilador de regras (build:rules permanece alias compatível).
  const rc = await buildRules(packageRoot);
  return rc === 0 ? 0 : rc;
}

function runCheck(
  roots: string | ConstraintRoots,
  deps: KnowledgeCompileDeps,
  logger: Logger
): number {
  const { consumerRoot } = normalizeConstraintRoots(roots);
  const compile = deps.compile ?? runConstraintsCheck;
  const readManifest = deps.readManifest ?? (() => defaultReadManifest(consumerRoot));

  // (1) EXISTÊNCIA.
  const persisted = readManifest();
  if (persisted === null) {
    logger.error(
      `❌ knowledge:check — manifesto ausente em ${CONSTRAINT_MANIFEST_PATH}. ` +
        "Rode `npm run knowledge:compile`."
    );
    return 1;
  }

  // (2) CLASSE.
  const parsed = parseConstraintManifest(persisted);
  if ("error" in parsed) {
    logger.error(
      `❌ knowledge:check — manifesto de classe inválida: ${parsed.error.reason} ` +
        "Rode `npm run knowledge:compile`."
    );
    return 1;
  }

  // (3) SYNC — recompilar as fontes vivas e comparar byte-a-byte.
  let result: CompileResult;
  try {
    result = compile(roots);
  } catch (e: unknown) {
    logger.error(`❌ knowledge:check — ${e instanceof Error ? e.message : String(e)}`);
    return compileExitCode(e);
  }
  if (result.violations.length > 0) {
    reportViolations(result, logger, "knowledge:check");
    logger.error("  Manifesto não é reproduzível (rode `npm run constraints:check`).");
    return 1;
  }
  const fresh = serializeConstraintManifest(result.manifest);
  if (fresh !== persisted) {
    logger.error(
      `❌ knowledge:check — manifesto fora de sync com as fontes vivas (${CONSTRAINT_MANIFEST_PATH}). ` +
        "Rode `npm run knowledge:compile` e versione o resultado."
    );
    return 1;
  }

  logger.info(`✅ knowledge:check — manifesto íntegro e em sync (${compiledSummary(result)})`);
  return 0;
}

/** Composition root: dispatcher `compile` (default) | `check`. */
export async function main(
  args: readonly string[],
  roots: string | ConstraintRoots = process.cwd(),
  deps: KnowledgeCompileDeps = {}
): Promise<number> {
  const logger = deps.logger ?? defaultLogger;
  const mode = args[0] ?? "compile";
  if (mode === "check") return runCheck(roots, deps, logger);
  if (mode === "compile") return runCompile(roots, deps, logger);
  logger.error(`❌ knowledge:compile — modo desconhecido: "${mode}". Use "compile" ou "check".`);
  return 2;
}
