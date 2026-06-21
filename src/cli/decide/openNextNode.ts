/**
 * Decisão `open-next-node` — transição governada pós-Human Gate para o próximo
 * PR stacked planejado. Diferente do preflight inicial de CO-10.3, esta
 * definição materializa a operação completa sob confirmação humana:
 *
 * snapshot situado
 * → briefing
 * → preview
 * → confirmação
 * → branch remota
 * → PR Draft factual
 * → state.yml/active.yml/tasks.md com o número real do PR
 * → commit exclusivo
 * → push normal
 *
 * Não faz merge, não executa Human Gate, não implementa o próximo nó e não
 * altera main.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { Scalar, isMap, isSeq, parseDocument } from "yaml";
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
import { parseWorkflowState } from "../../infrastructure/yaml/workflowStateSerializer.js";
import {
  parseActiveSpecs,
  stringifyActiveSpecs,
} from "../../infrastructure/yaml/activeSpecsSerializer.js";
import type { HandoffNodeFact } from "../handoffFacts.js";
import type { PrTopologyNode } from "../../domain/workflow/WorkflowState.js";

export interface OpenNextNodePayload {
  readonly specId: string;
  readonly specPath: string;
  readonly stateFile: string;
  readonly activeSpecsFile: string;
  readonly tasksFile: string;
  readonly activeNodeId: string;
  readonly activeNodeSequence: number | null;
  readonly nextNodeId: string;
  readonly nextNodeSequence: number | null;
  readonly nextCheckpoint: string;
  readonly baseBranch: string;
  readonly nextBranch: string;
  readonly startPoint: string;
  readonly prTitle: string;
  readonly prBody: string;
}

interface OpenNextNodeAppliedFiles {
  readonly stateYaml: string;
  readonly activeSpecsYaml: string;
  readonly tasksMd: string;
}

function toPosix(p: string): string {
  return p.replace(/\\/g, "/");
}

function nodeLabel(snapshot: DecisionSnapshot): string {
  return snapshot.facts.activeNode?.id ?? snapshot.checkpoint?.replace(/^checkpoint-/, "") ?? "nó";
}

export function nextNodeBranch(specId: string, nodeId: string): string {
  return `feat/spec-${specId}-${nodeId}`;
}

function humanizeNodeId(nodeId: string): string {
  return nodeId.replace(/-/g, " ");
}

export function executionPrTitle(specId: string, node: HandoffNodeFact): string {
  const seq = node.sequence !== null ? `${node.sequence}️⃣` : "";
  const arrow = node.terminal ? "" : "➜";
  return `[🛠️${seq}${arrow}] [Spec ${specId}] ${node.id} — ${humanizeNodeId(node.id)}`;
}

export function buildNextNodePrBody(input: {
  readonly specId: string;
  readonly currentNodeId: string;
  readonly nextNodeId: string;
  readonly nextCheckpoint: string;
  readonly baseBranch: string;
  readonly headBranch: string;
}): string {
  return `## Visão pretendida

\`\`\`text
Abrir ${input.nextNodeId} como próximo PR stacked da Spec ${input.specId}, a partir do nó aprovado ${input.currentNodeId}, sem merge isolado em main.
\`\`\`

## Resumo

Este PR entrega o nó ${input.nextNodeId} da Spec ${input.specId}. Ele nasce por transição governada pós-Human Gate de ${input.currentNodeId}.

## Escopo

### Dentro do escopo

- Materializar o checkpoint ${input.nextCheckpoint}.
- Trabalhar somente o nó ${input.nextNodeId}.
- Manter a stack em modo unit, com base em \`${input.baseBranch}\` e head \`${input.headBranch}\`.

### Fora do escopo

- Merge em main.
- Human Gate automático.
- Implementação fora do checkpoint ${input.nextCheckpoint}.

## Valor entregue

<preencher antes de Ready>

## Test plan

<preencher antes de Ready>

## Validação, evidências e checklist

### Evidências e gates

<preencher antes de Ready>

### Checklist operacional

- [ ] Implementação validada
- [ ] Reviews aplicáveis reconciliadas
- [ ] PR convertido para Ready somente após validação humana

## Disclosure de IA

<preencher antes de Ready>

## Cross-refs

- Spec ${input.specId}
- Nó anterior: ${input.currentNodeId}
- Próximo nó ativo: ${input.nextNodeId}
`;
}

function topologyNodeFromSnapshot(
  snapshot: DecisionSnapshot,
  nodeId: string
): PrTopologyNode | null {
  const topology = snapshot.handoffSnapshot.collected.state.topology;
  if (!topology) return null;
  return (
    [...topology.prs.concluded, ...topology.prs.active, ...topology.prs.planned].find(
      (n) => n.id === nodeId
    ) ?? null
  );
}

function nextCheckpointFromSnapshot(snapshot: DecisionSnapshot, nodeId: string): string | null {
  const node = topologyNodeFromSnapshot(snapshot, nodeId);
  return node?.checkpoints[0] ?? null;
}

function buildPayload(snapshot: DecisionSnapshot): OpenNextNodePayload | null {
  const active = snapshot.facts.activeNode;
  const next = snapshot.facts.nextPlannedNode;
  const pr = snapshot.facts.pullRequest;
  const nextCheckpoint = next ? nextCheckpointFromSnapshot(snapshot, next.id) : null;
  if (!active || !next || !pr || !nextCheckpoint || !snapshot.gitHead) return null;
  const nextBranch = nextNodeBranch(snapshot.specId, next.id);
  const stateFile = toPosix(`${snapshot.specPath}/state.yml`);
  const activeSpecsFile = ".governance/runtime/specs/active.yml";
  const tasksFile = toPosix(`${snapshot.specPath}/tasks.md`);
  return {
    specId: snapshot.specId,
    specPath: snapshot.specPath,
    stateFile,
    activeSpecsFile,
    tasksFile,
    activeNodeId: active.id,
    activeNodeSequence: active.sequence,
    nextNodeId: next.id,
    nextNodeSequence: next.sequence,
    nextCheckpoint,
    baseBranch: pr.headRefName,
    nextBranch,
    startPoint: snapshot.gitHead,
    prTitle: executionPrTitle(snapshot.specId, next),
    prBody: buildNextNodePrBody({
      specId: snapshot.specId,
      currentNodeId: active.id,
      nextNodeId: next.id,
      nextCheckpoint,
      baseBranch: pr.headRefName,
      headBranch: nextBranch,
    }),
  };
}

function mustMap(value: unknown, where: string): any {
  if (!isMap(value)) throw new Error(`${where} deve ser mapping YAML.`);
  return value;
}

function mustSeq(value: unknown, where: string): any {
  if (!isSeq(value)) throw new Error(`${where} deve ser lista YAML.`);
  return value;
}

function mapPair(map: any, key: string): any {
  const pair = map.items.find((p: any) => p.key?.value === key);
  if (!pair) throw new Error(`Chave YAML ausente: ${key}.`);
  return pair;
}

function mapValue(map: any, key: string): any {
  return mapPair(map, key).value;
}

function setMapScalar(map: any, key: string, value: string | number | null): void {
  mapPair(map, key).value = new Scalar(value);
}

function findYamlNodeIndex(seq: any, nodeId: string): number {
  return seq.items.findIndex(
    (item: unknown) => isMap(item) && mapValue(item, "id")?.value === nodeId
  );
}

export function transitionStateYaml(
  stateYaml: string,
  payload: OpenNextNodePayload,
  prNumber: number
): string {
  const doc = parseDocument(stateYaml);
  const root = mustMap(doc.contents, "state.yml");
  const nextNarrative = mustSeq(mapValue(root, "next"), "next");
  const topology = mustMap(mapValue(root, "topology"), "topology");
  const cursor = mustMap(mapValue(topology, "cursor"), "topology.cursor");
  const prs = mustMap(mapValue(topology, "prs"), "topology.prs");
  const concluded = mustSeq(mapValue(prs, "concluded"), "topology.prs.concluded");
  const active = mustSeq(mapValue(prs, "active"), "topology.prs.active");
  const planned = mustSeq(mapValue(prs, "planned"), "topology.prs.planned");

  const activeIndex = findYamlNodeIndex(active, payload.activeNodeId);
  if (activeIndex < 0) throw new Error(`Nó ativo ${payload.activeNodeId} não encontrado.`);
  const nextIndex = findYamlNodeIndex(planned, payload.nextNodeId);
  if (nextIndex < 0) throw new Error(`Próximo nó ${payload.nextNodeId} não encontrado em planned.`);

  const [completedNode] = active.items.splice(activeIndex, 1);
  concluded.items.push(completedNode);

  const [nextNode] = planned.items.splice(nextIndex, 1);
  if (!isMap(nextNode)) throw new Error(`Nó ${payload.nextNodeId} inválido.`);
  setMapScalar(nextNode, "github_pr", prNumber);
  active.items.push(nextNode);

  setMapScalar(cursor, "pr", payload.nextNodeId);
  setMapScalar(cursor, "checkpoint", payload.nextCheckpoint);
  const renderedNext = `canonical-next: ${payload.nextNodeId}. ${payload.activeNodeId} (seq ${payload.activeNodeSequence ?? "?"}) CONCLUIDO-NA-STACK por Human Gate approved; modo unit, SEM merge isolado em main. No ATIVO = ${payload.nextNodeId} (seq ${payload.nextNodeSequence ?? "?"}, ${payload.nextCheckpoint}; PR #${prNumber} stacked sobre ${payload.baseBranch}). Primeiro passo: detalhar e executar o novo checkpoint na branch ${payload.nextBranch}. NAO executar Ready/Human Gate automatico, merge em main ou implementar nos posteriores fora deste PR.`;
  if (nextNarrative.items.length === 0) {
    nextNarrative.items.push(new Scalar(renderedNext));
  } else {
    nextNarrative.items[0] = new Scalar(renderedNext);
  }

  const rendered = doc.toString({ lineWidth: 0 });
  parseWorkflowState(rendered);
  return rendered;
}

function formatTimestampUtcMinus3(instant: Date): string {
  const shifted = new Date(instant.getTime() - 3 * 60 * 60 * 1000);
  return shifted.toISOString().replace("Z", "-03:00");
}

export function transitionActiveSpecsYaml(
  activeSpecsYaml: string,
  payload: OpenNextNodePayload,
  actorHandle: string | null,
  now: Date = new Date()
): string {
  const parsed = parseActiveSpecs(activeSpecsYaml);
  const updated = {
    version: 1 as const,
    activeSpecs: parsed.activeSpecs.map((entry) =>
      entry.id === payload.specId
        ? {
            ...entry,
            branch: payload.nextBranch,
            updatedAt: formatTimestampUtcMinus3(now),
            ...(actorHandle ? { updatedBy: actorHandle } : {}),
          }
        : entry
    ),
  };
  return stringifyActiveSpecs(updated);
}

function checkpointHeading(nodeId: string): string {
  return `Checkpoint ${nodeId}`;
}

export function transitionTasksMarkdown(
  tasksMd: string,
  payload: OpenNextNodePayload,
  prNumber: number
): string {
  const lines = tasksMd.split(/\r?\n/);
  const activeHeading = checkpointHeading(payload.activeNodeId);
  const nextHeading = checkpointHeading(payload.nextNodeId);
  const activeIndex = lines.findIndex((line) => line.includes(`**${activeHeading}**`));
  if (activeIndex < 0) {
    throw new Error(`tasks.md não contém o checkpoint ativo "${activeHeading}".`);
  }

  lines[activeIndex] = lines[activeIndex].replace(/-\s*\[\/\]/, "- [x]");

  const nextIndex = lines.findIndex((line) => line.includes(`**${nextHeading}**`));
  if (nextIndex >= 0) {
    lines[nextIndex] = lines[nextIndex].replace(/-\s*\[[ xX/]\]/, "- [/]");
    return lines.join("\n");
  }

  const insertAt = lines.findIndex(
    (line, index) => index > activeIndex && /^## Fase de Review/.test(line)
  );
  if (insertAt < 0) {
    throw new Error(
      "tasks.md não contém a âncora '## Fase de Review' para materializar o próximo nó."
    );
  }
  const block = [
    "",
    `- [/] **${nextHeading}** (nó \`${payload.nextNodeId}\`, seq ${payload.nextNodeSequence ?? "?"}, **PR #${prNumber}**) — aberto por transição governada pós-Human Gate de \`${payload.activeNodeId}\`; PR próprio _stacked_ sobre \`${payload.baseBranch}\`; não mergeia isoladamente em main. **Objeto inicial:** materializar o checkpoint \`${payload.nextCheckpoint}\` e detalhar as tarefas do nó antes da implementação.`,
    "",
  ];
  lines.splice(insertAt, 0, ...block);
  return lines.join("\n");
}

function applyFileTransitions(
  ctx: DecisionApplyContext,
  payload: OpenNextNodePayload,
  prNumber: number
): OpenNextNodeAppliedFiles {
  const stateAbs = path.join(ctx.repoRoot, payload.stateFile);
  const activeAbs = path.join(ctx.repoRoot, payload.activeSpecsFile);
  const tasksAbs = path.join(ctx.repoRoot, payload.tasksFile);
  for (const [label, abs] of [
    [payload.stateFile, stateAbs],
    [payload.activeSpecsFile, activeAbs],
    [payload.tasksFile, tasksAbs],
  ] as const) {
    if (!fs.existsSync(abs)) throw new Error(`Arquivo obrigatório ausente: ${label}.`);
  }

  const stateYaml = transitionStateYaml(fs.readFileSync(stateAbs, "utf8"), payload, prNumber);
  const activeSpecsYaml = transitionActiveSpecsYaml(
    fs.readFileSync(activeAbs, "utf8"),
    payload,
    ctx.actor.handle
  );
  const tasksMd = transitionTasksMarkdown(fs.readFileSync(tasksAbs, "utf8"), payload, prNumber);

  fs.writeFileSync(stateAbs, stateYaml, "utf8");
  fs.writeFileSync(activeAbs, activeSpecsYaml, "utf8");
  fs.writeFileSync(tasksAbs, tasksMd, "utf8");
  return { stateYaml, activeSpecsYaml, tasksMd };
}

function applyBranchProjection(ctx: DecisionApplyContext, payload: OpenNextNodePayload): void {
  const activeAbs = path.join(ctx.repoRoot, payload.activeSpecsFile);
  if (!fs.existsSync(activeAbs)) {
    throw new Error(`Arquivo obrigatório ausente: ${payload.activeSpecsFile}.`);
  }
  const activeSpecsYaml = transitionActiveSpecsYaml(
    fs.readFileSync(activeAbs, "utf8"),
    payload,
    ctx.actor.handle
  );
  fs.writeFileSync(activeAbs, activeSpecsYaml, "utf8");
}

export class OpenNextNodeDefinition implements HumanDecisionDefinition {
  readonly id = OPEN_NEXT_NODE_ID;
  readonly title = "Abrir o próximo nó planejado";

  private policyOf(snapshot: DecisionSnapshot): HumanDecisionTypePolicy | undefined {
    return snapshot.policy ? findDecisionType(snapshot.policy, this.id) : undefined;
  }

  detect(snapshot: DecisionSnapshot): DecisionAvailability {
    return deriveOpenNextNodeAvailability(openNextNodeFactsFromDecisionSnapshot(snapshot));
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
    const active = snapshot.facts.activeNode;
    const next = snapshot.facts.nextPlannedNode;
    const pr = snapshot.facts.pullRequest;
    const currentNode = nodeLabel(snapshot);
    const payload = buildPayload(snapshot);

    const summary =
      availability.status === "available" && active && next
        ? `Abrir, de forma governada, o próximo nó: ${active.id} → ${next.id}.`
        : `A abertura do próximo nó ainda não pode ser executada.`;
    const whyNow =
      "Após Human Gate aprovado, a transição de nó é lifecycle governado. O sistema deve criar branch/PR e reconciliar as fontes estruturais sem depender de sequência manual.";

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
            `Branch pretendida: ${payload?.nextBranch ?? nextNodeBranch(snapshot.specId, next.id)}.`,
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
          ? "Preflight disponível para execução governada."
          : `Bloqueios: ${availability.reasons.join(" | ")}`,
      ],
      planned_effects: payload
        ? [
            `Criar e publicar branch ${payload.nextBranch} a partir do HEAD aprovado ${payload.startPoint}.`,
            "Criar um commit preparatório mínimo em active.yml antes do primeiro push, para os hooks validarem a branch correta.",
            "Abrir PR Draft stacked contra a branch do nó aprovado.",
            "Atualizar state.yml com o número factual retornado pelo GitHub.",
            "Reconciliar state.yml § next com a topologia ativa.",
            "Atualizar active.yml para a nova branch.",
            "Materializar tasks.md para o novo checkpoint não nascer sem objeto de trabalho.",
            "Comitar e fazer push normal do efeito governado.",
          ]
        : ["Sem payload completo, não há efeitos planejáveis."],
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
      technicalDetails.push({ label: "branch planejada", value: payload?.nextBranch ?? "—" });
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
        { label: "active", ref: ".governance/runtime/specs/active.yml" },
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
        preserved: ["state.yml inalterado", "tasks.md inalterado", "active.yml inalterado"],
        commitMessage: null,
        preconditions: [],
        nextHuman: [],
        note: ["Nada foi alterado."],
        payload: null,
      };
    }

    const payload = buildPayload(snapshot);
    if (!payload) {
      return {
        ...base,
        mutating: false,
        changes: [],
        preserved: [],
        commitMessage: null,
        preconditions: [],
        nextHuman: [],
        note: ["Não há payload completo para abrir o próximo nó."],
        payload: null,
      };
    }

    return {
      ...base,
      mutating: true,
      changes: [
        {
          path: payload.nextBranch,
          description: `cria branch a partir de ${payload.startPoint}`,
        },
        {
          path: `PR GitHub`,
          description: `abre Draft PR ${payload.nextNodeId} sobre ${payload.baseBranch}`,
        },
        {
          path: payload.stateFile,
          description: `${payload.activeNodeId} → concluded; ${payload.nextNodeId} → active com PR factual`,
        },
        {
          path: payload.activeSpecsFile,
          description: `projeta branch ativa para ${payload.nextBranch}`,
        },
        {
          path: payload.tasksFile,
          description: `materializa ${payload.nextCheckpoint} como objeto executável`,
        },
      ],
      preserved: [
        "main",
        "merge da stack",
        "Human Gate",
        "Ready do novo PR",
        "implementação funcional do próximo nó",
      ],
      commitMessage: `docs(spec-${snapshot.specId}): abre nó ${payload.nextNodeId}`,
      preconditions: [
        { label: "selo do snapshot", expected: snapshot.seal },
        { label: "git HEAD aprovado", expected: payload.startPoint },
        { label: "Human Gate", expected: "approved" },
        { label: "próximo nó", expected: `${payload.nextNodeId} sem github_pr` },
      ],
      nextHuman: [
        `Novo PR Draft deve apontar para ${payload.nextBranch}.`,
        "`npm run flow -- handoff 0024` deve projetar o novo nó como ativo após checkout da nova branch.",
        "A transição NÃO implementa o novo nó, NÃO faz Ready, NÃO executa Human Gate e NÃO faz merge.",
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
    const payload = plan.payload as OpenNextNodePayload;
    if (!ctx.git.createBranch || !ctx.git.pushBranch) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: ["git ops não suportam criação/publicação de branch para open-next-node."],
      };
    }
    if (!ctx.stack) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: ["StackOps/GitHub ausente — não é possível criar PR factual."],
      };
    }
    const beforeDirty = ctx.git.porcelainPaths();
    if (beforeDirty === null || beforeDirty.length > 0) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: [
          beforeDirty === null
            ? "git status indisponível — transição abortada."
            : `working tree precisa estar limpa antes da transição (dirty: ${beforeDirty.map(toPosix).join(", ")}).`,
        ],
      };
    }

    const messages: string[] = [];
    let prNumber: number;
    let preparationCommit: string | null = null;
    try {
      ctx.git.createBranch(payload.nextBranch, payload.startPoint);
      messages.push(`branch criada: ${payload.nextBranch}`);
      applyBranchProjection(ctx, payload);
      const branchProjectionDirty = ctx.git.porcelainPaths();
      if (branchProjectionDirty === null) {
        throw new Error("git status indisponível após preparar active.yml.");
      }
      const branchProjectionUnexpected = branchProjectionDirty
        .map(toPosix)
        .filter((p) => p !== payload.activeSpecsFile);
      if (branchProjectionUnexpected.length > 0) {
        throw new Error(
          `diff misto antes de publicar branch (mixed_diff: forbidden) — paths inesperados: ${branchProjectionUnexpected.join(", ")}.`
        );
      }
      ctx.git.add(payload.activeSpecsFile);
      ctx.git.commit(`docs(spec-${payload.specId}): prepara branch ${payload.nextNodeId}`);
      preparationCommit = ctx.git.revParseShortHead();
      messages.push(
        `projeção ativa preparada: ${preparationCommit ?? "(commit local)"} — ${payload.nextBranch}`
      );
      ctx.git.pushBranch(payload.nextBranch);
      messages.push(`branch publicada: ${payload.nextBranch}`);
      const pr = ctx.stack.createPullRequest({
        title: payload.prTitle,
        body: payload.prBody,
        base: payload.baseBranch,
        head: payload.nextBranch,
        draft: true,
      });
      prNumber = pr.number;
      messages.push(`PR Draft criado: #${prNumber}`);
      applyFileTransitions(ctx, payload, prNumber);
    } catch (e) {
      return {
        ok: false,
        committed: preparationCommit,
        pushed: false,
        messages: [
          ...messages,
          `transição abortada: ${e instanceof Error ? e.message : String(e)}`,
        ],
      };
    }

    const expected = new Set([payload.stateFile, payload.activeSpecsFile, payload.tasksFile]);
    const dirty = ctx.git.porcelainPaths();
    if (dirty === null) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: [...messages, "git status indisponível após aplicar arquivos — abortado."],
      };
    }
    const unexpected = dirty.map(toPosix).filter((p) => !expected.has(p));
    if (unexpected.length > 0) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: [
          ...messages,
          `diff misto (mixed_diff: forbidden) — paths inesperados: ${unexpected.join(", ")}.`,
        ],
      };
    }

    try {
      for (const file of expected) ctx.git.add(file);
      ctx.git.commit(plan.commitMessage ?? `docs: abre próximo nó`);
    } catch (e) {
      return {
        ok: false,
        committed: null,
        pushed: false,
        messages: [
          ...messages,
          `commit falhou (PR #${prNumber} já foi criado; nada pushado com artefatos): ${e instanceof Error ? e.message : String(e)}`,
        ],
      };
    }
    const committed = ctx.git.revParseShortHead();
    messages.push(`topologia registrada: ${committed} — "${plan.commitMessage}"`);
    try {
      ctx.git.push();
    } catch (e) {
      return {
        ok: false,
        committed,
        pushed: false,
        messages: [
          ...messages,
          `push final falhou; commit ${committed} permanece LOCAL: ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`,
        ],
      };
    }
    messages.push("push normal concluído.");
    return { ok: true, committed, pushed: true, messages };
  }
}
