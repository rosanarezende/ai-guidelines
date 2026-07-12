/**
 * CLI do graph snapshot derivado (PR #46): ORQUESTRA leitura/escrita/comparação.
 * A derivação é pura em `src/app/projections/governanceGraphSnapshot.ts`
 * (contrato §8 da matriz de lentes). Espelha o par build/check do
 * `governed-work-map`. Offline por construção: só filesystem local.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { parse as parseYaml } from "yaml";
import { parseWorkflowState } from "../infrastructure/yaml/workflowStateSerializer.js";
import {
  deriveGovernanceGraphSnapshot,
  type GovernanceGraphInput,
  type GraphSourceFile,
  type GovernanceGraphSnapshot,
} from "../app/projections/governanceGraphSnapshot.js";
import { discover } from "./reviewCheck.js";

interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

const defaultLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

const SPEC_DIR = "0024-context-architecture";
const SPEC_REL = `.governance/specs/${SPEC_DIR}`;
const SNAPSHOT_REL = `${SPEC_REL}/assets/governance-graph-snapshot.json`;
const ADRS_REL = ".core/governance/adrs";
const CONSTRAINTS_REL = ".core/constraints/constraints.yml";
const INSIGHTS_REL = ".governance/runtime/insights";
const ACTIVE_SPECS_REL = ".governance/runtime/specs/active.yml";

function toPosix(p: string): string {
  return p.replace(/\\/g, "/");
}

/** Coletor de fontes: todo path referenciado por um nó entra aqui (source_ref). */
class SourceFiles {
  private readonly files = new Map<string, string>();
  constructor(private readonly repoRoot: string) {}
  read(rel: string): string {
    const posix = toPosix(rel);
    const cached = this.files.get(posix);
    if (cached !== undefined) return cached;
    const content = fs.readFileSync(path.join(this.repoRoot, posix), "utf-8");
    this.files.set(posix, content);
    return content;
  }
  list(): GraphSourceFile[] {
    return [...this.files.entries()].map(([p, content]) => ({ path: p, content }));
  }
}

