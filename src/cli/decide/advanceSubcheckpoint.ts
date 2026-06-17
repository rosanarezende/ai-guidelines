/**
 * Decisão `advance-subcheckpoint` — a owner conclui o sub-checkpoint atual e ativa
 * o próximo dentro do MESMO checkpoint (transição de estado interno de execução).
 *
 * NÃO é Human Gate: não conclui o nó, não exerce gate, não mexe na topologia. O
 * efeito altera EXCLUSIVAMENTE dois marcadores em tasks.md (atual `[/]→[x]`,
 * próximo `[ ]→[/]`) por edição ESTRUTURADA (por id + marcador), preservando
 * descrição/indentação/comentários/encoding/line endings e todo o resto.
 *
 * Consistência com `guidelines work`: a elegibilidade vem da derivação ÚNICA
 * `deriveAdvanceEligibility` (advanceEligibility.ts) — a MESMA que `work` consome
 * sobre o mesmo snapshot factual. `decide` e `work` nunca divergem na pergunta "a
 * transição pode ser exercida?". Antes de escrever, simula o estado projetado e
 * exige que `work` passe a inferir `implement_checkpoint` com o próximo como objeto
 * (validação prospectiva). Zero LLM (ADR 0018).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import {
  DecisionApplyContext,
  DecisionApplyResult,
  DecisionAvailability,
  DecisionChoiceParams,
  DecisionPlan,
  HumanDecisionBrief,
  HumanDecisionChoice,
  HumanDecisionDefinition,
  HumanDecisionSection,
  HumanDecisionTechnicalDetail,
} from "./model.js";
import { DecisionSnapshot } from "./snapshot.js";
import { HandoffFacts, parseSubCheckpoints } from "../handoffFacts.js";
import { resolveSubCheckpointWork } from "../workBrief.js";
import {
  ADVANCE_SUBCHECKPOINT_ID,
  AdvanceTransitionPair,
  advanceTransitionPair,
  deriveAdvanceEligibility,
} from "./advanceEligibility.js";
import { advanceEligibilityFactsFromDecisionSnapshot } from "../flow/GovernedFlow.js";
import {
  findDecisionType,
  HumanDecisionTypePolicy,
} from "../../infrastructure/yaml/humanDecisionPolicyReader.js";

export { ADVANCE_SUBCHECKPOINT_ID };

interface AdvancePayload {
  readonly tasksFile: string;
  readonly checkpoint: string;
  readonly concludeId: string;
  readonly activateId: string;
  readonly activateTitle: string;
  readonly openFindings: number;
  readonly closedFindings: number;
}

function toPosix(p: string): string {
  return p.replace(/\\/g, "/");
}

function nodeLabel(snapshot: DecisionSnapshot): string {
  return (snapshot.checkpoint ?? "checkpoint").replace(/^checkpoint-/, "");
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Edição ESTRUTURADA dos marcadores: localiza a linha pelo id do sub-checkpoint
 * e troca SOMENTE o caractere do marcador (`/`→`x` no concluído, ` `→`/` no
 * ativado). Não toca newlines (preserva CRLF/LF e bytes do resto da linha).
 *
 * Ao CONCLUIR, REMOVE o token `` `readiness: …` `` da linha concluída: readiness
 * só vale para o `[/]` ativo (invariante de coerência), então um `[x]` jamais o
 * carrega. O ativado nasce `[/]` SEM readiness (ainda em implementação).
 */
export function advanceSubCheckpointMarkers(
  tasksMd: string,
  concludeId: string,
  activateId: string
): { text: string; ok: boolean; error: string | null } {
  const concludeRe = new RegExp(`(-[ \\t]*\\[)/(\\][ \\t]*\\*\\*${escapeRe(concludeId)}\\b)`);
  const activateRe = new RegExp(`(-[ \\t]*\\[) (\\][ \\t]*\\*\\*${escapeRe(activateId)}\\b)`);
  // Remove o code-span de readiness logo após o título em negrito do concluído.
  const stripReadinessRe = new RegExp(
    `(\\*\\*${escapeRe(concludeId)}\\b[^\\n]*?\\*\\*)[ \\t]*\`readiness:[^\`\\n]*\``
  );
  if (!concludeRe.test(tasksMd)) {
    return {
      text: tasksMd,
      ok: false,
      error: `não encontrei "${concludeId}" como [/] em tasks.md.`,
    };
  }
  if (!activateRe.test(tasksMd)) {
    return {
      text: tasksMd,
      ok: false,
      error: `não encontrei "${activateId}" como [ ] em tasks.md.`,
    };
  }
  const text = tasksMd
    .replace(concludeRe, "$1x$2")
    .replace(activateRe, "$1/$2")
    .replace(stripReadinessRe, "$1");
  return { text, ok: true, error: null };
}

