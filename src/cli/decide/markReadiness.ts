/**
 * Decisão `mark-readiness` — declara, de forma governada, que o sub-checkpoint
 * ativo satisfez seus critérios de saída. Não avança marcador, não abre o
 * próximo sub-checkpoint e não exerce Human Gate.
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
import {
  HandoffSubCheckpoint,
  parseSubCheckpoints,
  resolveSubCheckpointWork,
  SUBCHECKPOINT_READINESS,
} from "../handoffFacts.js";
import {
  deriveMarkReadinessAvailability,
  markReadinessFactsFromDecisionSnapshot,
} from "../flow/GovernedFlow.js";
import {
  findDecisionType,
  HumanDecisionTypePolicy,
} from "../../infrastructure/yaml/humanDecisionPolicyReader.js";

export const MARK_READINESS_ID = "mark-readiness";

interface MarkReadinessPayload {
  readonly tasksFile: string;
  readonly checkpoint: string;
  readonly activeId: string;
  readonly activeTitle: string;
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

function activeSubCheckpoint(subs: readonly HandoffSubCheckpoint[]): HandoffSubCheckpoint | null {
  const active = subs.filter((s) => s.state === "in-progress");
  return active.length === 1 ? active[0] : null;
}

export function markReadinessMarker(
  tasksMd: string,
  activeId: string
): { text: string; ok: boolean; error: string | null } {
  const lineRe = new RegExp(
    `(^[ \\t]*-[ \\t]*\\[/\\][ \\t]*\\*\\*${escapeRe(activeId)}\\b[^\\n]*?\\*\\*)([^\\n]*)$`,
    "m"
  );
  const match = lineRe.exec(tasksMd);
  if (!match) {
    return {
      text: tasksMd,
      ok: false,
      error: `não encontrei "${activeId}" como [/] em tasks.md.`,
    };
  }
  if (match[0].includes("`readiness:")) {
    return {
      text: tasksMd,
      ok: false,
      error: `${activeId} já possui readiness declarada.`,
    };
  }
  const replacement = `${match[1]} \`readiness: ${SUBCHECKPOINT_READINESS}\`${match[2]}`;
  return { text: tasksMd.replace(lineRe, replacement), ok: true, error: null };
}

export class MarkReadinessDefinition implements HumanDecisionDefinition {
  readonly id = MARK_READINESS_ID;
  readonly title = "Declarar readiness do sub-checkpoint ativo";

  private policyOf(snapshot: DecisionSnapshot): HumanDecisionTypePolicy | undefined {
    return snapshot.policy ? findDecisionType(snapshot.policy, this.id) : undefined;
  }

  detect(snapshot: DecisionSnapshot): DecisionAvailability {
    return deriveMarkReadinessAvailability(markReadinessFactsFromDecisionSnapshot(snapshot));
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
    const active = activeSubCheckpoint(snapshot.subCheckpoints);
    const next = active
      ? snapshot.subCheckpoints.find((s) => s.state === "pending" && s.line > active.line)
      : null;
    const node = nodeLabel(snapshot);
    const pr = snapshot.facts.pullRequest;

    const summary =
      availability.status === "available" && active
        ? `Declarar readiness de ${active.id} no checkpoint ${node}.`
        : `Readiness do sub-checkpoint ativo ainda não pode ser declarada.`;
    const whyNow =
      "Readiness é o sinal explícito de que o sub-checkpoint ativo satisfez seus critérios de saída; sem ele, `advance-subcheckpoint` deve continuar bloqueado.";

    const bodyByKey: Record<string, readonly string[]> = {
      active_scope: active
        ? [`${active.id} — ${active.title} continua [/] em tasks.md.`]
        : ["(nenhum sub-checkpoint ativo inequívoco)"],
      exit_criteria: [
        snapshot.openFindings.length === 0
          ? "Findings do checkpoint estão fechados."
          : `${snapshot.openFindings.length} finding(s) ainda aberto(s).`,
        pr
          ? `CI: ${pr.checks.pass} ok · ${pr.checks.fail} falha(s) · ${pr.checks.pending} pendente(s).`
          : "Estado remoto de PR/CI não observado.",
        snapshot.workingTreeState === "clean"
          ? "Working tree limpa."
          : "Working tree não está limpa.",
      ],
      next_decision: next
        ? [
            `Após a readiness, a decisão aplicável será advance-subcheckpoint: ${active?.id} → ${next.id}.`,
            "O próximo sub-checkpoint NÃO será ativado por esta decisão.",
          ]
        : [
            "Após a readiness terminal, o próximo movimento será fechamento do checkpoint/Ready/Human Gate.",
            "Nenhuma transição interna será executada por esta decisão.",
          ],
      consequences: policy.consequences,
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
          label: `ativo ${active.id}`,
          value: `tasks.md linha ${active.line} · [/] + readiness · ${active.title}`,
        });
      }
      technicalDetails.push({ label: "arquivo", value: `${snapshot.specPath}/tasks.md` });
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
      consequences: policy.consequences,
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
    if (choiceId === "cancel" || choiceId === "keep" || choiceId === "request-explanation") {
      return {
        ...base,
        mutating: false,
        changes: [],
        preserved: ["tasks.md inalterado", "sub-checkpoint atual permanece sem readiness nova"],
        commitMessage: null,
        preconditions: [],
        nextHuman: [],
        note: ["Nada foi alterado."],
        payload: null,
      };
    }

    const active = activeSubCheckpoint(snapshot.subCheckpoints);
    if (!active) {
      return {
        ...base,
        mutating: false,
        changes: [],
        preserved: [],
        commitMessage: null,
        preconditions: [],
        nextHuman: [],
        note: ["Não há sub-checkpoint ativo inequívoco."],
        payload: null,
      };
    }
    const tasksFile = toPosix(`${snapshot.specPath}/tasks.md`);
    const payload: MarkReadinessPayload = {
      tasksFile,
      checkpoint: snapshot.checkpoint ?? "",
      activeId: active.id,
      activeTitle: active.title,
    };
    return {
      ...base,
      mutating: true,
      changes: [
        {
          path: tasksFile,
          description: `${active.id}: adiciona readiness ${SUBCHECKPOINT_READINESS}`,
        },
      ],
      preserved: [
        "marcador [/] do sub-checkpoint ativo",
        "marcadores dos demais sub-checkpoints",
        "state.yml e active.yml",
        "reviews e gates",
        "topologia",
        "PR",
        "código funcional",
      ],
      commitMessage: `docs(spec-${snapshot.specId}): declara readiness de ${active.id}`,
      preconditions: [
        { label: "selo do snapshot", expected: snapshot.seal },
        { label: "git HEAD", expected: snapshot.gitHead ?? "?" },
        { label: `${active.id} em tasks.md`, expected: "[/] sem readiness" },
      ],
      nextHuman: [
        "`npm run flow -- work` passará a projetar a próxima decisão governada.",
        "A readiness NÃO avançou sub-checkpoint, NÃO criou gate e NÃO autorizou Ready/Human Gate/merge.",
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
    const payload = plan.payload as MarkReadinessPayload;
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
    const edited = markReadinessMarker(before, payload.activeId);
    if (!edited.ok) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: [`Edição abortada: ${edited.error}`],
      };
    }

    const newSubs = parseSubCheckpoints(edited.text, payload.checkpoint);
    const active = newSubs.filter((s) => s.state === "in-progress");
    const current = active.find((s) => s.id === payload.activeId);
    if (active.length !== 1 || !current || current.readiness !== SUBCHECKPOINT_READINESS) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: ["Simulação falhou: readiness não ficou no único [/] ativo."],
      };
    }
    const projected = resolveSubCheckpointWork({
      subCheckpoints: newSubs,
      lifecycle: {
        reviewDecisions: [],
        requiredReviewRoles: [],
        reviewStatuses: [],
        openFindings: 0,
        openBlocking: 0,
        closedFindings: 0,
        resolutions: 0,
        gateDecision: null,
      },
    } as never);
    if (projected.kind !== "transition" && projected.kind !== "terminal-ready") {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: [
          `Simulação falhou: estado projetado não infere transição/readiness terminal (inferido: ${projected.kind}).`,
        ],
      };
    }

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
      ctx.git.commit(plan.commitMessage ?? `docs: declara readiness`);
    } catch (e) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: [`commit falhou (nada pushado): ${e instanceof Error ? e.message : String(e)}`],
      };
    }
    const committed = ctx.git.revParseShortHead();
    messages.push(`readiness registrada: ${committed} — "${plan.commitMessage}"`);
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
