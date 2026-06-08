/**
 * CLI entrypoint para o gate `co-knowledge:check` (CO-2 / Spec 0024 — Knowledge tipado).
 *
 * Valida o ledger de {@link Falsification} (`.governance/runtime/falsifications.yml`):
 * - **F1–F3 + selo F2** (`validateFalsification`): forma + fingerprint que sela a
 *   claim/refs (tamper-evidence). Editar uma falsificação sem re-selar → ⚠️.
 * - **F4a — anti-reabertura por REF** (determinístico): se `falsifiesRef` aponta um
 *   conhecimento que ainda está ATIVO, é possível reabertura silenciosa. A única
 *   fonte de status que existe é `insights.yml` (`open`) — então F4a cobre
 *   `falsifiesRef` de estágio `insight`. decision/doctrine ficam de fora (sem ledger
 *   de status — não fingir), assim como **F4b** (paráfrase semântica; exigiria
 *   NLP/LLM, proibido — ADR 0018).
 *
 * **Advisory-first:** DETECTA e REPORTA, mas NUNCA falha o build — `main` retorna
 * sempre 0. Promoção a `required` é decisão futura. Sem entidade nova além da
 * `Falsification` persistida (fato primário; INV-4).
 *
 * Exit codes:
 *   0 — SEMPRE (advisory-first; ✅ ok ou ⚠️ achados reportados).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { Falsification, validateFalsification } from "../domain/knowledge/Falsification.js";
import { formatRef } from "../domain/knowledge/KnowledgeRef.js";
import { parseFalsifications } from "../infrastructure/yaml/falsificationsSerializer.js";
import { parseInsightsLedger } from "../infrastructure/yaml/insightsLedgerSerializer.js";

interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

const defaultLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

const FALSIFICATIONS_PATH = ".governance/runtime/falsifications.yml";
const INSIGHTS_PATH = ".governance/runtime/insights.yml";

export interface CoKnowledgeFinding {
  readonly falsificationId: string;
  readonly code: string;
  readonly message: string;
}

export interface CoKnowledgeResult {
  readonly checked: number;
  /** F1–F3 + selo F2 (forma + tamper-evidence). */
  readonly structural: CoKnowledgeFinding[];
  /** F4a — claim falsificada que continua ativa (reabertura por ref). */
  readonly reopened: CoKnowledgeFinding[];
}

/** Pure: valida cada Falsification (F1–F3 + selo) e detecta reabertura por ref (F4a). */
export function runCoKnowledgeCheck(input: {
  falsifications: ReadonlyArray<Falsification>;
  activeInsightIds: ReadonlySet<string>;
}): CoKnowledgeResult {
  const structural: CoKnowledgeFinding[] = [];
  const reopened: CoKnowledgeFinding[] = [];

  for (const f of input.falsifications) {
    for (const v of validateFalsification(f)) {
      structural.push({ falsificationId: f.id, code: v.code, message: v.message });
    }
    // F4a — determinístico por igualdade de ref (não fingerprint de claim).
    if (
      f.falsifiesRef &&
      f.falsifiesRef.stage === "insight" &&
      input.activeInsightIds.has(f.falsifiesRef.id)
    ) {
      reopened.push({
        falsificationId: f.id,
        code: "FAL_REOPENED_REF",
        message: `falsifica ${formatRef(f.falsifiesRef)}, mas esse insight está ATIVO (open) — possível reabertura silenciosa.`,
      });
    }
  }

  return { checked: input.falsifications.length, structural, reopened };
}

/** Composition root: lê os ledgers + reporta. SEMPRE retorna 0 (advisory-first). */
export function main(repoRoot: string, logger: Logger = defaultLogger): number {
  const falsAbs = path.join(repoRoot, FALSIFICATIONS_PATH);
  if (!fs.existsSync(falsAbs)) {
    logger.info(`ℹ co-knowledge:check (advisory) — ${FALSIFICATIONS_PATH} ausente. Nada a checar.`);
    return 0;
  }

  let falsifications: Falsification[];
  try {
    falsifications = parseFalsifications(fs.readFileSync(falsAbs, "utf-8"));
  } catch (e: unknown) {
    const m = e instanceof Error ? e.message : String(e);
    logger.info(
      `⚠️ co-knowledge:check (advisory) — falha ao parsear ${FALSIFICATIONS_PATH}: ${m}.`
    );
    return 0;
  }

  let activeInsightIds: ReadonlySet<string> = new Set();
  const insAbs = path.join(repoRoot, INSIGHTS_PATH);
  if (fs.existsSync(insAbs)) {
    try {
      const ledger = parseInsightsLedger(fs.readFileSync(insAbs, "utf-8"));
      activeInsightIds = new Set(ledger.open().map((i) => i.id));
    } catch {
      /* tolerante: state-yml/insights:check cobre a forma do insights.yml */
    }
  }

  const result = runCoKnowledgeCheck({ falsifications, activeInsightIds });
  const issues = result.structural.length + result.reopened.length;

  if (issues === 0) {
    logger.info(
      `✅ co-knowledge:check (advisory) — ${result.checked} falsification(s); ` +
        "invariantes (F1–F3 + selo) ok; nenhuma reabertura por ref (F4a)."
    );
    return 0;
  }

  logger.info(
    `⚠️ co-knowledge:check (advisory) — ${issues} achado(s) em ${result.checked} falsification(s):\n`
  );
  for (const f of result.structural)
    logger.info(`  [${f.code}] ${f.falsificationId}: ${f.message}`);
  for (const f of result.reopened) logger.info(`  [${f.code}] ${f.falsificationId}: ${f.message}`);
  logger.info(
    "\nAdvisory (CO-2 advisory-first): não bloqueia o build. F4b (paráfrase semântica) " +
      "NÃO é coberto — sem NLP/LLM no runtime (ADR 0018)."
  );
  return 0;
}
