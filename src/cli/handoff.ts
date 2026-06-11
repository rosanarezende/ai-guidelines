import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { parseActiveSpecs } from "../infrastructure/yaml/activeSpecsSerializer.js";
import { parseWorkflowState } from "../infrastructure/yaml/workflowStateSerializer.js";
import { ActiveSpecEntry } from "../domain/workflow/ActiveSpecEntry.js";
import { PrTopologyNode, WorkflowState } from "../domain/workflow/WorkflowState.js";
import { parseSpecBranch } from "../app/workflow/DetectActiveSpec.js";

export interface HandoffOptions {
  readonly identifier?: string;
  readonly hybrid?: boolean;
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
  if (text === null) return { exists: false, entries: [] };
  try {
    return { exists: true, entries: parseActiveSpecs(text).activeSpecs };
  } catch (error) {
    return {
      exists: true,
      entries: [],
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

export function renderHandoff(repoRoot: string, options: HandoffOptions = {}): HandoffResult {
  const projection = loadProjection(repoRoot);
  const branch = git(repoRoot, ["branch", "--show-current"]);

  let resolved: ResolvedSpec | null;
  let via: CurrentResolution["via"] | "identifier";
  if (options.identifier) {
    resolved = resolveByIdentifier(repoRoot, projection, options.identifier);
    via = "identifier";
  } else {
    const current = resolveCurrent(repoRoot, projection, branch);
    resolved = current.resolved;
    via = current.via;
  }
  if (!resolved) {
    throw new Error("Nao foi possivel resolver a spec para handoff.");
  }

  const diagnostics = projectionDiagnostics(projection, resolved, via, branch);
  const state = readState(repoRoot, resolved.specPath);
  const node = activeTopologyNode(state);
  const cursor = state.topology?.cursor;
  const head = git(repoRoot, ["rev-parse", "--short", "HEAD"]) ?? "(git indisponivel)";
  const status = git(repoRoot, ["status", "--short", "--branch"]) ?? "(git indisponivel)";
  const specFiles = existingFiles(
    repoRoot,
    SITUATED_FILES.map((file) => `${resolved.specPath}/${file}`)
  );

  const lines: string[] = [];
  lines.push("# Handoff situado — ai-guidelines");
  if (diagnostics.warnings.length > 0) {
    lines.push("");
    lines.push("## ⚠ Aviso de projeção — reconcilie antes de confiar");
    for (const warning of diagnostics.warnings) {
      lines.push(`- ${warning}`);
    }
  }
  lines.push("");
  lines.push("## 1. Retomada factual");
  lines.push(`- spec: ${resolved.label}`);
  lines.push(`- path: ${resolved.specPath}`);
  lines.push(`- branch: ${branch ?? "(git indisponivel)"}`);
  lines.push(`- HEAD: ${head}`);
  lines.push(`- git status: ${status.replace(/\n/g, " / ")}`);
  lines.push(`- projecao specs/active.yml: ${diagnostics.statusLine}`);
  lines.push(`- stage/gate: ${state.stage}/${state.gate.status}`);
  lines.push(`- cursor: ${cursor ? `${cursor.pr} · ${cursor.checkpoint}` : "(sem topology)"}`);
  lines.push(`- PR ativo: ${node?.github_pr ? `#${node.github_pr}` : "(nao declarado)"}`);
  lines.push("");
  lines.push("## 2. Autoridade e ordem de leitura");
  lines.push(renderList(existingFiles(repoRoot, AUTHORITY_FILES)));
  lines.push(renderList(specFiles));
  lines.push("");
  lines.push("## 3. Proximo contexto narrado");
  lines.push(renderList(state.next.slice(0, 3)));
  lines.push("");
  lines.push("## 4. Regras situacionais minimas");
  lines.push("- O repositorio vence transcript, memoria e output de agente.");
  lines.push("- state.yml § topology e a SSOT estrutural da spec.");
  lines.push("- AGENTS.md e canal/stub; regras completas vivem em .core/rules/** e no catalogo.");
  lines.push("- Runtime local nao chama LLM; IA atua como canal de sintese.");
  lines.push("- Sem git push sem autorizacao humana explicita; sem --no-verify.");
  lines.push("- Human Gate decide avanço; Ready nao equivale a merge.");
  lines.push("");
  lines.push("## 5. Primeiro turno recomendado");
  lines.push(
    "Reconcilie branch, HEAD, working tree, PR, cursor da spec, state.yml e divergencias entre narrativa e repo antes de propor ou executar qualquer acao."
  );
  if (options.hybrid) {
    lines.push("");
    lines.push("## 6. Slots humanos (hybrid)");
    lines.push("- [TODO humano] Uma frase com o objetivo da sessao.");
    lines.push("- [TODO humano] Qual papel o agente deve assumir nesta rodada.");
    lines.push("- [TODO humano] Qual decisao recente nao deve ser reaberta sem fato novo.");
  }

  return { text: `${lines.join("\n")}\n` };
}

export async function main(
  argv: readonly string[],
  repoRoot: string,
  logger: { info(message: string): void; error(message: string): void }
): Promise<number> {
  const hybrid = argv.includes("--hybrid");
  const identifier = argv.find((arg) => arg !== "--hybrid");
  try {
    logger.info(renderHandoff(repoRoot, { identifier, hybrid }).text.trimEnd());
    return 0;
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}
