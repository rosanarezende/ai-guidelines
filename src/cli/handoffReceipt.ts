/**
 * Recibo local efêmero de carga do handoff (CO-4 — contrato de carga /
 * reconcile-on-load; ADR 0021/0022).
 *
 * Conclusão arquitetural do checkpoint: não é possível provar que uma LLM
 * COMPREENDEU uma narrativa — é possível provar que a retomada foi solicitada,
 * que as fontes foram reconciliadas, que o handoff foi derivado de um snapshot
 * coerente, que a sessão recebeu um selo correspondente e que comandos
 * posteriores conseguem detectar que esse selo ficou stale. O recibo é a
 * evidência LOCAL desses fatos — nada mais.
 *
 * Natureza do recibo (regras cravadas):
 *   - vive em `.git/ai-guidelines/handoff-load.json` (resolvido via
 *     `git rev-parse --absolute-git-dir`, então funciona em worktrees);
 *     dentro de `.git/` ⇒ nunca versionado, nunca aparece no status;
 *   - NÃO é SSOT; pode ser apagado sem perda de estado e reconstruído
 *     reexecutando o comando de carga;
 *   - só fatos operacionais mínimos: sem narrativa, sem body de PR, sem
 *     prompts, sem segredos;
 *   - `loadedAt` é registro factual e NÃO participa do selo;
 *   - mudança de HEAD ou de fonte relevante torna o recibo stale; recibo
 *     stale NUNCA é atualizado silenciosamente (só uma nova carga explícita
 *     reescreve).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { HANDOFF_CONTRACT_VERSION, HandoffFacts } from "../app/handoff/handoffFacts.js";

export interface HandoffLoadReceipt {
  readonly contractVersion: string;
  readonly specId: string;
  readonly branch: string;
  readonly head: string;
  /** Selo determinístico das fontes — idêntico ao exibido no stdout da carga. */
  readonly sourceSeal: string;
  /** Fingerprint por fonte (id → fp) — habilita diagnóstico de QUAL fonte divergiu. */
  readonly sources: Readonly<Record<string, string>>;
  /** Ids de fontes não-fresh no momento da carga (degradação factual registrada). */
  readonly degraded: ReadonlyArray<string>;
  /** Quando a carga ocorreu (ISO). Registro factual; fora do selo. */
  readonly loadedAt: string;
  /** Comando canônico que produziu (e reproduz) este recibo. */
  readonly command: string;
}

export type ReceiptStatus =
  | { readonly kind: "fresh"; readonly receipt: HandoffLoadReceipt }
  | { readonly kind: "missing" }
  | {
      readonly kind: "stale-head";
      readonly receipt: HandoffLoadReceipt;
      readonly currentHead: string;
      readonly currentSeal: string;
    }
  | {
      readonly kind: "stale-sources";
      readonly receipt: HandoffLoadReceipt;
      readonly currentSeal: string;
      readonly divergentSources: ReadonlyArray<string>;
    }
  | { readonly kind: "invalid"; readonly reason: string };

export function reloadCommand(specId: string): string {
  return `npm run flow -- handoff ${specId}`;
}

/** Extrai o specId numérico do label da spec (ex.: "0024-context-architecture" → "0024"). */
export function specIdFromLabel(label: string): string {
  return /^(\d{4})/.exec(label)?.[1] ?? label;
}

/** Pure: snapshot (fatos + selo) → recibo. `now` injetado (determinismo em teste). */
export function createLoadReceipt(
  facts: HandoffFacts,
  seal: string,
  now: () => Date = () => new Date()
): HandoffLoadReceipt {
  const specId = specIdFromLabel(facts.spec.label);
  const sources: Record<string, string> = {};
  const degraded: string[] = [];
  for (const source of facts.sources) {
    sources[source.id] = source.fingerprint;
    if (source.status !== "fresh") degraded.push(source.id);
  }
  return {
    contractVersion: String(HANDOFF_CONTRACT_VERSION),
    specId,
    branch: facts.git.branch ?? "-",
    head: facts.git.head ?? "-",
    sourceSeal: seal,
    sources,
    degraded,
    loadedAt: now().toISOString(),
    command: reloadCommand(specId),
  };
}

function parseReceipt(rawText: string): HandoffLoadReceipt | { error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(rawText);
  } catch (e) {
    return { error: `JSON ilegível (${e instanceof Error ? e.message : String(e)})` };
  }
  if (typeof raw !== "object" || raw === null) return { error: "recibo não é um objeto JSON" };
  const r = raw as Record<string, unknown>;
  for (const field of [
    "contractVersion",
    "specId",
    "branch",
    "head",
    "sourceSeal",
    "loadedAt",
    "command",
  ]) {
    if (typeof r[field] !== "string" || r[field] === "") {
      return { error: `campo obrigatório ausente/inválido: ${field}` };
    }
  }
  if (typeof r.sources !== "object" || r.sources === null) {
    return { error: "campo obrigatório ausente/inválido: sources" };
  }
  return {
    contractVersion: r.contractVersion as string,
    specId: r.specId as string,
    branch: r.branch as string,
    head: r.head as string,
    sourceSeal: r.sourceSeal as string,
    sources: r.sources as Record<string, string>,
    degraded: Array.isArray(r.degraded) ? (r.degraded as string[]) : [],
    loadedAt: r.loadedAt as string,
    command: r.command as string,
  };
}

