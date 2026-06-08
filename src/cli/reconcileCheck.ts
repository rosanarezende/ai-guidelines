/**
 * CLI entrypoint para o gate `reconcile:check` (CO-1 / Spec 0024 — Continuidade Operacional).
 *
 * **Contrato de autoridade (INV-1).** `state.yml § topology` é a SSOT estrutural.
 * A prosa de `next` (e, por extensão, checkpoints/handoffs/memórias) NÃO é
 * autoridade quando diverge do canônico DERIVÁVEL da topologia. Este check deriva
 * o "próximo nó canônico" de `topology` (grupos + `sequence` + `cursor`) e
 * reconcilia contra ele tanto o `cursor` quanto a afirmação viva de próximo-passo
 * em `state.next[0]` — esta última por CONTRATO SINTÁTICO (marcador estrutural
 * `canonical-next: <id>`, não substring solta; ver `CANONICAL_NEXT_MARKER`). Mata
 * a classe PIT-0001/conflação: a retomada que lê o NARRADO e ignora o DERIVÁVEL.
 *
 * **Advisory-first.** O check DETECTA e REPORTA divergência, mas NUNCA falha o
 * build: `main` retorna sempre 0. Promoção a gate bloqueante (`required`) é
 * decisão futura, após uso real (CO advisory-first).
 *
 * **Sem entidade nova (ADR 0026 / INV-4).** O canônico derivado e o relatório de
 * divergência são DERIVADOS em memória (renderer-puros); nada é persistido,
 * nenhum schema novo. **Sem LLM (ADR 0018):** reconciliação 100% determinística.
 *
 * **Limites explícitos do nó (fora de escopo — pertencem a nós posteriores da
 * cauda CO):** projetor situado / reconcile-on-load (CO-4 `co-projection`);
 * leitura de arquivos de checkpoint/handoff/memória como fonte narrada (CO-4);
 * disparo automático em eventos (CO-6 `co-events`); conversão para `required`.
 * Aqui a única fonte narrada é `state.next`, e a função núcleo recebe apenas um
 * `WorkflowState` — é estruturalmente incapaz de ler outros artefatos.
 *
 * Exit codes:
 *   0 — SEMPRE (advisory-first). O relatório distingue ✅ (reconciliado) de
 *       ⚠️ (divergência advisory).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { parseWorkflowState } from "../infrastructure/yaml/workflowStateSerializer.js";
import {
  PrTopologyNode,
  WorkflowState,
  WorkflowTopology,
} from "../domain/workflow/WorkflowState.js";
import { discoverOperationalStateYmlFiles } from "./stateYmlCheck.js";

interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

const defaultLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

/**
 * Deriva o "próximo nó canônico" da topologia: o nó `role:execution` ainda
 * pendente (∈ active ∪ planned) de MENOR `sequence`. `sequence` = posição no
 * stack (1..K contígua, garantida pelo serializer). Retorna `null` quando não há
 * execution pendente (stack esgotada; só resta o terminal de integração).
 *
 * Puro e derivado em memória — não reifica entidade (ADR 0026 / INV-4).
 */
export function deriveCanonicalNext(topology: WorkflowTopology): PrTopologyNode | null {
  const pending = [...topology.prs.active, ...topology.prs.planned].filter(
    (n) => n.role === "execution" && n.sequence !== null
  );
  if (pending.length === 0) return null;
  return pending.reduce((min, n) => ((n.sequence as number) < (min.sequence as number) ? n : min));
}

function findNodeById(topology: WorkflowTopology, id: string): PrTopologyNode | undefined {
  return [...topology.prs.concluded, ...topology.prs.active, ...topology.prs.planned].find(
    (n) => n.id === id
  );
}

