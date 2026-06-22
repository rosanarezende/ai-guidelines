/**
 * CLI entrypoint para gate `active-specs:check`.
 *
 * **Drift guard de consistência fatos→projeção.** Para cada entry de
 * `.governance/runtime/specs/active.yml`, verifica:
 *
 *   1. `entry.stage` é projeção FIEL de `state.yml.stage` — invariante
 *      `[DEC-0023-A04]` (stage compartilha o enum e é projeção direta).
 *   2. `entry.id`/`entry.slug` round-trip com o basename de `entry.specPath`
 *      (o gerador `publish-state` DERIVA id/slug do nome do diretório; uma
 *      entry que não round-tripa não pôde ter saído do gerador).
 *   3. `entry.sourceStatePath`, se presente, é `${specPath}/state.yml`
 *      (mesma razão: round-trip do gerador).
 *   4. `entry.branch` é fiel ao branch git corrente QUANDO o branch corrente
 *      pertence à mesma spec (id canônico extraído via `parseSpecBranch`,
 *      [DEC-0023-I01]). Fronteira documentada: em HEAD detached (CI de PR),
 *      em branch fora do padrão `feat/spec-NNNN-*` ou em branch de OUTRA
 *      spec, o sub-check de branch é SKIPPED — o fato não é observável
 *      nesses ambientes. O ponto de enforcement determinístico é o validate
 *      completo local/CI rodando na branch da spec; o pre-push diário usa
 *      validate:changed para manter o ciclo de desenvolvimento curto.
 *
 * Por que existe: o `activeSpecsSerializer` valida deliberadamente só a FORMA.
 * A 0023 ficou listada como `closing/active` ~10 dias após `done` (stage stale);
 * o escopo original deste gate parou em `stage`, tratando `branch` como "registro
 * factual fora de escopo". A Spec 0024 falsificou esse recorte (dogfood CO-4,
 * 2026-06-11): `entry.branch` ficou DUAS gerações stale (#38→#41) e o drift foi
 * mascarado porque o handoff recuperava a spec por fallback canônico — projeção
 * stale aceita porque um fallback operacional esconde a divergência. `branch`
 * pode não ser projeção de `state.yml`, mas é projeção de um FATO (git), e
 * fato→projeção também driftam. Coerência projetada×factual é invariante de
 * ESTADO CONTÍNUO — superfície de check é a correta (cf. taxonomia de
 * superfícies de enforcement, research 2026-06-05).
 *
 * `status`/`updated_by` seguem dimensões declaradas (humanas) — não derivam de
 * fato observável, então NÃO entram aqui. `updated_at` segue registro factual
 * sem semântica de freshness (cf. `ActiveSpecEntry.updatedAt`).
 *
 * Exit codes:
 *   0 — sucesso (invariantes acima satisfeitas nos ambientes onde observáveis)
 *   1 — ≥ 1 entry diverge dos fatos (stage/branch/identidade/path stale)
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import {
  parseActiveSpecs,
  parseSpecsHistory,
} from "../infrastructure/yaml/activeSpecsSerializer.js";
import { parseWorkflowState } from "../infrastructure/yaml/workflowStateSerializer.js";
import { parseSpecBranch } from "../app/workflow/DetectActiveSpec.js";
import {
  checkSubCheckpointCoherence,
  findCheckpointTaskLine,
  parseSubCheckpoints,
} from "./handoffFacts.js";

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
  /**
   * Branch git corrente factual; `null`/ausente quando não observável
   * (HEAD detached, não-repo). Sub-check de branch só roda quando o branch
   * corrente parseia como `feat/spec-NNNN-*` E o id casa com a entry.
   */
  currentBranch?: string | null;
}

export interface ConsistencyFailure {
  id: string;
  message: string;
}

export type ConsistencyResult =
  | { kind: "ok"; count: number }
  | { kind: "fail"; failures: ConsistencyFailure[]; total: number };

/** Comando canônico de reconciliação da projeção (única forma governada de escrita). */
const RECONCILE_COMMAND =
  "npm run flow -- workflow publish-state --status=<status> --updated-by=<@autor>";

/**
 * Pure: parseia o índice + leitor injetado → compara cada entry com os fatos
 * (state.yml, basename do path, branch git injetado). Sem efeitos colaterais
 * (filesystem/git reais ficam no `main`).
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
    validateEntryIdentity(entry, "active-specs", failures);
    validateEntryStage(entry, "active-specs", input.readStateYml, failures);
    validateEntryBranch(entry, input.currentBranch ?? null, failures);
    validateEntrySubCheckpointCoherence(entry, input.readStateYml, failures);
  }

  if (input.historyText !== undefined) {
    const history = parseSpecsHistory(input.historyText);
    for (const entry of history.specsHistory) {
      validateEntryIdentity(entry, "specs-history", failures);
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

/**
 * Round-trip do gerador: `publish-state` deriva id/slug do basename de
 * `spec_path` e grava `source_state_path = ${spec_path}/state.yml`. Uma entry
 * que não round-tripa foi editada à mão ou apontada para a spec errada.
 */
