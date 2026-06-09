/**
 * Check required do inventario minimo de Knowledge (CO-2.1).
 *
 * Diferente de F4a/F4b, isto nao decide semantica: valida apenas forma, cobertura
 * minima e deadlines. Falhar aqui evita que "sem backfill amplo" vire debito
 * invisivel antes do Human Gate.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { validateKnowledgeBackfill } from "../domain/knowledge/KnowledgeBackfill.js";
import { parseKnowledgeBackfill } from "../infrastructure/yaml/knowledgeBackfillSerializer.js";
import { parseWorkflowState } from "../infrastructure/yaml/workflowStateSerializer.js";

interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

const defaultLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

const INVENTORY_PATH = ".governance/specs/0024-context-architecture/knowledge-backfill.yml";
const STATE_PATH = ".governance/specs/0024-context-architecture/state.yml";

/** Checkpoints declarados em `state.yml § topology` (todos os grupos/nós). */
function topologyCheckpoints(repoRoot: string): ReadonlySet<string> | undefined {
  const abs = path.join(repoRoot, STATE_PATH);
  if (!fs.existsSync(abs)) return undefined;
  try {
    const state = parseWorkflowState(fs.readFileSync(abs, "utf-8"));
    const t = state.topology;
    if (!t) return undefined;
    const cps = new Set<string>();
    for (const group of [t.prs.concluded, t.prs.active, t.prs.planned]) {
      for (const node of group) for (const cp of node.checkpoints) cps.add(cp);
    }
    return cps;
  } catch {
    return undefined; // degrada: state-yml:check já cobre a forma do state.yml
  }
}

export function main(repoRoot: string, logger: Logger = defaultLogger): number {
  const abs = path.join(repoRoot, INVENTORY_PATH);
  if (!fs.existsSync(abs)) {
    logger.error(`❌ co-knowledge:inventory — ${INVENTORY_PATH} ausente.`);
    return 1;
  }

  try {
    const entries = parseKnowledgeBackfill(fs.readFileSync(abs, "utf-8"));
    const violations = validateKnowledgeBackfill(entries, topologyCheckpoints(repoRoot));
    if (violations.length === 0) {
      logger.info(`✅ co-knowledge:inventory — ${entries.length} entrada(s); cobertura mínima ok.`);
      return 0;
    }
    logger.error(
      `❌ co-knowledge:inventory — ${violations.length} violação(ões) em ${INVENTORY_PATH}:`
    );
    for (const v of violations) {
      logger.error(`  [${v.code}]${v.entryId ? ` ${v.entryId}` : ""}: ${v.message}`);
    }
    return 1;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    logger.error(`❌ co-knowledge:inventory — falha ao parsear ${INVENTORY_PATH}: ${message}`);
    return 1;
  }
}
