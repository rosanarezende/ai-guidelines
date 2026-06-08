import { InsightLedger } from "../../domain/insight/InsightLedger.js";

/**
 * Porta de persistência do tier "Percepções em Trânsito".
 *
 * Granularidade load/save do ledger INTEIRO: a entidade lógica continua única,
 * mas adapters podem particionar a persistência física por status para
 * legibilidade humana.
 */
export interface InsightStore {
  /** Carrega o ledger; arquivo ausente ⇒ ledger vazio. */
  load(): InsightLedger;
  /** Persiste o ledger inteiro (determinístico, round-trippable). */
  save(ledger: InsightLedger): void;
}
