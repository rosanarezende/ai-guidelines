import { parse, stringify } from "yaml";
import {
  WorkflowState,
  isGateStatus,
  isWorkflowStage,
  isTopologyRole,
  NodeReviewPlanEntry,
  NodeReviewRequirementOverride,
  PrTopologyNode,
  TopologyContinuationPr,
  WorkflowTopology,
} from "../../domain/workflow/WorkflowState.js";

export class WorkflowStateParseError extends Error {
  constructor(message: string) {
    super(`Invalid state.yml: ${message}`);
    this.name = "WorkflowStateParseError";
  }
}

const ALLOWED_TOP_KEYS = ["stage", "gate", "focus", "next", "topology"] as const;
const ALLOWED_GATE_KEYS = ["status"] as const;
const ALLOWED_TOPOLOGY_KEYS = ["cursor", "prs"] as const;
const ALLOWED_CURSOR_KEYS = ["pr", "checkpoint"] as const;
const ALLOWED_PRS_KEYS = ["concluded", "active", "planned"] as const;
const ALLOWED_NODE_KEYS = [
  "id",
  "github_pr",
  "continuation_prs",
  "role",
  "terminal",
  "sequence",
  "checkpoints",
  "review_plan",
  "review_requirements",
] as const;
const ALLOWED_CONTINUATION_PR_KEYS = [
  "github_pr",
  "checkpoint",
  "head",
  "review_plan",
  "review_requirements",
] as const;
const ALLOWED_NODE_REVIEW_OVERRIDE_KEYS = ["requirement", "reason", "actor"] as const;
const ALLOWED_NODE_REVIEW_PLAN_KEYS = [
  "system_recommendation",
  "owner_decision",
  "reason",
  "actor",
  "revalidation",
] as const;
const ALLOWED_NODE_REVIEW_REVALIDATION_KEYS = [
  "owner_decision",
  "analyzed_head",
  "reason",
  "actor",
] as const;
const REQUIREMENT_LEVELS = ["disabled", "optional", "recommended", "required"] as const;
const REVIEW_PLAN_RECOMMENDATIONS = ["not_needed", "optional", "recommended", "required"] as const;
const REVIEW_PLAN_DECISIONS = ["pending", "waived", "optional", "recommended", "required"] as const;
const REVIEW_PLAN_REVALIDATION_DECISIONS = ["pending", "waived", "required"] as const;

/** Overrides situados por tipo de review do nó (CO-4, rodada 8). */
function parseNodeReviewRequirements(
  raw: unknown,
  where: string
): Record<string, NodeReviewRequirementOverride> {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new WorkflowStateParseError(`${where} must be a mapping of <type_id> overrides`);
  }
  const result: Record<string, NodeReviewRequirementOverride> = {};
  for (const [typeId, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new WorkflowStateParseError(`${where}.${typeId} must be a mapping`);
    }
    const o = value as Record<string, unknown>;
    for (const key of Object.keys(o)) {
      if (!(ALLOWED_NODE_REVIEW_OVERRIDE_KEYS as readonly string[]).includes(key)) {
        throw new WorkflowStateParseError(
          `${where}.${typeId}: unexpected key "${key}" (allowed: ${ALLOWED_NODE_REVIEW_OVERRIDE_KEYS.join(", ")})`
        );
      }
    }
    if (
      typeof o.requirement !== "string" ||
      !(REQUIREMENT_LEVELS as readonly string[]).includes(o.requirement)
    ) {
      throw new WorkflowStateParseError(
        `${where}.${typeId}.requirement must be one of: ${REQUIREMENT_LEVELS.join("|")}`
      );
    }
    if (o.reason !== undefined && typeof o.reason !== "string") {
      throw new WorkflowStateParseError(`${where}.${typeId}.reason must be a string`);
    }
    if (o.actor !== undefined && typeof o.actor !== "string") {
      throw new WorkflowStateParseError(`${where}.${typeId}.actor must be a string`);
    }
    result[typeId] = {
      requirement: o.requirement as NodeReviewRequirementOverride["requirement"],
      ...(o.reason !== undefined ? { reason: o.reason } : {}),
      ...(o.actor !== undefined ? { actor: o.actor } : {}),
    };
  }
  return result;
}

