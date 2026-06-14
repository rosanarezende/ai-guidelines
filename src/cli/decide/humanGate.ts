/**
 * Decisão `human-gate` — a owner decide o avanço do checkpoint quando o PR está
 * pronto. O gate artifact nasce DEPOIS da decisão. Registrar o gate NÃO executa
 * transição/merge/abertura de PR (Etapa 10). Zero LLM (ADR 0018).
 *
 * Nesta sessão a decisão real está BLOQUEADA (PR Draft + sub-checkpoints abertos):
 * o briefing explica o bloqueio em linguagem humana; o efeito está implementado
 * e testado, mas não é exercido.
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
import { parseGate } from "../../infrastructure/yaml/reviewArtifactsReader.js";
import {
  findDecisionType,
  HumanDecisionTypePolicy,
} from "../../infrastructure/yaml/humanDecisionPolicyReader.js";

export const HUMAN_GATE_ID = "human-gate";

interface GatePayload {
  readonly gateFile: string;
  readonly checkpoint: string;
  readonly ref: string | null;
  readonly decision: "approved" | "changes_requested";
  readonly note: string;
  readonly basis: string;
  readonly next: string;
}

function toPosix(p: string): string {
  return p.replace(/\\/g, "/");
}

function normalizeCheckpoint(slug: string): string {
  return slug.replace(/^checkpoint-/, "");
}

function nodeLabel(snapshot: DecisionSnapshot): string {
  return normalizeCheckpoint(snapshot.checkpoint ?? "checkpoint");
}

export class HumanGateDefinition implements HumanDecisionDefinition {
  readonly id = HUMAN_GATE_ID;
  readonly title = "Decidir o avanço do checkpoint (Human Gate)";

  private policyOf(snapshot: DecisionSnapshot): HumanDecisionTypePolicy | undefined {
    return snapshot.policy ? findDecisionType(snapshot.policy, this.id) : undefined;
  }

  /** Motivos de bloqueio derivados (linguagem humana). Vazio ⟹ elegível. */
  private blockers(snapshot: DecisionSnapshot): string[] {
    const reasons: string[] = [];
    const pr = snapshot.facts.pullRequest;
    // Sub-checkpoints pendentes (fonte canônica tasks.md) — em linguagem humana.
    for (const sc of snapshot.subCheckpoints) {
      if (sc.state === "pending") reasons.push(`${sc.id} ainda está aberto.`);
    }
    if (snapshot.openFindings.length > 0) {
      reasons.push(
        `A auditoria técnica ainda tem ${snapshot.openFindings.length} problema(s) aberto(s).`
      );
    }
    if (pr) {
      if (pr.isDraft) reasons.push(`PR #${pr.number} continua Draft (Ready é precondição).`);
      if (pr.checks.fail > 0 || pr.checks.pending > 0) {
        reasons.push(
          `A integração contínua ainda não está verde (${pr.checks.fail} falha(s), ${pr.checks.pending} pendente(s)).`
        );
      }
    } else {
      reasons.push("Estado do PR não observado — não é possível decidir o avanço.");
    }
    // Reviews obrigatórios pendentes.
    for (const s of snapshot.facts.lifecycle?.reviewStatuses ?? []) {
      if (s.blocking) reasons.push(`Review obrigatório pendente: ${s.typeId} (${s.state}).`);
    }
    if (snapshot.workingTreeState !== "clean") {
      reasons.push("A working tree tem mudanças não commitadas.");
    }
    if ((snapshot.facts.git.behind ?? 0) > 0) {
      reasons.push("A branch está atrás do remoto — reconcilie antes de decidir.");
    }
    // Checks externos (coletados só quando PR Ready).
    if (pr && !pr.isDraft) {
      if (!snapshot.prReady || !snapshot.prReady.ok) {
        reasons.push("pr-ready:check ainda não está verde.");
      }
      if (!snapshot.gateDecidability || !snapshot.gateDecidability.ok) {
        reasons.push("gate-decidability:check ainda não está verde.");
      }
    }
    return reasons;
  }

  detect(snapshot: DecisionSnapshot): DecisionAvailability {
    const policy = this.policyOf(snapshot);
    if (!policy) {
      return {
        status: "not-applicable",
        reasons: ["Tipo não declarado na human-decision-policy.yml."],
      };
    }
    if (snapshot.gateExists) {
      return {
        status: "not-applicable",
        reasons: ["Já existe um gate registrado para este checkpoint."],
      };
    }
    const reasons = this.blockers(snapshot);
    return reasons.length > 0
      ? { status: "blocked", reasons }
      : { status: "available", reasons: [] };
  }

  choices(snapshot: DecisionSnapshot): readonly HumanDecisionChoice[] {
    const policy = this.policyOf(snapshot);
    if (!policy) return [];
    const available = this.detect(snapshot).status === "available";
    return policy.choices.map((c) => ({
      id: c.id,
      label: c.label,
      mutating: c.mutating,
      available: c.id === "cancel" ? true : available,
    }));
  }

  buildBrief(snapshot: DecisionSnapshot, opts: { technical: boolean }): HumanDecisionBrief {
    const policy = this.policyOf(snapshot)!;
    const availability = this.detect(snapshot);
    const node = nodeLabel(snapshot);
    const pr = snapshot.facts.pullRequest;
    const blocked = availability.status !== "available";

    const summary = blocked
      ? `O avanço do checkpoint ${node} ainda não pode ser decidido.`
      : `Decidir o avanço do checkpoint ${node}: o trabalho está pronto e validado.`;
    const whyNow =
      "O Human Gate é a decisão da owner sobre concluir o checkpoint; " +
      "o gate é registrado DEPOIS da decisão e não executa transição automática.";

    const doneSubs = snapshot.subCheckpoints.filter((s) => s.state === "done");
    const reviewStatuses = snapshot.facts.lifecycle?.reviewStatuses ?? [];

    const bodyByKey: Record<string, readonly string[]> = {
      delivered_value:
        doneSubs.length > 0
          ? doneSubs.map((s) => `Concluído: ${s.id} — ${s.title}`)
          : ["(o valor entregue é confirmado no corpo do PR — ainda em andamento)"],
      experience_change: [
        "Quem usa passa a contar com a capacidade entregue por este checkpoint.",
        "(detalhe pleno: seção 'Valor entregue' do PR)",
      ],
      reviews:
        reviewStatuses.length > 0
          ? reviewStatuses.map(
              (s) =>
                `${s.typeId}: ${s.requirement}${s.applicability === "no" ? " (não aplicável)" : ""} · ${s.state}${s.decision ? ` (${s.decision})` : ""}`
            )
          : ["Reviews do checkpoint conforme a policy do repositório."],
      validation: [
        pr
          ? `Integração contínua: ${pr.checks.pass} ok · ${pr.checks.fail} falha(s) · ${pr.checks.pending} pendente(s).`
          : "Estado de CI não observado.",
        snapshot.prReady ? `pr-ready:check: ${snapshot.prReady.ok ? "verde" : "vermelho"}.` : "",
        snapshot.gateDecidability
          ? `gate-decidability:check: ${snapshot.gateDecidability.ok ? "verde" : "vermelho"}.`
          : "",
      ].filter((l) => l.length > 0),
      residual_risks: [
        "Riscos residuais registrados nos reviews e decisões governadas do checkpoint.",
      ],
      next_node: snapshot.nextPlannedNode
        ? [
            `Próximo nó planejado: ${snapshot.nextPlannedNode.id}.`,
            "Ele NÃO será iniciado automaticamente por esta decisão.",
          ]
        : ["Não há próximo nó planejado derivável; nada é iniciado automaticamente."],
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
      technicalDetails.push({
        label: "PR",
        value: pr
          ? `#${pr.number} · ${pr.state} · ${pr.isDraft ? "Draft" : "Ready"} · head ${pr.headRefOid.slice(0, 7)}`
          : "—",
      });
      technicalDetails.push({
        label: "functional HEAD",
        value: snapshot.effectiveFunctionalHead ?? "—",
      });
      technicalDetails.push({
        label: "gate artifact alvo",
        value: `${snapshot.specPath}/gates/c-${node}.yml${snapshot.gateExists ? " (JÁ EXISTE)" : ""}`,
      });
      technicalDetails.push({ label: "seal", value: snapshot.seal });
    }

    const sources = [
      { label: "tasks", ref: `${snapshot.specPath}/tasks.md` },
      ...(pr ? [{ label: "PR", ref: `#${pr.number}` }] : []),
      ...snapshot.lanes
        .filter((l) => l.reviewFile)
        .map((l) => ({ label: `review ${l.role}`, ref: l.reviewFile! })),
    ];

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
      sources,
      blockedReasons: blocked ? availability.reasons : [],
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
    const node = nodeLabel(snapshot);
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
    if (choiceId === "reject") {
      // O schema de gate suporta approved | changes_requested — não há "rejected".
      // Honesto: nenhum artefato é escrito; orienta o registro real.
      return {
        ...base,
        mutating: false,
        changes: [],
        preserved: ["nenhum gate criado"],
        commitMessage: null,
        preconditions: [],
        nextHuman: [],
        note: [
          "O schema de gate não tem o estado 'rejected'.",
          "Para recusar o avanço, registre 'changes_requested' (solicitar mudanças) ou trate fora do gate.",
          "Nada foi alterado.",
        ],
        payload: null,
      };
    }

    const decision: "approved" | "changes_requested" =
      choiceId === "approve" ? "approved" : "changes_requested";
    const gateFile = toPosix(`${snapshot.specPath}/gates/c-${node}.yml`);
    const ref = snapshot.facts.pullRequest ? `#${snapshot.facts.pullRequest.number}` : null;
    const next = snapshot.nextPlannedNode
      ? `Concluir o nó ${node} e preparar a abertura do próximo PR (${snapshot.nextPlannedNode.id}). Nenhuma transição é executada automaticamente.`
      : `Concluir o nó ${node} e preparar a próxima transição. Nenhuma transição é executada automaticamente.`;
    const note =
      decision === "approved"
        ? `Human Gate do checkpoint ${node} APROVADO para avançar. Não autoriza merge, topologia, próximo PR, policy ou outro checkpoint.`
        : `Human Gate do checkpoint ${node}: mudanças solicitadas antes de aprovar o avanço.`;
    const basis =
      "Decisão registrada DEPOIS da decisão humana, com o estado governado do checkpoint " +
      "(reviews/findings/CI/validações) projetado pelo briefing. Não executa transição automática.";

    const payload: GatePayload = {
      gateFile,
      checkpoint: snapshot.checkpoint ?? node,
      ref,
      decision,
      note,
      basis,
      next,
    };

    return {
      ...base,
      mutating: true,
      changes: [{ path: gateFile, description: `cria gate artifact (decision: ${decision})` }],
      preserved: [
        "topologia (state.yml)",
        "PR (sem Ready/merge automático)",
        "próximo PR (não aberto)",
        "outros checkpoints",
      ],
      commitMessage: `docs(spec-${snapshot.specId}): registra human gate do ${node}`,
      preconditions: [
        { label: "selo do snapshot", expected: snapshot.seal },
        { label: "git HEAD", expected: snapshot.gitHead ?? "?" },
        { label: `gate ${gateFile}`, expected: "ainda não existe" },
      ],
      nextHuman: [
        "Próxima operação autorizada: concluir o nó e preparar a transição.",
        "Nenhuma transição foi executada automaticamente.",
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
    const payload = plan.payload as GatePayload;
    const abs = path.join(ctx.repoRoot, payload.gateFile);

    // Gate duplicado bloqueia (o artefato nasce uma única vez por checkpoint).
    if (fs.existsSync(abs)) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: [`Já existe gate em ${payload.gateFile} — não será sobrescrito.`],
      };
    }
    if (!ctx.actor.handle) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: ["Actor não resolvido — não é possível registrar o gate."],
      };
    }

    const date = new Date().toISOString().slice(0, 10);
    const yaml =
      `# Human Gate do checkpoint ${normalizeCheckpoint(payload.checkpoint)} — registrado por guidelines decide.\n` +
      `# O artefato nasce DEPOIS da decisão humana; NÃO executa transição/merge/abertura de PR.\n` +
      `checkpoint: "${payload.checkpoint}"\n` +
      `actor: "${ctx.actor.handle}"\n` +
      (payload.ref ? `ref: "${payload.ref}"\n` : "") +
      `date: "${date}"\n` +
      `decision: ${payload.decision}\n` +
      `note: ${JSON.stringify(payload.note)}\n` +
      `basis: ${JSON.stringify(payload.basis)}\n` +
      `next: ${JSON.stringify(payload.next)}\n`;

    // Valida o schema do gate ANTES de gravar.
    try {
      parseGate(yaml, payload.gateFile);
    } catch (e) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: [`Gate inválido (${e instanceof Error ? e.message : String(e)}) — nada gravado.`],
      };
    }
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, yaml);

    // Guard de diff: working tree EXATAMENTE o gate criado.
    const dirty = ctx.git.porcelainPaths();
    if (dirty === null) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: ["git status indisponível — guard de diff abortou."],
      };
    }
    const unexpected = dirty.map(toPosix).filter((p) => p !== payload.gateFile);
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
      ctx.git.add(payload.gateFile);
      ctx.git.commit(plan.commitMessage ?? `docs: registra human gate`);
    } catch (e) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: [`commit falhou (nada pushado): ${e instanceof Error ? e.message : String(e)}`],
      };
    }
    const committed = ctx.git.revParseShortHead();
    messages.push(`Human Gate registrado: ${committed} — "${plan.commitMessage}"`);
    try {
      ctx.git.push();
    } catch (e) {
      return {
        ok: false,
        committed,
        pushed: false,
        messages: [
          ...messages,
          `push falhou; o commit ${committed} permanece LOCAL: ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`,
        ],
      };
    }
    messages.push("push normal concluído.");
    messages.push(
      "Próxima operação autorizada: concluir o nó e preparar a transição. Nenhuma transição automática."
    );
    return { ok: true, committed, pushed: true, messages };
  }
}
