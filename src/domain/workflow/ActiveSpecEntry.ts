/**
 * Entry tipada do índice operacional público (`.governance/runtime/active-specs.yml`).
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
