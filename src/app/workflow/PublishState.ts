import {
  ActiveSpecEntry,
  ActiveSpecsRoot,
  ActiveSpecStatus,
  isActiveSpecStatus,
} from "../../domain/workflow/ActiveSpecEntry.js";
import { SpecLocation } from "../../domain/workflow/SpecLocation.js";
import { WorkflowState } from "../../domain/workflow/WorkflowState.js";
import { WorkflowFileSystem } from "../ports/WorkflowFileSystem.js";
import { DetectActiveSpec } from "./DetectActiveSpec.js";

/**
 * Projeta o `state.yml` interno da spec corrente para uma entry do índice
 * operacional público (`.governance/runtime/active-specs.yml`).
 *
 * Regras canônicas (cf. `decision-brief.md` § [DEC-0023-G03] + [DEC-0023-G04]):
 *   - `stage` é projetado **direto** de `state.yml.stage` (sem tradução).
 *   - `status` é **declarado manualmente** pelo publisher (não derivado de
 *     `state.yml`; vocabulário fechado: active|blocked|paused|completed).
 *   - `updated_by` é **declarado manualmente** — quem autorizou a publicação,
 *     não quem executou nem qual agente IA rodou. Sem fallback automático.
 *   - `updated_at` é gerado pelo sistema (timestamp factual, não inferência).
 *   - Validação round-trip: o YAML escrito é reparsado antes de gravar
 *     (fail-fast contra inconsistência de schema).
 *
 * **Lookup-only por construção** (cf. memory `feedback-lookup-not-coordination`):
 * publish-state escreve apenas o estado **declarado** pelo humano; nunca infere
 * stale, prioridade, próxima ação, freshness, dependência cross-spec.
 */

const INDEX_PATH = ".governance/runtime/active-specs.yml";

/**
 * Formata um instante temporal como ISO-8601 com offset literal `-03:00`.
 *
 * Nome reflete o que o código faz de fato: deslocamento UTC fixo, sem
 * consulta a timezone real, sem dependência de `Intl`/`tzdata`, sem
 * regras de DST. Brasil aboliu horário de verão em 2019, então `-03:00`
 * é a representação estável do horário local para publishes feitos a
 * partir do Brasil; aplicações em outros offsets precisariam de função
 * própria (não-objetivo desta spec).
 *
 * Determinismo: `Date.prototype.toISOString()` sempre emite UTC, então
 * deslocamos o instante por -3h, formatamos como ISO e trocamos o `Z`
 * final pelo offset literal. Mesmo input → mesmo output em qualquer
 * runtime, qualquer TZ de máquina/CI.
 *
 * Compatibilidade: o parser (`ISO_8601_STRICT` em `activeSpecsSerializer.ts`)
 * já aceita `Z` E `±HH:MM` — entries históricas continuam válidas; novos
 * publishes passam a usar offset explícito. Heterogeneidade temporária
 * dentro do mesmo contrato (não é drift).
 */
function formatTimestampUtcMinus3(instant: Date): string {
  const OFFSET_MS = -3 * 60 * 60 * 1000;
  const shifted = new Date(instant.getTime() + OFFSET_MS);
  return shifted.toISOString().replace("Z", "-03:00");
}

export class PublishStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublishStateError";
  }
}

export interface PublishStateInput {
  readonly status: ActiveSpecStatus;
  readonly updatedBy: string;
  readonly title?: string;
  readonly baseBranch?: string;
  readonly lastSyncCommit?: string;
}

export interface PublishStateResult {
  readonly indexPath: string;
  readonly entry: ActiveSpecEntry;
  /** True se a entry substituiu uma anterior; false se foi appended. */
  readonly wasUpdate: boolean;
}

export type WorkflowStateParser = (yamlText: string) => WorkflowState;
export type ActiveSpecsParser = (yamlText: string) => ActiveSpecsRoot;
export type ActiveSpecsSerializer = (root: ActiveSpecsRoot) => string;

