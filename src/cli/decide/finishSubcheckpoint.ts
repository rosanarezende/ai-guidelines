/**
 * Decisão `finish-subcheckpoint` — caminho humano único para o caso comum:
 * critérios de saída satisfeitos + próximo sub-checkpoint pendente.
 *
 * Diferente de `mark-readiness`, não persiste uma readiness intermediária.
 * Diferente de `advance-subcheckpoint`, não exige que essa readiness já exista
 * em commit separado. A elegibilidade reaproveita a mesma derivação comum de
 * readiness/advance; o efeito permitido continua sendo só tasks.md.
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
import { HandoffFacts, parseSubCheckpoints, resolveSubCheckpointWork } from "../handoffFacts.js";
import { advanceTransitionPair, deriveAdvanceEligibility } from "./advanceEligibility.js";
import { advanceSubCheckpointMarkers } from "./advanceSubcheckpoint.js";
import {
  FINISH_SUBCHECKPOINT_ID,
  advanceEligibilityFactsFromDecisionSnapshot,
  deriveFinishSubcheckpointAvailability,
  deriveMarkReadinessAvailability,
  markReadinessFactsFromDecisionSnapshot,
} from "../flow/GovernedFlow.js";
import {
  findDecisionType,
  HumanDecisionTypePolicy,
} from "../../infrastructure/yaml/humanDecisionPolicyReader.js";

interface FinishPayload {
  readonly tasksFile: string;
  readonly checkpoint: string;
  readonly concludeId: string;
  readonly activateId: string;
  readonly openFindings: number;
  readonly closedFindings: number;
}

function toPosix(p: string): string {
  return p.replace(/\\/g, "/");
}

function nodeLabel(snapshot: DecisionSnapshot): string {
  return (snapshot.checkpoint ?? "checkpoint").replace(/^checkpoint-/, "");
}

export class FinishSubcheckpointDefinition implements HumanDecisionDefinition {
  readonly id = FINISH_SUBCHECKPOINT_ID;
  readonly title = "Concluir ponto atual e iniciar o próximo";

  private policyOf(snapshot: DecisionSnapshot): HumanDecisionTypePolicy | undefined {
    return snapshot.policy ? findDecisionType(snapshot.policy, this.id) : undefined;
  }

  detect(snapshot: DecisionSnapshot): DecisionAvailability {
    const markReadiness = deriveMarkReadinessAvailability(
      markReadinessFactsFromDecisionSnapshot(snapshot)
    );
    const advanceSubcheckpoint = deriveAdvanceEligibility(
      advanceEligibilityFactsFromDecisionSnapshot(snapshot)
    );
    return deriveFinishSubcheckpointAvailability({
      policyDeclared:
        snapshot.policy !== null &&
        findDecisionType(snapshot.policy, FINISH_SUBCHECKPOINT_ID) !== undefined,
      subCheckpoints: snapshot.subCheckpoints,
      markReadiness,
      advanceSubcheckpoint,
    });
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
    const pair = advanceTransitionPair(snapshot.subCheckpoints);
    const active =
      pair?.active ?? snapshot.subCheckpoints.find((s) => s.state === "in-progress") ?? null;
    const next = pair?.next ?? null;
    const lc = snapshot.facts.lifecycle;
    const pr = snapshot.facts.pullRequest;

    const summary =
      availability.status === "available" && pair
        ? `Concluir ${pair.active.id} e iniciar ${pair.next.id} no checkpoint ${nodeLabel(snapshot)}.`
        : "A conclusão em passo único ainda não está disponível.";
    const whyNow =
      "Este é o caminho normal de fim de sub-checkpoint interno: o sistema valida readiness como critério e registra a troca de marcadores em uma única decisão humana.";

    const bodyByKey: Record<string, readonly string[]> = {
      completed: active
        ? [`${active.id} — ${active.title}.`]
        : ["(nenhum sub-checkpoint ativo inequívoco)"],
      exit_criteria: [
        availability.status === "available"
          ? "Critérios de saída satisfeitos pela mesma regra que governa readiness/advance."
          : (availability.reasons[0] ?? "Critérios de saída ainda não satisfeitos."),
        lc && lc.openFindings > 0
          ? `Há ${lc.openFindings} finding(s) aberto(s).`
          : "Sem findings abertos bloqueando a conclusão.",
        pr
          ? `CI: ${pr.checks.pass} ok · ${pr.checks.fail} falha(s) · ${pr.checks.pending} pendente(s).`
          : "Estado remoto de PR/CI não observado.",
      ],
      next_starts: next
        ? [`Começa ${next.id} — ${next.title}.`]
        : ["(não há próximo sub-checkpoint pendente)"],
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
      if (pair) {
        technicalDetails.push({
          label: `concluir ${pair.active.id}`,
          value: `tasks.md linha ${pair.active.line} · [/] → [x] · ${pair.active.title}`,
        });
        technicalDetails.push({
          label: `ativar ${pair.next.id}`,
          value: `tasks.md linha ${pair.next.line} · [ ] → [/] · ${pair.next.title}`,
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
        preserved: ["tasks.md inalterado", "sub-checkpoint atual permanece ativo"],
        commitMessage: null,
        preconditions: [],
        nextHuman: [],
        note: ["Nada foi alterado."],
        payload: null,
      };
    }

    const pair = advanceTransitionPair(snapshot.subCheckpoints);
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
    const payload: FinishPayload = {
      tasksFile,
      checkpoint: snapshot.checkpoint ?? "",
      concludeId: pair.active.id,
      activateId: pair.next.id,
      openFindings: snapshot.facts.lifecycle?.openFindings ?? 0,
      closedFindings: snapshot.facts.lifecycle?.closedFindings ?? 0,
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
      commitMessage: `docs(spec-${snapshot.specId}): conclui ${pair.active.id} e ativa ${pair.next.id}`,
      preconditions: [
        { label: "selo do snapshot", expected: snapshot.seal },
        { label: "git HEAD", expected: snapshot.gitHead ?? "?" },
        { label: `${pair.active.id} em tasks.md`, expected: "[/] (em andamento)" },
        { label: `${pair.next.id} em tasks.md`, expected: "[ ] (pendente)" },
      ],
      nextHuman: [
        `\`npm run flow -- work\` passará a apontar ${pair.next.id} como objeto de IMPLEMENT_CHECKPOINT.`,
        "A decisão NÃO implementou o próximo sub-checkpoint nem autorizou Ready/Human Gate/gate/merge.",
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
    const payload = plan.payload as FinishPayload;
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
    const edited = advanceSubCheckpointMarkers(before, payload.concludeId, payload.activateId);
    if (!edited.ok) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: [`Edição abortada: ${edited.error}`],
      };
    }

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
    const projected = resolveSubCheckpointWork({
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
    } as unknown as HandoffFacts);
    if (projected.kind !== "implement" || projected.subCheckpoint.id !== payload.activateId) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: [
          `Simulação falhou: o estado projetado não infere IMPLEMENT_CHECKPOINT com objeto ${payload.activateId}. Nada foi escrito.`,
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
      ctx.git.commit(plan.commitMessage ?? "docs: conclui sub-checkpoint");
    } catch (e) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: [`commit falhou (nada pushado): ${e instanceof Error ? e.message : String(e)}`],
      };
    }
    const committed = ctx.git.revParseShortHead();
    messages.push(`sub-checkpoint concluído: ${committed} — "${plan.commitMessage}"`);
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
