/**
 * CLI entrypoint para o gate `review:check` — "revisão-como-artefato" (Spec 0024
 * Checkpoint 2.4). Torna os artefatos de governança load-bearing em vez de
 * comentários de PR (memória volátil).
 *
 * O que faz (determinístico, sem rede):
 *   1. Descobre reviews/gates sob `.governance/specs/<spec>/{reviews,gates}/*.yml`;
 *   2. valida o schema (severidade/status/decisão; ids de finding únicos);
 *   3. DERIVA o estado consolidado por checkpoint (nunca um arquivo à mão);
 *   4. ENFORCA: um gate `approved` exige ZERO findings bloqueantes (critical/high)
 *      `open` nas reviews daquele checkpoint — o gate consome o estado consolidado;
 *   5. imprime o consolidado (vira a projeção mínima do PR).
 *
 * Exit codes: 0 ok · 1 violação/erro de schema · 2 uso inválido (no bin).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import {
  parseReview,
  parseGate,
  ReviewArtifact,
  GateArtifact,
  Finding,
  BLOCKING_SEVERITIES,
} from "../infrastructure/yaml/reviewArtifactsReader.js";

export interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

const defaultLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

const SPEC_ROOTS = [".governance/specs", ".specify/specs"] as const;

export interface SpecArtifacts {
  readonly reviews: readonly ReviewArtifact[];
  readonly gates: readonly GateArtifact[];
}

function listYml(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".yml") && !e.name.startsWith("_"))
    .map((e) => path.join(dir, e.name))
    .sort();
}

export interface ConsolidatedCheckpoint {
  readonly checkpoint: string;
  readonly reviewDecisions: ReadonlyArray<{ role: string; actor: string; decision: string }>;
  readonly openByseverity: Readonly<Record<string, number>>;
  readonly openBlocking: readonly Finding[];
  readonly totalOpen: number;
  readonly totalResolved: number;
  readonly gate?: GateArtifact;
}

/** Pure: consolida por checkpoint e detecta violações de gate. */
export function consolidate(artifacts: SpecArtifacts): {
  byCheckpoint: ConsolidatedCheckpoint[];
  violations: string[];
} {
  const checkpoints = new Set<string>();
  for (const r of artifacts.reviews) checkpoints.add(r.checkpoint);
  for (const g of artifacts.gates) checkpoints.add(g.checkpoint);

  const violations: string[] = [];
  const byCheckpoint: ConsolidatedCheckpoint[] = [];

  for (const cp of [...checkpoints].sort()) {
    const reviews = artifacts.reviews.filter((r) => r.checkpoint === cp);

    // No máximo 1 review por (checkpoint, role) — re-reviews editam o mesmo arquivo.
    const byRole = new Map<string, ReviewArtifact>();
    for (const r of reviews) {
      if (byRole.has(r.role)) {
        violations.push(
          `checkpoint ${cp}: múltiplos arquivos de review para role "${r.role}" (${byRole.get(r.role)!.file}, ${r.file}). Use 1 arquivo por (checkpoint, role); re-reviews editam-no.`
        );
      }
      byRole.set(r.role, r);
    }

    const openByseverity: Record<string, number> = {};
    const openBlocking: Finding[] = [];
    let totalOpen = 0;
    let totalResolved = 0;
    for (const r of reviews) {
      for (const f of r.findings) {
        if (f.status === "open") {
          totalOpen++;
          openByseverity[f.severity] = (openByseverity[f.severity] ?? 0) + 1;
          if ((BLOCKING_SEVERITIES as readonly string[]).includes(f.severity)) openBlocking.push(f);
        } else if (f.status === "resolved") {
          totalResolved++;
        }
      }
    }

    const gates = artifacts.gates.filter((g) => g.checkpoint === cp);
    if (gates.length > 1) {
      violations.push(
        `checkpoint ${cp}: múltiplos gates (${gates.map((g) => g.file).join(", ")}).`
      );
    }
    const gate = gates[0];

    // ENFORCEMENT central: gate approved ⟹ nenhum finding bloqueante aberto.
    if (gate && gate.decision === "approved" && openBlocking.length > 0) {
      violations.push(
        `checkpoint ${cp}: gate em ${gate.file} é "approved", mas há ${openBlocking.length} finding(s) bloqueante(s) (critical/high) ainda \`open\`: ${openBlocking
          .map((f) => f.id)
          .join(", ")}. Resolva/aceite/dismisse antes de aprovar.`
      );
    }

    byCheckpoint.push({
      checkpoint: cp,
      reviewDecisions: reviews.map((r) => ({ role: r.role, actor: r.actor, decision: r.decision })),
      openByseverity,
      openBlocking,
      totalOpen,
      totalResolved,
      ...(gate ? { gate } : {}),
    });
  }

  return { byCheckpoint, violations };
}

function discover(repoRoot: string): { artifacts: SpecArtifacts; errors: string[] } {
  const reviews: ReviewArtifact[] = [];
  const gates: GateArtifact[] = [];
  const errors: string[] = [];
  for (const rootRel of SPEC_ROOTS) {
    const root = path.join(repoRoot, rootRel);
    if (!fs.existsSync(root)) continue;
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const specDir = path.join(root, entry.name);
      for (const file of listYml(path.join(specDir, "reviews"))) {
        try {
          reviews.push(parseReview(fs.readFileSync(file, "utf-8"), path.relative(repoRoot, file)));
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
    }
  }
  return { artifacts: { reviews, gates }, errors };
}

export function main(repoRoot: string, logger: Logger = defaultLogger): number {
  const { artifacts, errors } = discover(repoRoot);

  if (errors.length > 0) {
    logger.error(`❌ review:check — ${errors.length} erro(s) de schema em artefatos de revisão:`);
    for (const e of errors) logger.error(`  - ${e}`);
    return 1;
  }

  if (artifacts.reviews.length === 0 && artifacts.gates.length === 0) {
    logger.info(`ℹ review:check — nenhum artefato de revisão (reviews/ ou gates/). Estado válido.`);
    return 0;
  }

  const { byCheckpoint, violations } = consolidate(artifacts);

  // Projeção consolidada (vira o status mínimo do PR).
  for (const c of byCheckpoint) {
    const decs =
      c.reviewDecisions.map((d) => `${d.role}=${d.decision}`).join(" · ") || "(sem reviews)";
    const gate = c.gate ? c.gate.decision : "pending";
    logger.info(
      `• checkpoint ${c.checkpoint}: reviews [${decs}] · findings ${c.totalOpen} open / ${c.totalResolved} resolved · gate ${gate}`
    );
  }

  if (violations.length > 0) {
    logger.error(`\n❌ review:check FALHOU — ${violations.length} violação(ões):`);
    for (const v of violations) logger.error(`  - ${v}`);
    return 1;
  }

  logger.info(
    `✅ review:check — ${artifacts.reviews.length} review(s) + ${artifacts.gates.length} gate(s); schema ok; nenhum gate aprovado com bloqueante aberto.`
  );
  return 0;
}