/** Plano situado: sistema recomenda, owner decide; sem decisao implicita. */
function parseNodeReviewPlan(raw: unknown, where: string): Record<string, NodeReviewPlanEntry> {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new WorkflowStateParseError(`${where} must be a mapping of <type_id> decisions`);
  }
  const result: Record<string, NodeReviewPlanEntry> = {};
  for (const [typeId, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new WorkflowStateParseError(`${where}.${typeId} must be a mapping`);
    }
    const o = value as Record<string, unknown>;
    for (const key of Object.keys(o)) {
      if (!(ALLOWED_NODE_REVIEW_PLAN_KEYS as readonly string[]).includes(key)) {
        throw new WorkflowStateParseError(
          `${where}.${typeId}: unexpected key "${key}" (allowed: ${ALLOWED_NODE_REVIEW_PLAN_KEYS.join(", ")})`
        );
      }
    }
    if (
      typeof o.system_recommendation !== "string" ||
      !(REVIEW_PLAN_RECOMMENDATIONS as readonly string[]).includes(o.system_recommendation)
    ) {
      throw new WorkflowStateParseError(
        `${where}.${typeId}.system_recommendation must be one of: ${REVIEW_PLAN_RECOMMENDATIONS.join("|")}`
      );
    }
    if (
      typeof o.owner_decision !== "string" ||
      !(REVIEW_PLAN_DECISIONS as readonly string[]).includes(o.owner_decision)
    ) {
      throw new WorkflowStateParseError(
        `${where}.${typeId}.owner_decision must be one of: ${REVIEW_PLAN_DECISIONS.join("|")}`
      );
    }
    if (o.reason !== undefined && typeof o.reason !== "string") {
      throw new WorkflowStateParseError(`${where}.${typeId}.reason must be a string`);
    }
    if (o.actor !== undefined && typeof o.actor !== "string") {
      throw new WorkflowStateParseError(`${where}.${typeId}.actor must be a string`);
    }
    if (o.owner_decision !== "pending" && (!o.actor || !o.reason)) {
      throw new WorkflowStateParseError(
        `${where}.${typeId}: owner_decision "${o.owner_decision}" requires actor and reason`
      );
    }
    let revalidation: NodeReviewPlanEntry["revalidation"] | undefined;
    if (o.revalidation !== undefined) {
      if (
        o.revalidation === null ||
        typeof o.revalidation !== "object" ||
        Array.isArray(o.revalidation)
      ) {
        throw new WorkflowStateParseError(`${where}.${typeId}.revalidation must be a mapping`);
      }
      const r = o.revalidation as Record<string, unknown>;
      for (const key of Object.keys(r)) {
        if (!(ALLOWED_NODE_REVIEW_REVALIDATION_KEYS as readonly string[]).includes(key)) {
          throw new WorkflowStateParseError(
            `${where}.${typeId}.revalidation: unexpected key "${key}" (allowed: ${ALLOWED_NODE_REVIEW_REVALIDATION_KEYS.join(", ")})`
          );
        }
      }
      if (
        typeof r.owner_decision !== "string" ||
        !(REVIEW_PLAN_REVALIDATION_DECISIONS as readonly string[]).includes(r.owner_decision)
      ) {
        throw new WorkflowStateParseError(
          `${where}.${typeId}.revalidation.owner_decision must be one of: ${REVIEW_PLAN_REVALIDATION_DECISIONS.join("|")}`
        );
      }
      if (r.reason !== undefined && typeof r.reason !== "string") {
        throw new WorkflowStateParseError(
          `${where}.${typeId}.revalidation.reason must be a string`
        );
      }
      if (r.actor !== undefined && typeof r.actor !== "string") {
        throw new WorkflowStateParseError(`${where}.${typeId}.revalidation.actor must be a string`);
      }
      if (
        r.analyzed_head !== undefined &&
        (typeof r.analyzed_head !== "string" || !/^[0-9a-f]{7,40}$/i.test(r.analyzed_head))
      ) {
        throw new WorkflowStateParseError(
          `${where}.${typeId}.revalidation.analyzed_head must be a git object id`
        );
      }
      if (r.owner_decision !== "pending" && (!r.actor || !r.reason)) {
        throw new WorkflowStateParseError(
          `${where}.${typeId}.revalidation: owner_decision "${r.owner_decision}" requires actor and reason`
        );
      }
      revalidation = {
        owner_decision: r.owner_decision as NonNullable<
          NodeReviewPlanEntry["revalidation"]
        >["owner_decision"],
        ...(r.analyzed_head !== undefined ? { analyzed_head: r.analyzed_head as string } : {}),
        ...(r.reason !== undefined ? { reason: r.reason } : {}),
        ...(r.actor !== undefined ? { actor: r.actor } : {}),
      };
    }
    result[typeId] = {
      system_recommendation:
        o.system_recommendation as NodeReviewPlanEntry["system_recommendation"],
      owner_decision: o.owner_decision as NodeReviewPlanEntry["owner_decision"],
      ...(o.reason !== undefined ? { reason: o.reason } : {}),
      ...(o.actor !== undefined ? { actor: o.actor } : {}),
      ...(revalidation ? { revalidation } : {}),
    };
  }
  return result;
}

