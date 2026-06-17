/**
 * Registry EXTENSÍVEL de decisões humanas (espelha o CommandRegistry / catálogo
 * de reviews). Adicionar um tipo novo = uma definição + UMA linha aqui
 * (`register(new XDefinition())`) — sem cadeia central `if (type === ...)`.
 *
 * Determinístico (ADR 0018): resolve por id (match exato); colisão de id é erro
 * de programação (falha alto e cedo). A ordem de listagem é a ordem de registro
 * (estável), refinada pelo wizard que pode ordenar por disponibilidade.
 */
import { HumanDecisionDefinition } from "./model.js";
import { CloseDispositionsDefinition } from "./closeDispositions.js";
import { MarkReadinessDefinition } from "./markReadiness.js";
import { AdvanceSubcheckpointDefinition } from "./advanceSubcheckpoint.js";
import { HumanGateDefinition } from "./humanGate.js";
import { OpenNextNodeDefinition } from "./openNextNode.js";

export class DecisionRegistry {
  private readonly byId = new Map<string, HumanDecisionDefinition>();
  private readonly order: string[] = [];

  register(definition: HumanDecisionDefinition): this {
    if (this.byId.has(definition.id)) {
      throw new Error(`Decisão duplicada no registry: "${definition.id}" já registrada.`);
    }
    this.byId.set(definition.id, definition);
    this.order.push(definition.id);
    return this;
  }

  resolve(id: string): HumanDecisionDefinition | undefined {
    return this.byId.get(id);
  }

  /** Definições na ORDEM de registro (determinística). */
  definitions(): readonly HumanDecisionDefinition[] {
    return this.order.map((id) => this.byId.get(id)!);
  }

  ids(): readonly string[] {
    return [...this.order];
  }
}

/**
 * Ponto ÚNICO de registro das decisões da CLI (CO-3 / PR #42).
 * Ordem = ciclo de vida do checkpoint: encerrar findings → declarar readiness →
 * avançar sub-checkpoint → Human Gate → transição de nó. O wizard oculta as decisões
 * `not-applicable` e renumera.
 */
export function buildDecisionRegistry(): DecisionRegistry {
  const registry = new DecisionRegistry();
  registry.register(new CloseDispositionsDefinition());
  registry.register(new MarkReadinessDefinition());
  registry.register(new AdvanceSubcheckpointDefinition());
  registry.register(new HumanGateDefinition());
  registry.register(new OpenNextNodeDefinition());
  return registry;
}
