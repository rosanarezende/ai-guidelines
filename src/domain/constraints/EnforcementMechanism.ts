import { SurfaceClass } from "./Constraint.js";

/**
 * Catálogo determinístico de **mecanismos de enforcement** conhecidos (CO-3).
 *
 * Um mecanismo é a capability/entrypoint que EXECUTA a verificação de uma
 * constraint sobre uma superfície. O binding referencia o mecanismo por `id`; o
 * catálogo declara seu `status` (implementado vs planejado) e as classes de
 * superfície compatíveis. Um binding cujo mecanismo é desconhecido — ou
 * `required` apontando um mecanismo apenas `planned`, ou com classe incompatível
 * — falha com diagnóstico específico (a validação vive em `compileConstraints`).
 *
 * CO-3.1 declara apenas mecanismos factualmente existentes para as constraints
 * escolhidas, mais o reconhecimento ESTRUTURAL de `handoff-receipt` (planejado,
 * deliberadamente NÃO conectado — wiring é CO-3.4/CO-6).
 */
export type MechanismStatus = "implemented" | "planned";

export interface EnforcementMechanismDescriptor {
  readonly id: string;
  readonly status: MechanismStatus;
  readonly supportedSurfaceClasses: readonly SurfaceClass[];
  /** Ponto de execução (ref namespaced de superfície ou módulo). Documental. */
  readonly entrypoint?: string;
}

/** Catálogo default do CO-3.1 — só mecanismos reais + `handoff-receipt` estrutural. */
export const DEFAULT_ENFORCEMENT_MECHANISMS: readonly EnforcementMechanismDescriptor[] = [
  {
    id: "gate-decidability-check",
    status: "implemented",
    supportedSurfaceClasses: ["event"],
    entrypoint: "npm-script:gate-decidability:check",
  },
  {
    id: "script-contracts-check",
    status: "implemented",
    supportedSurfaceClasses: ["event"],
    entrypoint: "npm-script:script-contracts:check",
  },
  {
    // Reconhecido ESTRUTURALMENTE; wiring deferido (CO-3.4/CO-6). `required` o rejeita.
    id: "handoff-receipt",
    status: "planned",
    supportedSurfaceClasses: ["event"],
    entrypoint: "src/cli/handoffReceipt.ts",
  },
];

/** Lookup determinístico por id. `undefined` se desconhecido. */
export function resolveMechanism(
  id: string,
  catalog: readonly EnforcementMechanismDescriptor[] = DEFAULT_ENFORCEMENT_MECHANISMS
): EnforcementMechanismDescriptor | undefined {
  return catalog.find((m) => m.id === id);
}
