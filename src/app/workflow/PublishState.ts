import {
  ActiveSpecEntry,
  ActiveSpecsRoot,
  ActiveSpecStatus,
  isActiveSpecStatus,
} from "../../domain/workflow/ActiveSpecEntry.js";
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

    // 2. Detectar spec via branch (factual, não inferência)
    const detected = new DetectActiveSpec(this.fs).run();
    if (!detected.location) {
      throw new PublishStateError(
        `Não foi possível detectar spec ativa: ${detected.reason}. ` +
          `publish-state precisa ser rodado da branch da spec.`
      );
    }

    // 3. Derivar id + slug do nome do diretório (convenção 0023-workflow-runtime)
    const dirMatch = /^(\d{4})-(.+)$/.exec(detected.location.slug);
    if (!dirMatch) {
      throw new PublishStateError(
        `Slug do diretório "${detected.location.slug}" não segue padrão NNNN-slug. ` +
          `Não foi possível derivar id e slug do índice.`
      );
    }
    const [, id, slug] = dirMatch;

    // 4. Ler state.yml interno (fonte do stage)
    const specPrefix =
      detected.location.source === "governance" ? ".governance/specs" : ".specify/specs";
    const specPath = `${specPrefix}/${detected.location.slug}`;
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
      updatedAt: this.now().toISOString(),
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
}