function frontmatterField(text: string, key: string): string | undefined {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!match) return undefined;
  const fieldMatch = new RegExp(`^${key}:\\s*(.+)$`, "m").exec(match[1]);
  return fieldMatch?.[1]?.trim().replace(/^["']|["']$/g, "");
}

export function collectGovernanceGraphInput(repoRoot: string): GovernanceGraphInput {
  const sources = new SourceFiles(repoRoot);
  const statePath = `${SPEC_REL}/state.yml`;
  const tasksPath = `${SPEC_REL}/tasks.md`;
  const decisionBriefPath = `${SPEC_REL}/decision-brief.md`;

  const stateText = sources.read(statePath);
  const tasksMd = sources.read(tasksPath);
  const decisionBriefMd = sources.read(decisionBriefPath);
  const state = parseWorkflowState(stateText);

  // reviews/resolutions/events/gates: leitores canônicos, filtrados a este trabalho.
  const { artifacts } = discover(repoRoot);
  const inSpec = (file: string): boolean => toPosix(file).startsWith(`${SPEC_REL}/`);
  const readArtifact = (file: string): string => sources.read(toPosix(file));

  const reviews = artifacts.reviews
    .filter((r) => inSpec(r.file))
    .map((r) => {
      readArtifact(r.file);
      return {
        checkpoint: r.checkpoint,
        role: r.role,
        decision: r.decision,
        path: toPosix(r.file),
        findings: r.findings.map((f) => ({
          id: f.id,
          severity: f.severity,
          disposition: f.disposition,
        })),
      };
    });
  const resolutions = artifacts.resolutions
    .filter((r) => inSpec(r.file))
    .map((r) => {
      readArtifact(r.file);
      return {
        checkpoint: r.checkpoint,
        path: toPosix(r.file),
        resolves: r.resolutions.map((res) => res.finding),
      };
    });
  const events = artifacts.reviewEvents
    .filter((e) => inSpec(e.file))
    .map((e) => {
      readArtifact(e.file);
      return {
        checkpoint: e.checkpoint,
        role: e.role,
        eventId: e.eventId,
        kind: e.kind,
        decision: e.decision,
        scope: e.scope ?? "findings",
        verifies: e.verifies,
        path: toPosix(e.file),
      };
    });
  const gates = artifacts.gates
    .filter((g) => inSpec(g.file))
    .map((g) => {
      readArtifact(g.file);
      return { checkpoint: g.checkpoint, decision: g.decision, path: toPosix(g.file) };
    });

  // insights (PIT) — ledger runtime particionado por status.
  const insights: { id: string; status: string; path: string }[] = [];
  const insightsDir = path.join(repoRoot, INSIGHTS_REL);
  if (fs.existsSync(insightsDir)) {
    for (const entry of fs.readdirSync(insightsDir).sort()) {
      if (!entry.endsWith(".yml")) continue;
      const rel = `${INSIGHTS_REL}/${entry}`;
      const doc = parseYaml(sources.read(rel)) as {
        insights?: ReadonlyArray<{ id?: unknown; status?: unknown }>;
      } | null;
      for (const item of doc?.insights ?? []) {
        if (typeof item.id === "string") {
          insights.push({
            id: item.id,
            status: typeof item.status === "string" ? item.status : "unknown",
            path: rel,
          });
        }
      }
    }
  }

  // adrs
  const adrs: { id: string; path: string }[] = [];
  const adrsDir = path.join(repoRoot, ADRS_REL);
  if (fs.existsSync(adrsDir)) {
    for (const entry of fs.readdirSync(adrsDir).sort()) {
      if (!entry.endsWith(".md")) continue;
      const rel = `${ADRS_REL}/${entry}`;
      sources.read(rel);
      adrs.push({ id: entry.replace(/\.md$/, ""), path: rel });
    }
  }

  // guardrails (GG) — constraints com origem guardrail.
  const guardrails: { id: string; path: string }[] = [];
  if (fs.existsSync(path.join(repoRoot, CONSTRAINTS_REL))) {
    const doc = parseYaml(sources.read(CONSTRAINTS_REL)) as {
      constraints?: ReadonlyArray<{ id?: unknown; origin?: { kind?: unknown } }>;
    } | null;
    for (const c of doc?.constraints ?? []) {
      if (typeof c.id === "string" && c.origin?.kind === "guardrail") {
        guardrails.push({ id: c.id, path: CONSTRAINTS_REL });
      }
    }
  }

  // research (com artifact-kind do frontmatter quando declarado)
  const research: { path: string; artifactKind?: string }[] = [];
  const researchDir = path.join(repoRoot, SPEC_REL, "research");
  if (fs.existsSync(researchDir)) {
    for (const entry of fs.readdirSync(researchDir).sort()) {
      if (!entry.endsWith(".md")) continue;
      const rel = `${SPEC_REL}/research/${entry}`;
      const kind = frontmatterField(sources.read(rel), "artifact-kind");
      research.push({ path: rel, ...(kind ? { artifactKind: kind } : {}) });
    }
  }

  // continuation packages (DEC-0024-G26/G27)
  const continuations: {
    slug: string;
    path: string;
    sourcePr: number | null;
    targetNodeId: string | null;
  }[] = [];
  const prsDir = path.join(repoRoot, SPEC_REL, "pull-requests");
  if (fs.existsSync(prsDir)) {
    for (const prEntry of fs.readdirSync(prsDir).sort()) {
      const contDir = path.join(prsDir, prEntry, "continuations");
      if (!fs.existsSync(contDir)) continue;
      for (const pkg of fs.readdirSync(contDir).sort()) {
        const manifestRel = `${SPEC_REL}/pull-requests/${prEntry}/continuations/${pkg}/manifest.yml`;
        if (!fs.existsSync(path.join(repoRoot, manifestRel))) continue;
        const doc = parseYaml(sources.read(manifestRel)) as {
          source?: { pr?: unknown };
          continuation?: { slug?: unknown; target?: unknown };
        } | null;
        continuations.push({
          slug: typeof doc?.continuation?.slug === "string" ? doc.continuation.slug : pkg,
          path: manifestRel,
          sourcePr: typeof doc?.source?.pr === "number" ? doc.source.pr : null,
          targetNodeId:
            typeof doc?.continuation?.target === "string" ? doc.continuation.target : null,
        });
      }
    }
  }

  // projeções conhecidas (derivadas; nunca SSOT). O próprio snapshot NÃO entra.
  const projections: { id: string; path: string }[] = [];
  for (const [id, rel] of [
    ["governed-work-map-data", `${SPEC_REL}/assets/governed-work-map-data.json`],
    ["governed-work-map", `${SPEC_REL}/assets/governed-work-map.html`],
    ["active-specs", ACTIVE_SPECS_REL],
  ] as const) {
    if (fs.existsSync(path.join(repoRoot, rel))) {
      sources.read(rel);
      projections.push({ id, path: rel });
    }
  }

  return {
    governedWork: {
      id: SPEC_DIR,
      legacySpecId: "0024",
      legacySpecSlug: "context-architecture",
      sourcePath: SPEC_REL,
      statePath,
      tasksPath,
      decisionBriefPath,
    },
    state,
    tasksMd,
    decisionBriefMd,
    reviews,
    resolutions,
    events,
    gates,
    insights,
    adrs,
    guardrails,
    research,
    continuations,
    projections,
    files: sources.list(),
  };
}

async function formatSnapshot(
  repoRoot: string,
  snapshot: GovernanceGraphSnapshot
): Promise<string> {
  const prettier = await import("prettier");
  const config = (await prettier.resolveConfig(path.join(repoRoot, SNAPSHOT_REL))) ?? {};
  return prettier.format(`${JSON.stringify(snapshot, null, 2)}\n`, { ...config, parser: "json" });
}

export async function runBuild(repoRoot: string, logger: Logger = defaultLogger): Promise<number> {
  const snapshot = deriveGovernanceGraphSnapshot(collectGovernanceGraphInput(repoRoot));
  const abs = path.join(repoRoot, SNAPSHOT_REL);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, await formatSnapshot(repoRoot, snapshot));
  logger.info(
    `✅ governance-graph:build — ${SNAPSHOT_REL} regenerado (${snapshot.nodes.length} nós · ${snapshot.edges.length} arestas · fp ${snapshot.snapshot_fingerprint}).`
  );
  return 0;
}