/**
 * Marcador estrutural que declara o próximo nó canônico na afirmação viva
 * (`state.next[0]`). Contrato SINTÁTICO determinístico — `canonical-next: <id>`,
 * com `<id>` em kebab-case lowercase (forma dos ids da topologia). Substitui a
 * checagem por substring solta (`includes`), que dava FALSO-VERDE quando a prosa
 * citava o nó em contexto negativo/contraditório (ex.: "Não iniciar co-reconcile;
 * próximo é co-knowledge" — cita o id, mas a autoridade narrada é contrária).
 * Sem NLP, sem semântica, sem LLM: só a presença de um token estrutural.
 */
const CANONICAL_NEXT_MARKER = /canonical-next:\s*([a-z0-9][a-z0-9-]*)/g;

/** Ids declarados via marcador `canonical-next: <id>` em `text`, na ordem de ocorrência. */
export function extractCanonicalNextMarkers(text: string): string[] {
  return [...text.matchAll(CANONICAL_NEXT_MARKER)].map((m) => m[1]);
}

export type DivergenceCode =
  | "cursor-not-canonical-next"
  | "cursor-checkpoint-mismatch"
  | "narrated-next-omits-canonical";

export interface Divergence {
  code: DivergenceCode;
  message: string;
}

export type SpecReconcileResult =
  | { kind: "skip" } // sem topology: nada estrutural a reconciliar
  | { kind: "ok"; canonicalNextId: string | null }
  | { kind: "diverge"; canonicalNextId: string | null; divergences: Divergence[] };

/**
 * Pure: reconcilia o canônico DERIVADO da topologia contra as afirmações
 * (cursor + narração viva em `next[0]`) de um único `state.yml`. Sem I/O.
 */
export function reconcileTopology(state: WorkflowState): SpecReconcileResult {
  const topology = state.topology;
  if (!topology) return { kind: "skip" };

  const canonical = deriveCanonicalNext(topology);
  const canonicalNextId = canonical ? canonical.id : null;
  const divergences: Divergence[] = [];
  const { cursor } = topology;

  // INV-1: o cursor (âncora de retomada) deve apontar para o próximo nó canônico
  // derivado. Mata "cursor aponta para nó já concluído" e "cursor fura a ordem".
  if (canonical && cursor.pr !== canonical.id) {
    divergences.push({
      code: "cursor-not-canonical-next",
      message:
        `cursor.pr "${cursor.pr}" não é o próximo nó canônico derivado "${canonical.id}" ` +
        `(execution pendente de menor sequence = ${canonical.sequence}). ` +
        `A âncora de retomada diverge da ordem real da stack.`,
    });
  }

  // INV-2: cursor.checkpoint deve pertencer ao nó apontado por cursor.pr (o
  // serializer só garante que existe em ALGUMA lista; aqui endurecemos ao nó).
  const cursorNode = findNodeById(topology, cursor.pr);
  if (cursorNode && !cursorNode.checkpoints.includes(cursor.checkpoint)) {
    divergences.push({
      code: "cursor-checkpoint-mismatch",
      message:
        `cursor.checkpoint "${cursor.checkpoint}" não pertence aos checkpoints do nó ` +
        `"${cursor.pr}" (tem: ${cursorNode.checkpoints.join(", ") || "—"}).`,
    });
  }

  // INV-3 (narrado — CONTRATO SINTÁTICO determinístico): a afirmação viva
  // (state.next[0], por convenção do repo: a 1ª entrada é a VIVA, as demais são
  // histórico) deve DECLARAR o próximo nó canônico via marcador estrutural
  // `canonical-next: <id>` — NÃO por menção textual solta. Substring (`includes`)
  // dá falso-verde quando a prosa cita o id em contexto negativo/lateral (achado
  // da auditoria do #36). O contrato exige ≥1 marcador E que TODO marcador aponte
  // o canônico (marcadores stale/conflitantes falham). `next` vazio = sem
  // afirmação narrada → nada a reconciliar.
  if (canonical && state.next.length > 0) {
    const declared = extractCanonicalNextMarkers(state.next[0]);
    if (declared.length === 0) {
      divergences.push({
        code: "narrated-next-omits-canonical",
        message:
          `state.next[0] não declara o próximo nó canônico via marcador estrutural ` +
          `"canonical-next: <id>" (menção textual solta não conta — evita falso-verde em ` +
          `frase negativa/lateral). Esperado: "canonical-next: ${canonical.id}".`,
      });
    } else if (!declared.every((id) => id === canonical.id)) {
      divergences.push({
        code: "narrated-next-omits-canonical",
        message:
          `state.next[0] declara canonical-next=[${declared.join(", ")}], mas o nó canônico ` +
          `derivado é "${canonical.id}" (marcador stale ou conflitante). O derivado é a autoridade.`,
      });
    }
  }

  if (divergences.length > 0) return { kind: "diverge", canonicalNextId, divergences };
  return { kind: "ok", canonicalNextId };
}