export class AdvanceSubcheckpointDefinition implements HumanDecisionDefinition {
  readonly id = ADVANCE_SUBCHECKPOINT_ID;
  readonly title = "Iniciar o próximo sub-checkpoint";

  private policyOf(snapshot: DecisionSnapshot): HumanDecisionTypePolicy | undefined {
    return snapshot.policy ? findDecisionType(snapshot.policy, this.id) : undefined;
  }

  /** Par (atual, próximo) quando a forma é exatamente uma transição concluir+ativar. */
  private pair(snapshot: DecisionSnapshot): AdvanceTransitionPair | null {
    return advanceTransitionPair(snapshot.subCheckpoints);
  }

  detect(snapshot: DecisionSnapshot): DecisionAvailability {
    return deriveAdvanceEligibility(advanceEligibilityFactsFromDecisionSnapshot(snapshot));
  }

  choices(snapshot: DecisionSnapshot): readonly HumanDecisionChoice[] {
    const policy = this.policyOf(snapshot);
    if (!policy) return [];
    const available = this.detect(snapshot).status === "available";
    return policy.choices.map((c) => ({
      id: c.id,
      label: c.label,
      mutating: c.mutating,
      available: c.mutating ? available : true,
    }));
  }

  buildBrief(snapshot: DecisionSnapshot, opts: { technical: boolean }): HumanDecisionBrief {
    const policy = this.policyOf(snapshot)!;
    const availability = this.detect(snapshot);
    const node = nodeLabel(snapshot);
    const pair = this.pair(snapshot);
    const active =
      pair?.active ?? snapshot.subCheckpoints.find((s) => s.state === "in-progress") ?? null;
    const next = pair?.next ?? null;
    const lc = snapshot.facts.lifecycle;
    const pr = snapshot.facts.pullRequest;
    const terminalNoNext =
      !next &&
      active !== null &&
      availability.status === "not-applicable" &&
      availability.reasons.some((r) => r.includes("Não há próximo sub-checkpoint pendente"));

    const summary = next
      ? `Iniciar o próximo sub-checkpoint do ${node}: concluir ${active!.id} e ativar ${next.id}.`
      : terminalNoNext
        ? `A transição interna de sub-checkpoint não se aplica ao terminal do ${node}.`
        : `O ${node} ainda não pode avançar para o próximo sub-checkpoint.`;
    const whyNow = terminalNoNext
      ? "Não há próximo sub-checkpoint pendente; o próximo movimento governado é fechamento do checkpoint/Ready/Human Gate."
      : "O trabalho identifica uma transição interna pendente; ativar o próximo é um ato " +
        "explícito da owner — não um efeito colateral do fechamento dos problemas.";

    const consequences = next
      ? [
          `${active!.id} será marcado como concluído.`,
          `${next.id} será marcado como ativo.`,
          "`guidelines work` passará a apontá-lo como objeto de implementação.",
        ]
      : terminalNoNext
        ? [
            "Nenhum sub-checkpoint será marcado ou ativado por esta decisão.",
            "Use o fechamento do checkpoint/Ready/Human Gate conforme a política governada.",
          ]
        : policy.consequences;

    const bodyByKey: Record<string, readonly string[]> = {
      completed: active
        ? [`O ${active.id} entregou: ${active.title}.`]
        : ["(nenhum sub-checkpoint concluível no estado atual)"],
      exit_criteria: [
        active?.readiness === "ready-for-transition"
          ? `${active.id} declarou seus critérios de saída satisfeitos (readiness em tasks.md).`
          : `${active?.id ?? "O sub-checkpoint atual"} ainda não declarou seus critérios de saída satisfeitos (readiness).`,
        lc && lc.openFindings > 0
          ? "Há problemas abertos na auditoria — resolva antes de avançar."
          : "Sem findings bloqueantes abertos (findings fechados NÃO concluem o sub-checkpoint).",
        pr && pr.checks.fail === 0 && pr.checks.pending === 0
          ? "Integração contínua e validações estão verdes."
          : "As validações locais estão verdes.",
      ],
      next_starts: next
        ? [`Começa o ${next.id} — ${next.title}.`]
        : terminalNoNext
          ? [
              "(nenhum próximo sub-checkpoint pendente; a próxima ação é fechamento do checkpoint/Ready/Human Gate)",
            ]
          : ["(nenhum próximo sub-checkpoint pendente)"],
      consequences,
      not_authorized: policy.notAuthorized,
    };

    const sections: HumanDecisionSection[] = policy.sections.map((s) => ({
      key: s.key,
      heading: s.heading,
      body: bodyByKey[s.key] ?? [],
    }));

    const technicalDetails: HumanDecisionTechnicalDetail[] = [];
    if (opts.technical) {
      technicalDetails.push({ label: "checkpoint", value: snapshot.checkpoint ?? "—" });
      if (active) {
        technicalDetails.push({
          label: `atual ${active.id}`,
          value: `tasks.md linha ${active.line} · [/] → [x] · ${active.title}`,
        });
      }
      if (next) {
        technicalDetails.push({
          label: `próximo ${next.id}`,
          value: `tasks.md linha ${next.line} · [ ] → [/] · ${next.title}`,
        });
      }
      technicalDetails.push({ label: "arquivo", value: `${snapshot.specPath}/tasks.md` });
      technicalDetails.push({
        label: "functional HEAD",
        value: snapshot.effectiveFunctionalHead ?? "—",
      });
      technicalDetails.push({ label: "seal", value: snapshot.seal });
    }

    return {
      id: this.id,
      type: this.id,
      status: availability.status,
      title: policy.title,
      summary,
      whyNow,
      sections,
      consequences,
      notAuthorized: policy.notAuthorized,
      choices: this.choices(snapshot),
      technicalDetails,
      sources: [{ label: "tasks", ref: `${snapshot.specPath}/tasks.md` }],
      blockedReasons: availability.status === "available" ? [] : availability.reasons,
    };
  }

