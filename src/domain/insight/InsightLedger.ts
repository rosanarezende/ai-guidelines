import { GovernanceError } from "../shared/errors.js";
import { compareInsightId, InsightId, nextInsightId } from "./InsightId.js";
import { CaptureDraft, Insight, OriginContext, PromotionTarget } from "./Insight.js";
import { assertInsightInvariants } from "./InsightPolicy.js";
import {
  captureInsight,
  discardInsight,
  promoteInsight,
  recordOccurrence,
} from "./InsightTransitions.js";

/**
 * Coleção-agregado do tier "Percepções em Trânsito".
 *
 * SSOT lógica em memória. Garante: unicidade de ids, alocação sequencial,
 * ordenação determinística (diff git estável) e que toda transição passe
 * pelo serviço de domínio (invariantes preservadas). Espelha
 * `InMemoryRegistry` do agregado `WorkItem`.
 *
 * Persistência é responsabilidade do port `InsightStore` (load/save do
 * arquivo inteiro), fora deste agregado.
 */
export class InsightLedger {
  private readonly items = new Map<InsightId, Insight>();

  static empty(): InsightLedger {
    return new InsightLedger();
  }

  /** Reconstrói o ledger a partir de registros persistidos, revalidando tudo. */
  static fromArray(insights: ReadonlyArray<Insight>): InsightLedger {
    const ledger = new InsightLedger();
    for (const insight of insights) {
      assertInsightInvariants(insight);
      ledger.assertAbsent(insight.id);
      ledger.items.set(insight.id, insight);
    }
    return ledger;
  }

  private assertAbsent(id: InsightId): void {
    if (this.items.has(id)) {
      throw new GovernanceError(
        "INSIGHT_DUPLICATE_ID",
        `Percepção com id '${id}' já existe no ledger.`
      );
    }
  }

  private require(id: InsightId): Insight {
    const current = this.items.get(id);
    if (!current) {
      throw new GovernanceError(
        "INSIGHT_NOT_FOUND",
        `Percepção com id '${id}' não existe no ledger.`
      );
    }
    return current;
  }

  /** Captura uma nova percepção, alocando o próximo id sequencial. */
  capture(draft: CaptureDraft, at: string): Insight {
    const id = nextInsightId([...this.items.keys()]);
    const insight = captureInsight(draft, id, at);
    this.items.set(id, insight);
    return insight;
  }

  recordOccurrence(id: InsightId, origin: OriginContext, at: string, note?: string): Insight {
    const next = recordOccurrence(this.require(id), origin, at, note);
    this.items.set(id, next);
    return next;
  }

  promote(id: InsightId, target: PromotionTarget, at: string, by?: string): Insight {
    const next = promoteInsight(this.require(id), target, at, by);
    this.items.set(id, next);
    return next;
  }

  discard(id: InsightId, reason: string, at: string, by?: string): Insight {
    const next = discardInsight(this.require(id), reason, at, by);
    this.items.set(id, next);
    return next;
  }

  has(id: InsightId): boolean {
    return this.items.has(id);
  }

  find(id: InsightId): Insight | undefined {
    return this.items.get(id);
  }

  /** Todas as percepções, ordenadas por id ascendente (diff estável). */
  all(): ReadonlyArray<Insight> {
    return [...this.items.values()].sort((a, b) => compareInsightId(a.id, b.id));
  }

  /** Apenas as percepções vivas (status `open`), ordenadas por id. */
  open(): ReadonlyArray<Insight> {
    return this.all().filter((insight) => insight.status === "open");
  }

  size(): number {
    return this.items.size;
  }
}
