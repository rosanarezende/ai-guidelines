/**
 * Comando `handoff` — bootstrap situado de sessão IA (ADR 0022; CO-4).
 *
 * Pipeline cravado no checkpoint-co-projection:
 *   collect (este arquivo: fs/git/gh) → deriveHandoff (handoffFacts.ts, PURO)
 *   → render (este arquivo) → stdout (superfície primária; nada persistido).
 *
 * Contratos:
 *   - zero LLM no runtime (ADR 0018); geração determinística;
 *   - fallback NUNCA silencioso; projeção divergente NUNCA apresentada como
 *     íntegra (dogfood CO-4, 2026-06-11);
 *   - GitHub indisponível NÃO impede a geração: fonte remota vira
 *     degraded/unavailable, confiança degrada explicitamente, nada de estado
 *     remoto inventado;
 *   - `state.next[]` aparece como narrativa derivada — nunca é fonte da
 *     próxima ação (deriveNextAction decide só por fatos).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { parseActiveSpecs } from "../infrastructure/yaml/activeSpecsSerializer.js";
import { parseWorkflowState } from "../infrastructure/yaml/workflowStateSerializer.js";
import { parseInsightsLedger } from "../infrastructure/yaml/insightsLedgerSerializer.js";
import { ActiveSpecEntry } from "../domain/workflow/ActiveSpecEntry.js";
import { PrTopologyNode, WorkflowState } from "../domain/workflow/WorkflowState.js";
import { parseSpecBranch } from "../app/workflow/DetectActiveSpec.js";
import { consolidate, discover, observedReviewStates } from "./reviewCheck.js";
import { GhSnapshotCollector, detectRepo } from "./prReadyCheck.js";
import { buildReviewTypeRegistry, deriveEffectiveReviewStatuses } from "./reviewRequirements.js";
import { collectFunctionalFreshness } from "./reviewFreshness.js";
import {
  HANDOFF_CONTRACT_VERSION,
  HandoffDerived,
  HandoffFacts,
  HandoffGitFact,
  HandoffInsightFact,
  HandoffLifecycleFact,
  HandoffNodeFact,
  HandoffPrFact,
  HandoffReviewStatusFact,
  HandoffSourceFact,
  RepositoryContractFact,
  deriveHandoff,
  fingerprintSource,
  parseCheckpointTasks,
  parseSubCheckpoints,
} from "./handoffFacts.js";
import {
  extractAiGuidelinesBlock,
  parsePackageIdentity,
  parseRulesContract,
} from "./handoffContract.js";
import { HandoffLoadReceipt, createLoadReceipt, writeReceipt } from "./handoffReceipt.js";

/** Coletor da fonte remota (PR). Lança em falha; `null` = coleta não habilitada. */
export type RemotePrCollector = (prNumber: number, repoRoot: string) => HandoffPrFact;

export interface HandoffOptions {
  readonly identifier?: string;
  readonly hybrid?: boolean;
  /**
   * Fonte remota: `undefined`/`null` = não coletar (fonte declarada
   * unavailable — default hermético para chamadas programáticas/testes);
   * o `main` da CLI injeta `ghRemotePrCollector`.
   */
  readonly remote?: RemotePrCollector | null;
}

export interface HandoffResult {
  readonly text: string;
}

interface ResolvedSpec {
  readonly specPath: string;
  readonly label: string;
}

/**
 * Projeção `specs/active.yml` com a distinção que o consumo exige: arquivo
 * ausente, ilegível e entry inexistente são estados DIFERENTES — colapsá-los
 * em `[]` foi o que permitiu fallback silencioso (dogfood CO-4, 2026-06-11).
 */
interface ProjectionIndex {
  readonly exists: boolean;
  readonly entries: readonly ActiveSpecEntry[];
  readonly rawText: string | null;
  readonly parseError?: string;
}

const RECONCILE_COMMAND =
  "npm run guidelines -- workflow publish-state --status=<status> --updated-by=<@autor>";

const AUTHORITY_FILES = [
  "AGENTS.md",
  ".core/governance/script-contracts.yml",
  ".core/rules/catalog.md",
  ".core/rules/_meta/rules.json",
  ".governance/runtime/specs/active.yml",
];

// Apenas superfícies VIVAS da spec — nunca arquivos datados de research/
// (handoffs datados são registro histórico; apontá-los aqui já produziu
// retomada guiada por estado de 3 nós atrás — PIT-0010/PIT-0011).
const SITUATED_FILES = ["state.yml", "plan.md", "tasks.md", "knowledge-backfill.yml"];

function readIfExists(repoRoot: string, relativePath: string): string | null {
  const absolutePath = path.join(repoRoot, relativePath);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, "utf8") : null;
}

