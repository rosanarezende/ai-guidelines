/**
 * Graph snapshot DERIVADO do trabalho governado (Spec 0024 · PR #46).
 *
 * Implementa o contrato da matriz de lentes §8 (research/2026-07-12-…-work-graph-
 * lens-matrix.md): projeção derived-only, determinística, regenerável e offline
 * do work graph do próprio framework. Vocabulário conceitual por DEC-0024-G25:
 * `node.type = governed-work` (nunca `spec`); "spec" sobrevive apenas como
 * atributos legados (`legacy_spec_id`/`legacy_spec_slug`/`source_path`) e
 * `source_ref`. "Frente" NÃO é nó (G22: leitura derivada).
 *
 * Módulo PURO: recebe conteúdos/DTOs já lidos (a CLI orquestra I/O), deriva
 * nós/arestas/atributos e sela com `snapshot_fingerprint` (mesmo padrão dos
 * selos de review). Nenhum comando decisório LÊ este snapshot (DEC-G23).
 */
import { createHash } from "node:crypto";
import type { WorkflowState, PrTopologyNode } from "../../domain/workflow/WorkflowState.js";
import { parseSteps, parseCheckpointTasks } from "../handoff/handoffFacts.js";
import { deriveFrenteProgression } from "../workflow/frenteProgression.js";

// ── Contrato §8.1/§8.2 (conjuntos FECHADOS; fail-closed em violação) ─────────

export const GRAPH_NODE_TYPES = [
  "governed-work",
  "topology-node",
  "checkpoint",
  "step",
  "task",
  "decision",
  "adr",
  "guardrail",
  "insight",
  "review",
  "finding",
  "resolution",
  "review-event",
  "gate",
  "continuation-package",
  "research-artifact",
  "projection",
] as const;
export type GraphNodeType = (typeof GRAPH_NODE_TYPES)[number];

/** Proibidos por §8.0 (G25/G22) — conformance falha se aparecerem. */
export const FORBIDDEN_NODE_TYPES = ["spec", "frente"] as const;

export const GRAPH_EDGE_TYPES = [
  "contains",
  "stacked-on",
  "continues-from",
  "verifies",
  "belongs-to",
  "resolves",
  "closed-by",
  "supersedes",
  "supported-by",
  "derived-from",
] as const;
export type GraphEdgeType = (typeof GRAPH_EDGE_TYPES)[number];

// ── Input DTOs (a CLI mapeia dos leitores de infra; módulo não faz I/O) ──────

export interface GraphSourceFile {
  readonly path: string;
  readonly content: string;
}

export interface GraphGovernedWorkInput {
  /** Id físico estável do invólucro (basename do diretório governado). */
  readonly id: string;
  readonly legacySpecId: string;
  readonly legacySpecSlug: string;
  readonly sourcePath: string;
  readonly statePath: string;
  readonly tasksPath: string;
  readonly decisionBriefPath: string;
}

export interface GraphReviewInput {
  readonly checkpoint: string;
  readonly role: string;
  readonly decision: string;
  readonly path: string;
  readonly findings: ReadonlyArray<{
    readonly id: string;
    readonly severity: string;
    readonly disposition: string;
  }>;
}

export interface GraphResolutionInput {
  readonly checkpoint: string;
  readonly path: string;
  /** refs totalmente qualificadas `<role>#F<n>`. */
  readonly resolves: readonly string[];
}

export interface GraphEventInput {
  readonly checkpoint: string;
  readonly role: string;
  readonly eventId: string;
  readonly kind: string;
  readonly decision: string;
  readonly scope: string;
  readonly verifies: readonly string[];
  readonly path: string;
}

export interface GraphGateInput {
  readonly checkpoint: string;
  readonly decision: string;
  readonly path: string;
}

export interface GraphSimpleArtifactInput {
  readonly id: string;
  readonly path: string;
}

export interface GraphInsightInput extends GraphSimpleArtifactInput {
  readonly status: string;
}

export interface GraphResearchInput {
  readonly path: string;
  readonly artifactKind?: string;
}

