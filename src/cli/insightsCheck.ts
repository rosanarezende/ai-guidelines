import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { INSIGHTS_LEDGER_PATH } from "../infrastructure/yaml/FileInsightStore.js";
import { parseInsightsLedger } from "../infrastructure/yaml/insightsLedgerSerializer.js";

/**
 * Gate `insights:check` — protege as invariantes JÁ EXISTENTES do domínio na
 * fronteira de persistência. NÃO reimplementa regras: apenas força o parse do
 * ledger (`parseInsightsLedger` → `InsightLedger.fromArray` →
 * `assertInsightInvariants`). Um YAML editado à mão que quebre qualquer
 * invariante falha aqui, no `validate`/CI, em vez de só na leitura ad hoc.
 *
 * Exit codes: 0 ok (inclui ledger ausente — vazio é válido) · 1 violação.
 */
export function main(repoRoot: string): number {
  const path = resolve(repoRoot, INSIGHTS_LEDGER_PATH);
  if (!existsSync(path)) {
    process.stdout.write(`✅ insights:check — ledger ausente (vazio é válido).\n`);
    return 0;
  }
  try {
    const ledger = parseInsightsLedger(readFileSync(path, "utf-8"));
    const total = ledger.all().length;
    const open = ledger.open().length;
    process.stdout.write(
      `✅ insights:check — ${total} percepção(ões) (${open} open); invariantes ok.\n`
    );
    return 0;
  } catch (err) {
    process.stderr.write(
      `❌ insights:check — ${INSIGHTS_LEDGER_PATH} inválido: ` +
        `${err instanceof Error ? err.message : String(err)}\n`
    );
    return 1;
  }
}
