/**
 * Decisão `close-dispositions` — o reviewer/owner encerra (open → accepted) os
 * problemas já corrigidos e revalidados (CO-3 / PR #42, primeiro dogfood).
 *
 * Briefing HUMANO precede a decisão; IDs/SHAs/fingerprints ficam só em detalhes
 * técnicos. Efeito governado: altera EXCLUSIVAMENTE `disposition` (campo fora do
 * fingerprint — `review:seal` é no-op), preservando claim/severity/descrição/
 * resolutions/eventos. Zero LLM (ADR 0018).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { parseDocument, YAMLMap, YAMLSeq } from "yaml";
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
import { DecisionFinding, DecisionSnapshot } from "./snapshot.js";
import { consolidate, discover } from "../reviewCheck.js";
import { parseReview } from "../../infrastructure/yaml/reviewArtifactsReader.js";
import {
  findDecisionType,
  HumanDecisionTypePolicy,
} from "../../infrastructure/yaml/humanDecisionPolicyReader.js";

export const CLOSE_DISPOSITIONS_ID = "close-dispositions";

interface CloseFile {
  readonly path: string;
  readonly findingIds: readonly string[];
}
interface ClosePayload {
  readonly files: readonly CloseFile[];
}

function toPosix(p: string): string {
  return p.replace(/\\/g, "/");
}

function nodeLabel(snapshot: DecisionSnapshot): string {
  return (snapshot.checkpoint ?? "checkpoint").replace(/^checkpoint-/, "");
}

/** Etapa pendente seguinte (o que vira "próxima tarefa"). */
function nextPendingStep(snapshot: DecisionSnapshot): string | null {
  const pending = snapshot.steps.find((s) => s.state === "pending");
  return pending ? pending.id : null;
}

function reviewRevalidationWaived(snapshot: DecisionSnapshot, role: string): boolean {
  const status = snapshot.facts.lifecycle?.reviewStatuses.find((item) => item.typeId === role);
  return (status?.notes ?? []).some((note) => note.includes("revalidation waived"));
}

function findingCanClose(snapshot: DecisionSnapshot, finding: DecisionFinding): boolean {
  if (!finding.resolution || finding.resolution.action !== "fixed") return false;
  if (finding.refValid === false) return false;
  if (finding.verified) return true;
  return !finding.blocking && reviewRevalidationWaived(snapshot, finding.role);
}

export class CloseDispositionsDefinition implements HumanDecisionDefinition {
  readonly id = CLOSE_DISPOSITIONS_ID;
  readonly title = "Encerrar problemas revalidados da auditoria técnica";

  private policyOf(snapshot: DecisionSnapshot): HumanDecisionTypePolicy | undefined {
    return snapshot.policy ? findDecisionType(snapshot.policy, this.id) : undefined;
  }

  detect(snapshot: DecisionSnapshot): DecisionAvailability {
    const policy = this.policyOf(snapshot);
    if (!policy) {
      return {
        status: "not-applicable",
        reasons: ["Tipo não declarado na human-decision-policy.yml."],
      };
    }
    if (snapshot.openFindings.length === 0) {
      return {
        status: "not-applicable",
        reasons: ["Não há problemas abertos para encerrar neste checkpoint."],
      };
    }
    const reasons: string[] = [];
    if (snapshot.consolidation.errors.length > 0) {
      reasons.push(
        `Os artefatos de review têm erro de integridade: ${snapshot.consolidation.errors[0]}`
      );
    }
    // Cada lane com findings abertos precisa estar CURRENT (revalidada no HEAD),
    // salvo findings não bloqueantes já corrigidos cuja revalidação foi
    // explicitamente dispensada pela owner no plano situado de revisão.
    for (const lane of snapshot.lanes) {
      const laneOpenFindings = snapshot.openFindings.filter((f) => f.role === lane.role);
      const laneClosableByWaiver =
        reviewRevalidationWaived(snapshot, lane.role) &&
        laneOpenFindings.length > 0 &&
        laneOpenFindings.every((f) => findingCanClose(snapshot, f));
      if (!lane.current && !laneClosableByWaiver) {
        reasons.push(
          `A auditoria "${lane.role.replace(/_/g, " ")}" ainda não foi revalidada no estado atual — ` +
            `falta verificação aprovada cobrindo a cabeça funcional.`
        );
      }
    }
    // Cada finding aberto precisa de correção registrada (fixed) com ref válida
    // E verificação aprovada no HEAD.
    for (const f of snapshot.openFindings) {
      if (!f.resolution || f.resolution.action !== "fixed") {
        reasons.push(
          `O problema ${f.localId} ainda não tem correção registrada (resolution fixed).`
        );
      } else if (f.refValid === false) {
        reasons.push(
          `O problema ${f.localId} aponta uma correção que não está no histórico atual.`
        );
      } else if (!findingCanClose(snapshot, f)) {
        reasons.push(
          `O problema ${f.localId} ainda não foi revalidado por verificação independente.`
        );
      }
    }
    if (reasons.length > 0) {
      return { status: "blocked", reasons };
    }
    return { status: "available", reasons: [] };
  }

