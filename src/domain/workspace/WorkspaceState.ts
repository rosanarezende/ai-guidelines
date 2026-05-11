/**
 * [DEC-0021-A03] Estado do workspace de governança.
 *
 * Discriminated union puro — descreve **o que existe no filesystem** sem
 * decidir o que fazer. A decisão (precedence/migration) é responsabilidade
 * de {@link ./WorkspacePrecedence}.
 *
 * Fontes legadas reconhecidas: `.specify/` (specs/workflow), `.ai-guidelines/`
 * (assets locais). Qualquer outra pasta NÃO é tratada como legado — para evitar
 * heurística silenciosa.
 */
export type LegacySource = ".specify" | ".ai-guidelines";

export const LEGACY_SOURCES = [
  ".specify",
  ".ai-guidelines",
] as const satisfies ReadonlyArray<LegacySource>;

export const GOVERNANCE_ROOT = ".governance" as const;

export type WorkspaceState =
  | { readonly kind: "pristine" }
  | { readonly kind: "governance" }
  | { readonly kind: "legacy"; readonly sources: ReadonlyArray<LegacySource> }
  | { readonly kind: "mixed"; readonly legacySources: ReadonlyArray<LegacySource> };

/**
 * Snapshot determinístico da presença das raízes canônicas no filesystem.
 * É o único contrato que o domínio aceita — sem chamadas de IO embutidas.
 */
export interface RootsSnapshot {
  readonly hasGovernance: boolean;
  readonly hasSpecify: boolean;
  readonly hasAiGuidelines: boolean;
}

/**
 * Deriva o {@link WorkspaceState} a partir do snapshot.
 * Determinístico, total e puro: mesma entrada → mesma saída.
 */
export function deriveWorkspaceState(snapshot: RootsSnapshot): WorkspaceState {
  const sources: LegacySource[] = [];
  if (snapshot.hasSpecify) sources.push(".specify");
  if (snapshot.hasAiGuidelines) sources.push(".ai-guidelines");

  if (snapshot.hasGovernance && sources.length > 0) {
    return { kind: "mixed", legacySources: Object.freeze(sources.slice()) };
  }
  if (snapshot.hasGovernance) return { kind: "governance" };
  if (sources.length > 0) return { kind: "legacy", sources: Object.freeze(sources.slice()) };
  return { kind: "pristine" };
}
