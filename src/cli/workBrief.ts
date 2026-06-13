/**
 * `work` — briefing GOVERNADO e situado de TRABALHO (CO-4 / dogfood operacional
 * do PR #42).
 *
 * Dor absorvida (PIT-0011, 3ª classe): a RETOMADA (`handoff`) e o contrato de
 * REVIEW (`review <tipo>`) já eram descobríveis, mas a EXECUÇÃO de trabalho
 * funcional dependia de um mega-prompt humano reconstruindo escopo, autoridade,
 * validações, parada e formato do relatório — tudo derivável do repo.
 *
 * Sibling do `reviewBrief`: PROJETA o contrato que o implementador deve cumprir
 * (zero LLM no runtime — ADR 0018; não edita arquivos, não commita, não faz
 * push, não executa trabalho):
 *
 *   work-policy.yml (contrato por modo) + snapshot situado do handoff
 *   + autorização capability-scoped
 *   → modo inferido + objeto + permissões + validações + parada + report contract.
 *
 * O modo é inferido por precedência determinística reusando `deriveNextAction`
 * (handoff), refinado pela consolidação de findings×resolutions: o handoff cru
 * retorna `resolve-findings` por `openFindings>0`; aqui distinguimos
 * `resolve_findings` (falta fix válido) de `await_revalidation` (todos fixed com
 * ref válida — nada para o implementador além de aguardar o reviewer).
 */
import * as path from "node:path";
import * as fs from "node:fs";
import { execFileSync } from "node:child_process";
import { HandoffFacts, NextAction } from "./handoffFacts.js";
import {
  HandoffLoadSnapshot,
  HandoffOptions,
  ghRemotePrCollector,
  loadHandoffSnapshot,
} from "./handoff.js";
import { discover } from "./reviewCheck.js";
import { WorkingTreeState, collectFunctionalFreshness } from "./reviewFreshness.js";
import {
  WorkMode,
  WorkPolicy,
  WorkModePolicy,
  WorkPublicationPolicy,
  parseWorkPolicy,
} from "../infrastructure/yaml/workPolicyReader.js";

export interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

const defaultLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

export const WORK_POLICY_PATH = ".core/governance/work-policy.yml";

/**
 * Autorização capability-scoped: o PEDIDO HUMANO EXPLÍCITO de trabalho
 * ("Corrija os findings atuais." / "Implemente a tarefa atual.") autoriza commit
 * e push APENAS no objeto/checkpoint/branch inferidos e nas ações do modo. NÃO
 * cobre outro finding/checkpoint, próximo sub-checkpoint, review, disposition,
 * Ready, gate, merge, force-push ou `--no-verify`. O runtime não interpreta
 * linguagem natural: o AGENTS.md ensina o mapeamento; execução espontânea =
 * sem autorização (fail-closed).
 */
export type WorkAuthorizationArg = "explicit-work-request";

export function parseWorkAuthorization(
  raw: string | undefined
): WorkAuthorizationArg | null | "invalid" {
  if (raw === undefined) return null;
  return raw === "explicit-work-request" ? "explicit-work-request" : "invalid";
}

export interface WorkAuthorization {
  readonly kind: "none" | "explicit-work-request";
  readonly commitAllowed: boolean;
  readonly pushAllowed: boolean;
}

export interface WorkFinding {
  /** Qualificado `role#id` (ex.: `technical_audit#F1`). */
  readonly qualified: string;
  readonly role: string;
  readonly localId: string;
  readonly severity: string;
  readonly disposition: string;
  readonly location: string;
  readonly hasFixedResolution: boolean;
  /** Ref do commit funcional declarado na resolution (null = ausente). */
  readonly ref: string | null;
  /** Ref existe no histórico e é ancestral do functional HEAD? (null = sem ref para checar). */
  readonly refValid: boolean | null;
}

export interface WorkTaskRef {
  readonly title: string;
  readonly line: number;
}

export interface WorkObject {
  readonly checkpoint: string | null;
  readonly task?: WorkTaskRef;
  readonly findings?: readonly WorkFinding[];
  /** Lane de review pendente (quando o trabalho aponta um review, não implementação). */
  readonly reviewLane?: string;
}

