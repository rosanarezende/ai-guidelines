/**
 * Disclosure de IA como PROJEÇÃO de processo (Spec 0024, Checkpoint 2.4d).
 *
 * Responde "como este trabalho foi produzido e validado?" — pergunta de
 * PROCESSO, não "quem participou?". Por isso:
 *
 *   - NÃO há `participants.yml`/`contributors.yml`/ledger/grafo nem schema novo.
 *     Modelar participação (actor↔contribuições, m:n, varia no tempo) seria
 *     over-modeling para a pergunta que o disclosure realmente faz.
 *   - O disclosure é DERIVADO exclusivamente do que já existe: review-as-artifact
 *     (`reviews/`, `gates/` via `consolidate()`) ∩ os checkpoints que o PR embarca
 *     (`state.yml § topology`, G07). "derivado > declarado" (ADR 0021 §5).
 *   - A frase editorial "Implementação assistida por IA." NÃO é dado governado:
 *     vive como texto padrão do template de PR (editável; um PR pode ser
 *     puro-humano). Só revisões/findings/gate são derivados aqui.
 *
 * Determinístico, sem rede (resolução de branch via git é opcional/injetável).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import {
  parseReview,
  parseResolutions,
  parseGate,
  ReviewArtifact,
  ResolutionArtifact,
  GateArtifact,
} from "../infrastructure/yaml/reviewArtifactsReader.js";
import { consolidate, SpecArtifacts, ConsolidatedCheckpoint } from "./reviewCheck.js";
import { parseWorkflowState } from "../infrastructure/yaml/workflowStateSerializer.js";
import { parseSpecBranch } from "../app/workflow/DetectActiveSpec.js";
import { PrTopologyNode } from "../domain/workflow/WorkflowState.js";

export interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

const defaultLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

/** Rótulos human-friendly por role — HINT de projeção, não enum fechado.
 * Role desconhecido (research, architecture, security, …) cai no genérico. */
const ROLE_LABELS: Record<string, string> = {
  technical_audit: "Technical Audit",
  architectural_review: "Architectural Review",
};

export type GateState = "pending" | "approved" | "changes_requested" | "partial";

/** Fatos de PROCESSO derivados — o único "modelo de dados" do disclosure,
 * em memória, derivado. Nenhum campo é persistido. */
export interface DisclosureFacts {
  readonly reviewCount: number;
  readonly categories: readonly string[];
  readonly findingsEmitted: number;
  readonly findingsResolved: number;
  readonly hasHumanGate: boolean;
  /** Nº de checkpoints do escopo com gate (numerador da cobertura). */
  readonly gatedCount: number;
  readonly gateState: GateState;
  readonly checkpointsInScope: readonly string[];
}

/** `checkpoint-2.3` → `2.3` (tolera id já normalizado). */
export function normalizeCheckpoint(slug: string): string {
  return slug.replace(/^checkpoint-/, "");
}

/**
 * DERIVA os fatos de processo para um PR: o consolidado por checkpoint,
 * escopado aos checkpoints que o nó da topologia declara embarcar. Puro.
 */