function parseContinuationPrs(raw: unknown, where: string): TopologyContinuationPr[] {
  if (!Array.isArray(raw)) {
    throw new WorkflowStateParseError(`${where} must be a list`);
  }
  return raw.map((value, index) => {
    const itemWhere = `${where}[${index}]`;
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new WorkflowStateParseError(`${itemWhere} must be a mapping`);
    }
    const item = value as Record<string, unknown>;
    for (const key of Object.keys(item)) {
      if (!(ALLOWED_CONTINUATION_PR_KEYS as readonly string[]).includes(key)) {
        throw new WorkflowStateParseError(`${itemWhere}: unexpected key "${key}"`);
      }
    }
    if (!Number.isInteger(item.github_pr) || (item.github_pr as number) <= 0) {
      throw new WorkflowStateParseError(`${itemWhere}.github_pr must be a positive integer`);
    }
    if (typeof item.checkpoint !== "string" || item.checkpoint.trim() === "") {
      throw new WorkflowStateParseError(`${itemWhere}.checkpoint must be a non-empty string`);
    }
    if (typeof item.head !== "string" || item.head.trim() === "") {
      throw new WorkflowStateParseError(`${itemWhere}.head must be a non-empty string`);
    }
    const reviewPlan =
      item.review_plan !== undefined
        ? parseNodeReviewPlan(item.review_plan, `${itemWhere}.review_plan`)
        : undefined;
    const reviewRequirements =
      item.review_requirements !== undefined
        ? parseNodeReviewRequirements(item.review_requirements, `${itemWhere}.review_requirements`)
        : undefined;
    return {
      github_pr: item.github_pr as number,
      checkpoint: item.checkpoint,
      head: item.head,
      ...(reviewPlan ? { review_plan: reviewPlan } : {}),
      ...(reviewRequirements ? { review_requirements: reviewRequirements } : {}),
    };
  });
}

