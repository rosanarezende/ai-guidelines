import { InsightLedger } from "../../domain/insight/InsightLedger.js";

/**
 * Porta de persistência do tier "Percepções em Trânsito".
 *
 * Granularidade load/save do arquivo INTEIRO (espelha `PublishState` sobre
 * `active-specs.yml`): o ledger é um único arquivo runtime-scoped, e a
 * mutação atômica é "ler tudo → transicionar → escrever tudo".
 */
export interface InsightStore {
  /** Carrega o ledger; arquivo ausente ⇒ ledger vazio. */
  load(): InsightLedger;
  /** Persiste o ledger inteiro (determinístico, round-trippable). */
  save(ledger: InsightLedger): void;
}