export interface WorkValidation {
  readonly command: string;
  readonly level: "obrigatório" | "recomendado";
}

export interface WorkBrief {
  readonly specId: string;
  readonly checkpoint: string | null;
  readonly gitHead: string | null;
  readonly effectiveFunctionalHead: string | null;
  readonly workingTreeState: WorkingTreeState;
  readonly mode: WorkMode;
  readonly purpose: string;
  readonly modeBasis: readonly string[];
  readonly degraded: readonly string[];
  readonly object: WorkObject;
  readonly authorization: WorkAuthorization;
  readonly allowedActions: readonly string[];
  readonly forbiddenActions: readonly string[];
  readonly validations: readonly WorkValidation[];
  readonly publication: WorkPublicationPolicy;
  readonly expectsResolutions: boolean;
  readonly prBodyEditable: boolean;
  readonly stopConditions: readonly string[];
  readonly reportSections: readonly string[];
  readonly nextAction: { readonly description: string; readonly basis: readonly string[] };
}

export interface WorkBriefInput {
  readonly facts: HandoffFacts;
  /** Próxima ação do handoff (snapshot.derived) — base da precedência reusada. */
  readonly nextAction: NextAction;
  /** Findings consolidados do checkpoint (todas as lanes), já com ref validada. */
  readonly findings: readonly WorkFinding[];
  readonly policy: WorkPolicy;
  /** Mensagem de erro quando a policy é inválida (⇒ blocked). */
  readonly policyInvalid?: string | null;
  readonly workingTreeState: WorkingTreeState;
  readonly functionalDirtyFiles?: readonly string[];
  readonly effectiveFunctionalHead?: string | null;
  readonly authorization: WorkAuthorizationArg | null;
}

export interface CollectedWorkBrief {
  readonly snapshot: HandoffLoadSnapshot;
  readonly brief: WorkBrief;
}

export interface WorkBriefOptions extends HandoffOptions {
  readonly authorization?: WorkAuthorizationArg | null;
}

function normalizeCheckpoint(slug: string): string {
  return slug.replace(/^checkpoint-/, "");
}

function sameSha(a: string, b: string): boolean {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x.startsWith(y) || y.startsWith(x);
}

/** Reviews REQUIRED não satisfeitos (blocking) — apontam review, não implementação. */
function requiredReviewsPending(facts: HandoffFacts): string[] {
  return (facts.lifecycle?.reviewStatuses ?? []).filter((s) => s.blocking).map((s) => s.typeId);
}

/** Validações domínio-derivadas (recomendado) a partir do objeto de trabalho. */
function derivedValidations(specId: string, object: WorkObject): WorkValidation[] {
  const out: WorkValidation[] = [];
  const surfaces = (object.findings ?? []).map((f) => f.location).join(" ");
  if (/constraints/i.test(surfaces)) {
    out.push({ command: "npm run constraints:check", level: "recomendado" });
  }
  if (/\.core|package|dist|pack/i.test(surfaces)) {
    out.push({ command: "npm run test:smoke", level: "recomendado" });
    out.push({ command: "npm pack --dry-run", level: "recomendado" });
  }
  out.push({ command: `npm run handoff:check -- --spec ${specId}`, level: "recomendado" });
  return out;
}

/**
 * Inferência DETERMINÍSTICA do modo + projeção do contrato. Puro: nenhuma leitura
 * de fs/Git/GitHub — tudo vem do snapshot e da policy injetados.
 */