function validateEntryIdentity(
  entry: { id: string; slug: string; specPath: string; sourceStatePath?: string },
  source: string,
  failures: ConsistencyFailure[]
): void {
  const basename = entry.specPath.split("/").filter(Boolean).pop() ?? "";
  const expected = `${entry.id}-${entry.slug}`;
  if (basename !== expected) {
    failures.push({
      id: entry.id,
      message:
        `identidade stale: ${source} projeta id/slug "${expected}", mas spec_path ` +
        `aponta para "${basename}" (fonte projetada: ${INDEX_PATH}; fonte factual: ` +
        `basename de spec_path "${entry.specPath}"). Reconcilie com: ${RECONCILE_COMMAND}.`,
    });
  }
  if (
    entry.sourceStatePath !== undefined &&
    entry.sourceStatePath !== `${entry.specPath}/state.yml`
  ) {
    failures.push({
      id: entry.id,
      message:
        `source_state_path stale: ${source} diz "${entry.sourceStatePath}", mas o gerador ` +
        `grava "${entry.specPath}/state.yml" (fonte projetada: ${INDEX_PATH}; fonte factual: ` +
        `spec_path da própria entry). Reconcilie com: ${RECONCILE_COMMAND}.`,
    });
  }
}

/**
 * Coerência branch projetada × branch factual. Só decide quando o fato é
 * observável E pertence à mesma spec: branch corrente parseia como
 * `feat/spec-NNNN-*` ([DEC-0023-I01]) e o id canônico casa com `entry.id`.
 * Caso contrário (detached HEAD, branch `main`, branch de outra spec) o
 * sub-check é SKIPPED — ausência de fato não é evidência de coerência.
 */
function validateEntryBranch(
  entry: { id: string; branch: string },
  currentBranch: string | null,
  failures: ConsistencyFailure[]
): void {
  const parsed = parseSpecBranch(currentBranch);
  if (!parsed || parsed.specId !== entry.id) return;
  if (entry.branch !== currentBranch) {
    failures.push({
      id: entry.id,
      message:
        `branch stale: a projeção diz "${entry.branch}" (fonte: ${INDEX_PATH}), mas o ` +
        `fato é "${currentBranch}" (fonte: git branch corrente). A spec ${entry.id} está ` +
        `sendo trabalhada em branch que a projeção desconhece — retomadas que confiarem ` +
        `na projeção se situam no nó errado. Reconcilie com: ${RECONCILE_COMMAND}.`,
    });
  }
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

/**
 * Coerência ESTADO↔NARRATIVA dos sub-checkpoints (CO-x.y) do checkpoint ATIVO da
 * spec. `branch`/`stage` driftam fato→projeção; a narrativa dos sub-checkpoints é
 * a mesma classe — um `[x]` que ainda diz "EM EXECUÇÃO" mente para a retomada.
 * Reusa `parseSubCheckpoints` (parser canônico de handoffFacts) — sem parser
 * paralelo. O checkpoint ativo vem do cursor da topologia (state.yml). Reusa o
 * mesmo leitor injetado de `state.yml` para ler também o `tasks.md` da spec.
 */
function validateEntrySubCheckpointCoherence(
  entry: { id: string; specPath: string; sourceStatePath?: string },
  readSpecFile: (relPath: string) => string | null,
  failures: ConsistencyFailure[]
): void {
  const statePath = entry.sourceStatePath ?? `${entry.specPath}/state.yml`;
  const stateContent = readSpecFile(statePath);
  if (stateContent === null) return; // ausência já reportada por validateEntryStage
  let checkpoint: string | null;
  try {
    checkpoint = parseWorkflowState(stateContent).topology?.cursor.checkpoint ?? null;
  } catch {
    return; // parse failure já reportado por validateEntryStage
  }
  if (!checkpoint) return; // sem cursor/topologia → nada a checar
  const tasksContent = readSpecFile(`${entry.specPath}/tasks.md`);
  if (tasksContent === null) return; // tasks.md ausente não é divergência deste gate
  if (findCheckpointTaskLine(tasksContent, checkpoint) === null) {
    failures.push({
      id: entry.id,
      message:
        `checkpoint ativo não materializado em tasks.md: state.yml aponta para "${checkpoint}", ` +
        `mas tasks.md não contém o item "**Checkpoint ${checkpoint.replace(/^checkpoint-/, "")}**". ` +
        `A lista de tarefas deve materializar o checkpoint ativo antes de retomar ou decidir; ` +
        `alterações em tasks.md são decisão governada, não reparo automático.`,
    });
    return;
  }
  const subs = parseSubCheckpoints(tasksContent, checkpoint);
  for (const violation of checkSubCheckpointCoherence(subs)) {
    failures.push({
      id: entry.id,
      message:
        `coerência de sub-checkpoint (${checkpoint}): ${violation} ` +
        `A narrativa em tasks.md deve refletir o marcador de estado ([ ]/[/]/[x]).`,
    });
  }
}

/** Branch git corrente factual; `null` em detached HEAD ou fora de repo. */
function factualCurrentBranch(repoRoot: string): string | null {
  try {
    const out = execFileSync("git", ["branch", "--show-current"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return out === "" ? null : out;
  } catch {
    return null;
  }
}

/** Composition root: lê o índice + injeta readFile/branch factual + reporta. */
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
      currentBranch: factualCurrentBranch(repoRoot),
    });
  } catch (e: unknown) {
    const m = e instanceof Error ? e.message : String(e);
    logger.error(`❌ active-specs:check — falha ao parsear ${INDEX_PATH}: ${m}`);
    return 1;
  }

  if (result.kind === "ok") {
    logger.info(
      `✅ active-specs:check — ${result.count} entry(ies); stage/branch/identidade + coerência de sub-checkpoints fiéis aos fatos (state.yml + git + spec_path + tasks.md).`
    );
    return 0;
  }
  logger.error(
    `❌ active-specs:check — ${result.failures.length} divergência(s) fatos→projeção em ${result.total} entry(ies):\n`
  );
  for (const f of result.failures) {
    logger.error(`  ${f.id}`);
    logger.error(`    ${f.message}\n`);
  }
  logger.error(
    `A projeção specs/active.yml não se edita à mão; reconcilie com: ${RECONCILE_COMMAND}.`
  );
  return 1;
}
