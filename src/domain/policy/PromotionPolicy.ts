import { GovernanceError } from "../shared/errors.js";
import { LifecycleStatus, WorkItemKind } from "../shared/types.js";
import { WorkItem, WorkItemPatch } from "../work-item/WorkItem.js";

export interface PromotionInput {
  readonly target: WorkItemKind;
  readonly workspacePath?: string;
}

const MAINTENANCE_KINDS: readonly WorkItemKind[] = ["patch", "fix", "incident"];
const PROPOSAL_PROMOTION_OK_STATUS: readonly LifecycleStatus[] = ["review", "done"];

/**
 * Resultado puro de uma promoção: o `WorkItemPatch` a ser aplicado pelo registry.
 * O caller (use case) é quem persiste e quem orquestra workspace.
 */
export type PromotionPatch = WorkItemPatch;

/**
 * Aplica regras de promoção entre pilares MECE.
 *
 * Função pura — sem IO, sem persistência. Decisão "policy-first":
 * o use case só toca registry/workspace depois desta função aprovar.
 */
export function promote(item: WorkItem, input: PromotionInput): PromotionPatch {
  if (MAINTENANCE_KINDS.includes(item.kind)) {
    throw new GovernanceError(
      "POLICY_MAINTENANCE_NOT_PROMOTABLE",
      `Itens de manutenção ('${item.kind}') não evoluem; promoção bloqueada.`
    );
  }

  if (item.kind === "proposal" && input.target === "spec") {
    if (!PROPOSAL_PROMOTION_OK_STATUS.includes(item.status)) {
      throw new GovernanceError(
        "POLICY_PROPOSAL_NOT_MATURE",
        "Uma 'proposal' só pode ser promovida a 'spec' quando estiver em status 'review' ou 'done'."
      );
    }
    requireWorkspace(input);
    return {
      kind: "spec",
      workspacePath: input.workspacePath,
      status: "in-progress",
    };
  }

  if (item.kind === "experiment" && input.target === "spec") {
    if (item.outcome !== "won") {
      throw new GovernanceError(
        "POLICY_EXPERIMENT_NOT_WON",
        "Apenas experimentos com resultado 'won' (vencedor) podem ser promovidos a 'spec' (Shape-up)."
      );
    }
    requireWorkspace(input);
    return {
      kind: "spec",
      workspacePath: input.workspacePath,
      status: "in-progress",
      hypothesis: item.hypothesis,
      successMetrics: item.successMetrics,
    };
  }

  throw new GovernanceError(
    "POLICY_PROMOTION_NOT_SUPPORTED",
    `Promoção '${item.kind}' → '${input.target}' não é suportada.`
  );
}

function requireWorkspace(input: PromotionInput): void {
  if (!input.workspacePath) {
    throw new GovernanceError(
      "POLICY_PROMOTION_REQUIRES_WORKSPACE",
      "A promoção para 'spec' exige um 'workspacePath' definido."
    );
  }
}
