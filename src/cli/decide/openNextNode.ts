/**
 * Decisão `open-next-node` — briefing/preflight governado para a transição
 * pós-Human Gate de um nó não-terminal. Nesta etapa ela fecha a divergência
 * work↔decide: quando `work` diz "concluir nó e abrir próximo PR", `decide`
 * também oferece uma decisão situada, sem inventar efeitos automáticos.
 *
 * CO-10.3 deliberadamente não executa checkout/PR create aqui: a abertura
 * efetiva precisa de um executor transacional próprio (branch → PR → state.yml
 * com número factual → active.yml → tasks.md → PR body). O briefing nomeia esse
 * contrato para impedir a volta da orquestração informal.
 */
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
  deriveOpenNextNodeAvailability,
  OPEN_NEXT_NODE_ID,
  openNextNodeFactsFromDecisionSnapshot,
} from "../flow/GovernedFlow.js";
import {
  findDecisionType,
  HumanDecisionTypePolicy,
} from "../../infrastructure/yaml/humanDecisionPolicyReader.js";

function nodeLabel(snapshot: DecisionSnapshot): string {
  return snapshot.facts.activeNode?.id ?? snapshot.checkpoint?.replace(/^checkpoint-/, "") ?? "nó";
}

function nextBranch(specId: string, nodeId: string): string {
  return `feat/spec-${specId}-${nodeId}`;
}

export class OpenNextNodeDefinition implements HumanDecisionDefinition {
  readonly id = OPEN_NEXT_NODE_ID;
  readonly title = "Preparar abertura do próximo nó";

  private policyOf(snapshot: DecisionSnapshot): HumanDecisionTypePolicy | undefined {
    return snapshot.policy ? findDecisionType(snapshot.policy, this.id) : undefined;
  }

  detect(snapshot: DecisionSnapshot): DecisionAvailability {
    return deriveOpenNextNodeAvailability(openNextNodeFactsFromDecisionSnapshot(snapshot));
  }

  choices(snapshot: DecisionSnapshot): readonly HumanDecisionChoice[] {
    const policy = this.policyOf(snapshot);
    if (!policy) return [];
    const applicable = this.detect(snapshot).status !== "not-applicable";
    return policy.choices.map((c) => ({
      id: c.id,
      label: c.label,
      mutating: c.mutating,
      available: c.id === "cancel" ? true : applicable,
    }));
  }

