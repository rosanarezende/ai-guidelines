/**
 * Decisão `review-revalidation`: o sistema analisa o delta de reviews
 * obrigatórias stale e recomenda dispensar ou repetir a revisão; a owner decide.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { isMap, isSeq, parseDocument } from "yaml";
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
import { DecisionReviewRevalidation, DecisionSnapshot } from "./snapshot.js";
import {
  findDecisionType,
  HumanDecisionTypePolicy,
} from "../../infrastructure/yaml/humanDecisionPolicyReader.js";
import { parseWorkflowState } from "../../infrastructure/yaml/workflowStateSerializer.js";
import { main as buildGovernedWorkMap } from "../governedWorkMap.js";
import { GOVERNANCE_GRAPH_SNAPSHOT_REL, main as buildGovernanceGraph } from "../governanceGraph.js";

export const REVIEW_REVALIDATION_ID = "review-revalidation";

const MAP_DATA_REL =
  ".governance/specs/0024-context-architecture/assets/governed-work-map-data.json";
const MAP_HTML_REL = ".governance/specs/0024-context-architecture/assets/governed-work-map.html";

export interface ReviewRevalidationProjectionSynchronizer {
  readonly paths: readonly string[];
  synchronize(repoRoot: string): Promise<void>;
}

const defaultProjectionSynchronizer: ReviewRevalidationProjectionSynchronizer = {
  paths: [MAP_DATA_REL, MAP_HTML_REL, GOVERNANCE_GRAPH_SNAPSHOT_REL],
  async synchronize(repoRoot) {
    const logger = { info: () => undefined, error: () => undefined };
    if ((await buildGovernedWorkMap(["build"], repoRoot, logger)) !== 0) {
      throw new Error("governed-work-map:build falhou");
    }
    if ((await buildGovernanceGraph(["build"], repoRoot, logger)) !== 0) {
      throw new Error("governance-graph:build falhou");
    }
  },
};

interface ReviewRevalidationPayload {
  readonly stateFile: string;
  readonly nodeId: string;
  readonly decisions: readonly {
    role: string;
    ownerDecision: "waived" | "required";
    reason: string;
  }[];
}

interface FileBackup {
  readonly path: string;
  readonly existed: boolean;
  readonly content: string;
}

function toPosix(value: string): string {
  return value.replace(/\\/g, "/");
}

function recommendationLabel(
  value: DecisionReviewRevalidation["advice"]["recommendation"]
): string {
  if (value === "waive") return "dispensar a revalidação";
  if (value === "revalidate") return "repetir a revisão";
  return "avaliar manualmente";
}

function choiceDecision(
  item: DecisionReviewRevalidation,
  choiceId: string
): "waived" | "required" | null {
  if (choiceId === "waive-all") return "waived";
  if (choiceId === "require-all") return "required";
  if (choiceId !== "accept-recommendations") return null;
  if (item.advice.recommendation === "waive") return "waived";
  if (item.advice.recommendation === "revalidate") return "required";
  return null;
}

function mutateStateYaml(
  yamlText: string,
  payload: ReviewRevalidationPayload,
  actor: string
): string {
  const doc = parseDocument(yamlText);
  const active = doc.getIn(["topology", "prs", "active"], true);
  if (!isSeq(active)) throw new Error("state.yml: topology.prs.active deve ser lista.");
  const node = active.items.find(
    (item) => isMap(item) && String(item.get("id") ?? "") === payload.nodeId
  );
  if (!node || !isMap(node)) throw new Error(`Nó ativo ${payload.nodeId} não encontrado.`);
  const reviewPlan = node.get("review_plan", true);
  if (!isMap(reviewPlan)) throw new Error(`Nó ${payload.nodeId} não possui review_plan.`);
  for (const decision of payload.decisions) {
    const lane = reviewPlan.get(decision.role, true);
    if (!isMap(lane)) throw new Error(`review_plan.${decision.role} não encontrado.`);
    lane.set("revalidation", {
      owner_decision: decision.ownerDecision,
      actor,
      reason: decision.reason,
    });
  }
  const rendered = doc.toString({ lineWidth: 0 });
  parseWorkflowState(rendered);
  return rendered;
}

function backups(repoRoot: string, files: readonly string[]): FileBackup[] {
  return files.map((file) => {
    const abs = path.join(repoRoot, file);
    return {
      path: file,
      existed: fs.existsSync(abs),
      content: fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : "",
    };
  });
}

function restore(repoRoot: string, files: readonly FileBackup[]): void {
  for (const file of files) {
    const abs = path.join(repoRoot, file.path);
    if (file.existed) fs.writeFileSync(abs, file.content);
    else fs.rmSync(abs, { force: true });
  }
}

export class ReviewRevalidationDefinition implements HumanDecisionDefinition {
  readonly id = REVIEW_REVALIDATION_ID;
  readonly title = "Decidir se reviews stale precisam de revalidação";

  constructor(
    private readonly projections: ReviewRevalidationProjectionSynchronizer = defaultProjectionSynchronizer
  ) {}

  private policyOf(snapshot: DecisionSnapshot): HumanDecisionTypePolicy | undefined {
    return snapshot.policy ? findDecisionType(snapshot.policy, this.id) : undefined;
  }

  detect(snapshot: DecisionSnapshot): DecisionAvailability {
    if (!this.policyOf(snapshot)) {
      return { status: "not-applicable", reasons: ["Tipo ausente da policy humana."] };
    }
    if (snapshot.reviewRevalidations.length === 0) {
      return {
        status: "not-applicable",
        reasons: ["Não há review obrigatório stale+approved aguardando decisão de revalidação."],
      };
    }
    return {
      status: "available",
      reasons: [],
      hint: `${snapshot.reviewRevalidations.length} review(s) têm recomendação calculada; a decisão continua humana.`,
    };
  }

  choices(snapshot: DecisionSnapshot): readonly HumanDecisionChoice[] {
    const policy = this.policyOf(snapshot);
    if (!policy) return [];
    const available = this.detect(snapshot).status === "available";
    const recommendationsComplete = snapshot.reviewRevalidations.every(
      (item) => item.advice.recommendation !== "human-assessment"
    );
    return policy.choices.map((choice) => ({
      id: choice.id,
      label: choice.label,
      mutating: choice.mutating,
      available:
        !choice.mutating ||
        (available && (choice.id !== "accept-recommendations" || recommendationsComplete)),
    }));
  }

  buildBrief(
    snapshot: DecisionSnapshot,
    opts: { readonly technical: boolean }
  ): HumanDecisionBrief {
    const policy = this.policyOf(snapshot)!;
    const availability = this.detect(snapshot);
    const items = snapshot.reviewRevalidations;
    const bodyByKey: Record<string, readonly string[]> = {
      decision_summary: [
        "Decidir, para cada review obrigatório já aprovado que ficou stale, se o delta exige nova revisão ou se a revalidação pode ser dispensada.",
      ],
      system_recommendation: items.map(
        (item) =>
          `${item.role.replace(/_/g, " ")}: o sistema recomenda ${recommendationLabel(item.advice.recommendation)}. ${item.advice.reasons.join(" ")}`
      ),
      observed_delta: items.map(
        (item) =>
          `${item.role.replace(/_/g, " ")}: ${item.changedPaths.length} arquivo(s) entre a cobertura anterior e a cabeça funcional atual.`
      ),
      risks: items.flatMap((item) =>
        item.advice.paths
          .filter((entry) => ["sensitive", "unknown-functional"].includes(entry.classification))
          .map((entry) => `${item.role}: ${entry.path} (${entry.classification}).`)
      ),
      consequences: policy.consequences,
      not_authorized: policy.notAuthorized,
    };
    if (bodyByKey.risks.length === 0)
      bodyByKey.risks = ["Nenhum caminho sensível ou funcional desconhecido foi classificado."];
    const sections: HumanDecisionSection[] = policy.sections.map((section) => ({
      key: section.key,
      heading: section.heading,
      body: bodyByKey[section.key] ?? [],
    }));
    const technicalDetails: HumanDecisionTechnicalDetail[] = opts.technical
      ? items.flatMap((item) => [
          {
            label: `${item.role} · cobertura`,
            value: `${item.coveredHead}..${item.functionalHead}`,
          },
          {
            label: `${item.role} · paths`,
            value: item.advice.paths
              .map((entry) => `${entry.path}=${entry.classification}`)
              .join(" · "),
          },
        ])
      : [];
    return {
      id: this.id,
      type: this.id,
      status: availability.status,
      title: policy.title,
      summary:
        availability.status === "available"
          ? "O sistema analisou o delta e preparou uma recomendação; cabe à owner aceitá-la ou substituí-la."
          : "Não há decisão de revalidação pendente neste estado.",
      whyNow:
        "Uma review obrigatória aprovada ficou stale após novos commits; stale continua sendo fato, mas não significa automaticamente que repetir a revisão agrega segurança.",
      sections,
      consequences: policy.consequences,
      notAuthorized: policy.notAuthorized,
      choices: this.choices(snapshot),
      technicalDetails,
      sources: [
        { label: "plano situado", ref: `${snapshot.specPath}/state.yml` },
        { label: "reviews", ref: `${snapshot.specPath}/reviews` },
      ],
      blockedReasons: availability.status === "available" ? [] : availability.reasons,
    };
  }

  plan(snapshot: DecisionSnapshot, choiceId: string, _params?: DecisionChoiceParams): DecisionPlan {
    const policy = this.policyOf(snapshot)!;
    const choice = policy.choices.find((item) => item.id === choiceId);
    if (!choice) throw new Error(`Escolha desconhecida para ${this.id}: ${choiceId}.`);
    const base = {
      type: this.id,
      choiceId,
      seal: snapshot.seal,
      gitHead: snapshot.gitHead,
    } as const;
    if (!choice.mutating) {
      return {
        ...base,
        mutating: false,
        changes: [],
        preserved: ["state.yml e reviews inalterados"],
        commitMessage: null,
        preconditions: [],
        nextHuman: [],
        note: ["Nenhuma decisão foi registrada."],
        payload: null,
      };
    }
    if (this.detect(snapshot).status !== "available") {
      return {
        ...base,
        mutating: false,
        changes: [],
        preserved: [],
        commitMessage: null,
        preconditions: [],
        nextHuman: [],
        note: ["A decisão não está disponível."],
        payload: null,
      };
    }
    const decisions = snapshot.reviewRevalidations.map((item) => {
      const ownerDecision = choiceDecision(item, choiceId);
      if (!ownerDecision) {
        throw new Error(
          `${item.role}: recomendação exige avaliação humana; escolha waive-all ou require-all explicitamente.`
        );
      }
      return {
        role: item.role,
        ownerDecision,
        reason:
          `Decisão humana sobre delta ${item.coveredHead}..${item.functionalHead}; ` +
          `recomendação do sistema=${item.advice.recommendation}. ${item.advice.reasons.join(" ")}`,
      };
    });
    const stateFile = toPosix(`${snapshot.specPath}/state.yml`);
    const payload: ReviewRevalidationPayload = {
      stateFile,
      nodeId: snapshot.facts.activeNode?.id ?? "",
      decisions,
    };
    return {
      ...base,
      mutating: true,
      changes: [
        ...decisions.map((decision) => ({
          path: stateFile,
          description: `${decision.role}: revalidation.owner_decision → ${decision.ownerDecision}`,
        })),
        ...this.projections.paths.map((projectionPath) => ({
          path: projectionPath,
          description: "regenera projeção determinística após a decisão",
        })),
      ],
      preserved: [
        "reviews e eventos append-only",
        "fato de freshness stale",
        "requirement original das reviews",
        "readiness, Human Gate, PR e topologia",
      ],
      commitMessage: `docs(spec-${snapshot.specId}): registra decisão sobre revalidação de reviews`,
      preconditions: [
        { label: "selo do snapshot", expected: snapshot.seal },
        { label: "git HEAD", expected: snapshot.gitHead ?? "?" },
      ],
      nextHuman: [
        "Recarregar `npm run flow -- work` e `pr-ready:check`.",
        "A decisão não declara readiness nem exerce Human Gate.",
      ],
      note: [],
      payload,
    };
  }

  async apply(plan: DecisionPlan, ctx: DecisionApplyContext): Promise<DecisionApplyResult> {
    if (!plan.mutating || !plan.payload) {
      return { ok: true, committed: null, pushed: false, messages: ["Nada a aplicar."] };
    }
    const payload = plan.payload as ReviewRevalidationPayload;
    const actor = ctx.actor.handle ?? ctx.actor.email ?? ctx.actor.name;
    if (!actor) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: ["Actor humano não pôde ser resolvido."],
      };
    }
    const files = [payload.stateFile, ...this.projections.paths];
    const saved = backups(ctx.repoRoot, files);
    try {
      const stateAbs = path.join(ctx.repoRoot, payload.stateFile);
      const before = fs.readFileSync(stateAbs, "utf8");
      fs.writeFileSync(stateAbs, mutateStateYaml(before, payload, actor));
      await this.projections.synchronize(ctx.repoRoot);
      const dirty = ctx.git.porcelainPaths();
      if (dirty === null) throw new Error("git status indisponível — guard de diff abortou");
      const expected = new Set(files.map(toPosix));
      const dirtyPaths = dirty.map(toPosix);
      const unexpected = dirtyPaths.filter((file) => !expected.has(file));
      const stateChanged = dirtyPaths.includes(toPosix(payload.stateFile));
      if (unexpected.length > 0 || !stateChanged) {
        throw new Error(
          `diff misto/incompleto — inesperados: ${unexpected.join(", ") || "nenhum"}; state.yml alterado: ${stateChanged ? "sim" : "não"}`
        );
      }
      for (const file of dirtyPaths) ctx.git.add(file);
      ctx.git.commit(plan.commitMessage!);
    } catch (error) {
      restore(ctx.repoRoot, saved);
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: [error instanceof Error ? error.message : String(error)],
      };
    }
    const committed = ctx.git.revParseShortHead();
    try {
      ctx.git.push();
    } catch (error) {
      return {
        ok: false,
        committed,
        pushed: false,
        messages: [
          `commit ${committed} criado; push falhou: ${error instanceof Error ? error.message : String(error)}`,
        ],
      };
    }
    return {
      ok: true,
      committed,
      pushed: true,
      messages: [
        `Decisão registrada para ${payload.decisions.map((item) => item.role).join(", ")}.`,
        "Reviews permaneceram imutáveis; somente o plano situado e projeções foram publicados.",
      ],
    };
  }
}
