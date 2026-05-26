import { GovernanceError } from "../../domain/shared/errors.js";
import { MigrationPlan, planAdoption } from "../../domain/workspace/MigrationPlan.js";
import { WorkspaceState } from "../../domain/workspace/WorkspaceState.js";
import {
  PrecedenceOptions,
  resolvePrecedence,
} from "../../domain/workspace/WorkspacePrecedence.js";
import { WorkspaceProvisioner } from "../ports/WorkspaceProvisioner.js";

export interface AdoptWorkspaceDeps {
  readonly provisioner: WorkspaceProvisioner;
}

export interface AdoptWorkspaceInput {
  readonly state: WorkspaceState;
  readonly precedence?: PrecedenceOptions;
}

export interface AdoptWorkspaceResult {
  readonly plan: MigrationPlan;
  /** Diretórios criados neste run (participam do rollback bilateral). */
  readonly applied: ReadonlyArray<string>;
  /** Arquivos-índice criados neste run (não-destrutivos; fora do rollback). */
  readonly appliedFiles: ReadonlyArray<string>;
  /** True quando o plano era inteiramente no-op (idempotência em estado `governance`). */
  readonly idempotentNoop: boolean;
}

/**
 * Use case: aplica o plano de adoção/migração de workspace.
 *
 * Garantias:
 *  - Idempotência: rodar duas vezes não duplica nem reescreve.
 *  - Rollback bilateral: qualquer falha em `ensureDirectory` desfaz na ordem
 *    inversa os diretórios que **este caso de uso criou** (rollback nunca
 *    apaga conteúdo pré-existente — provisioner remove só vazios).
 *  - Estados ambíguos: erro determinístico antes de qualquer IO.
 */
export class AdoptWorkspace {
  constructor(private readonly deps: AdoptWorkspaceDeps) {}

  execute(input: AdoptWorkspaceInput): AdoptWorkspaceResult {
    const resolution = resolvePrecedence(input.state, input.precedence);
    if (resolution.kind === "ambiguous") {
      throw new GovernanceError(
        "WORKSPACE_AMBIGUOUS_STATE",
        `Workspace ambíguo: '.governance/' coexiste com ${resolution.legacySources.join(", ")}. ` +
          `Consolide o legado antes de adotar.`
      );
    }

    const plan = planAdoption(input.state);
    const created: string[] = [];
    const createdFiles: string[] = [];

    try {
      for (const step of plan.steps) {
        if (step.kind === "ensure-directory") {
          if (this.deps.provisioner.ensureDirectory(step.path)) created.push(step.path);
        } else {
          // ensure-file: não-destrutivo e idempotente (escreve só se ausente).
          // Fora do rollback transacional — re-rodar completa sem corromper.
          if (this.deps.provisioner.ensureFile(step.path, step.content)) {
            createdFiles.push(step.path);
          }
        }
      }
    } catch (err) {
      // Rollback determinístico dos DIRETÓRIOS: ordem inversa, removendo apenas
      // o que ESTE caso de uso criou neste run (não toca pré-existente). Os
      // arquivos-índice não são revertidos — são não-destrutivos e idempotentes.
      for (let i = created.length - 1; i >= 0; i -= 1) {
        try {
          this.deps.provisioner.removeDirectoryIfEmpty(created[i]);
        } catch {
          // Best-effort: rollback nunca mascara a causa raiz.
        }
      }
      throw err;
    }

    return {
      plan,
      applied: Object.freeze(created.slice()),
      appliedFiles: Object.freeze(createdFiles.slice()),
      idempotentNoop: created.length === 0 && createdFiles.length === 0,
    };
  }
}
