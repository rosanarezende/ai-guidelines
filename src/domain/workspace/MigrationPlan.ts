import { GOVERNANCE_ROOT, LegacySource, WorkspaceState } from "./WorkspaceState.js";

/**
 * [DEC-0021-A03] Plano de migração puro.
 *
 * O plano é **determinístico** a partir do estado: serve como contrato entre
 * domínio e infraestrutura. A execução real (IO) acontece em
 * `AdoptWorkspace` via {@link ../../app/ports/WorkspaceProvisioner}.
 *
 * Idempotência: rodar `planAdoption` duas vezes sobre o mesmo estado produz
 * planos equivalentes — e quando o estado já é `governance`, o plano é vazio.
 */
export interface MigrationStep {
  readonly kind: "ensure-directory";
  readonly path: string;
}

export interface MigrationPlan {
  readonly steps: ReadonlyArray<MigrationStep>;
  readonly noticedLegacy: ReadonlyArray<LegacySource>;
}

/**
 * Diretórios canônicos reservados em `.governance/` (vide [DEC-0021-B02]).
 * Mantemos a lista explícita para evitar drift entre docs e runtime.
 */
export const RESERVED_GOVERNANCE_DIRS = ["intake", "handoff", "telemetry"] as const;

export function planAdoption(state: WorkspaceState): MigrationPlan {
  const ensure: MigrationStep[] = [
    { kind: "ensure-directory", path: GOVERNANCE_ROOT },
    ...RESERVED_GOVERNANCE_DIRS.map(
      (sub): MigrationStep => ({
        kind: "ensure-directory",
        path: `${GOVERNANCE_ROOT}/${sub}`,
      })
    ),
  ];

  switch (state.kind) {
    case "governance":
      // Idempotência: já há `.governance/`. Plano apenas garante reservas.
      return { steps: Object.freeze(ensure.slice()), noticedLegacy: [] };
    case "pristine":
      return { steps: Object.freeze(ensure.slice()), noticedLegacy: [] };
    case "legacy":
      return {
        steps: Object.freeze(ensure.slice()),
        noticedLegacy: state.sources,
      };
    case "mixed":
      // Estado misto não pode ser migrado silenciosamente — caller deve
      // resolver via `WorkspacePrecedence` antes de pedir plano.
      return {
        steps: Object.freeze(ensure.slice()),
        noticedLegacy: state.legacySources,
      };
  }
}