export interface GraphContinuationInput {
  readonly slug: string;
  readonly path: string;
  readonly sourcePr: number | null;
  readonly targetNodeId: string | null;
}

export interface GovernanceGraphInput {
  readonly governedWork: GraphGovernedWorkInput;
  readonly state: WorkflowState;
  readonly tasksMd: string;
  readonly decisionBriefMd: string;
  readonly reviews: readonly GraphReviewInput[];
  readonly resolutions: readonly GraphResolutionInput[];
  readonly events: readonly GraphEventInput[];
  readonly gates: readonly GraphGateInput[];
  readonly insights: readonly GraphInsightInput[];
  readonly adrs: readonly GraphSimpleArtifactInput[];
  readonly guardrails: readonly GraphSimpleArtifactInput[];
  readonly research: readonly GraphResearchInput[];
  readonly continuations: readonly GraphContinuationInput[];
  readonly projections: readonly GraphSimpleArtifactInput[];
  /** Universo de fontes para source_ref/hash; todo path referenciado deve estar aqui. */
  readonly files: readonly GraphSourceFile[];
}

// ── Saída ────────────────────────────────────────────────────────────────────

export interface GraphSourceRef {
  readonly path: string;
  readonly hash: string;
}

export interface GraphNode {
  readonly id: string;
  readonly type: GraphNodeType;
  readonly label: string;
  readonly attributes: Readonly<Record<string, unknown>>;
  readonly source_ref: GraphSourceRef;
}

export interface GraphEdge {
  readonly from: string;
  readonly type: GraphEdgeType;
  readonly to: string;
}

export interface GovernanceGraphSnapshot {
  readonly schema_version: 1;
  readonly note: string;
  readonly source: { readonly kind: "derived-projection"; readonly authority: "none" };
  readonly governed_work_id: string;
  readonly snapshot_fingerprint: string;
  readonly source_refs: readonly GraphSourceRef[];
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
}

// ── Helpers puros ────────────────────────────────────────────────────────────

function sha12(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 12);
}

/**
 * Normalização de fontes VOLÁTEIS antes do hash (§8.3): campo de relógio de
 * projeção runtime (`updated_at` do active.yml) não é mudança semântica do
 * grafo — excluí-lo evita churn de fingerprint a cada publish-state. Qualquer
 * OUTRO campo (branch, stage, status…) segue hashado: mudança real muda o selo.
 */
export function normalizeSourceContentForHash(path: string, content: string): string {
  if (path.endsWith("runtime/specs/active.yml")) {
    return content
      .split(/\r?\n/)
      .filter((line) => !/^\s*updated_at:/.test(line))
      .join("\n");
  }
  return content;
}

function normalizeCheckpoint(slug: string): string {
  return slug.replace(/^checkpoint-/, "");
}

/** Seções `### [DEC-…] Título` do decision-brief + refs de research citadas. */
export function parseDecisionSections(decisionBriefMd: string): ReadonlyArray<{
  readonly id: string;
  readonly title: string;
  readonly status: string | null;
  readonly researchRefs: readonly string[];
}> {
  const headingRe = /^###\s+\[(DEC-[A-Za-z0-9-]+)\]\s+(.+)$/gm;
  const matches = [...decisionBriefMd.matchAll(headingRe)];
  return matches.map((m, i) => {
    const start = (m.index ?? 0) + m[0].length;
    const end =
      i + 1 < matches.length
        ? (matches[i + 1].index ?? decisionBriefMd.length)
        : decisionBriefMd.length;
    const body = decisionBriefMd.slice(start, end);
    const status = /\*\*Status:\*\*\s*([A-Za-z-]+)/.exec(body)?.[1] ?? null;
    const researchRefs = [
      ...new Set([...body.matchAll(/research\/[A-Za-z0-9._/-]+\.md/g)].map((r) => r[0])),
    ].sort();
    return { id: m[1], title: m[2].trim(), status, researchRefs };
  });
}

// ── Conformidade (fail-closed; também exportada para testes/checks) ─────────