export async function runCheck(repoRoot: string, logger: Logger = defaultLogger): Promise<number> {
  const snapshot = deriveGovernanceGraphSnapshot(collectGovernanceGraphInput(repoRoot));
  const expected = await formatSnapshot(repoRoot, snapshot);
  const abs = path.join(repoRoot, SNAPSHOT_REL);
  const current = fs.existsSync(abs) ? fs.readFileSync(abs, "utf-8") : "";
  if (current === expected) {
    logger.info(
      `✅ governance-graph:check — snapshot derivado sincronizado (${snapshot.nodes.length} nós · ${snapshot.edges.length} arestas · fp ${snapshot.snapshot_fingerprint}).`
    );
    return 0;
  }
  logger.error(`❌ governance-graph:check — ${SNAPSHOT_REL} está stale em relação às fontes.`);
  logger.error("   Rode: npm run governance-graph:build");
  return 1;
}

export function main(
  args: readonly string[],
  repoRoot: string,
  logger: Logger = defaultLogger
): Promise<number> {
  const subcommand = args[0];
  if (subcommand === "build") return runBuild(repoRoot, logger);
  if (subcommand === "check") return runCheck(repoRoot, logger);
  logger.error("Usage: governance-graph <build|check>");
  return Promise.resolve(2);
}