  choices(snapshot: DecisionSnapshot): readonly HumanDecisionChoice[] {
    const policy = this.policyOf(snapshot);
    if (!policy) return [];
    const available = this.detect(snapshot).status === "available";
    return policy.choices.map((c) => ({
      id: c.id,
      label: c.label,
      mutating: c.mutating,
      // accept-all/review-individually só fazem sentido quando elegível; as
      // demais (esclarecimento/mudanças/cancelar) sempre disponíveis.
      available: c.mutating ? available : true,
    }));
  }

  buildBrief(snapshot: DecisionSnapshot, opts: { technical: boolean }): HumanDecisionBrief {
    const policy = this.policyOf(snapshot)!;
    const availability = this.detect(snapshot);
    const node = nodeLabel(snapshot);
    const findings = snapshot.openFindings;
    const n = findings.length;
    const verifs = snapshot.lanes.flatMap((l) => l.approvedVerifications);

    const summary =
      availability.status === "available"
        ? `Encerrar ${n} problema(s) encontrado(s) na auditoria técnica do ${node} — todos já corrigidos e revalidados.`
        : `Os problemas da auditoria técnica do ${node} ainda não podem ser encerrados.`;
    const whyNow =
      "As correções foram aplicadas e revalidadas por verificação independente; " +
      "falta apenas a sua decisão para encerrar os problemas — o implementador não fecha disposições.";

    const bodyByKey: Record<string, readonly string[]> = {
      decision_summary: [summary],
      why_now: [whyNow],
      // Linguagem HUMANA primeiro (human_context); sem truncamento. Os detalhes
      // técnicos (descrição/evidência/IDs) vivem só em --technical.
      problems: findings.map(
        (f, i) =>
          `${i + 1}. ${f.humanSummary ?? "Um problema foi encontrado na auditoria técnica (detalhe técnico em --technical)."}`
      ),
      changes: findings.map(
        (f, i) =>
          `${i + 1}. ${f.resolution?.humanSummary ?? "A correção foi registrada e revalidada (detalhe técnico em --technical)."}`
      ),
      verification: [
        `${verifs.length} verificação(ões) independente(s) aprovaram as correções.`,
        "Nenhum problema novo foi emitido.",
        snapshot.facts.pullRequest
          ? `Integração contínua verde (${snapshot.facts.pullRequest.checks.pass} checagem ok).`
          : "Testes e validações locais verdes.",
      ],
      residual_risks: [
        "Nenhum novo risco bloqueante foi registrado.",
        "Esta decisão não aprova o PR inteiro.",
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
      for (const f of findings) {
        technicalDetails.push({
          label: f.qualified,
          value:
            `severity=${f.severity} · fingerprint=${f.fingerprint} · location=${f.location} · ` +
            `resolution=${f.resolution?.action ?? "—"} ref=${f.resolution?.ref ?? "—"} · ` +
            `verified=${f.verified}`,
        });
        technicalDetails.push({ label: `${f.localId} · descrição`, value: f.description });
        if (f.resolution?.evidence) {
          technicalDetails.push({
            label: `${f.localId} · evidência`,
            value: f.resolution.evidence,
          });
        }
      }
      for (const v of verifs) {
        technicalDetails.push({
          label: `verification ${v.eventId}`,
          value: `${v.decision} · ${v.executor} · subject_ref=${v.subjectRef ?? "—"} · verifies=${v.verifies.join(",")}`,
        });
      }
      technicalDetails.push({
        label: "functional HEAD",
        value: snapshot.effectiveFunctionalHead ?? "—",
      });
      technicalDetails.push({ label: "seal", value: snapshot.seal });
    }

    const sources = [
      ...snapshot.lanes
        .filter((l) => l.reviewFile)
        .map((l) => ({ label: `review ${l.role}`, ref: l.reviewFile! })),
      ...snapshot.lanes.flatMap((l) =>
        l.approvedVerifications.map((v) => ({ label: `verification ${v.eventId}`, ref: v.file }))
      ),
      { label: "tasks", ref: `${snapshot.specPath}/tasks.md` },
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
      blockedReasons: availability.status === "available" ? [] : availability.reasons,
    };
  }

  plan(snapshot: DecisionSnapshot, choiceId: string, params?: DecisionChoiceParams): DecisionPlan {
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
    if (choiceId === "request-explanation") {
      const missing = this.detect(snapshot).reasons;
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
          ...(missing.length > 0
            ? ["Pontos a esclarecer antes de encerrar:", ...missing.map((r) => `- ${r}`)]
            : ["Solicite ao implementador/reviewer o esclarecimento desejado."]),
        ],
        payload: null,
      };
    }
    if (choiceId === "request-changes") {
      return {
        ...base,
        mutating: false,
        changes: [],
        preserved: ["disposições permanecem open", "nenhuma resolution inventada"],
        commitMessage: null,
        preconditions: [],
        nextHuman: [],
        note: [
          "Os problemas permanecem abertos.",
          "Próxima ação determinística: o implementador registra nova resolution e solicita nova verificação independente.",
        ],
        payload: null,
      };
    }