export function deriveWorkBrief(input: WorkBriefInput): WorkBrief {
  const { facts, nextAction, findings, policy } = input;
  const specId = /^(\d{4})/.exec(facts.spec.label)?.[1] ?? facts.spec.label;
  const checkpoint = facts.cursor?.checkpoint ?? null;
  const gitHead = facts.git.head;
  const effectiveFunctionalHead = input.effectiveFunctionalHead ?? gitHead;
  const head = effectiveFunctionalHead;
  const workingTreeState = input.workingTreeState;
  const modeBasis: string[] = [];
  const degraded: string[] = [];

  const openFindings = findings.filter((f) => f.disposition === "open");
  const allOpenResolved =
    openFindings.length > 0 &&
    openFindings.every((f) => f.hasFixedResolution && f.refValid !== false);
  const reqPending = requiredReviewsPending(facts);

  // ── Condições de BLOQUEIO (precedência máxima) ──────────────────────────────
  const prHeadDiffers =
    facts.pullRequest !== null && head !== null && !sameSha(facts.pullRequest.headRefOid, head);
  const prHeadDiverges = prHeadDiffers && (facts.git.behind ?? 0) > 0;

  let mode: WorkMode | null = null;
  if (input.policyInvalid) {
    mode = "blocked";
    modeBasis.push(`work-policy inválida: ${input.policyInvalid}`);
  } else if (!checkpoint) {
    mode = "blocked";
    modeBasis.push("state.yml sem topology/cursor — não há checkpoint ativo para trabalhar.");
  } else if (facts.driftWarnings.length > 0) {
    mode = "blocked";
    modeBasis.push("fontes/projeções divergentes — reconcilie antes de qualquer trabalho:");
    for (const w of facts.driftWarnings) modeBasis.push(`  ${w}`);
  } else if (workingTreeState === "functional-dirty") {
    mode = "blocked";
    modeBasis.push(
      "working tree com MUDANÇAS FUNCIONAIS não commitadas — o objeto de trabalho diverge de " +
        "qualquer commit; commite ou descarte antes de iniciar. Arquivos funcionais sujos:"
    );
    for (const file of input.functionalDirtyFiles ?? []) modeBasis.push(`  ${file}`);
  } else if (prHeadDiverges) {
    mode = "blocked";
    modeBasis.push(
      `PR/HEAD divergentes com remoto À FRENTE (behind ${facts.git.behind}): pull/reconcilie antes de trabalhar.`
    );
  } else if (facts.lifecycle?.gateDecision === "approved") {
    mode = "blocked";
    modeBasis.push(
      `gate do checkpoint ${checkpoint} já está approved — nenhuma nova implementação neste nó; confira o cursor (reconcile:check) ou abra o próximo nó (transição autorizada por gate).`
    );
  }

  // ── Mapa nextAction.kind → modo (refinado por findings×resolutions) ─────────
  if (mode === null) {
    switch (nextAction.kind) {
      case "reconcile-drift":
      case "reconcile-remote-source":
        mode = "blocked";
        modeBasis.push(nextAction.description, ...nextAction.basis.map((b) => `  ${b}`));
        break;
      case "resolve-findings":
        if (allOpenResolved) {
          mode = "await_revalidation";
          modeBasis.push(
            `${openFindings.length} finding(s) open, TODOS com resolution fixed e ref válida — ` +
              "nada a corrigir; a lane aguarda revalidação independente (reviewer/owner)."
          );
        } else {
          mode = "resolve_findings";
          const pendentes = openFindings.filter(
            (f) => !f.hasFixedResolution || f.refValid === false
          );
          modeBasis.push(
            `${openFindings.length} finding(s) open; ${pendentes.length} sem resolution fixed válida — corrigir a causa raiz.`,
            ...pendentes.map(
              (f) =>
                `  ${f.qualified}: ${f.hasFixedResolution ? `resolution fixed mas ref ${f.ref ?? "ausente"} inválida` : "sem resolution fixed"}`
            )
          );
        }
        break;
      case "run-required-review":
        mode = "await_revalidation";
        modeBasis.push(
          `review(s) OBRIGATÓRIO(s) pendente(s): ${reqPending.join(", ") || "(?)"} — aponta REVIEW, não implementação (use \`guidelines review <tipo>\`).`
        );
        break;
      case "prepare-ready":
        mode = "prepare_close";
        modeBasis.push(nextAction.description, ...nextAction.basis.map((b) => `  ${b}`));
        break;
      case "exercise-human-gate":
        mode = "current";
        modeBasis.push(
          "PR Ready com Human Gate pendente — decisão da OWNER; nenhum trabalho de implementação para o agente."
        );
        break;
      case "conclude-node-open-next":
        mode = "blocked";
        modeBasis.push(nextAction.description, ...nextAction.basis.map((b) => `  ${b}`));
        break;
      case "execute-task":
        mode = "implement_checkpoint";
        modeBasis.push(nextAction.description, ...nextAction.basis.map((b) => `  ${b}`));
        break;
      case "investigate-checkpoint":
      default:
        mode = "implement_checkpoint";
        modeBasis.push(nextAction.description, ...nextAction.basis.map((b) => `  ${b}`));
        break;
    }
  }

  // Degradações declaradas (não bloqueiam, mas o briefing nunca inventa fato).
  if (workingTreeState === "review-only") {
    degraded.push(
      "working tree contém APENAS artefatos de review não commitados — código funcional inalterado."
    );
  }
  if (prHeadDiffers && !prHeadDiverges && mode !== "blocked") {
    degraded.push(
      `PR head remoto (${facts.pullRequest!.headRefOid.slice(0, 7)}) atrás do HEAD local ${head} — push pendente; o briefing cobre o HEAD LOCAL.`
    );
  }
  const prSource = facts.sources.find((s) => s.id === "pull-request");
  if (prSource && prSource.status !== "fresh") {
    degraded.push(
      `fonte remota (PR) ${prSource.status}${prSource.detail ? ` — ${prSource.detail}` : ""}; fatos de PR/CI não observados (nada inventado).`
    );
  }

  const modePolicy: WorkModePolicy | undefined = policy.modes[mode];
  if (!modePolicy) {
    // Contrato incompleto é estado impossível (o reader exige todos os modos).
    throw new Error(`work-policy não define o modo "${mode}" — contrato incompleto.`);
  }

  // ── Objeto de trabalho ──────────────────────────────────────────────────────
  const openTasks = facts.tasks.filter((t) => !t.done);
  const firstOpenTask = openTasks[0];
  const object: WorkObject = {
    checkpoint,
    ...(mode === "implement_checkpoint" && firstOpenTask
      ? {
          task: {
            title: /\*\*(.+?)\*\*/.exec(firstOpenTask.text)?.[1] ?? firstOpenTask.text.slice(0, 80),
            line: firstOpenTask.line,
          },
        }
      : {}),
    ...(mode === "resolve_findings" || mode === "await_revalidation"
      ? { findings: openFindings }
      : {}),
    ...(mode === "await_revalidation" && reqPending.length > 0
      ? { reviewLane: reqPending[0] }
      : {}),
  };

  // ── Autorização ─────────────────────────────────────────────────────────────
  const authKind = input.authorization ?? "none";
  const commitAllowed =
    authKind === "explicit-work-request" &&
    modePolicy.publication.commit === "explicit-work-request";
  const pushAllowed =
    authKind === "explicit-work-request" && modePolicy.publication.push === "explicit-work-request";
  const authorization: WorkAuthorization = {
    kind: authKind,
    commitAllowed,
    pushAllowed,
  };

  // ── Validações (obrigatório da policy + recomendado domínio-derivado) ───────
  const validations: WorkValidation[] = [
    ...modePolicy.validations.map((c) => ({ command: c, level: "obrigatório" as const })),
    ...derivedValidations(specId, object).filter(
      (d) => !modePolicy.validations.includes(d.command)
    ),
  ];

  // ── Próxima ação por modo ───────────────────────────────────────────────────
  let next: { description: string; basis: readonly string[] };
  if (mode === "await_revalidation") {
    next = {
      description:
        "Solicitar revalidação independente por reviewer/owner sobre o functional HEAD " +
        `${head ?? "?"} — o implementador NÃO cria nova resolution nem fecha disposition.`,
      basis: [
        ...openFindings.map(
          (f) => `${f.qualified}: ${f.disposition} · resolution fixed (ref ${f.ref ?? "?"})`
        ),
        ...(object.reviewLane ? [`review obrigatório pendente: ${object.reviewLane}`] : []),
        "dispositions fecham só por reviewer/owner (review:check)",
      ],
    };
  } else if (mode === "current") {
    next = {
      description: "Nenhuma ação de implementação/fechamento pendente — não inventar tarefa.",
      basis: nextAction.basis,
    };
  } else {
    next = { description: nextAction.description, basis: nextAction.basis };
  }

  return {
    specId,
    checkpoint,
    gitHead,
    effectiveFunctionalHead,
    workingTreeState,
    mode,
    purpose: modePolicy.purpose,
    modeBasis,
    degraded,
    object,
    authorization,
    allowedActions: modePolicy.allowedActions,
    forbiddenActions: modePolicy.forbiddenActions,
    validations,
    publication: modePolicy.publication,
    expectsResolutions: modePolicy.expectsResolutions,
    prBodyEditable: modePolicy.prBodyEditable,
    stopConditions: modePolicy.stopConditions,
    reportSections: modePolicy.reportSections,
    nextAction: next,
  };
}