export function deriveDisclosure(
  node: PrTopologyNode,
  byCheckpoint: readonly ConsolidatedCheckpoint[]
): DisclosureFacts {
  const scopeArray = node.checkpoints.map(normalizeCheckpoint);
  const scope = new Set(scopeArray);
  const terminalCheckpoint = scopeArray.length > 0 ? scopeArray[scopeArray.length - 1] : null;
  const inScope = byCheckpoint.filter((c) => scope.has(normalizeCheckpoint(c.checkpoint)));

  let reviewCount = 0;
  let findingsEmitted = 0;
  let findingsResolved = 0;
  const categories = new Set<string>();
  const gateDecisions: string[] = [];
  let terminalGateDecision: string | null = null;

  for (const c of inScope) {
    reviewCount += c.reviewDecisions.length;
    for (const d of c.reviewDecisions) categories.add(d.role);
    // invariante do schema: findings presentes == findings_emitted.
    findingsEmitted += c.totalOpen + c.totalClosed;
    findingsResolved += c.totalClosed; // disposition accepted/dismissed (lane do reviewer)
    if (c.gate) {
      gateDecisions.push(c.gate.decision);
      if (normalizeCheckpoint(c.checkpoint) === terminalCheckpoint) {
        terminalGateDecision = c.gate.decision;
      }
    }
  }

  const gatedCount = gateDecisions.length;
  const hasHumanGate = gatedCount > 0;
  // (Cenário A) cobertura: gate final consolida checkpoints internos do PR.
  // Se o checkpoint terminal do nó tem gate approved, ele absorve os checkpoints
  // anteriores do mesmo PR. Se não, exigimos gate em cada checkpoint (gatedCount === scope.size).
  const fullyCovered =
    scope.size > 0 && (terminalGateDecision === "approved" || gatedCount === scope.size);
  let gateState: GateState;
  if (!hasHumanGate) {
    gateState = "pending";
  } else if (gateDecisions.some((g) => g === "changes_requested")) {
    // qualquer gate rejeitado ⇒ não-validado, independente dos demais.
    gateState = "changes_requested";
  } else if (fullyCovered && gateDecisions.every((g) => g === "approved")) {
    gateState = "approved";
  } else {
    // aprovado, porém SEM cobrir todo o escopo declarado.
    gateState = "partial";
  }

  return {
    reviewCount,
    categories: [...categories].map((r) => ROLE_LABELS[r] ?? r),
    findingsEmitted,
    findingsResolved,
    hasHumanGate,
    gatedCount,
    gateState,
    checkpointsInScope: [...scope],
  };
}

/**
 * Render do bloco DERIVADO (process-cêntrico). NÃO emite a frase editorial
 * "Implementação assistida por IA." — essa vive no template. Puro.
 */
export function renderDisclosure(facts: DisclosureFacts): string {
  if (facts.reviewCount === 0 && !facts.hasHumanGate) {
    return "Sem revisões independentes registradas em artefato para este PR ainda.";
  }
  const lines: string[] = [];
  const cat = facts.categories.length ? ` (${facts.categories.join(", ")})` : "";
  const noun = facts.reviewCount === 1 ? "artefato de revisão" : "artefatos de revisão";
  lines.push(
    `Revisão independente registrada em ${facts.reviewCount} ${noun}${cat}: ` +
      `${facts.findingsEmitted} findings emitidos, ${facts.findingsResolved} resolvidos.`
  );
  switch (facts.gateState) {
    case "approved":
      lines.push("Consolidação e validação final pelo owner.");
      break;
    case "changes_requested":
      lines.push("Gate humano: changes requested (pendente de resolução).");
      break;
    case "partial":
      lines.push(
        `Gate humano: parcial — ${facts.gatedCount} de ${facts.checkpointsInScope.length} ` +
          `checkpoints do escopo com gate; demais pendentes.`
      );
      break;
    case "pending":
    default:
      lines.push("Gate humano: pendente.");
  }
  return lines.join("\n");
}

function listYml(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".yml") && !e.name.startsWith("_"))
    .map((e) => path.join(dir, e.name))
    .sort();
}

/** Descoberta escopada a UMA spec (evita colisão de checkpoint cross-spec). */
function discoverSpec(
  repoRoot: string,
  specDir: string
): { artifacts: SpecArtifacts; errors: string[] } {
  const reviews: ReviewArtifact[] = [];
  const resolutions: ResolutionArtifact[] = [];
  const gates: GateArtifact[] = [];
  const errors: string[] = [];
  for (const file of listYml(path.join(specDir, "reviews"))) {
    const rel = path.relative(repoRoot, file);
    try {
      if (path.basename(file).endsWith("-resolutions.yml")) {
        resolutions.push(parseResolutions(fs.readFileSync(file, "utf-8"), rel));
      } else {
        reviews.push(parseReview(fs.readFileSync(file, "utf-8"), rel));
      }
    } catch (e) {
      errors.push((e as Error).message);
    }
  }
  for (const file of listYml(path.join(specDir, "gates"))) {
    try {
      gates.push(parseGate(fs.readFileSync(file, "utf-8"), path.relative(repoRoot, file)));
    } catch (e) {
      errors.push((e as Error).message);
    }
  }
  return {
    artifacts: { reviews, reviewEvents: [], resolutions, gates, allowedCheckpoints: [] },
    errors,
  };
}

