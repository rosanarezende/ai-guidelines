import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { graduationRefOf } from "../domain/insight/insightKnowledge.js";
import { recurrenceOf } from "../domain/insight/Insight.js";
import { formatRef, isWellFormedRef } from "../domain/knowledge/KnowledgeRef.js";
import { INSIGHTS_LEDGER_PATH } from "../infrastructure/yaml/FileInsightStore.js";
import {
  parseInsightsLedger,
  stringifyInsightsLedger,
} from "../infrastructure/yaml/insightsLedgerSerializer.js";

/**
 * Gate `insights:check` — protege as invariantes JÁ EXISTENTES do domínio na
 * fronteira de persistência. NÃO reimplementa regras:
 *
 *  1. força o parse do ledger (`parseInsightsLedger` → `InsightLedger.fromArray`
 *     → `assertInsightInvariants`) — quebra de invariante falha no CI;
 *  2. exige FORMA CANÔNICA: `raw === stringify(parse(raw))`. O serializer é o
 *     único dono do formato (o arquivo está em `.prettierignore`), então uma
 *     edição manual parseável-mas-não-canônica é detectada em vez de sofrer
 *     reformat silencioso na próxima escrita da CLI. Análogo à paridade do
 *     `ruleset:check`.
 *  3. valida a ARESTA DE GRADUAÇÃO no pipeline Knowledge: um Insight promovido
 *     para o conhecimento (doctrine/decision/guardrail) deve ter uma `ref`
 *     bem-formada para o estágio-alvo (typo de ref falha aqui). Forma, não
 *     existência — integridade referencial é decisão arquitetural futura.
 *  4. SINALIZA candidatos à graduação (detector de maturação, NÃO-bloqueante):
 *     Insight `open` com recorrência ≥ `GRADUATION_CANDIDATE_THRESHOLD` sem
 *     graduação → ⚠️ "decisão humana necessária". Fecha o modo de falha
 *     "observar para sempre" (aprendizado recorrente preso indefinidamente em
 *     estado observacional). É DECLARAÇÃO contínua (warn); graduar é EVENTO de
 *     julgamento humano, então NÃO falha o CI (falhar seria vermelho-cedo-demais,
 *     cf. PIT-0008). Detecta + delega ao humano; NÃO auto-promove.
 *
 * Exit codes: 0 ok (ledger ausente é válido; candidatos só avisam) · 1 violação.
 */

/**
 * Limiar de recorrência que sinaliza um Insight `open` como candidato à
 * graduação. = 3: a barra da própria lente projeção-vs-entidade (≥2 instâncias
 * do mesmo mecanismo) + 1 de folga contra ruído. Sinaliza; o julgamento
 * (graduar vs descartar) permanece humano.
 */
const GRADUATION_CANDIDATE_THRESHOLD = 3;

export function main(repoRoot: string): number {
  const path = resolve(repoRoot, INSIGHTS_LEDGER_PATH);
  if (!existsSync(path)) {
    process.stdout.write(`✅ insights:check — ledger ausente (vazio é válido).\n`);
    return 0;
  }
  let raw: string;
  let ledger;
  try {
    raw = readFileSync(path, "utf-8");
    ledger = parseInsightsLedger(raw);
  } catch (err) {
    process.stderr.write(
      `❌ insights:check — ${INSIGHTS_LEDGER_PATH} inválido: ` +
        `${err instanceof Error ? err.message : String(err)}\n`
    );
    return 1;
  }

  if (raw !== stringifyInsightsLedger(ledger)) {
    process.stderr.write(
      `❌ insights:check — ${INSIGHTS_LEDGER_PATH} não está na forma canônica ` +
        `(edição manual?). Regenere pela CLI (\`ai-guidelines insight …\`).\n`
    );
    return 1;
  }

  for (const insight of ledger.all()) {
    const edge = graduationRefOf(insight);
    if (edge && !isWellFormedRef(edge)) {
      process.stderr.write(
        `❌ insights:check — ${insight.id} graduou para ${formatRef(edge)}, ` +
          `mas a ref não casa o padrão do estágio '${edge.stage}'.\n`
      );
      return 1;
    }
  }

  // Detector de maturação (não-bloqueante): sinaliza Insights `open` recorrentes
  // que já deveriam graduar. Mecânico detecta; o julgamento (promover/descartar)
  // é humano — não auto-promove, não falha o CI (graduar é evento, não estado).
  const candidates = ledger
    .open()
    .filter((insight) => recurrenceOf(insight) >= GRADUATION_CANDIDATE_THRESHOLD);
  for (const candidate of candidates) {
    process.stdout.write(
      `⚠️  insights:check — ${candidate.id} acumulou ${recurrenceOf(candidate)} ocorrência(s) ` +
        `(≥ ${GRADUATION_CANDIDATE_THRESHOLD}) sem graduação — candidato à graduação; ` +
        `decisão humana necessária (\`insight promote\` ou \`insight discard\`).\n`
    );
  }

  const total = ledger.all().length;
  const open = ledger.open().length;
  process.stdout.write(
    `✅ insights:check — ${total} percepção(ões) (${open} open); ` +
      `invariantes + forma canônica + arestas de graduação ok` +
      `${candidates.length > 0 ? ` · ${candidates.length} candidato(s) à graduação` : ""}.\n`
  );
  return 0;
}