// ── Coleta (I/O) — mesmo snapshot do ato de carga ────────────────────────────

/** Ref existe no histórico E é ancestral do functional HEAD? */
function refIsValid(repoRoot: string, ref: string, head: string | null): boolean {
  try {
    execFileSync("git", ["cat-file", "-e", `${ref}^{commit}`], { cwd: repoRoot, stdio: "ignore" });
  } catch {
    return false;
  }
  if (!head) return true; // existe; sem head para comparar ancestralidade
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ref, head], {
      cwd: repoRoot,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

export function loadWorkPolicy(repoRoot: string): {
  policy: WorkPolicy | null;
  error: string | null;
} {
  const policyPath = path.join(repoRoot, WORK_POLICY_PATH);
  if (!fs.existsSync(policyPath)) {
    return { policy: null, error: `fonte governada ausente: ${WORK_POLICY_PATH}` };
  }
  try {
    return { policy: parseWorkPolicy(fs.readFileSync(policyPath, "utf-8")), error: null };
  } catch (e) {
    return { policy: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export function collectWorkBrief(
  repoRoot: string,
  options: WorkBriefOptions = {}
): CollectedWorkBrief {
  const snapshot = loadHandoffSnapshot(repoRoot, options);
  const facts = snapshot.collected.facts;
  const cursor = facts.cursor;
  const matches = (cp: string): boolean =>
    cursor !== null && normalizeCheckpoint(cp) === normalizeCheckpoint(cursor.checkpoint);

  const { artifacts } = discover(repoRoot);
  const reviews = artifacts.reviews.filter((r) => matches(r.checkpoint));
  const resolutionArtifacts = artifacts.resolutions.filter((r) => matches(r.checkpoint));

  const freshness = collectFunctionalFreshness(repoRoot, `${facts.spec.path}/reviews`);
  const head = freshness.effectiveFunctionalHead ?? facts.git.head;

  // role#id → resolution (action + ref) consolidada do checkpoint.
  const resByFinding = new Map<string, { action: string; ref: string | null }>();
  for (const artifact of resolutionArtifacts) {
    for (const res of artifact.resolutions) {
      resByFinding.set(res.finding, { action: res.action, ref: res.ref ?? null });
    }
  }

  const findings: WorkFinding[] = [];
  for (const review of reviews) {
    for (const f of review.findings) {
      const qualified = `${review.role}#${f.id}`;
      const res = resByFinding.get(qualified) ?? null;
      const ref = res?.ref ?? null;
      const refValid = ref ? refIsValid(repoRoot, ref, head) : null;
      findings.push({
        qualified,
        role: review.role,
        localId: f.id,
        severity: f.severity,
        disposition: f.disposition,
        location: f.location,
        hasFixedResolution: res?.action === "fixed",
        ref,
        refValid,
      });
    }
  }

  const { policy, error } = loadWorkPolicy(repoRoot);
  const brief = deriveWorkBrief({
    facts,
    nextAction: snapshot.derived.nextAction,
    findings,
    // policy null só com erro — fornecemos um stub vazio compatível só p/ tipos;
    // o modo será blocked e nenhum modePolicy é acessado além do blocked.
    policy: policy ?? ({ version: 1, modes: {} } as unknown as WorkPolicy),
    policyInvalid: error,
    workingTreeState: freshness.workingTreeState,
    functionalDirtyFiles: freshness.functionalDirtyFiles,
    effectiveFunctionalHead: freshness.effectiveFunctionalHead,
    authorization: options.authorization ?? null,
  });

  return { snapshot, brief };
}

// ── Renderer ─────────────────────────────────────────────────────────────────

function renderList(lines: string[], items: readonly string[], empty = "(nenhum)"): void {
  if (items.length === 0) {
    lines.push(`- ${empty}`);
    return;
  }
  for (const item of items) lines.push(`- ${item}`);
}

export function renderWorkBrief(collected: CollectedWorkBrief): string {
  const { snapshot, brief } = collected;
  const facts = snapshot.collected.facts;
  const pr = facts.pullRequest;
  const lines: string[] = [];

  lines.push(`# Briefing governado de trabalho — ${brief.mode} · ${facts.spec.label}`);
  lines.push("");
  lines.push("## 1. Retomada factual");
  lines.push(`- spec: ${facts.spec.label} · checkpoint: ${brief.checkpoint ?? "(sem cursor)"}`);
  lines.push(
    `- branch: ${facts.git.branch ?? "?"} · git HEAD: ${brief.gitHead ?? "?"} · functional HEAD: ${brief.effectiveFunctionalHead ?? "?"}`
  );
  lines.push(`- working tree: ${brief.workingTreeState}`);
  lines.push(
    pr
      ? `- PR: #${pr.number} (${pr.state}${pr.isDraft ? ", Draft" : ", Ready"}; base ${pr.baseRefName}; head ${pr.headRefOid.slice(0, 7)}) · CI: ${pr.checks.pass} pass · ${pr.checks.fail} fail · ${pr.checks.pending} pending`
      : `- PR: ${facts.activeNode?.githubPr ? `#${facts.activeNode.githubPr} (estado remoto NÃO observado)` : "(não declarado)"}`
  );
  lines.push(
    `- carga/recibo: ${
      snapshot.receiptSkippedReason
        ? `NÃO registrado — ${snapshot.receiptSkippedReason}`
        : `fresh (selo ${snapshot.derived.seal})`
    }`
  );
  lines.push("");
  lines.push(`## 2. Modo inferido: ${brief.mode.toUpperCase()}`);
  lines.push(`- propósito: ${brief.purpose}`);
  lines.push("- base factual:");
  for (const basis of brief.modeBasis) lines.push(`  - ${basis}`);
  if (brief.degraded.length > 0) {
    lines.push("- degradações declaradas:");
    for (const d of brief.degraded) lines.push(`  - ${d}`);
  }
  lines.push("");
  lines.push("## 3. Objeto de trabalho");
  lines.push(`- checkpoint: ${brief.object.checkpoint ?? "(sem cursor)"}`);
  if (brief.object.task) {
    lines.push(`- tarefa: ${brief.object.task.title} (tasks.md linha ${brief.object.task.line})`);
  }
  if (brief.object.reviewLane) {
    lines.push(`- lane de review pendente: ${brief.object.reviewLane}`);
  }
  if (brief.object.findings && brief.object.findings.length > 0) {
    lines.push("- findings:");
    for (const f of brief.object.findings) {
      lines.push(
        `  - ${f.qualified} · ${f.severity} · ${f.disposition} · ${f.location} — resolution: ${
          f.hasFixedResolution
            ? `fixed (ref ${f.ref ?? "?"}${f.refValid === false ? ", INVÁLIDA" : ""})`
            : "ausente/não-fixed"
        }`
      );
    }
  }
  if (!brief.object.task && !brief.object.findings && !brief.object.reviewLane) {
    lines.push("- (nenhum objeto materializado para este modo)");
  }
  lines.push("");
  lines.push("## 4. Base factual e fontes");
  lines.push(`- próxima ação derivada (handoff): ${snapshot.derived.nextAction.description}`);
  renderList(
    lines,
    snapshot.derived.nextAction.basis.map((b) => `base: ${b}`),
    "base: (nenhuma)"
  );
  lines.push(`- selo da carga: ${snapshot.derived.seal}`);
  lines.push("");
  lines.push("## 5. Ações permitidas");
  renderList(lines, brief.allowedActions);
  lines.push("");
  lines.push("## 6. Ações proibidas");
  renderList(lines, brief.forbiddenActions);
  lines.push("");
  lines.push("## 7. Validações");
  renderList(
    lines,
    brief.validations.map((v) => `${v.level}: \`${v.command}\``),
    "(nenhuma — modo read-only)"
  );
  lines.push("");
  lines.push("## 8. Publicação e autoridade");
  lines.push(
    `- política do modo: commit ${brief.publication.commit} · push ${brief.publication.push} · mixed_scope ${brief.publication.mixedScope}`
  );
  lines.push(
    `- expects_resolutions: ${brief.expectsResolutions} · pr_body_editable: ${brief.prBodyEditable}`
  );
  if (brief.authorization.kind === "explicit-work-request") {
    lines.push("- Autorização capability-scoped: ATIVA (explicit-work-request)");
    lines.push(
      `  - escopo: checkpoint ${brief.checkpoint ?? "?"} · branch ${facts.git.branch ?? "?"} · objeto inferido do modo;`
    );
    lines.push(
      `  - commit: ${brief.authorization.commitAllowed ? "autorizado" : "NÃO autorizado neste modo"}`
    );
    lines.push(
      `  - push: ${brief.authorization.pushAllowed ? "autorizado (normal; nunca --force/--no-verify)" : "NÃO autorizado neste modo"}`
    );
    lines.push(
      "  - NÃO cobre: outro finding/checkpoint, próximo sub-checkpoint, review, disposition, Ready, gate, merge."
    );
    if (!brief.authorization.commitAllowed) {
      lines.push("  - autorização NÃO cria trabalho: este modo não tem escrita a publicar.");
    }
  } else {
    lines.push("- Autorização capability-scoped: AUSENTE — briefing informativo.");
    lines.push("  - commit: não autorizado · push: não autorizado");
    lines.push(
      "  - Com pedido humano explícito, gere com `--authorization explicit-work-request`."
    );
  }
  lines.push("");
  lines.push("## 9. Critérios de parada");
  renderList(lines, brief.stopConditions);
  lines.push("");
  lines.push("## 10. Estrutura obrigatória do relatório final");
  lines.push(
    "Use EXATAMENTE estes headers (governados em work-policy.yml § " +
      `modes.${brief.mode}.report_sections):`
  );
  for (const section of brief.reportSections) lines.push(`- ${section}`);
  lines.push("");
  lines.push("## 11. Próxima ação");
  lines.push(`- ${brief.nextAction.description}`);
  for (const basis of brief.nextAction.basis) lines.push(`  - ${basis}`);
  lines.push("");
  lines.push(
    `_Briefing derivado do snapshot da carga (selo ${snapshot.derived.seal}). O runtime projeta o contrato; a execução é do agente sob autoridade do humano._`
  );
  return `${lines.join("\n")}\n`;
}

// ── Entrada CLI ──────────────────────────────────────────────────────────────

export function runWorkBrief(
  repoRoot: string,
  logger: Logger = defaultLogger,
  remoteOverride?: HandoffOptions["remote"],
  authorizationArg?: string
): number {
  const authorization = parseWorkAuthorization(authorizationArg);
  if (authorization === "invalid") {
    logger.error(
      `❌ autorização desconhecida: "${authorizationArg}". Única forma válida: explicit-work-request (mapeada de um pedido humano explícito de trabalho).`
    );
    return 2;
  }
  try {
    const collected = collectWorkBrief(repoRoot, {
      remote: remoteOverride !== undefined ? remoteOverride : ghRemotePrCollector,
      authorization,
    });
    logger.info(renderWorkBrief(collected).trimEnd());
    return 0;
  } catch (error) {
    logger.error(
      `❌ work (briefing) — estado irrecuperável: ${error instanceof Error ? error.message : String(error)}`
    );
    return 1;
  }
}
