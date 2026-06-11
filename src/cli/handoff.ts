import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { parseActiveSpecs } from "../infrastructure/yaml/activeSpecsSerializer.js";
import { parseWorkflowState } from "../infrastructure/yaml/workflowStateSerializer.js";
import { ActiveSpecEntry } from "../domain/workflow/ActiveSpecEntry.js";
import { PrTopologyNode, WorkflowState } from "../domain/workflow/WorkflowState.js";

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

function activeSpecs(repoRoot: string): readonly ActiveSpecEntry[] {
  const text = readIfExists(repoRoot, ".governance/runtime/specs/active.yml");
  if (!text) return [];
  try {
    return parseActiveSpecs(text).activeSpecs;
  } catch {
    return [];
  }
}

function entryMatches(entry: ActiveSpecEntry, identifier: string): boolean {
  return (
    entry.id === identifier ||
    entry.slug === identifier ||
    `${entry.id}-${entry.slug}` === identifier
  );
}

function resolveByIdentifier(repoRoot: string, identifier: string): ResolvedSpec | null {
  const fromIndex = activeSpecs(repoRoot).find((entry) => entryMatches(entry, identifier));
  if (fromIndex)
    return { specPath: fromIndex.specPath, label: `${fromIndex.id}-${fromIndex.slug}` };

  const byDir = listSpecDirs(repoRoot).find((specPath) => {
    const name = path.basename(specPath);
    return name === identifier || name.startsWith(`${identifier}-`);
  });
  return byDir ? { specPath: byDir, label: path.basename(byDir) } : null;
}

function resolveCurrent(repoRoot: string): ResolvedSpec | null {
  const branch = git(repoRoot, ["branch", "--show-current"]);
  const indexed = activeSpecs(repoRoot).find((entry) => entry.branch === branch);
  if (indexed) return { specPath: indexed.specPath, label: `${indexed.id}-${indexed.slug}` };

  const match = branch?.match(/spec-(\d{4})/);
  if (match) return resolveByIdentifier(repoRoot, match[1]);

  const dirs = listSpecDirs(repoRoot);
  return dirs.length === 1 ? { specPath: dirs[0], label: path.basename(dirs[0]) } : null;
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

export function renderHandoff(repoRoot: string, options: HandoffOptions = {}): HandoffResult {
  const resolved = options.identifier
    ? resolveByIdentifier(repoRoot, options.identifier)
    : resolveCurrent(repoRoot);
  if (!resolved) {
    throw new Error("Nao foi possivel resolver a spec para handoff.");
  }

  const state = readState(repoRoot, resolved.specPath);
  const node = activeTopologyNode(state);
  const cursor = state.topology?.cursor;
  const head = git(repoRoot, ["rev-parse", "--short", "HEAD"]) ?? "(git indisponivel)";
  const branch = git(repoRoot, ["branch", "--show-current"]) ?? "(git indisponivel)";
  const status = git(repoRoot, ["status", "--short", "--branch"]) ?? "(git indisponivel)";
  const specFiles = existingFiles(
    repoRoot,
    SITUATED_FILES.map((file) => `${resolved.specPath}/${file}`)
  );

  const lines: string[] = [];
  lines.push("# Handoff situado — ai-guidelines");
  lines.push("");
  lines.push("## 1. Retomada factual");
  lines.push(`- spec: ${resolved.label}`);
  lines.push(`- path: ${resolved.specPath}`);
  lines.push(`- branch: ${branch}`);
  lines.push(`- HEAD: ${head}`);
  lines.push(`- git status: ${status.replace(/\n/g, " / ")}`);
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
