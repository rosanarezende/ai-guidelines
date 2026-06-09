/**
 * CLI entrypoint para gate `active-specs:check`.
 *
 * **Drift guard de consistência SSOT→projeção.** Para cada entry de
 * `.governance/runtime/specs/active.yml`, verifica que `entry.stage` é projeção
 * FIEL de `state.yml.stage` da spec — invariante `[DEC-0023-A04]` (stage
 * compartilha o enum e é projeção direta de `state.yml.stage`).
 *
 * Por que existe: o `activeSpecsSerializer` valida deliberadamente só a FORMA
 * (ver seu header: "Drift guard de ambiente é responsabilidade [de outro lugar]").
 * Esse "outro lugar" não existia — e a 0023 ficou listada como `closing/active`
 * ~10 dias após `done` (3ª representação stale do padrão recorrente SSOT→projeção).
 * Este gate fecha a lacuna: o serializer valida FORMA; este valida CONSISTÊNCIA.
 *
 * Escopo deliberado: só `stage` (projeção direta). `status` é dimensão
 * independente (`[DEC-0023-A04]`) e `branch`/`updatedAt` são registros factuais —
 * NÃO são projeções de `state.yml`, então NÃO entram aqui.
 *
 * Exit codes:
 *   0 — sucesso (todo entry.stage == state.yml.stage; state.yml existe)
 *   1 — ≥ 1 entry diverge da SSOT (stage stale) ou aponta state.yml inexistente
 */
import * as fs from "node:fs";
import * as path from "node:path";
import {
  parseActiveSpecs,
  parseSpecsHistory,
} from "../infrastructure/yaml/activeSpecsSerializer.js";
import { parseWorkflowState } from "../infrastructure/yaml/workflowStateSerializer.js";

interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

const defaultLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

const INDEX_PATH = ".governance/runtime/specs/active.yml";
const HISTORY_PATH = ".governance/runtime/specs/history.yml";

export interface ActiveSpecsConsistencyInput {
  /** Conteúdo bruto de `specs/active.yml`. */
  indexText: string;
  /** Conteúdo bruto opcional de `specs/history.yml`. */
  historyText?: string;
  /** Lê o `state.yml` de uma entry pelo caminho relativo; `null` se não existe. */
  readStateYml: (relPath: string) => string | null;
}

export interface ConsistencyFailure {
  id: string;
  message: string;
}

export type ConsistencyResult =
  | { kind: "ok"; count: number }
  | { kind: "fail"; failures: ConsistencyFailure[]; total: number };

/**
 * Pure: parseia o índice + leitor injetado → compara `entry.stage` com
 * `state.yml.stage`. Sem efeitos colaterais (filesystem real fica no `main`).
 */
export function runActiveSpecsConsistencyCheck(
  input: ActiveSpecsConsistencyInput
): ConsistencyResult {
  const root = parseActiveSpecs(input.indexText);
  const entries = root.activeSpecs;
  const failures: ConsistencyFailure[] = [];

  for (const entry of entries) {
    if (entry.status === "completed") {
      failures.push({
        id: entry.id,
        message:
          `status completed não pertence a specs/active.yml; publique com ` +
          `workflow publish-state --status=completed para mover a entry a ${HISTORY_PATH}.`,
      });
      continue;
    }
    validateEntryStage(entry, "active-specs", input.readStateYml, failures);
  }

  if (input.historyText !== undefined) {
    const history = parseSpecsHistory(input.historyText);
    for (const entry of history.specsHistory) {
      validateEntryStage(entry, "specs-history", input.readStateYml, failures);
    }
  }

  if (failures.length > 0) {
    const total =
      entries.length +
      (input.historyText ? parseSpecsHistory(input.historyText).specsHistory.length : 0);
    return { kind: "fail", failures, total };
  }
  const historyCount = input.historyText
    ? parseSpecsHistory(input.historyText).specsHistory.length
    : 0;
  return { kind: "ok", count: entries.length + historyCount };
}

function validateEntryStage(
  entry: { id: string; specPath: string; sourceStatePath?: string; stage: string },
  source: string,
  readStateYml: (relPath: string) => string | null,
  failures: ConsistencyFailure[]
): void {
  const statePath = entry.sourceStatePath ?? `${entry.specPath}/state.yml`;
  const content = readStateYml(statePath);
  if (content === null) {
    failures.push({
      id: entry.id,
      message: `state.yml não encontrado em "${statePath}" (${source} aponta para SSOT inexistente).`,
    });
    return;
  }
  let stateStage: string;
  try {
    stateStage = parseWorkflowState(content).stage;
  } catch (e: unknown) {
    const m = e instanceof Error ? e.message : String(e);
    failures.push({ id: entry.id, message: `falha ao parsear "${statePath}": ${m}` });
    return;
  }
  if (entry.stage !== stateStage) {
    failures.push({
      id: entry.id,
      message:
        `stage stale: ${source} diz "${entry.stage}", mas a SSOT (${statePath}) diz ` +
        `"${stateStage}". stage é projeção direta — [DEC-0023-A04].`,
    });
  }
}

/** Composition root: lê o índice + injeta readFile + reporta. */
export function main(repoRoot: string, logger: Logger = defaultLogger): number {
  const indexAbs = path.join(repoRoot, INDEX_PATH);
  if (!fs.existsSync(indexAbs)) {
    logger.info(`ℹ ${INDEX_PATH} ausente. Estado válido (nenhuma spec publicada).`);
    return 0;
  }
  let result: ConsistencyResult;
  try {
    result = runActiveSpecsConsistencyCheck({
      indexText: fs.readFileSync(indexAbs, "utf-8"),
      historyText: fs.existsSync(path.join(repoRoot, HISTORY_PATH))
        ? fs.readFileSync(path.join(repoRoot, HISTORY_PATH), "utf-8")
        : undefined,
      readStateYml: (rel) => {
        const abs = path.join(repoRoot, rel);
        return fs.existsSync(abs) ? fs.readFileSync(abs, "utf-8") : null;
      },
    });
  } catch (e: unknown) {
    const m = e instanceof Error ? e.message : String(e);
    logger.error(`❌ active-specs:check — falha ao parsear ${INDEX_PATH}: ${m}`);
    return 1;
  }

  if (result.kind === "ok") {
    logger.info(
      `✅ active-specs:check — ${result.count} entry(ies); stage fiel à SSOT (state.yml).`
    );
    return 0;
  }
  logger.error(
    `❌ active-specs:check — ${result.failures.length} de ${result.total} entry(ies) divergem da SSOT:\n`
  );
  for (const f of result.failures) {
    logger.error(`  ${f.id}`);
    logger.error(`    ${f.message}\n`);
  }
  logger.error(
    "Corrija a projeção em specs/active.yml (ou rode publish-state). Invariante: entry.stage == state.yml.stage."
  );
  return 1;
}
