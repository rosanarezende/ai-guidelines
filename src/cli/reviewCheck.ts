/**
 * CLI entrypoint para o gate `review:check` — "revisão-como-artefato" (Spec 0024
 * Checkpoint 2.4/2.4a). Torna artefatos de governança load-bearing em vez de
 * comentários de PR (memória volátil). Determinístico, sem rede.
 *
 *   1. Descobre reviews/resolutions/gates sob `.governance/specs/<spec>/{reviews,gates}/`;
 *   2. valida schema + integridade (fingerprint da claim; findings_emitted+contiguidade);
 *   3. DERIVA o consolidado por checkpoint (nunca arquivo à mão);
 *   4. ENFORCA: gate `approved` ⟹ zero finding bloqueante (critical/high) com
 *      `disposition: open`. O gate lê `disposition` (reviewer-owned) — a resolução
 *      do implementador NÃO destrava (anti-autoaprovação estrutural);
 *   5. resolução órfã (aponta finding inexistente) → violação;
 *   6. imprime o consolidado (projeção mínima do PR).
 *
 * Exit codes: 0 ok · 1 violação/erro de schema · 2 uso inválido (no bin).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import {
  parseReview,
  parseResolutions,
  parseGate,
  ReviewArtifact,
  ResolutionArtifact,
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
  readonly resolutions: readonly ResolutionArtifact[];
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
  readonly reviewDecisions: ReadonlyArray<{ role: string; decision: string }>;
  readonly openBlocking: readonly Finding[];
  readonly totalOpen: number;
  readonly totalClosed: number;
  readonly gate?: GateArtifact;
}

/** Pure: consolida por checkpoint e detecta violações. */
export function consolidate(artifacts: SpecArtifacts): {
  byCheckpoint: ConsolidatedCheckpoint[];
  violations: string[];
} {
  const checkpoints = new Set<string>();
  for (const r of artifacts.reviews) checkpoints.add(r.checkpoint);
  for (const r of artifacts.resolutions) checkpoints.add(r.checkpoint);
  for (const g of artifacts.gates) checkpoints.add(g.checkpoint);

  const violations: string[] = [];
  const byCheckpoint: ConsolidatedCheckpoint[] = [];

  for (const cp of [...checkpoints].sort()) {
    const reviews = artifacts.reviews.filter((r) => r.checkpoint === cp);

    const byRole = new Map<string, ReviewArtifact>();
    for (const r of reviews) {
      if (byRole.has(r.role)) {
        violations.push(
          `checkpoint ${cp}: múltiplos arquivos de review para role "${r.role}" (${byRole.get(r.role)!.file}, ${r.file}). 1 arquivo por (checkpoint, role).`
        );
      }
      byRole.set(r.role, r);
    }

    const findingIds = new Set<string>();
    const openBlocking: Finding[] = [];
    let totalOpen = 0;
    let totalClosed = 0;
    for (const r of reviews) {
      for (const f of r.findings) {
        findingIds.add(`${r.role}#${f.id}`);
        if (f.disposition === "open") {
          totalOpen++;
          if ((BLOCKING_SEVERITIES as readonly string[]).includes(f.severity)) openBlocking.push(f);
        } else {
          totalClosed++;
        }
      }
    }

    // Resolução órfã: o id DEVE ser totalmente qualificado (`<role>#<F-id>`) e
    // bater EXATAMENTE com um finding (sem `endsWith` — evita colisão cross-role:
    // `architectural_review#F1` ≠ `technical_audit#F1`). 2.4c.
    for (const res of artifacts.resolutions.filter((r) => r.checkpoint === cp)) {
      for (const r of res.resolutions) {
        if (!findingIds.has(r.finding)) {
          const hint = r.finding.includes("#")
            ? "inexistente nas reviews"
            : `não-qualificado — use "<role>#${r.finding}" (ex.: technical_audit#${r.finding})`;
          violations.push(
            `checkpoint ${cp}: resolução em ${res.file} aponta para finding "${r.finding}" ${hint}.`
          );
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

    // ENFORCEMENT: gate approved ⟹ nenhum bloqueante com disposition: open.
    if (gate && gate.decision === "approved" && openBlocking.length > 0) {
      violations.push(
        `checkpoint ${cp}: gate em ${gate.file} é "approved", mas há ${openBlocking.length} finding(s) bloqueante(s) (critical/high) com disposition: open: ${openBlocking
          .map((f) => f.id)
          .join(
            ", "
          )}. Só o reviewer fecha (accepted/dismissed) — resolução do implementador não destrava.`
      );
    }

    byCheckpoint.push({
      checkpoint: cp,
      reviewDecisions: reviews.map((r) => ({ role: r.role, decision: r.decision })),
      openBlocking,
      totalOpen,
      totalClosed,
      ...(gate ? { gate } : {}),
    });
  }

  return { byCheckpoint, violations };
}

function discover(repoRoot: string): { artifacts: SpecArtifacts; errors: string[] } {
  const reviews: ReviewArtifact[] = [];
  const resolutions: ResolutionArtifact[] = [];
  const gates: GateArtifact[] = [];
  const errors: string[] = [];
  for (const rootRel of SPEC_ROOTS) {
    const root = path.join(repoRoot, rootRel);
    if (!fs.existsSync(root)) continue;
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const specDir = path.join(root, entry.name);
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
    }
  }
  return { artifacts: { reviews, resolutions, gates }, errors };
}

export function main(repoRoot: string, logger: Logger = defaultLogger): number {
  const { artifacts, errors } = discover(repoRoot);

  if (errors.length > 0) {
    logger.error(`❌ review:check — ${errors.length} erro(s) de schema/integridade:`);
    for (const e of errors) logger.error(`  - ${e}`);
    return 1;
  }

  if (
    artifacts.reviews.length === 0 &&
    artifacts.resolutions.length === 0 &&
    artifacts.gates.length === 0
  ) {
    logger.info(`ℹ review:check — nenhum artefato de revisão. Estado válido.`);
    return 0;
  }

  const { byCheckpoint, violations } = consolidate(artifacts);

  for (const c of byCheckpoint) {
    const decs =
      c.reviewDecisions.map((d) => `${d.role}=${d.decision}`).join(" · ") || "(sem reviews)";
    const gate = c.gate ? c.gate.decision : "pending";
    logger.info(
      `• checkpoint ${c.checkpoint}: reviews [${decs}] · findings ${c.totalOpen} open / ${c.totalClosed} closed · gate ${gate}`
    );
  }

  if (violations.length > 0) {
    logger.error(`\n❌ review:check FALHOU — ${violations.length} violação(ões):`);
    for (const v of violations) logger.error(`  - ${v}`);
    return 1;
  }

  logger.info(
    `✅ review:check — ${artifacts.reviews.length} review(s) + ${artifacts.resolutions.length} resolução(ões) + ${artifacts.gates.length} gate(s); integridade ok; nenhum gate aprovado com bloqueante aberto.`
  );
  return 0;
}