    // accept-all | review-individually → fechamento de disposições.
    let targets: readonly DecisionFinding[];
    if (choiceId === "review-individually") {
      const wanted = new Set(params?.findings ?? []);
      targets = snapshot.openFindings.filter(
        (f) => wanted.has(f.qualified) || wanted.has(f.localId)
      );
    } else {
      targets = snapshot.openFindings;
    }

    if (targets.length === 0) {
      return {
        ...base,
        mutating: false,
        changes: [],
        preserved: [],
        commitMessage: null,
        preconditions: [],
        nextHuman: [],
        note: ["Nenhum problema selecionado — nada a registrar."],
        payload: null,
      };
    }

    // Agrupa por arquivo de review (lane).
    const byFile = new Map<string, string[]>();
    for (const f of targets) {
      const lane = snapshot.lanes.find((l) => l.role === f.role);
      const file = lane?.reviewFile;
      if (!file) continue;
      const arr = byFile.get(file) ?? [];
      arr.push(f.localId);
      byFile.set(file, arr);
    }
    const files: CloseFile[] = [...byFile.entries()].map(([p, ids]) => ({
      path: toPosix(p),
      findingIds: ids,
    }));

    const changes = targets.map((f) => ({
      path: toPosix(snapshot.lanes.find((l) => l.role === f.role)?.reviewFile ?? "?"),
      description: `${f.localId}: open → accepted`,
    }));
    const nextPending = nextPendingStep(snapshot);
    return {
      ...base,
      mutating: true,
      changes,
      preserved: [
        "review fingerprint",
        "finding fingerprints",
        "claims, severity e descrições",
        "resolutions e eventos de verificação",
        "código funcional",
      ],
      commitMessage: `docs(spec-${snapshot.specId}): fecha findings do technical audit do ${nodeLabel(snapshot)}`,
      preconditions: [
        { label: "selo do snapshot", expected: snapshot.seal },
        { label: "git HEAD", expected: snapshot.gitHead ?? "?" },
        ...files.map((f) => ({
          label: `arquivo ${f.path}`,
          expected: "inalterado desde o briefing",
        })),
      ],
      nextHuman: [
        nextPending
          ? `A próxima etapa pendente (${nextPending}) passa a ser a tarefa seguinte.`
          : "A próxima etapa pendente passa a ser a tarefa seguinte.",
        "Nada de Ready, Human Gate, gate artifact, merge ou próximo PR foi autorizado.",
      ],
      note: [],
      payload: { files } satisfies ClosePayload,
    };
  }

  async apply(plan: DecisionPlan, ctx: DecisionApplyContext): Promise<DecisionApplyResult> {
    const messages: string[] = [];
    if (!plan.mutating || plan.payload === null) {
      return {
        ok: true,
        committed: null,
        pushed: false,
        messages: ["Nada a aplicar (read-only)."],
      };
    }
    const payload = plan.payload as ClosePayload;

    // ── Edição YAML por AST: só `disposition` (preserva comentários/fingerprints) ──
    const editedFiles: string[] = [];
    for (const file of payload.files) {
      const abs = path.join(ctx.repoRoot, file.path);
      if (!fs.existsSync(abs)) {
        return {
          ok: false,
          committed: null,
          pushed: false,
          messages: [`Arquivo ausente: ${file.path}.`],
        };
      }
      const before = fs.readFileSync(abs, "utf8");
      const doc = parseDocument(before);
      const findingsSeq = doc.get("findings") as YAMLSeq | undefined;
      if (!findingsSeq) {
        return {
          ok: false,
          committed: null,
          pushed: false,
          messages: [`Sem findings em ${file.path}.`],
        };
      }
      const idSet = new Set(file.findingIds);
      let touched = 0;
      for (const item of findingsSeq.items as YAMLMap[]) {
        const id = String(item.get("id") ?? "");
        if (!idSet.has(id)) continue;
        if (String(item.get("disposition") ?? "") !== "open") {
          return {
            ok: false,
            committed: null,
            pushed: false,
            messages: [`${file.path}:${id} não está open (estado mudou — recarregue).`],
          };
        }
        item.set("disposition", "accepted");
        touched++;
      }
      if (touched !== file.findingIds.length) {
        return {
          ok: false,
          committed: null,
          pushed: false,
          messages: [
            `${file.path}: esperados ${file.findingIds.length} findings, alterados ${touched}.`,
          ],
        };
      }
      const after = String(doc);
      // Validação: re-parse mantém o schema/selo (disposition fora do fingerprint).
      try {
        parseReview(after, file.path);
      } catch (e) {
        return {
          ok: false,
          committed: null,
          pushed: false,
          messages: [
            `Validação falhou em ${file.path}: ${e instanceof Error ? e.message : String(e)}`,
          ],
        };
      }
      fs.writeFileSync(abs, after);
      editedFiles.push(file.path);
    }

    // ── review:check composto: 0 finding bloqueante open; consolida fechados ──
    const { artifacts, errors } = discover(ctx.repoRoot);
    if (errors.length > 0) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: [`review:check — erro de schema: ${errors[0]}`],
      };
    }
    const { violations } = consolidate(artifacts);
    if (violations.length > 0) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: [`review:check — violação: ${violations[0]}`],
      };
    }

    // ── Guard de diff: working tree EXATAMENTE os arquivos de review editados ──
    const dirty = ctx.git.porcelainPaths();
    if (dirty === null) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: ["git status indisponível — guard de diff abortou."],
      };
    }
    const expected = new Set(editedFiles.map(toPosix));
    const unexpected = dirty.map(toPosix).filter((p) => !expected.has(p));
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

    // ── Commit EXCLUSIVO + push normal (nunca force/--no-verify) ──
    try {
      for (const f of editedFiles) ctx.git.add(f);
      ctx.git.commit(plan.commitMessage ?? `docs: fecha findings`);
    } catch (e) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: [`commit falhou (nada pushado): ${e instanceof Error ? e.message : String(e)}`],
      };
    }
    const committed = ctx.git.revParseShortHead();
    messages.push(`commit exclusivo: ${committed} — "${plan.commitMessage}"`);
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
