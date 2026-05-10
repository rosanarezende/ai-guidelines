import {
  deriveWorkspaceState,
  GOVERNANCE_ROOT,
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
    const snapshot: RootsSnapshot = {
      hasGovernance: probe.directoryExists(GOVERNANCE_ROOT),
      hasSpecify: probe.directoryExists(".specify"),
      hasAiGuidelines: probe.directoryExists(".ai-guidelines"),
    };
    const state = deriveWorkspaceState(snapshot);
    const resolution = resolvePrecedence(state, opts);
    return { snapshot, state, resolution };
  }
}