export class PublishState {
  constructor(
    private readonly fs: WorkflowFileSystem,
    private readonly parseIndex: ActiveSpecsParser,
    private readonly serializeIndex: ActiveSpecsSerializer,
    private readonly parseState: WorkflowStateParser,
    private readonly now: () => Date = () => new Date()
  ) {}

  run(input: PublishStateInput): PublishStateResult {
    // 1. Validar input declarado pelo humano
    if (!isActiveSpecStatus(input.status)) {
      throw new PublishStateError(
        `status "${input.status}" inválido. Use um de: active|blocked|paused|completed ` +
          `(per [DEC-0023-G04]; vocabulário fechado).`
      );
    }
    if (typeof input.updatedBy !== "string" || input.updatedBy.trim() === "") {
      throw new PublishStateError(
        `updated_by é obrigatório (quem autorizou a publicação). ` +
          `Sem fallback automático — git config user.email é "quem executou", não "quem autorizou".`
      );
    }

    // 2. Detectar spec via branch (factual, não inferência). Quando a branch
    //    corrente é "de trabalho" (escopo do PR) e não casa o diretório
    //    canônico da spec, DetectActiveSpec falha. Nesse caso, fallback
    //    explícito via índice público — match EXATO em entry.branch. Sem
    //    fuzzy, sem ranking, sem auto-checkout; ambiguidade vira erro
    //    narrativo. Lookup/translation, não orquestração.
    const detected = new DetectActiveSpec(this.fs).run();
    const location: SpecLocation =
      detected.location ?? this.resolveLocationFromIndexBranchMatch(detected.reason);

    // 3. Derivar id + slug do nome do diretório (convenção 0023-workflow-runtime)
    const dirMatch = /^(\d{4})-(.+)$/.exec(location.slug);
    if (!dirMatch) {
      throw new PublishStateError(
        `Slug do diretório "${location.slug}" não segue padrão NNNN-slug. ` +
          `Não foi possível derivar id e slug do índice.`
      );
    }
    const [, id, slug] = dirMatch;

    // 4. Ler state.yml interno (fonte do stage)
    const specPrefix = location.source === "governance" ? ".governance/specs" : ".specify/specs";
    const specPath = `${specPrefix}/${location.slug}`;
    const statePath = `${specPath}/state.yml`;
    if (!this.fs.fileExists(statePath)) {
      throw new PublishStateError(
        `state.yml não encontrado em "${statePath}". ` +
          `A spec precisa ter state.yml interno antes de publish-state.`
      );
    }
    const state = this.parseState(this.fs.readTextFile(statePath));

    // 5. Branch corrente (factual)
    const branch = this.fs.currentBranch();
    if (!branch) {
      throw new PublishStateError(
        `Nenhum branch git ativo (HEAD detached ou não-repo). ` +
          `publish-state precisa de branch corrente para registrar.`
      );
    }

    // 6. Construir entry — stage projetado direto, status/updated_by declarados
    const newEntry: ActiveSpecEntry = {
      id,
      slug,
      ...(input.title !== undefined ? { title: input.title } : {}),
      branch,
      ...(input.baseBranch !== undefined ? { baseBranch: input.baseBranch } : {}),
      stage: state.stage,
      status: input.status,
      specPath,
      sourceStatePath: statePath,
      updatedAt: formatTimestampUtcMinus3(this.now()),
      updatedBy: input.updatedBy,
      ...(input.lastSyncCommit !== undefined ? { lastSyncCommit: input.lastSyncCommit } : {}),
    };

    // 7. Ler índice atual (ou começar vazio)
    let root: ActiveSpecsRoot;
    if (this.fs.fileExists(INDEX_PATH)) {
      root = this.parseIndex(this.fs.readTextFile(INDEX_PATH));
    } else {
      root = { version: 1, activeSpecs: [] };
    }

    // 8. Upsert por id — atualiza in-place ou append no fim
    const existingIndex = root.activeSpecs.findIndex((e) => e.id === id);
    const wasUpdate = existingIndex >= 0;
    const updatedEntries: ActiveSpecEntry[] = wasUpdate
      ? root.activeSpecs.map((e, i) => (i === existingIndex ? newEntry : e))
      : [...root.activeSpecs, newEntry];
    const updatedRoot: ActiveSpecsRoot = { version: 1, activeSpecs: updatedEntries };

    // 9. Round-trip de validação — fail-fast se o resultado não bate com o schema
    const serialized = this.serializeIndex(updatedRoot);
    try {
      this.parseIndex(serialized);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new PublishStateError(
        `Inconsistência interna: round-trip do índice falhou pós-serialize. ` +
          `Detalhe: ${message}. Nada foi escrito.`
      );
    }

    // 10. Escrever
    this.fs.writeTextFile(INDEX_PATH, serialized);

    return { indexPath: INDEX_PATH, entry: newEntry, wasUpdate };
  }

