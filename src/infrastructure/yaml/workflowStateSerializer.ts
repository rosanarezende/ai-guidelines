import { parse, stringify } from "yaml";
import {
  WorkflowState,
  isGateStatus,
  isWorkflowStage,
  isTopologyRole,
  PrTopologyNode,
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
  "role",
  "terminal",
  "sequence",
  "checkpoints",
] as const;

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

      nodes.push({
        id: nodeObj.id,
        github_pr: nodeObj.github_pr as number | null,
        role: nodeObj.role,
        terminal: nodeObj.terminal,
        sequence: nodeObj.sequence as number | null,
        checkpoints: nodeCheckpoints,
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
  }
  // Unicidade de github_pr (cada PR real pertence a no máximo um nó).
  const prNumbers = allTopologyNodes.map((n) => n.github_pr).filter((p): p is number => p !== null);
  if (new Set(prNumbers).size !== prNumbers.length) {
    throw new WorkflowStateParseError(
      `topology has a duplicate github_pr; cada PR real pertence a no máximo um nó (got ${prNumbers
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
        role: n.role,
        terminal: n.terminal,
        sequence: n.sequence,
        checkpoints: [...n.checkpoints],
      }));
    }
    if (state.topology.prs.active.length > 0) {
      plain.topology.prs.active = state.topology.prs.active.map((n) => ({
        id: n.id,
        github_pr: n.github_pr,
        role: n.role,
        terminal: n.terminal,
        sequence: n.sequence,
        checkpoints: [...n.checkpoints],
      }));
    }
    if (state.topology.prs.planned.length > 0) {
      plain.topology.prs.planned = state.topology.prs.planned.map((n) => ({
        id: n.id,
        github_pr: n.github_pr,
        role: n.role,
        terminal: n.terminal,
        sequence: n.sequence,
        checkpoints: [...n.checkpoints],
      }));
    }
  }

  return stringify(plain, { indent: 2, lineWidth: 0 });
}