export function parseWorkflowState(yamlText: string): WorkflowState {
  const raw: unknown = parse(yamlText);
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new WorkflowStateParseError("root must be a mapping");
  }
  const obj = raw as Record<string, unknown>;

  for (const key of Object.keys(obj)) {
    if (!(ALLOWED_TOP_KEYS as readonly string[]).includes(key)) {
      throw new WorkflowStateParseError(
        `unexpected top-level key "${key}" (allowed: ${ALLOWED_TOP_KEYS.join(", ")})`
      );
    }
  }

  if (!isWorkflowStage(obj.stage)) {
    throw new WorkflowStateParseError(
      `stage must be one of: discovery|decision|planning|implementation|closing|done`
    );
  }

  if (obj.gate === null || typeof obj.gate !== "object" || Array.isArray(obj.gate)) {
    throw new WorkflowStateParseError(`gate must be a mapping with a "status" key`);
  }
  const gate = obj.gate as Record<string, unknown>;
  for (const key of Object.keys(gate)) {
    if (!(ALLOWED_GATE_KEYS as readonly string[]).includes(key)) {
      throw new WorkflowStateParseError(`unexpected gate key "${key}"`);
    }
  }
  if (!isGateStatus(gate.status)) {
    throw new WorkflowStateParseError(`gate.status must be one of: open|awaiting-review|closed`);
  }

  const focus = parseStringArray(obj.focus, "focus");
  const next = parseStringArray(obj.next, "next");

  let topology: WorkflowTopology | undefined = undefined;
  if (obj.topology !== undefined) {
    topology = parseTopology(obj.topology);
  }

  return {
    stage: obj.stage,
    gate: { status: gate.status },
    focus,
    next,
    ...(topology ? { topology } : {}),
  };
}