  plan(snapshot: DecisionSnapshot, choiceId: string, _params?: DecisionChoiceParams): DecisionPlan {
    const policy = this.policyOf(snapshot)!;
    const choice = policy.choices.find((c) => c.id === choiceId);
    if (!choice) {
      throw new Error(
        `Escolha desconhecida para ${this.id}: "${choiceId}". Disponíveis: ${policy.choices
          .map((c) => c.id)
          .join(", ")}.`
      );
    }
    const base = {
      type: this.id,
      choiceId,
      seal: snapshot.seal,
      gitHead: snapshot.gitHead,
    } as const;

    if (choiceId === "cancel") {
      return {
        ...base,
        mutating: false,
        changes: [],
        preserved: [],
        commitMessage: null,
        preconditions: [],
        nextHuman: [],
        note: ["Nada foi alterado."],
        payload: null,
      };
    }
    if (choiceId === "keep") {
      return {
        ...base,
        mutating: false,
        changes: [],
        preserved: ["tasks.md inalterado", "sub-checkpoint atual permanece ativo"],
        commitMessage: null,
        preconditions: [],
        nextHuman: [],
        note: ["O sub-checkpoint atual permanece ativo. Nada foi alterado."],
        payload: null,
      };
    }
    if (choiceId === "request-explanation") {
      return {
        ...base,
        mutating: false,
        changes: [],
        preserved: [],
        commitMessage: null,
        preconditions: [],
        nextHuman: [],
        note: [
          "Nenhum artefato foi alterado.",
          "Solicite ao implementador/reviewer o esclarecimento desejado.",
        ],
        payload: null,
      };
    }

    // advance → transição (concluir atual + ativar próximo).
    const pair = this.pair(snapshot);
    if (!pair) {
      return {
        ...base,
        mutating: false,
        changes: [],
        preserved: [],
        commitMessage: null,
        preconditions: [],
        nextHuman: [],
        note: ["Não há transição concluir+ativar inequívoca no estado atual."],
        payload: null,
      };
    }
    const tasksFile = toPosix(`${snapshot.specPath}/tasks.md`);
    const lc = snapshot.facts.lifecycle;
    const payload: AdvancePayload = {
      tasksFile,
      checkpoint: snapshot.checkpoint ?? "",
      concludeId: pair.active.id,
      activateId: pair.next.id,
      activateTitle: pair.next.title,
      openFindings: lc?.openFindings ?? 0,
      closedFindings: lc?.closedFindings ?? 0,
    };
    return {
      ...base,
      mutating: true,
      changes: [
        { path: tasksFile, description: `${pair.active.id}: [/] → [x]` },
        { path: tasksFile, description: `${pair.next.id}: [ ] → [/]` },
      ],
      preserved: [
        "state.yml e o cursor da spec",
        "topologia",
        "PR",
        "código funcional",
        "reviews e gate",
        "demais sub-checkpoints",
        "indentação, comentários, encoding e line endings de tasks.md",
      ],
      commitMessage: `docs(spec-${snapshot.specId}): avança ${nodeLabel(snapshot)} para ${pair.next.id}`,
      preconditions: [
        { label: "selo do snapshot", expected: snapshot.seal },
        { label: "git HEAD", expected: snapshot.gitHead ?? "?" },
        { label: `${pair.active.id} em tasks.md`, expected: "[/] (em andamento)" },
        { label: `${pair.next.id} em tasks.md`, expected: "[ ] (pendente)" },
      ],
      nextHuman: [
        `\`guidelines work\` passará a apontar ${pair.next.id} como objeto de IMPLEMENT_CHECKPOINT.`,
        "A transição NÃO implementou o próximo sub-checkpoint nem autorizou Ready/Human Gate/gate/merge.",
      ],
      note: [],
      payload,
    };
  }

