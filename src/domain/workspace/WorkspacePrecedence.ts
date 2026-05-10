import { GovernanceError } from "../shared/errors.js";
import { LegacySource, WorkspaceState } from "./WorkspaceState.js";

/**
 * [DEC-0021-A03] Política de precedência.
 *
 * Regras explícitas (sem alias mágico, sem fallback invisível):
 *
 *  - `pristine`     → requer init (CLI deve oferecer).
 *  - `governance`   → `.governance/` é SSOT; legado não está disponível.
 *  - `legacy`       → requer adoção/migração explícita.
 *  - `mixed`        → falha determinística (`WORKSPACE_AMBIGUOUS_STATE`)
 *                     a não ser que o caller opte por bridge explícita.
 *
 * Bridge explícita: opt-in consciente do caller (ex.: flag CLI). Mesmo nesse
 * caso, `.governance/` continua como SSOT — a bridge apenas permite leitura
 * **explícita** do legado pelos casos de uso que pedem (nunca por fallback).
 */
export type WorkspaceResolution =
  | { readonly kind: "needs-init" }
  | { readonly kind: "governance-ssot" }
  | { readonly kind: "needs-adoption"; readonly sources: ReadonlyArray<LegacySource> }
  | { readonly kind: "ambiguous"; readonly legacySources: ReadonlyArray<LegacySource> };

export interface PrecedenceOptions {
  /** Opt-in: aceitar estado misto como `governance-ssot` (legado fica acessível apenas por leitura explícita). */
  readonly allowExplicitLegacyBridge?: boolean;
}

export function resolvePrecedence(
  state: WorkspaceState,
  opts: PrecedenceOptions = {}
): WorkspaceResolution {
  switch (state.kind) {
    case "pristine":
      return { kind: "needs-init" };
    case "governance":
      return { kind: "governance-ssot" };
    case "legacy":
      return { kind: "needs-adoption", sources: state.sources };
    case "mixed":
      if (opts.allowExplicitLegacyBridge) {
        return { kind: "governance-ssot" };
      }
      return { kind: "ambiguous", legacySources: state.legacySources };
  }
}

/**
 * Versão estrita: lança {@link GovernanceError} em estados que exigem ação.
 * Útil para use cases que só sabem operar com `.governance/` como SSOT.
 */
export function requireGovernanceSsot(state: WorkspaceState, opts: PrecedenceOptions = {}): void {
  const resolution = resolvePrecedence(state, opts);
  if (resolution.kind === "governance-ssot") return;

  if (resolution.kind === "ambiguous") {
    throw new GovernanceError(
      "WORKSPACE_AMBIGUOUS_STATE",
      `Workspace ambíguo: '.governance/' coexiste com ${resolution.legacySources.join(", ")}. ` +
        `Consolide o legado ou habilite bridge explícita.`
    );
  }
  if (resolution.kind === "needs-adoption") {
    throw new GovernanceError(
      "WORKSPACE_LEGACY_NOT_ADOPTED",
      `Workspace legado detectado em ${resolution.sources.join(", ")}. ` +
        `Execute a adoção para '.governance/' antes de continuar.`
    );
  }
  throw new GovernanceError(
    "WORKSPACE_NOT_INITIALIZED",
    `Workspace ainda não inicializado: '.governance/' inexistente.`
  );
}
