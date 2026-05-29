/**
 * CLI entrypoint para gate `state-yml:check`.
 *
 * Itera todos os `state.yml` sob `.governance/specs/*` e `.specify/specs/*`
 * (legacy bridge per ADR 0019) e valida cada um contra o schema canônico
 * definido em `src/domain/workflow/WorkflowState.ts` via `parseWorkflowState`.
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
export function main(repoRoot: string, logger: Logger = defaultLogger): number {
  const files = discoverStateYmlFiles(repoRoot);
  if (files.length === 0) {
    logger.info(
      `ℹ Nenhum state.yml encontrado sob ${SPEC_ROOTS.join(" ou ")}. Estado válido (sem specs ativas).`
    );
    return 0;
  }
  const result = runStateYmlCheck({
    files,
    readFile: (p) => fs.readFileSync(p, "utf-8"),
  });
  if (result.kind === "ok") {
    logger.info(`✅ Todos os ${result.count} state.yml conformam ao schema canônico.`);
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