/**
 * Pure: recibo persistido × snapshot ATUAL → status. Comparação é por
 * HEAD + selo + fingerprints (NUNCA por timestamp). Precedência: invalid >
 * stale-head > stale-sources > fresh.
 */
export function validateLoadReceipt(
  rawText: string | null,
  current: { readonly facts: HandoffFacts; readonly seal: string },
  options: { readonly ignoreSourceIds?: ReadonlyArray<string> } = {}
): ReceiptStatus {
  if (rawText === null) return { kind: "missing" };
  const parsed = parseReceipt(rawText);
  if ("error" in parsed) return { kind: "invalid", reason: parsed.error };
  if (parsed.contractVersion !== String(HANDOFF_CONTRACT_VERSION)) {
    return {
      kind: "invalid",
      reason: `contractVersion "${parsed.contractVersion}" ≠ contrato atual v${HANDOFF_CONTRACT_VERSION}`,
    };
  }

  const currentHead = current.facts.git.head ?? "-";
  if (parsed.head !== currentHead) {
    return { kind: "stale-head", receipt: parsed, currentHead, currentSeal: current.seal };
  }

  // Divergência por-fonte (sempre derivada das fingerprints; `ignoreSourceIds`
  // exclui fontes que o chamador não pode/não quer verificar localmente — ex.: a
  // fonte remota `pull-request`, cujo fingerprint exige rede para reproduzir).
  const ignore = new Set(options.ignoreSourceIds ?? []);
  const divergent: string[] = [];
  const currentFps = new Map(current.facts.sources.map((s) => [s.id, s.fingerprint]));
  const seen = new Set<string>();
  for (const [id, fp] of Object.entries(parsed.sources)) {
    seen.add(id);
    if (ignore.has(id)) continue;
    if (currentFps.get(id) !== fp) divergent.push(id);
  }
  for (const id of currentFps.keys()) {
    if (ignore.has(id) || seen.has(id)) continue;
    divergent.push(id);
  }

  // Gate: SEM ignore, mantém o selo como gate (comportamento idêntico ao anterior;
  // `handoff:check` e demais chamadores inalterados). COM ignore, gate é a
  // divergência por-fonte já excluindo as ignoradas.
  const stale = ignore.size === 0 ? parsed.sourceSeal !== current.seal : divergent.length > 0;
  if (stale) {
    return {
      kind: "stale-sources",
      receipt: parsed,
      currentSeal: current.seal,
      divergentSources: divergent.sort(),
    };
  }
  return { kind: "fresh", receipt: parsed };
}

/**
 * Razão canônica (única) de um recibo NÃO-fresh. Fonte única consumida tanto
 * pela guarda lançante (`assertFreshHandoffReceipt`) quanto pelo caminho
 * advisory-first (`formatReceiptAdvisory`) — sem reimplementar o switch.
 */
export function describeReceiptStaleReason(
  status: Exclude<ReceiptStatus, { kind: "fresh" }>
): string {
  switch (status.kind) {
    case "missing":
      return "nenhuma carga registrada";
    case "invalid":
      return `recibo inválido (${status.reason})`;
    case "stale-head":
      return `recibo stale: HEAD carregado ${status.receipt.head} ≠ HEAD atual ${status.currentHead}`;
    case "stale-sources":
      return `recibo stale: fontes divergiram (${status.divergentSources.join(", ")})`;
  }
}

/**
 * Linha advisory determinística (advisory-first; NÃO lança) para um recibo
 * não-fresh; `null` quando fresh. Compartilhada pelas superfícies situadas do
 * CO-3.4 (`workflow publish-state`, `review:publish`).
 */
export function formatReceiptAdvisory(status: ReceiptStatus, specId: string): string | null {
  if (status.kind === "fresh") return null;
  return (
    `⚠️  [advisory] retomada não reconciliada — ${describeReceiptStaleReason(status)}. ` +
    `Recarregue com: ${reloadCommand(specId)}`
  );
}

/**
 * Guarda para comandos MUTANTES futuros (integração mínima; o wiring amplo é
 * evolução de enforcement/CO-6 — deliberadamente NÃO conectado agora). Lança
 * com diagnóstico + comando de recarga quando a retomada não está fresh.
 */
export function assertFreshHandoffReceipt(status: ReceiptStatus, specId: string): void {
  if (status.kind === "fresh") return;
  throw new Error(
    `retomada não reconciliada — ${describeReceiptStaleReason(status)}. ` +
      `Recarregue com: ${reloadCommand(specId)}.`
  );
}

// ── I/O do recibo (fora do domínio puro) ─────────────────────────────────────

/**
 * Caminho do recibo dentro do git-dir REAL (worktree-safe). `null` fora de
 * repo git — recibo simplesmente não se aplica.
 */
export function receiptPath(repoRoot: string): string | null {
  try {
    const gitDir = execFileSync("git", ["rev-parse", "--absolute-git-dir"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return path.join(gitDir, "ai-guidelines", "handoff-load.json");
  } catch {
    return null;
  }
}

export function readReceiptText(repoRoot: string): string | null {
  const file = receiptPath(repoRoot);
  if (!file || !fs.existsSync(file)) return null;
  return fs.readFileSync(file, "utf8");
}

/** Escreve o recibo (carga EXPLÍCITA — único caminho de escrita). */
export function writeReceipt(repoRoot: string, receipt: HandoffLoadReceipt): string | null {
  const file = receiptPath(repoRoot);
  if (!file) return null;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  return file;
}