export function collectGraphViolations(snapshot: {
  readonly nodes: readonly { id: string; type: string; source_ref?: GraphSourceRef }[];
  readonly edges: readonly { from: string; type: string; to: string }[];
}): string[] {
  const violations: string[] = [];
  const nodeTypes = new Set<string>(GRAPH_NODE_TYPES);
  const edgeTypes = new Set<string>(GRAPH_EDGE_TYPES);
  const forbidden = new Set<string>(FORBIDDEN_NODE_TYPES);
  const ids = new Set<string>();
  for (const node of snapshot.nodes) {
    if (forbidden.has(node.type)) {
      violations.push(`node.type PROIBIDO (§8.0): "${node.type}" em ${node.id}`);
    } else if (!nodeTypes.has(node.type)) {
      violations.push(`node.type fora do §8.1: "${node.type}" em ${node.id}`);
    }
    if (ids.has(node.id)) violations.push(`node.id duplicado: ${node.id}`);
    ids.add(node.id);
    if (!node.source_ref?.path || !node.source_ref?.hash) {
      violations.push(`node sem source_ref completo (path+hash): ${node.id}`);
    }
  }
  for (const edge of snapshot.edges) {
    if (!edgeTypes.has(edge.type)) {
      violations.push(`edge.type fora do §8.2: "${edge.type}" (${edge.from} -> ${edge.to})`);
    }
    if (!ids.has(edge.from)) violations.push(`edge.from inexistente: ${edge.from} (${edge.type})`);
    if (!ids.has(edge.to)) violations.push(`edge.to inexistente: ${edge.to} (${edge.type})`);
  }
  return violations;
}

// ── Derivação ────────────────────────────────────────────────────────────────