  /**
   * Fallback de resolução de spec corrente quando `DetectActiveSpec` falha
   * (branch "de trabalho" cujo slug derivado não casa diretório local).
   *
   * Consulta o índice público e procura entry cujo `branch` case **exatamente**
   * a branch corrente. Determinístico: 0 matches ou >1 matches viram erro
   * narrativo, nunca "escolha mais provável". Match estrito por igualdade
   * de string — sem fuzzy, sem prefixo, sem ranking.
   *
   * Lookup/translation puro: a branch continua sendo input declarativo
   * (estado do filesystem); o índice é consultado **como tabela de tradução
   * branch→spec**, não como autoridade semântica nem fonte de inferência.
   */
  private resolveLocationFromIndexBranchMatch(detectReason?: string): SpecLocation {
    const branch = this.fs.currentBranch();
    if (!branch) {
      throw new PublishStateError(
        `Não foi possível detectar spec ativa: ${detectReason ?? "branch indisponível"}. ` +
          `publish-state precisa de branch corrente para registrar.`
      );
    }

    if (!this.fs.fileExists(INDEX_PATH)) {
      throw new PublishStateError(
        `Branch "${branch}" não casa diretório de spec conhecido, ` +
          `e o índice público "${INDEX_PATH}" também está ausente. ` +
          `Rode da branch canônica da spec (feat/spec-NNNN-<slug>) ou ` +
          `publique a entry no índice a partir da branch canônica primeiro.`
      );
    }

    const root = this.parseIndex(this.fs.readTextFile(INDEX_PATH));
    const matches = root.activeSpecs.filter((entry) => entry.branch === branch);

    if (matches.length === 0) {
      throw new PublishStateError(
        `Branch "${branch}" não casa diretório de spec conhecido, ` +
          `e nenhuma entry do índice público referencia esta branch. ` +
          `Opções: (a) rode da branch canônica da spec; (b) registre esta ` +
          `branch como "branch" de uma entry existente; (c) publique a ` +
          `entry inicial a partir da branch canônica.`
      );
    }

    if (matches.length > 1) {
      const conflictList = matches.map((e) => `${e.id}/${e.slug}`).join(", ");
      throw new PublishStateError(
        `Branch "${branch}" é referenciada por múltiplas entries no índice ` +
          `público (${conflictList}). Ambiguidade — qual atualizar? ` +
          `Reconcilie o índice antes de publicar.`
      );
    }

    const entry = matches[0];
    const source: SpecLocation["source"] = entry.specPath.startsWith(".governance/")
      ? "governance"
      : "specify-legacy";
    const dirSlug = entry.specPath.split("/").pop() ?? `${entry.id}-${entry.slug}`;
    return {
      slug: dirSlug,
      absolutePath: this.fs.resolveAbsolute(entry.specPath),
      source,
    };
  }
}