  buildBrief(snapshot: DecisionSnapshot, opts: { technical: boolean }): HumanDecisionBrief {
    const policy = this.policyOf(snapshot)!;
    const availability = this.detect(snapshot);
    const active = snapshot.facts.activeNode;
    const next = snapshot.facts.nextPlannedNode;
    const pr = snapshot.facts.pullRequest;
    const currentNode = nodeLabel(snapshot);
    const branch = next ? nextBranch(snapshot.specId, next.id) : "(sem próximo nó)";

    const summary =
      availability.status === "available"
        ? `Preparar abertura governada do próximo nó: ${active!.id} → ${next!.id}.`
        : `A abertura do próximo nó ainda não pode ser preparada.`;
    const whyNow =
      "Após o Human Gate aprovado, a transição de nó deixa de ser trabalho de implementação " +
      "e vira lifecycle governado. O briefing explicita a sequência antes de qualquer PR novo.";

    const bodyByKey: Record<string, readonly string[]> = {
      completed_node: active
        ? [
            `${active.id} (seq ${active.sequence ?? "?"}) é o nó ativo da topologia.`,
            snapshot.facts.lifecycle?.gateDecision === "approved"
              ? "Human Gate deste checkpoint está aprovado."
              : "Human Gate deste checkpoint ainda não está aprovado.",
          ]
        : ["Nenhum nó ativo inequívoco foi derivado da topologia."],
      next_node: next
        ? [
            `${next.id} (seq ${next.sequence ?? "?"}) é o próximo nó planejado.`,
            `Branch pretendida: ${branch}.`,
            `Base pretendida: ${pr?.headRefName ?? snapshot.facts.git.branch ?? "(branch atual)"}.`,
          ]
        : ["Não há próximo nó planejado derivável em state.yml § topology."],
      preflight: [
        pr
          ? `PR atual #${pr.number}: ${pr.state}${pr.isDraft ? " · Draft" : " · Ready"} · CI ${pr.checks.pass} ok / ${pr.checks.fail} falha(s) / ${pr.checks.pending} pendente(s).`
          : "PR atual não observado.",
        snapshot.workingTreeState === "clean"
          ? "Working tree limpa."
          : "Working tree não está limpa.",
        availability.status === "available"
          ? "Preflight modelado como disponível."
          : `Bloqueios: ${availability.reasons.join(" | ")}`,
      ],
      planned_effects: next
        ? [
            `Criar branch ${branch} a partir do HEAD aprovado.`,
            "Abrir PR Draft stacked contra a branch do nó aprovado.",
            "Atualizar state.yml: nó aprovado sai de active para concluded; próximo nó entra em active com número factual do PR.",
            "Regenerar active.yml por projeção, não edição manual.",
            "Materializar tasks.md do novo checkpoint para `work` não ficar sem objeto.",
            "Atualizar o body do novo PR com Template v3.",
          ]
        : ["Sem próximo nó, não há efeitos planejáveis."],
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
      technicalDetails.push({ label: "nó atual", value: currentNode });
      technicalDetails.push({ label: "próximo nó", value: next?.id ?? "—" });
      technicalDetails.push({ label: "branch planejada", value: branch });
      technicalDetails.push({ label: "state.yml", value: `${snapshot.specPath}/state.yml` });
      technicalDetails.push({ label: "tasks.md", value: `${snapshot.specPath}/tasks.md` });
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
      sources: [
        { label: "state", ref: `${snapshot.specPath}/state.yml` },
        { label: "tasks", ref: `${snapshot.specPath}/tasks.md` },
        ...(snapshot.gateFile ? [{ label: "gate", ref: snapshot.gateFile }] : []),
      ],
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
    const next = snapshot.facts.nextPlannedNode;
    const base = {
      type: this.id,
      choiceId,
      seal: snapshot.seal,
      gitHead: snapshot.gitHead,
    } as const;

    if (choiceId === "prepare-plan") {
      const branch = next ? nextBranch(snapshot.specId, next.id) : "(sem próximo nó)";
      return {
        ...base,
        mutating: false,
        changes: [],
        preserved: [
          "state.yml inalterado",
          "tasks.md inalterado",
          "active.yml inalterado",
          "nenhum branch criado",
          "nenhum PR criado",
        ],
        commitMessage: null,
        preconditions: [
          { label: "selo do snapshot", expected: snapshot.seal },
          { label: "git HEAD", expected: snapshot.gitHead ?? "?" },
          { label: "gate", expected: "approved" },
        ],
        nextHuman: [],
        note: next
          ? [
              `Plano de abertura: ${snapshot.facts.activeNode?.id ?? "nó atual"} → ${next.id}.`,
              `Branch pretendida: ${branch}.`,
              "A execução completa deve criar branch/PR antes de gravar o número factual em state.yml.",
              "Nada foi alterado por este briefing/preflight.",
            ]
          : ["Não há próximo nó planejado. Nada foi alterado."],
        payload: null,
      };
    }

    return {
      ...base,
      mutating: false,
      changes: [],
      preserved: ["nenhum artefato alterado"],
      commitMessage: null,
      preconditions: [],
      nextHuman: [],
      note:
        choiceId === "keep"
          ? ["O nó atual permanece ativo. Nada foi alterado."]
          : choiceId === "request-explanation"
            ? ["Solicite o esclarecimento desejado. Nada foi alterado."]
            : ["Nada foi alterado."],
      payload: null,
    };
  }

  async apply(_plan: DecisionPlan, _ctx: DecisionApplyContext): Promise<DecisionApplyResult> {
    return {
      ok: true,
      committed: null,
      pushed: false,
      messages: ["open-next-node é briefing/preflight nesta fase; nada foi alterado."],
    };
  }
}