export function deriveGovernanceGraphSnapshot(
  input: GovernanceGraphInput
): GovernanceGraphSnapshot {
  const gw = input.governedWork;
  const hashes = new Map(
    input.files.map((f) => [f.path, sha12(normalizeSourceContentForHash(f.path, f.content))])
  );
  const refOf = (path: string): GraphSourceRef => {
    const hash = hashes.get(path);
    if (!hash) throw new Error(`source_ref sem conteúdo para hash (path fora de files[]): ${path}`);
    return { path, hash };
  };
  const nid = (type: GraphNodeType, local: string): string => `${type}:${gw.id}/${local}`;

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeIds = new Set<string>();
  const addNode = (node: GraphNode): void => {
    if (nodeIds.has(node.id)) return; // idempotente por id (fontes podem repetir)
    nodeIds.add(node.id);
    nodes.push(node);
  };
  const addEdge = (from: string, type: GraphEdgeType, to: string): void => {
    if (!nodeIds.has(from) || !nodeIds.has(to)) return; // aresta só entre nós existentes
    edges.push({ from, type, to });
  };

  const topology = input.state.topology;
  if (!topology) {
    throw new Error("state.yml sem topology — snapshot do work graph não pode ser derivado.");
  }

  // governed-work (invólucro; "spec" só como atributo legado — §8.0/G25)
  const allTopologyNodes: ReadonlyArray<{ node: PrTopologyNode; status: string }> = [
    ...topology.prs.concluded.map((node) => ({ node, status: "concluded" })),
    ...topology.prs.active.map((node) => ({ node, status: "active" })),
    ...topology.prs.planned.map((node) => ({ node, status: "planned" })),
  ];
  const cursorCheckpoint = topology.cursor.checkpoint;
  const cursorSteps = parseSteps(input.tasksMd, cursorCheckpoint);
  const firstPlanned = topology.prs.planned[0] ?? null;
  const cursorGate = input.gates.find(
    (g) => normalizeCheckpoint(g.checkpoint) === normalizeCheckpoint(cursorCheckpoint)
  );
  const progression = deriveFrenteProgression({
    steps: cursorSteps,
    nextPlannedNode: firstPlanned ? { id: firstPlanned.id, sequence: firstPlanned.sequence } : null,
    gateApproved: cursorGate?.decision === "approved",
  });
  const gwId = nid("governed-work", gw.id);
  addNode({
    id: gwId,
    type: "governed-work",
    label: "Trabalho governado — Context Architecture / 0024",
    attributes: {
      legacy_spec_id: gw.legacySpecId,
      legacy_spec_slug: gw.legacySpecSlug,
      source_path: gw.sourcePath,
      stage: input.state.stage,
      gate_status: input.state.gate.status,
      derived: {
        frente_complete: progression.frenteComplete,
        next_topology_executable: progression.nextTopologyExecutable,
        active_step_ready: progression.activeStepReady,
        next_semantic_step: progression.nextSemanticStep?.id ?? null,
      },
    },
    source_ref: refOf(gw.statePath),
  });

  // topology-node + checkpoint + step + task (cadeia contains do §8.2)
  for (const { node, status } of allTopologyNodes) {
    const tnId = nid("topology-node", node.id);
    addNode({
      id: tnId,
      type: "topology-node",
      label: node.id,
      attributes: {
        github_pr: node.github_pr,
        continuation_prs: (node.continuation_prs ?? []).map((continuation) => ({
          github_pr: continuation.github_pr,
          checkpoint: continuation.checkpoint,
          head: continuation.head,
        })),
        sequence: node.sequence,
        role: node.role,
        terminal: node.terminal,
        status,
        is_cursor: node.id === topology.cursor.pr,
      },
      source_ref: refOf(gw.statePath),
    });
    addEdge(gwId, "contains", tnId);

    for (const checkpoint of node.checkpoints) {
      const cpId = nid("checkpoint", checkpoint);
      addNode({
        id: cpId,
        type: "checkpoint",
        label: checkpoint,
        attributes: { is_cursor: checkpoint === cursorCheckpoint },
        source_ref: refOf(gw.statePath),
      });
      addEdge(tnId, "contains", cpId);

      for (const step of parseSteps(input.tasksMd, checkpoint)) {
        const stepId = nid("step", step.id);
        addNode({
          id: stepId,
          type: "step",
          label: step.title || step.id,
          attributes: {
            state: step.state,
            line: step.line,
            ...(step.readiness ? { readiness: step.readiness } : {}),
          },
          source_ref: refOf(gw.tasksPath),
        });
        addEdge(cpId, "contains", stepId);
      }
      // Tarefas ancoram no checkpoint hoje (tasks.md); step→task quando materializar.
      // Id ESTÁVEL por conteúdo (hash do texto normalizado), não por linha (§8.3):
      // mover a tarefa no arquivo preserva a identidade; texto duplicado no mesmo
      // checkpoint recebe ordinal por ocorrência. `line` fica como atributo humano.
      const taskOccurrences = new Map<string, number>();
      for (const task of parseCheckpointTasks(input.tasksMd, {
        pr: node.id,
        checkpoint,
      })) {
        const contentKey = sha12(task.text.replace(/\s+/g, " ").trim());
        const seen = taskOccurrences.get(contentKey) ?? 0;
        taskOccurrences.set(contentKey, seen + 1);
        const ordinal = seen === 0 ? "" : `-${seen + 1}`;
        const taskId = nid("task", `${normalizeCheckpoint(checkpoint)}-${contentKey}${ordinal}`);
        addNode({
          id: taskId,
          type: "task",
          label: task.text.slice(0, 120),
          attributes: { done: task.done, line: task.line },
          source_ref: refOf(gw.tasksPath),
        });
        addEdge(cpId, "contains", taskId);
      }
    }
  }

  // stacked-on: nós de execução em ordem de sequence; seq 1 ancora no nó de governança.
  const governanceBase = allTopologyNodes.find(({ node }) => node.role === "governance");
  const bySequence = allTopologyNodes
    .filter(({ node }) => node.sequence !== null)
    .sort((a, b) => (a.node.sequence ?? 0) - (b.node.sequence ?? 0));
  for (let i = 0; i < bySequence.length; i++) {
    const current = nid("topology-node", bySequence[i].node.id);
    if (i === 0) {
      if (governanceBase) {
        addEdge(current, "stacked-on", nid("topology-node", governanceBase.node.id));
      }
    } else {
      addEdge(current, "stacked-on", nid("topology-node", bySequence[i - 1].node.id));
    }
  }

  // decision (DEC) + supported-by (refs de research citadas na seção)
  const researchByTail = new Map<string, string>();
  for (const r of input.research) {
    const local = r.path.split("/").slice(-1)[0].replace(/\.md$/, "");
    const rid = nid("research-artifact", local);
    addNode({
      id: rid,
      type: "research-artifact",
      label: local,
      attributes: r.artifactKind ? { artifact_kind: r.artifactKind } : {},
      source_ref: refOf(r.path),
    });
    const tail = r.path.match(/research\/[A-Za-z0-9._/-]+\.md$/)?.[0];
    if (tail) researchByTail.set(tail, rid);
  }
  for (const dec of parseDecisionSections(input.decisionBriefMd)) {
    const decId = nid("decision", dec.id);
    addNode({
      id: decId,
      type: "decision",
      label: dec.title,
      attributes: dec.status ? { status: dec.status } : {},
      source_ref: refOf(gw.decisionBriefPath),
    });
    for (const ref of dec.researchRefs) {
      const target = researchByTail.get(ref);
      if (target) addEdge(decId, "supported-by", target);
    }
  }
  // supersedes (decision→decision): emissão ADIADA — sem marcador machine-readable
  // confiável no decision-brief (prosa contém negações como "sem superseder").
  // O tipo permanece permitido pelo §8.2; ver relatório do PR #46.

  // adr · guardrail · insight
  for (const adr of input.adrs) {
    addNode({
      id: nid("adr", adr.id),
      type: "adr",
      label: adr.id,
      attributes: {},
      source_ref: refOf(adr.path),
    });
  }
  for (const gg of input.guardrails) {
    addNode({
      id: nid("guardrail", gg.id),
      type: "guardrail",
      label: gg.id,
      attributes: {},
      source_ref: refOf(gg.path),
    });
  }
  for (const pit of input.insights) {
    addNode({
      id: nid("insight", pit.id),
      type: "insight",
      label: pit.id,
      attributes: { status: pit.status },
      source_ref: refOf(pit.path),
    });
  }

  // review + finding + resolution + review-event + gate (lanes por checkpoint)
  const findingIdOf = (checkpoint: string, ref: string): string =>
    nid("finding", `${normalizeCheckpoint(checkpoint)}-${ref.replace("#", "-")}`);
  for (const review of input.reviews) {
    const cp = normalizeCheckpoint(review.checkpoint);
    const reviewId = nid("review", `${cp}-${review.role}`);
    addNode({
      id: reviewId,
      type: "review",
      label: `${review.role} · ${cp}`,
      attributes: { role: review.role, decision: review.decision },
      source_ref: refOf(review.path),
    });
    const cpNode = nodes.find(
      (n) => n.type === "checkpoint" && normalizeCheckpoint(n.label) === cp
    );
    if (cpNode) addEdge(reviewId, "verifies", cpNode.id);
    for (const finding of review.findings) {
      const fid = findingIdOf(review.checkpoint, `${review.role}#${finding.id}`);
      addNode({
        id: fid,
        type: "finding",
        label: `${review.role}#${finding.id} · ${cp}`,
        attributes: { severity: finding.severity, disposition: finding.disposition },
        source_ref: refOf(review.path),
      });
      addEdge(fid, "belongs-to", reviewId);
    }
  }
  for (const resolution of input.resolutions) {
    const cp = normalizeCheckpoint(resolution.checkpoint);
    const resId = nid("resolution", cp);
    addNode({
      id: resId,
      type: "resolution",
      label: `resolutions · ${cp}`,
      attributes: {},
      source_ref: refOf(resolution.path),
    });
    for (const ref of resolution.resolves) {
      addEdge(resId, "resolves", findingIdOf(resolution.checkpoint, ref));
    }
  }
  for (const event of input.events) {
    const cp = normalizeCheckpoint(event.checkpoint);
    const evId = nid("review-event", `${cp}-${event.role}-${event.eventId}`);
    addNode({
      id: evId,
      type: "review-event",
      label: `${event.role} ${event.eventId} · ${cp}`,
      attributes: { kind: event.kind, scope: event.scope, decision: event.decision },
      source_ref: refOf(event.path),
    });
    addEdge(evId, "verifies", nid("review", `${cp}-${event.role}`));
    for (const ref of event.verifies) {
      addEdge(evId, "verifies", findingIdOf(event.checkpoint, ref));
    }
  }
  for (const gate of input.gates) {
    const cp = normalizeCheckpoint(gate.checkpoint);
    const gateId = nid("gate", cp);
    addNode({
      id: gateId,
      type: "gate",
      label: `gate · ${cp}`,
      attributes: { decision: gate.decision },
      source_ref: refOf(gate.path),
    });
    const cpNode = nodes.find(
      (n) => n.type === "checkpoint" && normalizeCheckpoint(n.label) === cp
    );
    if (cpNode) addEdge(cpNode.id, "closed-by", gateId);
  }

  // continuation-package + continues-from
  const nodeByPr = new Map<number, string>();
  for (const { node } of allTopologyNodes) {
    const topologyId = nid("topology-node", node.id);
    if (node.github_pr !== null) nodeByPr.set(node.github_pr, topologyId);
    for (const continuation of node.continuation_prs ?? []) {
      nodeByPr.set(continuation.github_pr, topologyId);
    }
  }
  for (const cont of input.continuations) {
    const contId = nid("continuation-package", cont.slug);
    addNode({
      id: contId,
      type: "continuation-package",
      label: cont.slug,
      attributes: { source_pr: cont.sourcePr, target: cont.targetNodeId },
      source_ref: refOf(cont.path),
    });
    if (cont.targetNodeId && cont.sourcePr !== null) {
      const target = nid("topology-node", cont.targetNodeId);
      const source = nodeByPr.get(cont.sourcePr);
      if (source) addEdge(target, "continues-from", source);
    }
  }

  // projection —derived-from→ governed-work (nunca SSOT)
  for (const projection of input.projections) {
    const pid = nid("projection", projection.id);
    addNode({
      id: pid,
      type: "projection",
      label: projection.id,
      attributes: { authority: "none" },
      source_ref: refOf(projection.path),
    });
    addEdge(pid, "derived-from", gwId);
  }

  // Ordenação canônica (determinismo independe da ordem dos inputs)
  const sortedNodes = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
  const sortedEdges = [...edges].sort((a, b) =>
    `${a.from}|${a.type}|${a.to}`.localeCompare(`${b.from}|${b.type}|${b.to}`)
  );
  const sourceRefs = [...hashes.entries()]
    .map(([path, hash]) => ({ path, hash }))
    .sort((a, b) => a.path.localeCompare(b.path));

  const violations = collectGraphViolations({ nodes: sortedNodes, edges: sortedEdges });
  if (violations.length > 0) {
    throw new Error(`snapshot fora do contrato §8 (fail-closed):\n${violations.join("\n")}`);
  }

  // Selo: serialização canônica (padrão review_fingerprint). Sem generated-at/
  // source-commit na v1: determinismo do par build/check — a rastreabilidade
  // temporal vem dos content-hashes de source_refs (ver relatório PR #46).
  const snapshot_fingerprint = sha12(JSON.stringify([1, sourceRefs, sortedNodes, sortedEdges]));

  return {
    schema_version: 1,
    note:
      "Projeção DERIVADA (derived-only) do trabalho governado — regenerável via " +
      "`npm run governance-graph:build`; validada por `governance-graph:check`. " +
      "NUNCA é SSOT: state.yml/tasks.md/decision-brief/reviews/gates governam; " +
      "nenhum comando decisório lê este arquivo (DEC-0024-G23/G25).",
    source: { kind: "derived-projection", authority: "none" },
    governed_work_id: gw.id,
    snapshot_fingerprint,
    source_refs: sourceRefs,
    nodes: sortedNodes,
    edges: sortedEdges,
  };
}