function parseTopology(raw: unknown): WorkflowTopology {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new WorkflowStateParseError("topology must be a mapping");
  }
  const obj = raw as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!(ALLOWED_TOPOLOGY_KEYS as readonly string[]).includes(key)) {
      throw new WorkflowStateParseError(`unexpected topology key "${key}"`);
    }
  }

  if (obj.cursor === null || typeof obj.cursor !== "object" || Array.isArray(obj.cursor)) {
    throw new WorkflowStateParseError("topology.cursor must be a mapping");
  }
  const cursorObj = obj.cursor as Record<string, unknown>;
  for (const key of Object.keys(cursorObj)) {
    if (!(ALLOWED_CURSOR_KEYS as readonly string[]).includes(key)) {
      throw new WorkflowStateParseError(`unexpected cursor key "${key}"`);
    }
  }
  if (typeof cursorObj.pr !== "string") {
    throw new WorkflowStateParseError("topology.cursor.pr must be a string");
  }
  if (typeof cursorObj.checkpoint !== "string") {
    throw new WorkflowStateParseError("topology.cursor.checkpoint must be a string");
  }

  if (obj.prs === null || typeof obj.prs !== "object" || Array.isArray(obj.prs)) {
    throw new WorkflowStateParseError("topology.prs must be a mapping");
  }
  const prsObj = obj.prs as Record<string, unknown>;
  for (const key of Object.keys(prsObj)) {
    if (!(ALLOWED_PRS_KEYS as readonly string[]).includes(key)) {
      throw new WorkflowStateParseError(`unexpected prs key "${key}"`);
    }
  }

  const ids = new Set<string>();
  const checkpointsSet = new Set<string>();
  let hasTerminal = false;
  let terminalCount = 0;

  const parseGroup = (groupName: string): PrTopologyNode[] => {
    const rawNodes = prsObj[groupName];
    if (rawNodes === undefined) return [];
    if (!Array.isArray(rawNodes)) {
      throw new WorkflowStateParseError(`topology.prs.${groupName} must be a list`);
    }

    const nodes: PrTopologyNode[] = [];
    for (const [index, rawNode] of rawNodes.entries()) {
      if (rawNode === null || typeof rawNode !== "object" || Array.isArray(rawNode)) {
        throw new WorkflowStateParseError(`topology.prs.${groupName}[${index}] must be a mapping`);
      }
      const nodeObj = rawNode as Record<string, unknown>;
      for (const key of Object.keys(nodeObj)) {
        if (!(ALLOWED_NODE_KEYS as readonly string[]).includes(key)) {
          throw new WorkflowStateParseError(`unexpected node key "${key}" in node ${index}`);
        }
      }

      if (typeof nodeObj.id !== "string")
        throw new WorkflowStateParseError(
          `topology.prs.${groupName}[${index}].id must be a string`
        );
      if (nodeObj.github_pr !== null && typeof nodeObj.github_pr !== "number")
        throw new WorkflowStateParseError(
          `topology.prs.${groupName}[${index}].github_pr must be a number or null`
        );
      if (!isTopologyRole(nodeObj.role))
        throw new WorkflowStateParseError(`topology.prs.${groupName}[${index}].role is invalid`);
      if (typeof nodeObj.terminal !== "boolean")
        throw new WorkflowStateParseError(
          `topology.prs.${groupName}[${index}].terminal must be a boolean`
        );
      if (nodeObj.sequence !== null && typeof nodeObj.sequence !== "number")
        throw new WorkflowStateParseError(
          `topology.prs.${groupName}[${index}].sequence must be a number or null`
        );

      const nodeCheckpoints = parseStringArray(
        nodeObj.checkpoints,
        `topology.prs.${groupName}[${index}].checkpoints`
      );
      const continuationPrs =
        nodeObj.continuation_prs !== undefined
          ? parseContinuationPrs(
              nodeObj.continuation_prs,
              `topology.prs.${groupName}[${index}].continuation_prs`
            )
          : undefined;

      if (ids.has(nodeObj.id)) {
        throw new WorkflowStateParseError(`duplicate PR id "${nodeObj.id}"`);
      }
      ids.add(nodeObj.id);

      for (const cp of nodeCheckpoints) {
        if (checkpointsSet.has(cp)) {
          throw new WorkflowStateParseError(`duplicate checkpoint id "${cp}"`);
        }
        checkpointsSet.add(cp);
      }

      if (nodeObj.terminal) {
        hasTerminal = true;
        terminalCount++;
      }

      const reviewRequirements =
        nodeObj.review_requirements !== undefined && nodeObj.review_requirements !== null
          ? parseNodeReviewRequirements(
              nodeObj.review_requirements,
              `topology.prs.${groupName}[${index}].review_requirements`
            )
          : undefined;
      const reviewPlan =
        nodeObj.review_plan !== undefined && nodeObj.review_plan !== null
          ? parseNodeReviewPlan(
              nodeObj.review_plan,
              `topology.prs.${groupName}[${index}].review_plan`
            )
          : undefined;

      nodes.push({
        id: nodeObj.id,
        github_pr: nodeObj.github_pr as number | null,
        ...(continuationPrs && continuationPrs.length > 0
          ? { continuation_prs: continuationPrs }
          : {}),
        role: nodeObj.role,
        terminal: nodeObj.terminal,
        sequence: nodeObj.sequence as number | null,
        checkpoints: nodeCheckpoints,
        ...(reviewPlan ? { review_plan: reviewPlan } : {}),
        ...(reviewRequirements ? { review_requirements: reviewRequirements } : {}),
      });
    }
    return nodes;
  };

  const concluded = parseGroup("concluded");
  const active = parseGroup("active");
  const planned = parseGroup("planned");

  const totalNodes = concluded.length + active.length + planned.length;

  if (!hasTerminal && totalNodes > 0) {
    throw new WorkflowStateParseError(
      "topology must have at least one terminal node if nodes exist"
    );
  }
  if (terminalCount > 1) {
    throw new WorkflowStateParseError("topology cannot have multiple terminal nodes");
  }
  if (!ids.has(cursorObj.pr)) {
    throw new WorkflowStateParseError(`topology.cursor.pr "${cursorObj.pr}" does not exist in prs`);
  }
  if (!checkpointsSet.has(cursorObj.checkpoint)) {
    throw new WorkflowStateParseError(
      `topology.cursor.checkpoint "${cursorObj.checkpoint}" does not exist in any checkpoints list`
    );
  }

  // Invariantes de `sequence` (Checkpoint 2.3a / O6). `sequence` = posição no
  // stack de execução: existe sse-e-somente-se o nó é `execution`, é única, e
  // o conjunto forma 1..K contíguo (sem buracos nem colisão). Previne a classe
  // do nó-fantasma (sequence sem slot real) corrigida em B1.
  const allTopologyNodes = [...concluded, ...active, ...planned];
  const executionSequences: number[] = [];
  for (const node of allTopologyNodes) {
    if (node.role === "execution") {
      if (node.sequence === null) {
        throw new WorkflowStateParseError(
          `execution node "${node.id}" must have a non-null sequence (sequence = stack position)`
        );
      }
      executionSequences.push(node.sequence);
    } else if (node.sequence !== null) {
      throw new WorkflowStateParseError(
        `node "${node.id}" (role ${node.role}) must have sequence: null — only execution nodes occupy stack positions`
      );
    }
  }
  const seqSet = new Set(executionSequences);
  if (seqSet.size !== executionSequences.length) {
    throw new WorkflowStateParseError(
      `topology has a duplicate execution sequence; stack positions must be unique (got ${executionSequences
        .slice()
        .sort((a, b) => a - b)
        .join(", ")})`
    );
  }
  for (let pos = 1; pos <= executionSequences.length; pos++) {
    if (!seqSet.has(pos)) {
      throw new WorkflowStateParseError(
        `execution sequences must be contiguous 1..${executionSequences.length} (missing ${pos}); ` +
          `got ${[...seqSet].sort((a, b) => a - b).join(", ")}`
      );
    }
  }

  // Invariantes de lifecycle-coerência (Checkpoint 2.3b). Guard local
  // determinístico que torna a SSOT confiável o suficiente para o
  // `governance-pr-check` enforçar projeções (sustenta a promoção a `required`,
  // `[DEC-0024-G07]` / O5). NÃO confere o PR no GitHub (isso é hardening de API,
  // fora de escopo) — apenas a coerência interna grupo↔existência-de-PR:
  //   github_pr presente  ⟺  nó ∈ {active, concluded}  (PR real já aberto)
  //   github_pr ausente    ⟺  nó ∈ {planned}            (PR ainda não aberto)
  // Fecha a classe do nó-fantasma (active/concluded com github_pr null).
  for (const node of [...concluded, ...active]) {
    if (node.github_pr === null) {
      throw new WorkflowStateParseError(
        `node "${node.id}" está em concluded/active mas tem github_pr: null — ` +
          `nós nesses grupos representam um PR real aberto (use planned para PR ainda não aberto)`
      );
    }
  }
  for (const node of planned) {
    if (node.github_pr !== null) {
      throw new WorkflowStateParseError(
        `node "${node.id}" está em planned mas tem github_pr: ${node.github_pr} — ` +
          `planned é para PR ainda não aberto (mova para active/concluded ao abrir o PR)`
      );
    }
    if ((node.continuation_prs ?? []).length > 0) {
      throw new WorkflowStateParseError(
        `node "${node.id}" está em planned mas declara continuation_prs — continuações exigem um nó real ativo ou concluído`
      );
    }
  }
  for (const node of allTopologyNodes) {
    const continuationCheckpoints = new Set<string>();
    const continuationHeads = new Set<string>();
    for (const continuation of node.continuation_prs ?? []) {
      if (!node.checkpoints.includes(continuation.checkpoint)) {
        throw new WorkflowStateParseError(
          `node "${node.id}" associa PR #${continuation.github_pr} ao checkpoint "${continuation.checkpoint}", que não pertence ao nó`
        );
      }
      if (continuationCheckpoints.has(continuation.checkpoint)) {
        throw new WorkflowStateParseError(
          `node "${node.id}" possui mais de uma continuação para o checkpoint "${continuation.checkpoint}"`
        );
      }
      if (continuationHeads.has(continuation.head)) {
        throw new WorkflowStateParseError(
          `node "${node.id}" possui continuation head duplicada "${continuation.head}"`
        );
      }
      continuationCheckpoints.add(continuation.checkpoint);
      continuationHeads.add(continuation.head);
    }
  }
  // Unicidade global: cada PR real pertence a um único nó/checkpoint.
  const prNumbers = allTopologyNodes.flatMap((node) => [
    ...(node.github_pr === null ? [] : [node.github_pr]),
    ...(node.continuation_prs ?? []).map((continuation) => continuation.github_pr),
  ]);
  if (new Set(prNumbers).size !== prNumbers.length) {
    throw new WorkflowStateParseError(
      `topology has a duplicate github_pr; cada PR real pertence a no máximo um nó/checkpoint (got ${prNumbers
        .slice()
        .sort((a, b) => a - b)
        .join(", ")})`
    );
  }

  return {
    cursor: {
      pr: cursorObj.pr,
      checkpoint: cursorObj.checkpoint,
    },
    prs: {
      concluded,
      active,
      planned,
    },
  };
}

