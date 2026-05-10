import { WorkItem, WorkItemType, Spec, Experiment, Incident } from "../entities";
import { PolicyService } from "./index";

/**
 * Implementação do PolicyService.
 * Centraliza as regras de negócio e validações de governança (Linguagem Ubíqua).
 */
export class GovernancePolicyService implements PolicyService {
  /**
   * Valida se um item de trabalho pode transicionar para um novo tipo (Promoção).
   * ex: 'proposal' -> 'spec' ou 'experiment' -> 'spec'.
   */
  async validateTransition(
    item: WorkItem,
    newType: WorkItemType
  ): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    // Se o tipo for o mesmo, a transição é neutra (válida)
    if (item.type === newType) return { valid: true };

    // Regras de Promoção de Proposal
    if (item.type === "proposal" && newType === "spec") {
      if (item.status !== "review" && item.status !== "done") {
        errors.push(
          "Uma 'proposal' só pode ser promovida a 'spec' quando estiver em status 'review' ou 'done'."
        );
      }
    }

    // Regras de Promoção de Experiment (Shape-up)
    if (item.type === "experiment" && newType === "spec") {
      const exp = item as Experiment;
      if (exp.outcome !== "won") {
        errors.push(
          "Apenas experimentos com resultado 'won' (vencedor) podem ser promovidos a 'spec' (Shape-up)."
        );
      }
    }

    // Regras Restritivas (Tipos que não podem mudar)
    const immutableTypes: WorkItemType[] = ["patch", "fix", "incident"];
    if (immutableTypes.includes(item.type)) {
      errors.push(
        `Itens do tipo '${item.type}' possuem ciclo de vida fechado e não podem mudar de tipo.`
      );
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Valida se o item de trabalho possui todos os metadados obrigatórios para seu tipo atual.
   */
  async validateMetadata(item: WorkItem): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    // Validações Base
    if (!item.title || item.title.trim().length < 5) {
      errors.push("O título deve ter pelo menos 5 caracteres.");
    }

    // Validações por Tipo (Pillars)
    switch (item.type) {
      case "spec":
        const spec = item as Spec;
        if (!spec.workspacePath) {
          errors.push("Uma 'spec' exige obrigatoriamente um 'workspacePath' para seus artefatos.");
        }
        break;

      case "experiment":
        const exp = item as Experiment;
        if (!exp.hypothesis || exp.hypothesis.trim().length < 10) {
          errors.push("Um 'experiment' exige uma hipótese clara (mínimo 10 caracteres).");
        }
        if (!exp.successMetrics || exp.successMetrics.length === 0) {
          errors.push("Um 'experiment' exige a definição de pelo menos uma métrica de sucesso.");
        }
        if (!exp.workspacePath) {
          errors.push("Um 'experiment' exige um 'workspacePath' para registro de acompanhamento.");
        }
        break;

      case "incident":
        const inc = item as Incident;
        if (!inc.severity) {
          errors.push(
            "Um 'incident' exige a definição de uma severidade (critical, high, medium, low)."
          );
        }
        if (!inc.workspacePath) {
          errors.push(
            "Um 'incident' exige um 'workspacePath' para o Post-mortem/Root Cause Analysis."
          );
        }
        break;

      case "exploration":
        if (!item.workspacePath) {
          errors.push(
            "Uma 'exploration' exige um 'workspacePath' para arquivamento dos protótipos/pesquisas."
          );
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