  async apply(plan: DecisionPlan, ctx: DecisionApplyContext): Promise<DecisionApplyResult> {
    if (!plan.mutating || plan.payload === null) {
      return {
        ok: true,
        committed: null,
        pushed: false,
        messages: ["Nada a aplicar (read-only)."],
      };
    }
    const payload = plan.payload as AdvancePayload;
    const abs = path.join(ctx.repoRoot, payload.tasksFile);
    if (!fs.existsSync(abs)) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: [`tasks.md ausente: ${payload.tasksFile}.`],
      };
    }
    const before = fs.readFileSync(abs, "utf8");

    // ── Edição estruturada (em memória) ──────────────────────────────────────
    const edited = advanceSubCheckpointMarkers(before, payload.concludeId, payload.activateId);
    if (!edited.ok) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: [`Edição abortada: ${edited.error}`],
      };
    }

    // ── Validação PROSPECTIVA: o estado projetado deve virar IMPLEMENT com objeto ──
    const newSubs = parseSubCheckpoints(edited.text, payload.checkpoint);
    const inProgress = newSubs.filter((s) => s.state === "in-progress");
    const concluded = newSubs.find((s) => s.id === payload.concludeId);
    if (inProgress.length !== 1 || inProgress[0].id !== payload.activateId) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: [
          "Simulação falhou: o estado projetado não tem exatamente o próximo sub-checkpoint ativo.",
        ],
      };
    }
    if (!concluded || concluded.state !== "done") {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: [
          "Simulação falhou: o sub-checkpoint atual não ficou concluído no estado projetado.",
        ],
      };
    }
    const projectedFacts = {
      subCheckpoints: newSubs,
      lifecycle: {
        reviewDecisions: [],
        requiredReviewRoles: [],
        reviewStatuses: [],
        openFindings: payload.openFindings,
        openBlocking: 0,
        closedFindings: payload.closedFindings,
        resolutions: 0,
        gateDecision: null,
      },
    } as unknown as HandoffFacts;
    const projected = resolveSubCheckpointWork(projectedFacts);
    if (projected.kind !== "implement" || projected.subCheckpoint.id !== payload.activateId) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: [
          `Simulação falhou: o estado projetado não infere IMPLEMENT_CHECKPOINT com objeto ${payload.activateId} ` +
            `(inferido: ${projected.kind}). Nada foi escrito.`,
        ],
      };
    }

    // ── Escrita + guarda de diff (somente tasks.md) ──────────────────────────
    fs.writeFileSync(abs, edited.text);
    const dirty = ctx.git.porcelainPaths();
    if (dirty === null) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: ["git status indisponível — guard de diff abortou."],
      };
    }
    const unexpected = dirty.map(toPosix).filter((p) => p !== payload.tasksFile);
    if (unexpected.length > 0) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: [
          `diff misto (mixed_diff: forbidden) — paths inesperados: ${unexpected.join(", ")}.`,
        ],
      };
    }

    const messages: string[] = [];
    try {
      ctx.git.add(payload.tasksFile);
      ctx.git.commit(plan.commitMessage ?? `docs: avança sub-checkpoint`);
    } catch (e) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: [`commit falhou (nada pushado): ${e instanceof Error ? e.message : String(e)}`],
      };
    }
    const committed = ctx.git.revParseShortHead();
    messages.push(`transição registrada: ${committed} — "${plan.commitMessage}"`);
    try {
      ctx.git.push();
    } catch (e) {
      return {
        ok: false,
        committed,
        pushed: false,
        messages: [
          ...messages,
          `push falhou; o commit ${committed} permanece LOCAL (nada perdido): ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`,
        ],
      };
    }
    messages.push("push normal concluído.");
    return { ok: true, committed, pushed: true, messages };
  }
}