function git(repoRoot: string, args: readonly string[]): string | null {
  try {
    return execFileSync("git", args, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function listSpecDirs(repoRoot: string): readonly string[] {
  const base = path.join(repoRoot, ".governance", "specs");
  if (!fs.existsSync(base)) return [];
  return fs
    .readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d{4}-/.test(entry.name))
    .map((entry) => `.governance/specs/${entry.name}`)
    .sort();
}

function loadProjection(repoRoot: string): ProjectionIndex {
  const text = readIfExists(repoRoot, ".governance/runtime/specs/active.yml");
  if (text === null) return { exists: false, entries: [], rawText: null };
  try {
    return { exists: true, entries: parseActiveSpecs(text).activeSpecs, rawText: text };
  } catch (error) {
    return {
      exists: true,
      entries: [],
      rawText: text,
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
}

function entryMatches(entry: ActiveSpecEntry, identifier: string): boolean {
  return (
    entry.id === identifier ||
    entry.slug === identifier ||
    `${entry.id}-${entry.slug}` === identifier
  );
}

/**
 * Resolução canônica primeiro (diretório `NNNN-*` em `.governance/specs/`),
 * projeção depois. Projection layer ≠ primary resolver de identity
 * ([DEC-0023-I01]); a ordem invertida (projeção primeiro) foi o que mascarou
 * o branch stale do active.yml no dogfood CO-4.
 */
function resolveByIdentifier(
  repoRoot: string,
  projection: ProjectionIndex,
  identifier: string
): ResolvedSpec | null {
  const byDir = listSpecDirs(repoRoot).find((specPath) => {
    const name = path.basename(specPath);
    return name === identifier || name.startsWith(`${identifier}-`);
  });
  if (byDir) return { specPath: byDir, label: path.basename(byDir) };

  const fromIndex = projection.entries.find((entry) => entryMatches(entry, identifier));
  return fromIndex
    ? { specPath: fromIndex.specPath, label: `${fromIndex.id}-${fromIndex.slug}` }
    : null;
}

interface CurrentResolution {
  readonly resolved: ResolvedSpec | null;
  /** Como a spec foi encontrada — fallbacks não-canônicos geram aviso no output. */
  readonly via: "canonical-branch" | "projection-branch" | "single-dir" | "none";
}

function resolveCurrent(
  repoRoot: string,
  projection: ProjectionIndex,
  branch: string | null
): CurrentResolution {
  const parsed = parseSpecBranch(branch);
  if (parsed) {
    const resolved = resolveByIdentifier(repoRoot, projection, parsed.specId);
    if (resolved) return { resolved, via: "canonical-branch" };
  }

  const indexed = projection.entries.find((entry) => entry.branch === branch);
  if (indexed) {
    return {
      resolved: { specPath: indexed.specPath, label: `${indexed.id}-${indexed.slug}` },
      via: "projection-branch",
    };
  }

  const dirs = listSpecDirs(repoRoot);
  if (dirs.length === 1) {
    return {
      resolved: { specPath: dirs[0], label: path.basename(dirs[0]) },
      via: "single-dir",
    };
  }
  return { resolved: null, via: "none" };
}

function readState(repoRoot: string, specPath: string): WorkflowState {
  const statePath = path.join(specPath, "state.yml");
  const text = readIfExists(repoRoot, statePath);
  if (!text) throw new Error(`state.yml ausente em ${specPath}.`);
  return parseWorkflowState(text);
}

function activeTopologyNode(state: WorkflowState): PrTopologyNode | null {
  const cursor = state.topology?.cursor;
  if (!cursor || !state.topology) return null;
  return (
    state.topology.prs.active.find(
      (node) => node.id === cursor.pr && node.checkpoints.includes(cursor.checkpoint)
    ) ?? null
  );
}

function nextPlannedNode(state: WorkflowState): PrTopologyNode | null {
  const planned = state.topology?.prs.planned ?? [];
  const sequenced = planned
    .filter((node) => node.sequence !== null)
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  return sequenced[0] ?? planned[0] ?? null;
}

function existingFiles(repoRoot: string, files: readonly string[]): readonly string[] {
  return files.filter((file) => fs.existsSync(path.join(repoRoot, file)));
}

function renderList(items: readonly string[], empty = "(nenhum)"): string {
  return items.length === 0 ? `- ${empty}` : items.map((item) => `- ${item}`).join("\n");
}

/**
 * Diagnóstico da projeção no ponto de consumo: compara a entry do
 * `specs/active.yml` com os fatos disponíveis. NUNCA bloqueia o handoff
 * (disponibilidade preservada), mas degradação de confiança vira aviso
 * explícito — fallback silencioso é a classe de erro que este código
 * existe para eliminar (dogfood CO-4, 2026-06-11).
 */
function projectionDiagnostics(
  projection: ProjectionIndex,
  resolved: ResolvedSpec,
  via: CurrentResolution["via"] | "identifier",
  branch: string | null
): { statusLine: string; warnings: string[] } {
  const warnings: string[] = [];

  if (via === "projection-branch") {
    warnings.push(
      "Spec resolvida pela PROJEÇÃO (match de branch em specs/active.yml), não pela " +
        "detecção canônica por id de branch — o branch corrente não segue o padrão " +
        "feat/spec-NNNN-*. Verifique se este é o branch certo para a spec."
    );
  }
  if (via === "single-dir") {
    warnings.push(
      "Spec resolvida por fallback de diretório único (.governance/specs/) — nem o branch " +
        "corrente nem a projeção identificam a spec. Confirme a spec antes de confiar."
    );
  }

  if (!projection.exists) {
    return {
      statusLine: "ausente (arquivo nao existe; handoff derivado por deteccao canonica)",
      warnings: [
        ...warnings,
        `Projeção specs/active.yml AUSENTE. O handoff foi derivado das fontes canônicas ` +
          `(diretório da spec + git), mas a projeção precisa ser publicada: ${RECONCILE_COMMAND}.`,
      ],
    };
  }
  if (projection.parseError) {
    return {
      statusLine: "ilegivel (parse falhou)",
      warnings: [
        ...warnings,
        `Projeção specs/active.yml ILEGÍVEL (${projection.parseError}). ` +
          `Reconcilie com: ${RECONCILE_COMMAND}.`,
      ],
    };
  }

  const specId = /^(\d{4})/.exec(resolved.label)?.[1];
  const entry = specId ? projection.entries.find((e) => e.id === specId) : undefined;
  if (!entry) {
    return {
      statusLine: "sem entry para esta spec",
      warnings: [
        ...warnings,
        `Spec ${resolved.label} não tem entry na projeção specs/active.yml. ` +
          `Publique com: ${RECONCILE_COMMAND}.`,
      ],
    };
  }

  const parsedBranch = parseSpecBranch(branch);
  if (parsedBranch && parsedBranch.specId === entry.id && entry.branch !== branch) {
    return {
      statusLine: `DIVERGENTE (projeta branch "${entry.branch}"; fato: "${branch}")`,
      warnings: [
        ...warnings,
        `Branch projetada STALE: specs/active.yml diz "${entry.branch}" (fonte: projeção), ` +
          `mas o branch factual é "${branch}" (fonte: git). Este handoff NÃO deve ser tratado ` +
          `como confiável até a projeção ser reconciliada: ${RECONCILE_COMMAND}.`,
      ],
    };
  }

  return { statusLine: "fiel aos fatos observaveis", warnings };
}

// ── Coleta de fatos (I/O) ────────────────────────────────────────────────────

function collectGitFacts(repoRoot: string): HandoffGitFact {
  const branch = git(repoRoot, ["branch", "--show-current"]);
  const head = git(repoRoot, ["rev-parse", "--short", "HEAD"]);
  const porcelain = git(repoRoot, ["status", "--porcelain"]);
  const upstream = git(repoRoot, ["rev-parse", "--abbrev-ref", "@{upstream}"]);
  let ahead: number | null = null;
  let behind: number | null = null;
  if (upstream) {
    const counts = git(repoRoot, ["rev-list", "--left-right", "--count", "HEAD...@{upstream}"]);
    const match = counts ? /^(\d+)\s+(\d+)$/.exec(counts) : null;
    if (match) {
      ahead = Number(match[1]);
      behind = Number(match[2]);
    }
  }
  return {
    branch: branch || null,
    head: head || null,
    workingTreeClean: porcelain === null ? null : porcelain === "",
    ahead,
    behind,
    upstream: upstream || null,
  };
}

/** Coletor remoto real: gh via prReadyCheck (mesmo gateway do pr-ready:check). */
export function ghRemotePrCollector(prNumber: number, repoRoot: string): HandoffPrFact {
  const snapshot = new GhSnapshotCollector().collect(prNumber, detectRepo(), repoRoot);
  const buckets = { pass: 0, fail: 0, pending: 0 };
  for (const check of snapshot.checks) {
    if (check.bucket === "pass") buckets.pass++;
    else if (check.bucket === "fail") buckets.fail++;
    else if (check.bucket === "pending") buckets.pending++;
  }
  return {
    number: snapshot.pr.number,
    state: snapshot.pr.state,
    isDraft: snapshot.pr.isDraft,
    baseRefName: snapshot.pr.baseRefName ?? "(desconhecida)",
    headRefName: snapshot.pr.headRefName,
    headRefOid: snapshot.pr.headRefOid,
    checks: buckets,
    bodyReadyReasons: snapshot.readyBodyContractReasons,
    labels: snapshot.pr.labels,
  };
}

function normalizeCheckpoint(slug: string): string {
  return slug.replace(/^checkpoint-/, "");
}

function collectLifecycle(
  repoRoot: string,
  cursor: { pr: string; checkpoint: string },
  specPath: string,
  prLabels: readonly string[] | null
): { lifecycle: HandoffLifecycleFact; fingerprint: string; errors: string[] } {
  const { artifacts, errors } = discover(repoRoot);
  const { byCheckpoint } = consolidate(artifacts);
  const entry = byCheckpoint.find(
    (cp) => normalizeCheckpoint(cp.checkpoint) === normalizeCheckpoint(cursor.checkpoint)
  );
  const resolutions = artifacts.resolutions
    .filter((r) => normalizeCheckpoint(r.checkpoint) === normalizeCheckpoint(cursor.checkpoint))
    .reduce((sum, r) => sum + r.resolutions.length, 0);

  // Status efetivo por tipo do catálogo (CO-4, rodada 8): aplicabilidade +
  // requisito + estado/freshness. Labels vêm do PR quando observadas; changed
  // paths não são derivados aqui (regras dependentes ficam `unknown`).
  const nodeCtx =
    artifacts.topologyByCheckpoint?.[cursor.checkpoint] ??
    artifacts.topologyByCheckpoint?.[normalizeCheckpoint(cursor.checkpoint)];
  const freshness = collectFunctionalFreshness(repoRoot, `${specPath}/reviews`);
  const statuses = deriveEffectiveReviewStatuses({
    registry: artifacts.registry ?? buildReviewTypeRegistry(null).registry,
    policy: artifacts.reviewPolicy ?? null,
    ctx: {
      prProfile: nodeCtx?.nodeRole ?? null,
      labels: prLabels,
      changedPaths: null,
    },
    ...(nodeCtx?.overrides ? { nodeOverrides: nodeCtx.overrides } : {}),
    observed: observedReviewStates(artifacts, cursor.checkpoint),
    functionalHead: freshness.effectiveFunctionalHead,
  });
  for (const s of statuses) for (const e of s.errors) errors.push(e);
  const reviewStatuses: HandoffReviewStatusFact[] = statuses.map((s) => ({
    typeId: s.typeId,
    applicability: s.applicability,
    requirement: s.requirement,
    state: s.state,
    decision: s.decision,
    blocking: s.blocking,
    source: s.requirementSource,
  }));

  const lifecycle: HandoffLifecycleFact = {
    reviewDecisions: entry?.reviewDecisions ?? [],
    requiredReviewRoles: reviewStatuses
      .filter((s) => s.requirement === "required")
      .map((s) => s.typeId),
    reviewStatuses,
    openFindings: entry?.totalOpen ?? 0,
    openBlocking: entry?.openBlocking.length ?? 0,
    closedFindings: entry?.totalClosed ?? 0,
    resolutions,
    gateDecision: entry?.gate?.decision ?? null,
  };
  return { lifecycle, fingerprint: fingerprintSource(JSON.stringify(lifecycle)), errors };
}

function collectInsights(
  repoRoot: string,
  specId: string | undefined,
  cursorCheckpoint: string | null
): { insights: HandoffInsightFact[]; source: HandoffSourceFact } {
  const origin = ".governance/runtime/insights/open.yml";
  const text = readIfExists(repoRoot, origin);
  if (text === null) {
    return {
      insights: [],
      source: {
        id: "insights",
        origin,
        status: "degraded",
        fingerprint: "-",
        detail: "arquivo ausente",
      },
    };
  }
  try {
    const ledger = parseInsightsLedger(text);
    const insights: HandoffInsightFact[] = [];
    for (const insight of ledger.all()) {
      if (insight.status !== "open") continue;
      // Relevância SITUADA: ocorrência no checkpoint do cursor (não a spec
      // inteira — 9 PITs da spec seriam ruído, não contexto do momento).
      const relevant = insight.occurrences.some((occ) =>
        cursorCheckpoint !== null
          ? occ.origin.cursor === cursorCheckpoint
          : specId !== undefined && occ.origin.spec === specId
      );
      if (!relevant) continue;
      const excerpt = insight.text.length > 110 ? `${insight.text.slice(0, 110)}…` : insight.text;
      insights.push({ id: insight.id, excerpt });
    }
    return {
      insights,
      source: { id: "insights", origin, status: "fresh", fingerprint: fingerprintSource(text) },
    };
  } catch (error) {
    return {
      insights: [],
      source: {
        id: "insights",
        origin,
        status: "degraded",
        fingerprint: fingerprintSource(text),
        detail: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/** Fontes do contrato global — referenciadas pela guarda de carga e pelo render. */
const BOOTSTRAP_SOURCE = "AGENTS.md";
const RULES_SOURCE = ".core/rules/_meta/rules.json";
const RULES_CATALOG_POINTER = ".core/rules/catalog.md";
const SCRIPT_CONTRACT_SOURCE = ".core/governance/script-contracts.yml";
const SSOT_SPECS_DIR = ".governance/specs";

/** Ids de fonte cuja ausência impede recibo FRESH (contrato obrigatório). */
export const MANDATORY_CONTRACT_SOURCES = ["runtime-bootstrap", "rules-contract"] as const;

interface CollectedContract {
  readonly contract: RepositoryContractFact | null;
  readonly sources: HandoffSourceFact[];
  readonly driftWarnings: string[];
}

/**
 * Coleta a camada de identidade + contrato global (package.json, bloco
 * `<AI_GUIDELINES>`, rules.json, script-contracts.yml). Cada fonte declara
 * frescor/fingerprint SEMÂNTICO; ausência do bootstrap ou do catálogo
 * obrigatório vira drift (reconciliar antes de confiar) e bloqueia recibo
 * fresh. Nenhuma regra é inventada: tudo vem das fontes governadas.
 */
function collectContract(repoRoot: string): CollectedContract {
  const sources: HandoffSourceFact[] = [];
  const driftWarnings: string[] = [];

  // Identidade (package.json) — genérica: vale para repositórios consumidores.
  const pkgText = readIfExists(repoRoot, "package.json");
  let identity: ReturnType<typeof parsePackageIdentity> | null = null;
  if (pkgText !== null) {
    try {
      identity = parsePackageIdentity(pkgText);
      sources.push({
        id: "repository-contract",
        origin: "package.json",
        status: "fresh",
        fingerprint: identity.fingerprint,
      });
    } catch (e) {
      sources.push({
        id: "repository-contract",
        origin: "package.json",
        status: "degraded",
        fingerprint: fingerprintSource(pkgText),
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  } else {
    sources.push({
      id: "repository-contract",
      origin: "package.json",
      status: "unavailable",
      fingerprint: "-",
      detail: "arquivo ausente",
    });
  }

  // Bootstrap obrigatório de agente (bloco compilado <AI_GUIDELINES>).
  const agentsText = readIfExists(repoRoot, BOOTSTRAP_SOURCE);
  const block = agentsText !== null ? extractAiGuidelinesBlock(agentsText) : null;
  if (block !== null) {
    sources.push({
      id: "runtime-bootstrap",
      origin: `${BOOTSTRAP_SOURCE} <AI_GUIDELINES>`,
      status: "fresh",
      fingerprint: fingerprintSource(block),
    });
  } else {
    sources.push({
      id: "runtime-bootstrap",
      origin: `${BOOTSTRAP_SOURCE} <AI_GUIDELINES>`,
      status: "unavailable",
      fingerprint: "-",
      detail: agentsText === null ? "AGENTS.md ausente" : "bloco <AI_GUIDELINES> ausente",
    });
    driftWarnings.push(
      "Bootstrap obrigatório de agente NÃO carregado (bloco <AI_GUIDELINES> ausente em " +
        "AGENTS.md). A sessão não recebeu o contrato de comportamento — reconcilie com: " +
        "npm run runtime-bootstrap:sync."
    );
  }

  // Catálogo machine-readable de regras (fingerprint semântico; sem generated_at).
  const rulesText = readIfExists(repoRoot, RULES_SOURCE);
  let mandatoryRules: RepositoryContractFact["mandatoryRules"] = [];
  if (rulesText !== null) {
    try {
      const parsed = parseRulesContract(rulesText, RULES_SOURCE);
      mandatoryRules = parsed.mandatoryRules;
      sources.push({
        id: "rules-contract",
        origin: RULES_SOURCE,
        status: "fresh",
        fingerprint: parsed.fingerprint,
      });
    } catch (e) {
      sources.push({
        id: "rules-contract",
        origin: RULES_SOURCE,
        status: "degraded",
        fingerprint: fingerprintSource(rulesText),
        detail: e instanceof Error ? e.message : String(e),
      });
      driftWarnings.push(
        `Catálogo obrigatório de regras ILEGÍVEL (${RULES_SOURCE}). Nenhuma regra foi ` +
          `inventada no lugar — reconcilie com: npm run build:rules.`
      );
    }
  } else {
    sources.push({
      id: "rules-contract",
      origin: RULES_SOURCE,
      status: "unavailable",
      fingerprint: "-",
      detail: "arquivo ausente",
    });
    driftWarnings.push(
      `Catálogo obrigatório de regras AUSENTE (${RULES_SOURCE}). A sessão não recebeu as ` +
        `regras globais — reconcilie com: npm run build:rules.`
    );
  }

  // Contrato operacional de scripts/hooks/workflows.
  const scriptText = readIfExists(repoRoot, SCRIPT_CONTRACT_SOURCE);
  sources.push(
    scriptText !== null
      ? {
          id: "script-contract",
          origin: SCRIPT_CONTRACT_SOURCE,
          status: "fresh",
          fingerprint: fingerprintSource(scriptText),
        }
      : {
          id: "script-contract",
          origin: SCRIPT_CONTRACT_SOURCE,
          status: "degraded",
          fingerprint: "-",
          detail: "arquivo ausente",
        }
  );

  const contract: RepositoryContractFact | null = identity
    ? {
        repositoryId: identity.repositoryId,
        repositoryKind: identity.repositoryKind,
        summary: identity.summary,
        ssotPath: fs.existsSync(path.join(repoRoot, SSOT_SPECS_DIR)) ? `${SSOT_SPECS_DIR}/` : null,
        bootstrapSource: `${BOOTSTRAP_SOURCE} <AI_GUIDELINES>`,
        rulesSource: RULES_SOURCE,
        rulesCatalogPointer: RULES_CATALOG_POINTER,
        scriptContractSource: SCRIPT_CONTRACT_SOURCE,
        mandatoryRules,
      }
    : null;

  return { contract, sources, driftWarnings };
}

export interface CollectedHandoff {
  readonly resolved: ResolvedSpec;
  readonly state: WorkflowState;
  readonly facts: HandoffFacts;
  readonly projectionStatusLine: string;
}

/**
 * Coleta TODOS os fatos (fs/git/gh) e devolve o `HandoffFacts` serializável.
 * Único ponto com I/O; a derivação (próxima ação, proibições, selo) é pura.
 */
export function collectHandoffFacts(
  repoRoot: string,
  options: HandoffOptions = {}
): CollectedHandoff {
  const projection = loadProjection(repoRoot);
  const gitFacts = collectGitFacts(repoRoot);

  let resolved: ResolvedSpec | null;
  let via: CurrentResolution["via"] | "identifier";
  if (options.identifier) {
    resolved = resolveByIdentifier(repoRoot, projection, options.identifier);
    via = "identifier";
  } else {
    const current = resolveCurrent(repoRoot, projection, gitFacts.branch);
    resolved = current.resolved;
    via = current.via;
  }
  if (!resolved) {
    throw new Error("Nao foi possivel resolver a spec para handoff.");
  }

  const diagnostics = projectionDiagnostics(projection, resolved, via, gitFacts.branch);
  const state = readState(repoRoot, resolved.specPath);
  const stateText = readIfExists(repoRoot, `${resolved.specPath}/state.yml`) ?? "";
  const node = activeTopologyNode(state);
  const cursor = state.topology?.cursor ?? null;
  const specId = /^(\d{4})/.exec(resolved.label)?.[1];

  // Camada 1+2: identidade + contrato global (bootstrap/regras/scripts).
  const contractCollected = collectContract(repoRoot);

  const sources: HandoffSourceFact[] = [...contractCollected.sources];
  sources.push({
    id: "state.yml",
    origin: `${resolved.specPath}/state.yml`,
    status: "fresh",
    fingerprint: fingerprintSource(stateText),
  });
  sources.push({
    id: "active.yml",
    origin: ".governance/runtime/specs/active.yml",
    status: diagnostics.warnings.length === 0 ? "fresh" : "degraded",
    fingerprint: projection.rawText === null ? "-" : fingerprintSource(projection.rawText),
    ...(diagnostics.warnings.length > 0 ? { detail: diagnostics.statusLine } : {}),
  });
  const gitAvailable = gitFacts.branch !== null || gitFacts.head !== null;
  sources.push({
    id: "git",
    origin: "git local",
    status: gitAvailable ? "fresh" : "unavailable",
    fingerprint: gitAvailable
      ? fingerprintSource(
          JSON.stringify([gitFacts.branch, gitFacts.head, gitFacts.workingTreeClean])
        )
      : "-",
    ...(gitAvailable ? {} : { detail: "git indisponível (não-repo ou erro)" }),
  });

  // Fonte remota (PR) — nunca inventar estado: falha vira unavailable.
  let pullRequest: HandoffPrFact | null = null;
  if (node?.github_pr) {
    if (options.remote) {
      try {
        pullRequest = options.remote(node.github_pr, repoRoot);
        sources.push({
          id: "pull-request",
          origin: `gh api (PR #${node.github_pr})`,
          status: "fresh",
          fingerprint: fingerprintSource(JSON.stringify(pullRequest)),
        });
      } catch (error) {
        sources.push({
          id: "pull-request",
          origin: `gh api (PR #${node.github_pr})`,
          status: "unavailable",
          fingerprint: "-",
          detail: error instanceof Error ? error.message.split("\n")[0] : String(error),
        });
      }
    } else {
      sources.push({
        id: "pull-request",
        origin: `gh api (PR #${node.github_pr})`,
        status: "unavailable",
        fingerprint: "-",
        detail: "coleta remota não habilitada nesta invocação",
      });
    }
  }

  // Lifecycle (reviews/resolutions/gates) — mesmo leitor do review:check.
  let lifecycle: HandoffLifecycleFact | null = null;
  if (cursor) {
    const collected = collectLifecycle(
      repoRoot,
      cursor,
      resolved.specPath,
      pullRequest ? pullRequest.labels : null
    );
    lifecycle = collected.lifecycle;
    sources.push({
      id: "reviews",
      origin: `${resolved.specPath}/{reviews,gates}/`,
      status: collected.errors.length === 0 ? "fresh" : "degraded",
      fingerprint: collected.fingerprint,
      ...(collected.errors.length > 0
        ? { detail: `${collected.errors.length} erro(s) de schema nos artefatos` }
        : {}),
    });
  }

  // Tasks do checkpoint.
  const tasksOrigin = `${resolved.specPath}/tasks.md`;
  const tasksText = readIfExists(repoRoot, tasksOrigin);
  const tasks = cursor && tasksText !== null ? parseCheckpointTasks(tasksText, cursor) : [];
  const subCheckpoints =
    cursor && tasksText !== null ? parseSubCheckpoints(tasksText, cursor.checkpoint) : [];
  sources.push({
    id: "tasks.md",
    origin: tasksOrigin,
    status: tasksText !== null ? "fresh" : "degraded",
    fingerprint: tasksText !== null ? fingerprintSource(tasksText) : "-",
    ...(tasksText !== null ? {} : { detail: "arquivo ausente" }),
  });

  const { insights, source: insightsSource } = collectInsights(
    repoRoot,
    specId,
    cursor?.checkpoint ?? null
  );
  sources.push(insightsSource);

  const activeNode: HandoffNodeFact | null = node
    ? {
        id: node.id,
        githubPr: node.github_pr,
        sequence: node.sequence,
        terminal: node.terminal,
      }
    : null;
  const planned = nextPlannedNode(state);

  const facts: HandoffFacts = {
    spec: { label: resolved.label, path: resolved.specPath },
    contract: contractCollected.contract,
    stage: state.stage,
    gateStatus: state.gate.status,
    cursor,
    activeNode,
    nextPlannedNode: planned
      ? {
          id: planned.id,
          githubPr: planned.github_pr,
          sequence: planned.sequence,
          terminal: planned.terminal,
        }
      : null,
    narrativeNextHead: state.next[0] ?? null,
    git: gitFacts,
    pullRequest,
    lifecycle,
    tasks,
    subCheckpoints,
    insights,
    driftWarnings: [...diagnostics.warnings, ...contractCollected.driftWarnings],
    sources,
  };

  return { resolved, state, facts, projectionStatusLine: diagnostics.statusLine };
}

// ── Renderer (apresentação compacta; leitura humana primeiro) ───────────────

function renderRetomada(collected: CollectedHandoff, lines: string[]): void {
  const { facts, projectionStatusLine } = collected;
  const g = facts.git;
  lines.push("## 1. Retomada factual");
  lines.push(`- spec: ${facts.spec.label}`);
  lines.push(`- path: ${facts.spec.path}`);
  lines.push(`- branch: ${g.branch ?? "(git indisponivel)"}`);
  lines.push(`- HEAD: ${g.head ?? "(git indisponivel)"}`);
  lines.push(
    `- ahead/behind (vs ${g.upstream ?? "upstream desconhecido"}): ${
      g.ahead === null ? "(nao observavel)" : `${g.ahead}/${g.behind}`
    }`
  );
  lines.push(
    `- working tree: ${
      g.workingTreeClean === null ? "(nao observavel)" : g.workingTreeClean ? "limpa" : "SUJA"
    }`
  );
  lines.push(`- projecao specs/active.yml: ${projectionStatusLine}`);
  lines.push(`- stage/gate: ${facts.stage}/${facts.gateStatus}`);
  lines.push(
    `- cursor: ${facts.cursor ? `${facts.cursor.pr} · ${facts.cursor.checkpoint}` : "(sem topology)"}`
  );
  const pr = facts.pullRequest;
  if (pr) {
    lines.push(
      `- PR ativo: #${pr.number} (${pr.state}${pr.isDraft ? ", Draft" : ", Ready"}; base ${pr.baseRefName}; head ${pr.headRefOid.slice(0, 7)})`
    );
    lines.push(
      `- CI: ${pr.checks.pass} pass · ${pr.checks.fail} fail · ${pr.checks.pending} pending`
    );
  } else {
    lines.push(
      `- PR ativo: ${facts.activeNode?.githubPr ? `#${facts.activeNode.githubPr} (estado remoto NAO observado)` : "(nao declarado)"}`
    );
  }
}

function renderSources(facts: HandoffFacts, lines: string[]): void {
  lines.push("## 2. Saúde das fontes");
  for (const source of facts.sources) {
    lines.push(
      `- ${source.id} · ${source.status} · ${source.origin} · fp ${source.fingerprint}${
        source.detail ? ` · ${source.detail}` : ""
      }`
    );
  }
  const reconcile = facts.driftWarnings.length > 0;
  if (reconcile) {
    lines.push(`- reconciliacao necessaria: sim (ver "Aviso de projeção")`);
  }
}

function renderLifecycle(facts: HandoffFacts, lines: string[]): void {
  lines.push("## 4. Lifecycle do checkpoint");
  const lc = facts.lifecycle;
  if (!lc) {
    lines.push("- (sem cursor/topologia — lifecycle nao derivavel)");
    return;
  }
  const decisions = lc.reviewDecisions.map((d) => `${d.role}=${d.decision}`).join(", ");
  lines.push(
    `- reviews: ${decisions || "(nenhum)"}${
      lc.requiredReviewRoles.length > 0 ? ` · exigidos: ${lc.requiredReviewRoles.join(", ")}` : ""
    }`
  );
  if (lc.reviewStatuses.length > 0) {
    // Catálogo×requisito (CO-4 rodada 8): seção COMPACTA — informa, não obriga.
    lines.push("- reviews aplicáveis:");
    for (const s of lc.reviewStatuses) {
      if (s.applicability === "no") {
        lines.push(`  - ${s.typeId}: não aplicável`);
      } else {
        lines.push(
          `  - ${s.typeId}: ${s.requirement} · ${s.state}${s.decision ? ` (${s.decision})` : ""} · ${s.blocking ? "BLOQUEIA" : "não bloqueia"}`
        );
      }
    }
  }
  lines.push(
    `- findings: ${lc.openFindings} open (${lc.openBlocking} bloqueante(s)) / ${lc.closedFindings} closed · resolutions: ${lc.resolutions}`
  );
  lines.push(`- gate do checkpoint: ${lc.gateDecision ?? "(ausente — decisão humana futura)"}`);
  if (facts.insights.length > 0) {
    lines.push(`- insights abertos do cursor: ${facts.insights.map((i) => i.id).join(", ")}`);
  }
}

/**
 * Cápsula COMPACTA do contrato carregado: identidade + fontes do contrato +
 * obrigações globais (id+título — nunca o corpo) + ponteiro para as regras
 * completas. Restrições do nó NÃO são duplicadas aqui (vivem na seção de
 * ações proibidas, derivadas do estado).
 */
function renderContract(facts: HandoffFacts, lines: string[]): void {
  lines.push("## 3. Contrato global carregado");
  const contract = facts.contract;
  if (!contract) {
    lines.push("- identidade do repositório NÃO derivável (package.json ausente/ilegível).");
    return;
  }
  lines.push(
    `- repositório: ${contract.repositoryId} · ${contract.repositoryKind}${contract.summary ? ` · "${contract.summary}"` : ""}`
  );
  if (contract.ssotPath) {
    lines.push(`- SSOT estrutural: ${contract.ssotPath}`);
  }
  const fp = (id: string): string => {
    const source = facts.sources.find((s) => s.id === id);
    return source ? `${source.status} · fp ${source.fingerprint}` : "(não coletado)";
  };
  lines.push(`- bootstrap: ${contract.bootstrapSource} · ${fp("runtime-bootstrap")}`);
  lines.push(`- catálogo de regras: ${contract.rulesSource} · ${fp("rules-contract")}`);
  lines.push(`- contrato de scripts: ${contract.scriptContractSource} · ${fp("script-contract")}`);
  if (contract.mandatoryRules.length > 0) {
    lines.push("- obrigações globais (sempre injetadas):");
    for (const rule of contract.mandatoryRules) {
      lines.push(`  - [${rule.id}] ${rule.title}`);
    }
  } else {
    lines.push("- obrigações globais: (nenhuma derivável do catálogo — ver Saúde das fontes)");
  }
  lines.push(
    '- restrições do nó: derivadas do estado — ver "Ações proibidas (derivadas do estado)".'
  );
  lines.push(
    `- regras completas: ${contract.rulesCatalogPointer} (o handoff projeta a cápsula; NÃO é SSOT de regras).`
  );
}

function renderNextAction(derived: HandoffDerived, lines: string[]): void {
  lines.push("## 5. Próxima ação única (derivada)");
  lines.push(`- ${derived.nextAction.description}`);
  lines.push(`- bloqueante: ${derived.nextAction.blocking ? "sim" : "não"}`);
  lines.push("- base factual:");
  for (const basis of derived.nextAction.basis) {
    lines.push(`  - ${basis}`);
  }
}

function renderProhibitions(derived: HandoffDerived, lines: string[]): void {
  lines.push("## 6. Ações proibidas (derivadas do estado)");
  lines.push(renderList([...derived.prohibitions], "(nenhuma proibição derivada)"));
}

function renderCollected(
  repoRoot: string,
  collected: CollectedHandoff,
  derived: HandoffDerived,
  options: HandoffOptions,
  receiptNote: string | null
): HandoffResult {
  const { facts } = collected;
  const specFiles = existingFiles(
    repoRoot,
    SITUATED_FILES.map((file) => `${collected.resolved.specPath}/${file}`)
  );

  const lines: string[] = [];
  lines.push("# Handoff situado — ai-guidelines");
  if (facts.driftWarnings.length > 0) {
    lines.push("");
    lines.push("## ⚠ Aviso de projeção — reconcilie antes de confiar");
    for (const warning of facts.driftWarnings) {
      lines.push(`- ${warning}`);
    }
  }
  lines.push("");
  renderRetomada(collected, lines);
  lines.push("");
  renderSources(facts, lines);
  lines.push("");
  renderContract(facts, lines);
  lines.push("");
  renderLifecycle(facts, lines);
  lines.push("");
  renderNextAction(derived, lines);
  lines.push("");
  renderProhibitions(derived, lines);
  lines.push("");
  lines.push("## 7. Autoridade e ordem de leitura");
  lines.push(renderList(existingFiles(repoRoot, AUTHORITY_FILES)));
  lines.push(renderList([...specFiles]));
  lines.push("");
  lines.push("## 8. Narrativa derivada (não é fonte da próxima ação)");
  lines.push(renderList(collected.state.next.slice(0, 3)));
  lines.push("");
  lines.push("## 9. Primeiro turno recomendado");
  lines.push(
    "Reconcilie branch, HEAD, working tree, PR, cursor da spec, state.yml e divergencias entre narrativa e repo antes de propor ou executar qualquer acao."
  );
  lines.push("");
  lines.push("## 10. Selo de geração");
  lines.push(
    `- selo: ${derived.seal} (contrato v${HANDOFF_CONTRACT_VERSION}; HEAD ${facts.git.head ?? "-"}; ${facts.sources.length} fonte(s))`
  );
  lines.push(
    "- determinístico: mesmas fontes ⇒ mesmo selo; o handoff NÃO é persistido (stdout é a superfície primária)."
  );
  if (receiptNote) {
    lines.push(`- recibo de carga: ${receiptNote}`);
  }
  if (options.hybrid) {
    lines.push("");
    lines.push("## 11. Slots humanos (hybrid)");
    lines.push("- [TODO humano] Uma frase com o objetivo da sessao.");
    lines.push("- [TODO humano] Qual papel o agente deve assumir nesta rodada.");
    lines.push("- [TODO humano] Qual decisao recente nao deve ser reaberta sem fato novo.");
  }

  return { text: `${lines.join("\n")}\n` };
}

/** Render SEM ato de carga (sem recibo) — usado em consultas programáticas/testes. */
export function renderHandoff(repoRoot: string, options: HandoffOptions = {}): HandoffResult {
  const collected = collectHandoffFacts(repoRoot, options);
  const derived = deriveHandoff(collected.facts);
  return renderCollected(repoRoot, collected, derived, options, null);
}

export interface HandoffLoadResult {
  readonly text: string;
  readonly seal: string;
  /** Recibo escrito; `null` quando fora de repo git ou snapshot incoerente. */
  readonly receipt: HandoffLoadReceipt | null;
  readonly receiptFile: string | null;
  readonly receiptSkippedReason?: string;
}

export interface HandoffLoadSnapshot {
  readonly collected: CollectedHandoff;
  readonly derived: HandoffDerived;
  readonly receipt: HandoffLoadReceipt | null;
  readonly receiptFile: string | null;
  readonly receiptSkippedReason?: string;
}

/**
 * ATO DE CARGA reutilizável (CO-4): coleta única + derivação + recibo, SEM
 * renderizar — consumido pelo `handoff` (que renderiza o handoff) e pelo
 * `review <papel>` (que deriva o briefing DO MESMO snapshot; anti-TOCTOU).
 */
export function loadHandoffSnapshot(
  repoRoot: string,
  options: HandoffOptions = {}
): HandoffLoadSnapshot {
  const collected = collectHandoffFacts(repoRoot, options);
  const derived = deriveHandoff(collected.facts);

  // Contrato obrigatório ausente ⇒ não existe carga "fresh" sem bootstrap/catálogo.
  const missingMandatory = collected.facts.sources.filter(
    (s) => (MANDATORY_CONTRACT_SOURCES as readonly string[]).includes(s.id) && s.status !== "fresh"
  );
  if (missingMandatory.length > 0) {
    const reason =
      `contrato obrigatório não carregado (${missingMandatory.map((s) => s.id).join(", ")}); ` +
      `recibo NÃO publicado — reconcilie as fontes e reexecute a carga.`;
    return { collected, derived, receipt: null, receiptFile: null, receiptSkippedReason: reason };
  }

  // Anti-TOCTOU: HEAD mudou durante a coleta ⇒ snapshot misturado não vira evidência.
  const headNow = git(repoRoot, ["rev-parse", "--short", "HEAD"]);
  if (
    collected.facts.git.head !== null &&
    headNow !== null &&
    headNow !== collected.facts.git.head
  ) {
    const reason = `HEAD mudou durante a coleta (${collected.facts.git.head} → ${headNow}); recibo NÃO publicado — reexecute a carga.`;
    return { collected, derived, receipt: null, receiptFile: null, receiptSkippedReason: reason };
  }

  const receipt = createLoadReceipt(collected.facts, derived.seal);
  const receiptFile = writeReceipt(repoRoot, receipt);
  return { collected, derived, receipt: receiptFile ? receipt : null, receiptFile };
}

/**
 * ATO VERIFICÁVEL DE CARGA (contrato de carga do CO-4): coleta os fatos UMA
 * única vez, deriva o handoff DESSE snapshot, registra o recibo local efêmero
 * com o MESMO selo exibido, e renderiza. Anti-TOCTOU: se o HEAD mudou entre o
 * início e o fim da coleta, o recibo NÃO é publicado como fresh (snapshot
 * misturado não vira evidência de carga).
 */
export function loadHandoff(repoRoot: string, options: HandoffOptions = {}): HandoffLoadResult {
  const snapshot = loadHandoffSnapshot(repoRoot, options);
  const { collected, derived } = snapshot;
  const note = snapshot.receiptSkippedReason
    ? `NÃO registrado: ${snapshot.receiptSkippedReason}`
    : snapshot.receiptFile
      ? `${snapshot.receiptFile} (efêmero, fora do versionamento; selo ${snapshot.receipt!.sourceSeal})`
      : "(fora de repo git — recibo não se aplica)";
  return {
    text: renderCollected(repoRoot, collected, derived, options, note).text,
    seal: derived.seal,
    receipt: snapshot.receipt,
    receiptFile: snapshot.receiptFile,
    ...(snapshot.receiptSkippedReason
      ? { receiptSkippedReason: snapshot.receiptSkippedReason }
      : {}),
  };
}

export async function main(
  argv: readonly string[],
  repoRoot: string,
  logger: { info(message: string): void; error(message: string): void }
): Promise<number> {
  const hybrid = argv.includes("--hybrid");
  const noRemote = argv.includes("--no-remote");
  const identifier = argv.find((arg) => !arg.startsWith("--"));
  try {
    logger.info(
      loadHandoff(repoRoot, {
        identifier,
        hybrid,
        remote: noRemote ? null : ghRemotePrCollector,
      }).text.trimEnd()
    );
    return 0;
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}