function parseStringArray(value: unknown, fieldName: string): ReadonlyArray<string> {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new WorkflowStateParseError(`${fieldName} must be a list of strings`);
  }
  for (const item of value) {
    if (typeof item !== "string") {
      throw new WorkflowStateParseError(`${fieldName} must contain only strings`);
    }
  }
  return value as ReadonlyArray<string>;
}

export function serializeWorkflowState(state: WorkflowState): string {
  const plain: any = {
    stage: state.stage,
    gate: { status: state.gate.status },
    focus: [...state.focus],
    next: [...state.next],
  };

  if (state.topology) {
    plain.topology = {
      cursor: {
        pr: state.topology.cursor.pr,
        checkpoint: state.topology.cursor.checkpoint,
      },
      prs: {},
    };
    if (state.topology.prs.concluded.length > 0) {
      plain.topology.prs.concluded = state.topology.prs.concluded.map((n) => ({
        id: n.id,
        github_pr: n.github_pr,
        ...(n.continuation_prs ? { continuation_prs: n.continuation_prs } : {}),
        role: n.role,
        terminal: n.terminal,
        sequence: n.sequence,
        checkpoints: [...n.checkpoints],
        ...(n.review_plan ? { review_plan: n.review_plan } : {}),
        ...(n.review_requirements ? { review_requirements: n.review_requirements } : {}),
      }));
    }
    if (state.topology.prs.active.length > 0) {
      plain.topology.prs.active = state.topology.prs.active.map((n) => ({
        id: n.id,
        github_pr: n.github_pr,
        ...(n.continuation_prs ? { continuation_prs: n.continuation_prs } : {}),
        role: n.role,
        terminal: n.terminal,
        sequence: n.sequence,
        checkpoints: [...n.checkpoints],
        ...(n.review_plan ? { review_plan: n.review_plan } : {}),
        ...(n.review_requirements ? { review_requirements: n.review_requirements } : {}),
      }));
    }
    if (state.topology.prs.planned.length > 0) {
      plain.topology.prs.planned = state.topology.prs.planned.map((n) => ({
        id: n.id,
        github_pr: n.github_pr,
        ...(n.continuation_prs ? { continuation_prs: n.continuation_prs } : {}),
        role: n.role,
        terminal: n.terminal,
        sequence: n.sequence,
        checkpoints: [...n.checkpoints],
        ...(n.review_plan ? { review_plan: n.review_plan } : {}),
        ...(n.review_requirements ? { review_requirements: n.review_requirements } : {}),
      }));
    }
  }

  return stringify(plain, { indent: 2, lineWidth: 0 });
}
