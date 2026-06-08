/**
 * Entry tipada do índice operacional público (`.governance/runtime/specs/active.yml`).
 *
 * Contrato cravado em `decision-brief.md` § [DEC-0023-G02] (estrutura + campos
 * permitidos) + [DEC-0023-G04] (vocabulário stage/status + regra de projeção).
 *
 * Princípio: `stage` é **projeção direta** de `state.yml.stage` (mesmo enum,
 * sem tradução). `status` é dimensão **independente** — não derivada de `stage`
 * — declarada manualmente pelo publisher. Combinação válida típica:
 * `stage: implementation` + `status: blocked`.
 *
 * Naming de `id`, `slug`, `branch`, `spec_path` é **validação mínima estável**
 * (string não-vazia). Convenções de nomenclatura (`id` 4 dígitos, branch
 * `feat/spec-NNNN-*`) NÃO viram invariante arquitetural do parser — runtime
 * pode evoluir taxonomia sem reescrever o schema.
 */

import { WorkflowStage } from "./WorkflowState.js";

export type ActiveSpecStatus = "active" | "blocked" | "paused" | "completed";

export const ACTIVE_SPEC_STATUSES: readonly ActiveSpecStatus[] = [
  "active",
  "blocked",
  "paused",
  "completed",
];

export function isActiveSpecStatus(value: unknown): value is ActiveSpecStatus {
  return typeof value === "string" && (ACTIVE_SPEC_STATUSES as readonly string[]).includes(value);
}

export interface ActiveSpecEntry {
  readonly id: string;
  readonly slug: string;
  readonly branch: string;
  readonly stage: WorkflowStage;
  readonly status: ActiveSpecStatus;
  readonly specPath: string;
  /**
   * Timestamp ISO-8601 estrito de quando o humano publicou o estado.
   *
   * **Semântica deliberadamente restrita** — `updatedAt` é registro factual,
   * NÃO sinal operacional. Especificamente NÃO representa:
   *   - progresso da spec;
   *   - prioridade relativa entre specs;
   *   - atividade recente do time;
   *   - saúde operacional;
   *   - freshness/staleness (não derive "stale", "outdated", "needs-republish").
   *
   * Inferências sobre intenção a partir deste campo (sorting, ranking,
   * heartbeat, sync drift) recriam coordination creep que a Spec 0023
   * craveia como anti-pattern (cf. `[DEC-0023-A03]` AI-as-Channel +
   * `[DEC-0023-G03]` manual-first). Qualquer enriquecimento semântico
   * derivado de `updated_at` exige `[DEC-NNNN-*]` próprio.
   */
  readonly updatedAt: string;

  readonly title?: string;
  readonly baseBranch?: string;
  readonly sourceStatePath?: string;
  readonly updatedBy?: string;
  readonly lastSyncCommit?: string;
}

export interface ActiveSpecsRoot {
  readonly version: 1;
  readonly activeSpecs: ReadonlyArray<ActiveSpecEntry>;
}

export interface SpecsHistoryRoot {
  readonly version: 1;
  readonly specsHistory: ReadonlyArray<ActiveSpecEntry>;
}
