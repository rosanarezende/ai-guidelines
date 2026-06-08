/**
 * CLI entrypoint para gate `state-yml:check`.
 *
 * Por padrão, valida o escopo operacional: specs publicadas como não concluídas
 * em `.governance/runtime/active-specs.yml` + `state.yml` tocados no diff local.
 * Use `--all` para varredura histórica completa sob `.governance/specs/*` e
 * `.specify/specs/*` (legacy bridge per ADR 0019).
 *
 * Move o enforcement do schema do runtime (onde só era invocado quando
 * `workflow continue` lia a spec ativa) para o gate de validação global —
 * pattern "sistema enforce, não agente infere" per ADR 0021.
 *
 * Exit codes:
 *   0 — sucesso (todos os state.yml conformam ao schema)
 *   1 — ≥ 1 state.yml violou o schema
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { parseActiveSpecs } from "../infrastructure/yaml/activeSpecsSerializer.js";
import { parseWorkflowState } from "../infrastructure/yaml/workflowStateSerializer.js";

interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

const defaultLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

const SPEC_ROOTS = [".governance/specs", ".specify/specs"] as const;
const ACTIVE_SPECS_INDEX_PATH = ".governance/runtime/active-specs.yml";

export type StateYmlCheckScope = "operational" | "all";

/**
 * Descobre todos os `state.yml` sob os roots canônicos de specs.
 * Ignora subdiretórios sem `state.yml` (roadmap, research-library, etc.).
 */
export function discoverStateYmlFiles(repoRoot: string): string[] {
  const out: string[] = [];
  for (const rootRel of SPEC_ROOTS) {
    const root = path.join(repoRoot, rootRel);
    if (!fs.existsSync(root)) continue;
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const stateFile = path.join(root, entry.name, "state.yml");
      if (fs.existsSync(stateFile)) out.push(stateFile);
    }
  }
  out.sort();
  return out;
}

export interface SelectOperationalStateYmlFilesInput {
  repoRoot: string;
  allFiles: readonly string[];
  activeSpecsText?: string;
  changedRelPaths: readonly string[];
}

/**
 * Pure-ish selector: reduz a varredura global ao escopo operacional padrão.
 * Specs `completed` ficam no arquivo histórico e são cobertas por `--all`, mas
 * não bloqueiam o ciclo local se não foram tocadas.
 */
export function selectOperationalStateYmlFiles(
  input: SelectOperationalStateYmlFilesInput
): string[] {
  const byRelPath = new Map<string, string>();
  for (const file of input.allFiles) {
    byRelPath.set(normalizeRelPath(path.relative(input.repoRoot, file)), file);
  }

  const selected = new Set<string>();

  if (input.activeSpecsText !== undefined) {
    const root = parseActiveSpecs(input.activeSpecsText);
    for (const entry of root.activeSpecs) {
      if (entry.status === "completed") continue;
      const stateRelPath = normalizeRelPath(entry.sourceStatePath ?? `${entry.specPath}/state.yml`);
      const abs = byRelPath.get(stateRelPath);
      if (abs !== undefined) selected.add(abs);
    }
  }

  for (const rel of input.changedRelPaths) {
    const normalized = normalizeRelPath(rel);
    if (!normalized.endsWith("/state.yml")) continue;
    const abs = byRelPath.get(normalized);
    if (abs !== undefined) selected.add(abs);
  }

  return [...selected].sort();
}

/**
 * Descobre o escopo operacional. Se o índice não existe ou não parseia,
 * degrada para a varredura completa: melhor pagar custo global do que produzir
 * falso-verde quando a projeção operacional está indisponível.
 */
export function discoverOperationalStateYmlFiles(repoRoot: string): string[] {
  const allFiles = discoverStateYmlFiles(repoRoot);
  const indexPath = path.join(repoRoot, ACTIVE_SPECS_INDEX_PATH);
  if (!fs.existsSync(indexPath)) return allFiles;

  try {
    return selectOperationalStateYmlFiles({
      repoRoot,
      allFiles,
      activeSpecsText: fs.readFileSync(indexPath, "utf-8"),
      changedRelPaths: discoverChangedRelPaths(repoRoot),
    });
  } catch {
    return allFiles;
  }
}

function discoverChangedRelPaths(repoRoot: string): string[] {
  const changed = new Set<string>();
  for (const args of [
    ["diff", "--name-only"],
    ["diff", "--name-only", "--cached"],
  ] as const) {
    try {
      const output = execFileSync("git", args, {
        cwd: repoRoot,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      for (const line of output.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed !== "") changed.add(trimmed);
      }
    } catch {
      return [];
    }
  }
  return [...changed].sort();
}

function normalizeRelPath(relPath: string): string {
  return relPath.split(path.sep).join("/");
}

export interface StateYmlCheckInput {
  files: string[];
  readFile: (filePath: string) => string;
}

export interface StateYmlCheckFailure {
  file: string;
  message: string;
}

export type StateYmlCheckResult =
  | { kind: "ok"; count: number }
  | { kind: "fail"; failures: StateYmlCheckFailure[]; total: number };

/**
 * Pure: recebe lista de arquivos + leitor injetado; valida cada via parseWorkflowState.
 * Sem efeitos colaterais (filesystem real fica no composition root `main`).
 */
export function runStateYmlCheck(input: StateYmlCheckInput): StateYmlCheckResult {
  const failures: StateYmlCheckFailure[] = [];
  for (const file of input.files) {
    const content = input.readFile(file);
    try {
      parseWorkflowState(content);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      failures.push({ file, message });
    }
  }
  if (failures.length > 0) {
    return { kind: "fail", failures, total: input.files.length };
  }
  return { kind: "ok", count: input.files.length };
}

/**
 * Composition root: descobre arquivos + injeta readFile + reporta.
 */
export interface StateYmlCheckOptions {
  scope?: StateYmlCheckScope;
}

export function main(
  repoRoot: string,
  logger: Logger = defaultLogger,
  options: StateYmlCheckOptions = {}
): number {
  const scope = options.scope ?? "operational";
  const files =
    scope === "all" ? discoverStateYmlFiles(repoRoot) : discoverOperationalStateYmlFiles(repoRoot);
  if (files.length === 0) {
    const label =
      scope === "all"
        ? `sob ${SPEC_ROOTS.join(" ou ")}`
        : "no escopo operacional (active-specs não concluídas + diff local)";
    logger.info(`ℹ Nenhum state.yml encontrado ${label}. Estado válido.`);
    return 0;
  }
  const result = runStateYmlCheck({
    files,
    readFile: (p) => fs.readFileSync(p, "utf-8"),
  });
  if (result.kind === "ok") {
    const label = scope === "all" ? "histórico/global" : "operacional";
    logger.info(`✅ Todos os ${result.count} state.yml (${label}) conformam ao schema canônico.`);
    return 0;
  }
  logger.error(
    `❌ ${result.failures.length} de ${result.total} state.yml violaram o schema canônico:\n`
  );
  for (const failure of result.failures) {
    const relPath = path.relative(repoRoot, failure.file);
    logger.error(`  ${relPath}`);
    logger.error(`    ${failure.message}\n`);
  }
  logger.error("Schema canônico: src/domain/workflow/WorkflowState.ts");
  return 1;
}