export interface ReconcileCheckInput {
  files: string[];
  readFile: (filePath: string) => string;
}

export type SpecOutcome = SpecReconcileResult | { kind: "parse-error"; message: string };

export interface SpecReport {
  file: string;
  result: SpecOutcome;
}

export interface ReconcileCheckReport {
  specs: SpecReport[];
}

/**
 * Pure: parseia + reconcilia cada arquivo. Parse-error é responsabilidade do
 * `state-yml:check` (required, roda antes); aqui é registrado como advisory para
 * não mascarar, sem decidir exit code (advisory-first fica no `main`).
 */
export function runReconcileCheck(input: ReconcileCheckInput): ReconcileCheckReport {
  const specs: SpecReport[] = [];
  for (const file of input.files) {
    let state: WorkflowState;
    try {
      state = parseWorkflowState(input.readFile(file));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      specs.push({ file, result: { kind: "parse-error", message } });
      continue;
    }
    specs.push({ file, result: reconcileTopology(state) });
  }
  return { specs };
}

/**
 * Composition root: descobre os state.yml + injeta readFile + reporta.
 * SEMPRE retorna 0 (advisory-first).
 */
export function main(repoRoot: string, logger: Logger = defaultLogger): number {
  const files = discoverOperationalStateYmlFiles(repoRoot);
  if (files.length === 0) {
    logger.info("ℹ reconcile:check (advisory) — nenhum state.yml encontrado. Nada a reconciliar.");
    return 0;
  }

  const report = runReconcileCheck({
    files,
    readFile: (p) => fs.readFileSync(p, "utf-8"),
  });

  const reconciled = report.specs.filter(
    (s) => s.result.kind === "ok" || s.result.kind === "diverge"
  );
  const diverging = report.specs.filter((s) => s.result.kind === "diverge");
  const parseErrors = report.specs.filter((s) => s.result.kind === "parse-error");

  for (const s of parseErrors) {
    logger.info(
      `⚠️ reconcile:check (advisory) — ${path.relative(repoRoot, s.file)} não parseou ` +
        "(ver state-yml:check). Pulado."
    );
  }

  if (diverging.length === 0) {
    logger.info(
      `✅ reconcile:check (advisory) — ${reconciled.length} spec(s) com topology; ` +
        "cursor e narração (next[0]) fiéis ao canônico derivado."
    );
    return 0;
  }

  logger.info(
    "⚠️ reconcile:check (advisory) — divergência entre narração/cursor e o canônico " +
      "derivado (state.yml § topology é a SSOT estrutural):\n"
  );
  for (const s of diverging) {
    if (s.result.kind !== "diverge") continue;
    logger.info(
      `  ${path.relative(repoRoot, s.file)} ` +
        `(próximo canônico: ${s.result.canonicalNextId ?? "—"})`
    );
    for (const d of s.result.divergences) {
      logger.info(`    [${d.code}] ${d.message}`);
    }
    logger.info("");
  }
  logger.info(
    "Advisory (CO-1 advisory-first): não bloqueia o build. Reconcilie a prosa/cursor com a " +
      "topologia — ou ajuste a topologia se a realidade da stack mudou. Classe PIT-0001."
  );
  return 0;
}