function resolveSpecDir(repoRoot: string, specId: string, branchScope: string): string | null {
  const direct = path.join(repoRoot, ".governance/specs", `${specId}-${branchScope}`);
  if (fs.existsSync(direct)) return direct;
  for (const root of [".governance/specs", ".specify/specs"]) {
    const base = path.join(repoRoot, root);
    if (!fs.existsSync(base)) continue;
    const match = fs
      .readdirSync(base, { withFileTypes: true })
      .find((e) => e.isDirectory() && e.name.startsWith(`${specId}-`));
    if (match) return path.join(base, match.name);
  }
  return null;
}

function findNode(
  topology: NonNullable<ReturnType<typeof parseWorkflowState>["topology"]>,
  branchScope: string,
  prNumber: number | null
): PrTopologyNode | null {
  const all = [...topology.prs.concluded, ...topology.prs.active, ...topology.prs.planned];
  return (
    all.find((n) => n.id === branchScope || (prNumber != null && n.github_pr === prNumber)) ?? null
  );
}

function currentBranch(repoRoot: string): string | null {
  try {
    return execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim();
  } catch {
    return null;
  }
}

export interface MainOptions {
  readonly branch?: string;
  readonly prNumber?: number;
  readonly logger?: Logger;
}

/**
 * Composition root: branch → spec → nó da topologia → discover+consolidate
 * (escopado) → deriva → renderiza. Imprime o bloco DERIVADO no stdout (pronto
 * para colar) e o contexto no stderr.
 */
export function main(repoRoot: string, opts: MainOptions = {}): number {
  const logger = opts.logger ?? defaultLogger;
  const branch = opts.branch ?? currentBranch(repoRoot);
  const parsed = parseSpecBranch(branch);
  if (!parsed) {
    logger.error(
      `ℹ Branch "${branch ?? "(desconhecida)"}" não é de spec (feat/spec-NNNN-*). ` +
        `Disclosure derivado só se aplica a PRs de spec; use a frase editorial do template.`
    );
    return 0;
  }

  const specDir = resolveSpecDir(repoRoot, parsed.specId, parsed.branchScope);
  if (!specDir) {
    logger.error(`❌ Diretório da spec ${parsed.specId} não encontrado.`);
    return 1;
  }

  const statePath = path.join(specDir, "state.yml");
  if (!fs.existsSync(statePath)) {
    logger.error(`❌ state.yml não encontrado em ${statePath}.`);
    return 1;
  }
  let topology;
  try {
    topology = parseWorkflowState(fs.readFileSync(statePath, "utf-8")).topology;
  } catch (e) {
    logger.error(`❌ Erro ao parsear state.yml: ${(e as Error).message}`);
    return 1;
  }
  if (!topology) {
    logger.error(`ℹ Spec ${parsed.specId} sem topologia declarada; nada a derivar.`);
    return 0;
  }

  const node = findNode(topology, parsed.branchScope, opts.prNumber ?? null);
  if (!node) {
    logger.error(
      `❌ Nó da topologia não encontrado para "${parsed.branchScope}"${opts.prNumber ? ` / PR #${opts.prNumber}` : ""}.`
    );
    return 1;
  }

  const { artifacts, errors } = discoverSpec(repoRoot, specDir);
  if (errors.length > 0) {
    logger.error(`⚠ ${errors.length} artefato(s) com erro de schema (ignorados na projeção):`);
    for (const e of errors) logger.error(`  - ${e}`);
  }

  const { byCheckpoint, violations } = consolidate(artifacts);
  if (violations.length > 0) {
    // (Cenário C) o consolidator já declarou o estado inválido (ex.: 2 reviews
    // p/ a mesma role/checkpoint). Não projetar disclosure sobre estado que ele
    // rejeitou — seria afirmar narrativa válida sobre estado inconsistente.
    // Espelha o `review:check` (mesma fonte de invariantes).
    logger.error(
      `❌ Estado inconsistente: ${violations.length} violação(ões) do consolidator — ` +
        `disclosure não é projetado sobre estado inválido (resolva via \`yarn review:check\`):`
    );
    for (const v of violations) logger.error(`  - ${v}`);
    return 1;
  }
  const facts = deriveDisclosure(node, byCheckpoint);

  logger.error(
    `# Disclosure derivado — Spec ${parsed.specId}${node.github_pr ? ` · PR #${node.github_pr}` : ""} · checkpoints [${facts.checkpointsInScope.join(", ")}]`
  );
  logger.info(renderDisclosure(facts));
  return 0;
}
