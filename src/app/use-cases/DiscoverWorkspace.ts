import {
  deriveWorkspaceState,
  GOVERNANCE_ROOT,
  LEGACY_SOURCES,
  RootsSnapshot,
  WorkspaceState,
} from "../../domain/workspace/WorkspaceState.js";
import {
  PrecedenceOptions,
  resolvePrecedence,
  WorkspaceResolution,
} from "../../domain/workspace/WorkspacePrecedence.js";
import { FileSystemProbe } from "../ports/FileSystemProbe.js";

export interface DiscoverWorkspaceDeps {
  readonly probe: FileSystemProbe;
}

export interface DiscoverWorkspaceResult {
  readonly snapshot: RootsSnapshot;
  readonly state: WorkspaceState;
  readonly resolution: WorkspaceResolution;
}

/**
 * Use case: descobre o estado real do workspace a partir do filesystem.
 *
 * Determinístico: para o mesmo filesystem, retorna o mesmo resultado.
 * Pure-IO split: probe faz leitura; domínio decide.
 */
export class DiscoverWorkspace {
  constructor(private readonly deps: DiscoverWorkspaceDeps) {}

  execute(opts: PrecedenceOptions = {}): DiscoverWorkspaceResult {
    const { probe } = this.deps;
    // Roots legados iterados a partir de LEGACY_SOURCES — único ponto de extensão
    // se um terceiro legado aparecer (evita string literal duplicada).
    const legacyPresence = new Map(
      LEGACY_SOURCES.map((src) => [src, probe.directoryExists(src)] as const)
    );
    const snapshot: RootsSnapshot = {
      hasGovernance: probe.directoryExists(GOVERNANCE_ROOT),
      hasSpecify: legacyPresence.get(".specify") ?? false,
      hasAiGuidelines: legacyPresence.get(".ai-guidelines") ?? false,
    };
    const state = deriveWorkspaceState(snapshot);
    const resolution = resolvePrecedence(state, opts);
    return { snapshot, state, resolution };
  }
}
