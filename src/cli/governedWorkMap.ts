/**
 * Generated projection for the governed work map.
 *
 * Source of truth remains `.governance/specs/0024-context-architecture/state.yml`.
 * This module only derives a browser-friendly data snapshot + static HTML view.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import {
  HandoffStep,
  HandoffTaskFact,
  parseCheckpointTasks,
  parseSteps,
  STEP_READINESS,
} from "../app/handoff/handoffFacts.js";
import { PrTopologyNode } from "../domain/workflow/WorkflowState.js";
import { parseWorkflowState } from "../infrastructure/yaml/workflowStateSerializer.js";

interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

const defaultLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

const SPEC_REL = ".governance/specs/0024-context-architecture";
const STATE_REL = `${SPEC_REL}/state.yml`;
const TASKS_REL = `${SPEC_REL}/tasks.md`;
const PULL_REQUESTS_REL = `${SPEC_REL}/pull-requests`;
const DATA_REL = `${SPEC_REL}/assets/governed-work-map-data.json`;
const HTML_REL = `${SPEC_REL}/assets/governed-work-map.html`;

type GovernedWorkNodeStatus = "concluded" | "active" | "planned";

interface GovernedWorkStepPreview {
  readonly id: string;
  readonly title: string;
  readonly line: number;
  readonly readiness: boolean;
}

interface GovernedWorkTaskSummary {
  readonly total: number;
  readonly done: number;
  readonly open: number;
  readonly samples: readonly string[];
  readonly sourcePath: string;
}

interface GovernedWorkStepSummary {
  readonly total: number;
  readonly done: number;
  readonly active: number;
  readonly pending: number;
  readonly readyForTransition: number;
  readonly activeStep: GovernedWorkStepPreview | null;
  readonly nextPending: GovernedWorkStepPreview | null;
  readonly sourcePath: string;
}

interface GovernedWorkCheckpointEvidence {
  readonly checkpoint: string;
  readonly taskSummary: GovernedWorkTaskSummary;
  readonly stepSummary: GovernedWorkStepSummary;
}

interface GovernedWorkPrBodySummary {
  readonly sourcePath: string;
  readonly intendedVision: string;
  readonly summary: string;
  readonly deliveredValue: readonly string[];
  readonly inScope: readonly string[];
  readonly outOfScope: readonly string[];
  readonly testPlan: readonly string[];
  readonly gates: readonly string[];
}

interface GovernedWorkNodeEvidence {
  readonly tasks: GovernedWorkTaskSummary;
  readonly steps: GovernedWorkStepSummary;
  readonly checkpoints: readonly GovernedWorkCheckpointEvidence[];
  readonly prBody: GovernedWorkPrBodySummary | null;
}

interface GovernedWorkNode {
  readonly id: string;
  readonly status: GovernedWorkNodeStatus;
  readonly githubPr: number | null;
  readonly role: string;
  readonly terminal: boolean;
  readonly sequence: number | null;
  readonly checkpoints: readonly string[];
  readonly isCursor: boolean;
  readonly evidence: GovernedWorkNodeEvidence;
}

interface GovernedWorkMapData {
  readonly schemaVersion: 2;
  readonly title: string;
  readonly subtitle: string;
  readonly source: {
    readonly statePath: string;
    readonly sourceKind: "derived-projection";
    readonly authority: "state-yml-topology";
  };
  readonly stage: string;
  readonly gateStatus: string;
  readonly cursor: {
    readonly pr: string;
    readonly checkpoint: string;
  };
  readonly counts: {
    readonly concluded: number;
    readonly active: number;
    readonly planned: number;
    readonly checkpoints: number;
  };
  readonly focus: readonly string[];
  readonly next: readonly string[];
  readonly nodes: readonly GovernedWorkNode[];
}

export function deriveGovernedWorkMapData(repoRoot: string): GovernedWorkMapData {
  const statePath = path.join(repoRoot, STATE_REL);
  const state = parseWorkflowState(fs.readFileSync(statePath, "utf-8"));
  const tasksMd = readOptionalText(repoRoot, TASKS_REL) ?? "";
  if (state.topology === undefined) {
    throw new Error(`${STATE_REL} não declara topology; mapa vivo não pode ser derivado.`);
  }

  const cursor = state.topology.cursor;
  const nodes = [
    ...mapNodes("concluded", state.topology.prs.concluded, cursor.pr, repoRoot, tasksMd),
    ...mapNodes("active", state.topology.prs.active, cursor.pr, repoRoot, tasksMd),
    ...mapNodes("planned", state.topology.prs.planned, cursor.pr, repoRoot, tasksMd),
  ];
  const checkpointCount = nodes.reduce((sum, node) => sum + node.checkpoints.length, 0);

  return {
    schemaVersion: 2,
    title: "Mapa Vivo do Trabalho Governado",
    subtitle: "Context Architecture / 0024",
    source: {
      statePath: STATE_REL,
      sourceKind: "derived-projection",
      authority: "state-yml-topology",
    },
    stage: state.stage,
    gateStatus: state.gate.status,
    cursor,
    counts: {
      concluded: state.topology.prs.concluded.length,
      active: state.topology.prs.active.length,
      planned: state.topology.prs.planned.length,
      checkpoints: checkpointCount,
    },
    focus: state.focus,
    next: state.next,
    nodes,
  };
}

function mapNodes(
  status: GovernedWorkNodeStatus,
  nodes: readonly PrTopologyNode[],
  cursorPr: string,
  repoRoot: string,
  tasksMd: string
): GovernedWorkNode[] {
  return nodes.map((node) => {
    const checkpoints = [...node.checkpoints];
    return {
      id: node.id,
      status,
      githubPr: node.github_pr,
      role: node.role,
      terminal: node.terminal,
      sequence: node.sequence,
      checkpoints,
      isCursor: node.id === cursorPr,
      evidence: deriveNodeEvidence(repoRoot, tasksMd, node.id, node.github_pr, checkpoints),
    };
  });
}

function deriveNodeEvidence(
  repoRoot: string,
  tasksMd: string,
  nodeId: string,
  githubPr: number | null,
  checkpoints: readonly string[]
): GovernedWorkNodeEvidence {
  const checkpointEvidence = checkpoints.map((checkpoint) => {
    const tasks = parseCheckpointTasks(tasksMd, { pr: nodeId, checkpoint });
    const steps = parseSteps(tasksMd, checkpoint);
    return {
      checkpoint,
      taskSummary: summarizeTasks(tasks),
      stepSummary: summarizeSteps(steps),
    };
  });
  const tasks = summarizeTaskSummaries(checkpointEvidence.map((item) => item.taskSummary));
  const steps = summarizeStepSummaries(checkpointEvidence.map((item) => item.stepSummary));

  return {
    tasks,
    steps,
    checkpoints: checkpointEvidence,
    prBody: githubPr === null ? null : readPrBodySummary(repoRoot, githubPr),
  };
}

function summarizeTasks(tasks: readonly HandoffTaskFact[]): GovernedWorkTaskSummary {
  const done = tasks.filter((task) => task.done).length;
  const openTasks = tasks.filter((task) => !task.done);
  const sampleTasks = (openTasks.length > 0 ? openTasks : tasks).slice(0, 4);
  return {
    total: tasks.length,
    done,
    open: tasks.length - done,
    samples: sampleTasks.map((task) => truncateText(stripInlineMarkdown(task.text), 220)),
    sourcePath: TASKS_REL,
  };
}

function summarizeSteps(steps: readonly HandoffStep[]): GovernedWorkStepSummary {
  const done = steps.filter((step) => step.state === "done").length;
  const active = steps.filter((step) => step.state === "in-progress").length;
  const pending = steps.filter((step) => step.state === "pending").length;
  const readyForTransition = steps.filter((step) => step.readiness === STEP_READINESS).length;
  return {
    total: steps.length,
    done,
    active,
    pending,
    readyForTransition,
    activeStep: toStepPreview(steps.find((step) => step.state === "in-progress") ?? null),
    nextPending: toStepPreview(steps.find((step) => step.state === "pending") ?? null),
    sourcePath: TASKS_REL,
  };
}

function summarizeTaskSummaries(
  summaries: readonly GovernedWorkTaskSummary[]
): GovernedWorkTaskSummary {
  return {
    total: summaries.reduce((sum, item) => sum + item.total, 0),
    done: summaries.reduce((sum, item) => sum + item.done, 0),
    open: summaries.reduce((sum, item) => sum + item.open, 0),
    samples: summaries.flatMap((item) => item.samples).slice(0, 6),
    sourcePath: TASKS_REL,
  };
}

function summarizeStepSummaries(
  summaries: readonly GovernedWorkStepSummary[]
): GovernedWorkStepSummary {
  return {
    total: summaries.reduce((sum, item) => sum + item.total, 0),
    done: summaries.reduce((sum, item) => sum + item.done, 0),
    active: summaries.reduce((sum, item) => sum + item.active, 0),
    pending: summaries.reduce((sum, item) => sum + item.pending, 0),
    readyForTransition: summaries.reduce((sum, item) => sum + item.readyForTransition, 0),
    activeStep: summaries.find((item) => item.activeStep !== null)?.activeStep ?? null,
    nextPending: summaries.find((item) => item.nextPending !== null)?.nextPending ?? null,
    sourcePath: TASKS_REL,
  };
}

function toStepPreview(step: HandoffStep | null): GovernedWorkStepPreview | null {
  if (step === null) return null;
  return {
    id: step.id,
    title: compactStepTitle(step.title),
    line: step.line,
    readiness: step.readiness === STEP_READINESS,
  };
}

function compactStepTitle(title: string): string {
  return stripInlineMarkdown(title)
    .replace(/\s*\((?:EM EXECUÇÃO|EM REVISAO|EM REVISÃO|PR #|n[oó] seq).*/i, "")
    .trim();
}

function readPrBodySummary(repoRoot: string, prNumber: number): GovernedWorkPrBodySummary | null {
  const sourcePath = `${PULL_REQUESTS_REL}/pr-${prNumber}/body.md`;
  const markdown = readOptionalText(repoRoot, sourcePath);
  if (markdown === null) return null;
  const escopo = markdownSection(markdown, "Escopo", 2);
  const validacao = markdownSection(markdown, "Validação, evidências e checklist", 2);
  return {
    sourcePath,
    intendedVision: firstParagraph(markdownSection(markdown, "Visão pretendida", 2)),
    summary: firstParagraph(markdownSection(markdown, "Resumo", 2)),
    deliveredValue: markdownBullets(markdownSection(markdown, "Valor entregue", 2), 7),
    inScope: markdownBullets(markdownSection(escopo, "Dentro do escopo", 3), 6),
    outOfScope: markdownBullets(markdownSection(escopo, "Fora do escopo", 3), 6),
    testPlan: markdownCodeLines(markdownSection(markdown, "Test plan", 2), 8),
    gates: markdownBullets(markdownSection(validacao, "Evidências e gates", 3), 6),
  };
}

function readOptionalText(repoRoot: string, rel: string): string | null {
  const abs = path.join(repoRoot, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, "utf-8") : null;
}

function markdownSection(markdown: string, heading: string, level: 2 | 3): string {
  const lines = markdown.split(/\r?\n/);
  const target = normalizeHeading(heading);
  const headingRe = new RegExp(`^#{${level}}\\s+(.+?)\\s*$`);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const match = headingRe.exec(lines[i].trim());
    if (match && normalizeHeading(match[1]) === target) {
      start = i + 1;
      break;
    }
  }
  if (start < 0) return "";
  const endRe = new RegExp(`^#{1,${level}}\\s+`);
  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    if (endRe.test(lines[i].trim())) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n").trim();
}

function firstParagraph(markdown: string): string {
  const lines = readableMarkdownLines(markdown);
  const paragraph: string[] = [];
  for (const line of lines) {
    if (line.length === 0) {
      if (paragraph.length > 0) break;
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      if (paragraph.length > 0) break;
      continue;
    }
    paragraph.push(stripInlineMarkdown(line));
  }
  if (paragraph.length > 0) return truncateText(paragraph.join(" "), 360);
  const firstBullet = markdownBullets(markdown, 1)[0];
  return firstBullet ? truncateText(firstBullet, 360) : "";
}

function markdownBullets(markdown: string, limit: number): string[] {
  const out: string[] = [];
  for (const line of readableMarkdownLines(markdown)) {
    const match = /^\s*[-*]\s+(.*)$/.exec(line);
    if (!match) continue;
    const text = stripInlineMarkdown(match[1].replace(/^\[[ xX/]\]\s+/, ""));
    if (text.length > 0) out.push(truncateText(text, 260));
    if (out.length >= limit) break;
  }
  return out;
}

function markdownCodeLines(markdown: string, limit: number): string[] {
  const lines = markdown.split(/\r?\n/);
  const out: string[] = [];
  let inFence = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (!inFence || line.length === 0) continue;
    out.push(truncateText(line, 220));
    if (out.length >= limit) return out;
  }
  return markdownBullets(markdown, limit);
}

function readableMarkdownLines(markdown: string): string[] {
  const lines = markdown.split(/\r?\n/);
  const out: string[] = [];
  let inFence = false;
  let inDetails = false;
  let inComment = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (inComment) {
      if (line.includes("-->")) inComment = false;
      continue;
    }
    if (line.startsWith("<!--")) {
      if (!line.includes("-->")) inComment = true;
      continue;
    }
    if (/^<details\b/i.test(line)) {
      inDetails = true;
      continue;
    }
    if (inDetails) {
      if (/^<\/details>/i.test(line)) inDetails = false;
      continue;
    }
    if (/^#{1,6}\s+/.test(line)) continue;
    out.push(line);
  }
  return out;
}

function stripInlineMarkdown(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHeading(value: string): string {
  return stripInlineMarkdown(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function truncateText(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function renderData(data: GovernedWorkMapData): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

function renderHtml(data: GovernedWorkMapData): string {
  return renderHumanReadableHtml(data);
}

function renderHumanReadableHtml(data: GovernedWorkMapData): string {
  const embedded = JSON.stringify(data).replace(/</g, "\\u003c");
  const labels: Record<GovernedWorkNodeStatus, string> = {
    concluded: "Concluído",
    active: "Ativo",
    planned: "Planejado",
  };
  const stageLabels: Record<string, string> = {
    implementation: "Implementação",
    ready: "Ready",
    gated: "Gate aprovado",
    closed: "Fechado",
  };
  const gateLabels: Record<string, string> = {
    closed: "Fechado",
    open: "Aberto",
    approved: "Aprovado",
    pending: "Pendente",
  };
  const activeNode =
    data.nodes.find((node) => node.status === "active") ??
    data.nodes.find((node) => node.id === data.cursor.pr);
  const latestConcluded = [...data.nodes].reverse().find((node) => node.status === "concluded");
  const nextPlanned = data.nodes.find((node) => node.status === "planned");
  const nextNarrative = nextNarrativeSummary(data.next, nextPlanned);
  const focusItems = data.focus.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const nextItems = data.next.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const sourceCards = [
    ["Topologia", data.source.statePath],
    ["Checklist", ".governance/specs/0024-context-architecture/tasks.md"],
    ["Decisões", ".governance/specs/0024-context-architecture/decision-brief.md"],
    ["Evidências", "reviews, gates, PRs e projeções versionadas"],
  ];
  const nodeCards = (status: GovernedWorkNodeStatus): string => {
    const statusNodes = data.nodes.filter((node) => node.status === status);
    if (statusNodes.length === 0) return "";
    return `<section class="lane" data-lane="${status}">
      <div class="lane-title"><span>${labels[status]}</span><span>${statusNodes.length}</span></div>
      <div class="nodes">
        ${statusNodes.map((node) => renderHumanNodeCard(node, labels[node.status])).join("")}
      </div>
    </section>`;
  };
  const matrixRows = data.nodes
    .map(
      (node) => `<tr class="filterable" data-status="${node.status}" data-search="${escapeHtml(
        nodeSearchText(node)
      )}" data-node="${escapeHtml(node.id)}">
        <td><strong>${escapeHtml(node.id)}</strong></td>
        <td>${labels[node.status]}</td>
        <td>${node.githubPr ?? "planejado"}</td>
        <td>${escapeHtml(node.role)}</td>
        <td>${node.evidence.steps.done}/${node.evidence.steps.total} concluídas</td>
        <td>${node.evidence.tasks.open} aberta(s) de ${node.evidence.tasks.total}</td>
        <td>${node.evidence.prBody ? escapeHtml(node.evidence.prBody.summary || "body versionado") : "sem body"}</td>
        <td>${escapeHtml(node.checkpoints.join(", "))}</td>
      </tr>`
    )
    .join("");
  const flowCards = [
    [
      "Stack concluída",
      data.nodes.filter((node) => node.status === "concluded"),
      "O que já passou por decisão humana e fica como trilha de evidência.",
    ],
    [
      "Ativo agora",
      data.nodes.filter((node) => node.status === "active"),
      "O checkpoint em implementação/revisão; CI verde sozinho não conclui a frente.",
    ],
    [
      "Planejado depois",
      data.nodes.filter((node) => node.status === "planned"),
      "A cauda futura, que só deve abrir quando o fechamento anterior estiver honesto.",
    ],
  ]
    .map(([title, nodes, description]) => {
      const group = nodes as GovernedWorkNode[];
      return `<article class="flow-card">
        <div class="eyebrow">${escapeHtml(title as string)}</div>
        <strong>${group.length}</strong>
        <p>${escapeHtml(description as string)}</p>
        <ol>
          ${group
            .slice(0, 8)
            .map((node) => `<li><code>${escapeHtml(node.id)}</code></li>`)
            .join("")}
          ${group.length > 8 ? `<li>+${group.length - 8} nó(s)</li>` : ""}
        </ol>
      </article>`;
    })
    .join("");

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(data.title)} — ${escapeHtml(data.subtitle)}</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f7f4ef;
      --surface: #fffaf2;
      --surface-strong: #ffffff;
      --ink: #142321;
      --muted: #64706b;
      --green: #0d3b31;
      --sage: #8fa99a;
      --brass: #c19a4b;
      --graphite: #2b2f33;
      --line: rgba(20, 35, 33, 0.13);
      font-family:
        Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      background:
        radial-gradient(circle at 14% 12%, rgba(193, 154, 75, 0.14), transparent 32rem),
        radial-gradient(circle at 86% 8%, rgba(13, 59, 49, 0.12), transparent 34rem),
        var(--bg);
      color: var(--ink);
    }
    main { max-width: 1480px; margin: 0 auto; padding: 32px; }
    header {
      display: grid;
      grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);
      gap: 24px;
      align-items: stretch;
      margin-bottom: 18px;
    }
    .hero,
    .panel,
    .brief-card,
    .toolbar,
    .node,
    .detail,
    .table-wrap,
    .flow-card,
    .raw-panel {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: rgba(255, 250, 242, 0.88);
      box-shadow: 0 16px 50px rgba(20, 35, 33, 0.08);
    }
    .hero {
      position: relative;
      min-height: 410px;
      padding: 34px;
      overflow: hidden;
      display: grid;
      align-content: space-between;
    }
    .hero::after {
      content: "";
      position: absolute;
      right: -18%;
      bottom: -50%;
      width: 48%;
      height: 340px;
      opacity: 0.32;
      background:
        linear-gradient(90deg, transparent 0 12%, rgba(13, 59, 49, 0.18) 12% 13%, transparent 13% 28%, rgba(193, 154, 75, 0.32) 28% 29%, transparent 29% 100%),
        radial-gradient(circle at 16% 52%, rgba(13, 59, 49, 0.26) 0 12px, transparent 13px),
        radial-gradient(circle at 38% 30%, rgba(143, 169, 154, 0.32) 0 20px, transparent 21px),
        radial-gradient(circle at 58% 60%, rgba(43, 47, 51, 0.18) 0 16px, transparent 17px),
        radial-gradient(circle at 80% 38%, rgba(13, 59, 49, 0.22) 0 24px, transparent 25px);
      pointer-events: none;
      transform: rotate(-2deg);
    }
    .hero > * { position: relative; z-index: 1; }
    .eyebrow {
      color: var(--green);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    h1 {
      max-width: 880px;
      margin: 14px 0;
      font-size: clamp(42px, 5vw, 78px);
      line-height: 0.94;
      letter-spacing: 0;
    }
    h2 { margin: 0 0 10px; font-size: 22px; }
    h3 { margin: 0; }
    p { color: var(--muted); line-height: 1.58; }
    .hero p { max-width: 760px; font-size: 18px; }
    code {
      color: var(--green);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      font-size: 0.92em;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      max-width: 780px;
      margin-top: 24px;
    }
    .metric {
      min-height: 92px;
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: rgba(255, 250, 242, 0.88);
    }
    .metric strong { display: block; color: var(--green); font-size: 28px; }
    .metric span { color: var(--muted); font-size: 13px; font-weight: 700; }
    .panel { padding: 24px; }
    .sources { display: grid; gap: 10px; margin-top: 18px; }
    .source-card {
      display: grid;
      gap: 2px;
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.52);
    }
    .source-card strong { color: var(--green); font-size: 13px; }
    .source-card span { color: var(--muted); font-size: 12px; line-height: 1.45; overflow-wrap: anywhere; }
    .brief-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 18px;
    }
    .brief-card { min-height: 154px; padding: 18px; }
    .brief-card strong { display: block; margin: 8px 0; color: var(--ink); font-size: 18px; line-height: 1.22; overflow-wrap: anywhere; }
    .brief-card p { margin: 0; font-size: 14px; }
    .toolbar {
      display: grid;
      grid-template-columns: minmax(240px, 1fr) repeat(4, auto) 1px repeat(3, auto);
      gap: 12px;
      align-items: center;
      padding: 14px;
      margin-bottom: 18px;
    }
    .separator { width: 1px; height: 28px; background: var(--line); }
    input,
    button {
      min-height: 42px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      color: var(--ink);
      padding: 0 14px;
      font: inherit;
    }
    button { cursor: pointer; font-weight: 700; }
    button.active { background: var(--green); color: white; }
    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 370px;
      gap: 18px;
      align-items: start;
    }
    .view { display: none; }
    .view.active { display: block; }
    .lane { display: grid; gap: 10px; margin-bottom: 14px; }
    .lane-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--muted);
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .nodes { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
    .node {
      min-height: 174px;
      padding: 16px;
      cursor: pointer;
      position: relative;
    }
    .node.active-node { outline: 3px solid rgba(193, 154, 75, 0.28); }
    .node h3 { margin: 8px 0 4px; font-size: 18px; overflow-wrap: anywhere; }
    .node p { margin: 0; font-size: 14px; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
    .chip {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.62);
      color: var(--muted);
      font-size: 12px;
      padding: 5px 9px;
    }
    .node-summary { margin-top: 10px !important; color: var(--green); font-weight: 700; }
    .node-note { margin-top: 8px !important; font-size: 13px !important; }
    .status-concluded { border-left: 5px solid var(--sage); }
    .status-active { border-left: 5px solid var(--brass); }
    .status-planned { border-left: 5px solid var(--graphite); }
    .detail { padding: 20px; position: sticky; top: 18px; }
    .detail dl { display: grid; grid-template-columns: 120px 1fr; gap: 8px 12px; margin: 0; }
    .detail dt { color: var(--muted); font-weight: 700; }
    .detail dd { margin: 0; overflow-wrap: anywhere; }
    .detail-section {
      margin-top: 18px;
      padding-top: 16px;
      border-top: 1px solid var(--line);
    }
    .detail-section h3 { margin: 0 0 8px; font-size: 16px; }
    .detail-section p { margin: 0; font-size: 14px; }
    .mini-list { margin: 8px 0 0; padding-left: 18px; color: var(--muted); line-height: 1.5; }
    .mini-list li + li { margin-top: 6px; }
    .progress-line {
      display: grid;
      gap: 6px;
      margin-top: 10px;
      color: var(--muted);
      font-size: 14px;
    }
    .progress-line strong { color: var(--green); }
    .checkpoint-list { margin: 16px 0 0; padding-left: 18px; }
    .checkpoint-list li + li { margin-top: 7px; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; min-width: 1180px; border-collapse: collapse; background: rgba(255, 250, 242, 0.88); }
    th,
    td { padding: 12px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
    th { color: var(--muted); font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; }
    td { font-size: 14px; }
    .flow { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .flow-card { min-height: 220px; padding: 18px; }
    .flow-card > strong { display: block; margin: 8px 0; color: var(--green); font-size: 40px; line-height: 1; }
    .flow-card ol { margin: 12px 0 0; padding-left: 18px; color: var(--muted); line-height: 1.55; }
    .raw-panel { margin-top: 18px; padding: 16px 18px; }
    .raw-panel summary { cursor: pointer; color: var(--green); font-weight: 800; }
    .raw-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 14px; }
    .raw-grid ol { margin: 8px 0 0; padding-left: 20px; color: var(--muted); line-height: 1.58; }
    .raw-grid li + li { margin-top: 8px; }
    .hidden { display: none !important; }
    .empty { padding: 24px; color: var(--muted); border: 1px dashed var(--line); border-radius: 8px; }
    @media (max-width: 980px) {
      main { padding: 18px; }
      header,
      .brief-grid,
      .layout,
      .flow,
      .raw-grid { grid-template-columns: 1fr; }
      .toolbar { grid-template-columns: 1fr 1fr; }
      .separator { display: none; }
      .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .detail { position: static; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <section class="hero">
        <div>
          <div class="eyebrow">${escapeHtml(data.subtitle)} · projeção derivada · não-SSOT</div>
          <h1>${escapeHtml(data.title)}</h1>
          <p>
            Leitura humana da topologia governada: onde a frente está, o que já foi fechado,
            o que vem depois e quais evidências sustentam cada nó. A decisão continua nos
            artefatos governados; este mapa só organiza a navegação.
          </p>
        </div>
        <div class="metrics" aria-label="Resumo da topologia">
          <div class="metric"><strong>${data.counts.concluded}</strong><span>nós concluídos</span></div>
          <div class="metric"><strong>${data.counts.active}</strong><span>nó ativo</span></div>
          <div class="metric"><strong>${data.counts.planned}</strong><span>nós planejados</span></div>
          <div class="metric"><strong>${data.counts.checkpoints}</strong><span>checkpoints rastreados</span></div>
        </div>
      </section>
      <aside class="panel">
        <div class="eyebrow">Fontes do mapa</div>
        <h2>O que este HTML pode afirmar</h2>
        <p>
          A visualização é regenerável e comparada por check. Se divergir do estado governado,
          <code>governed-work-map:check</code> falha.
        </p>
        <div class="sources">
          ${sourceCards
            .map(
              ([title, source]) => `<div class="source-card">
                <strong>${escapeHtml(title)}</strong>
                <span>${escapeHtml(source)}</span>
              </div>`
            )
            .join("")}
        </div>
      </aside>
    </header>

    <section class="brief-grid" aria-label="Resumo situado">
      <article class="brief-card">
        <div class="eyebrow">Onde estamos</div>
        <strong>${escapeHtml(activeNode?.id ?? data.cursor.pr)}</strong>
        <p>${escapeHtml(activeNodeSummary(activeNode, data.cursor.checkpoint))}</p>
      </article>
      <article class="brief-card">
        <div class="eyebrow">Estado do trabalho</div>
        <strong>${escapeHtml(stageLabels[data.stage] ?? data.stage)}</strong>
        <p>Gate atual: ${escapeHtml(
          gateLabels[data.gateStatus] ?? data.gateStatus
        )}. O cursor vem de <code>state.yml</code>.</p>
      </article>
      <article class="brief-card">
        <div class="eyebrow">Último fechamento</div>
        <strong>${escapeHtml(latestConcluded?.id ?? "nenhum nó concluído")}</strong>
        <p>${latestConcluded?.githubPr ? `PR ${latestConcluded.githubPr}` : "Sem PR"} · ${
          latestConcluded?.checkpoints.length ?? 0
        } checkpoint(s).</p>
      </article>
      <article class="brief-card">
        <div class="eyebrow">Próxima cauda</div>
        <strong>${escapeHtml(nextNarrative.title)}</strong>
        <p>${escapeHtml(nextNarrative.description)}</p>
      </article>
    </section>

    <section class="toolbar" aria-label="Filtros do mapa">
      <input id="search" type="search" placeholder="Buscar PR, checkpoint, papel..." />
      <button type="button" class="active" data-filter="all">Todos</button>
      <button type="button" data-filter="concluded">Concluídos</button>
      <button type="button" data-filter="active">Ativo</button>
      <button type="button" data-filter="planned">Planejados</button>
      <span class="separator" aria-hidden="true"></span>
      <button type="button" class="active" data-mode="map-view">Mapa</button>
      <button type="button" data-mode="matrix-view">Matriz</button>
      <button type="button" data-mode="flow-view">Fluxo</button>
    </section>

    <section class="layout">
      <div>
        <section id="map-view" class="view active" aria-label="Mapa por status">
          ${nodeCards("concluded")}
          ${nodeCards("active")}
          ${nodeCards("planned")}
        </section>
        <section id="matrix-view" class="view" aria-label="Matriz de nós">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nó</th>
                  <th>Status</th>
                  <th>PR</th>
                  <th>Papel</th>
                  <th>Etapas</th>
                  <th>Tarefas</th>
                  <th>PR body</th>
                  <th>Checkpoints</th>
                </tr>
              </thead>
              <tbody>${matrixRows}</tbody>
            </table>
          </div>
        </section>
        <section id="flow-view" class="view" aria-label="Fluxo macro">
          <div class="flow">${flowCards}</div>
        </section>
        <div id="empty" class="empty hidden">Nenhum nó encontrado para os filtros atuais.</div>
        <details class="raw-panel">
          <summary>Fonte bruta derivada do estado governado</summary>
          <div class="raw-grid">
            <section>
              <div class="eyebrow">Focus</div>
              <ol>${focusItems}</ol>
            </section>
            <section>
              <div class="eyebrow">Next</div>
              <ol>${nextItems}</ol>
            </section>
          </div>
        </details>
      </div>
      <aside id="detail" class="detail"></aside>
    </section>
  </main>

  <script id="governed-work-data" type="application/json">${embedded}</script>
  <script>
    const data = JSON.parse(document.getElementById("governed-work-data").textContent);
    const labels = { concluded: "Concluído", active: "Ativo", planned: "Planejado" };
    const detail = document.getElementById("detail");
    const search = document.getElementById("search");
    const empty = document.getElementById("empty");
    let currentFilter = "all";
    let selectedId = data.cursor.pr;

    function h(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function matchesSearch(node, term) {
      if (!term) return true;
      const prBody = node.evidence.prBody || {};
      const haystack = [
        node.id,
        node.status,
        node.role,
        String(node.githubPr ?? ""),
        ...node.checkpoints,
        node.evidence.steps.activeStep?.title || "",
        node.evidence.steps.nextPending?.title || "",
        ...(node.evidence.tasks.samples || []),
        prBody.intendedVision || "",
        prBody.summary || "",
        ...(prBody.deliveredValue || []),
        ...(prBody.inScope || []),
        ...(prBody.outOfScope || []),
        ...(prBody.gates || []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term.toLowerCase());
    }

    function applyFilters() {
      const term = search.value.trim();
      let visibleCount = 0;
      for (const element of document.querySelectorAll(".filterable")) {
        const status = element.dataset.status;
        const node = data.nodes.find((item) => item.id === element.dataset.node);
        const filterOk = currentFilter === "all" || status === currentFilter;
        const searchOk = node ? matchesSearch(node, term) : (element.dataset.search || "").toLowerCase().includes(term.toLowerCase());
        const visible = filterOk && searchOk;
        element.classList.toggle("hidden", !visible);
        if (visible && element.matches(".node, tr")) visibleCount += 1;
      }
      for (const lane of document.querySelectorAll(".lane")) {
        const hasVisibleNode = lane.querySelector(".node:not(.hidden)") !== null;
        lane.classList.toggle("hidden", !hasVisibleNode);
      }
      empty.classList.toggle("hidden", visibleCount > 0);
    }

    function renderDetail(node) {
      if (!node) {
        detail.innerHTML = "<h2>Sem seleção</h2><p>Nenhum nó disponível.</p>";
        return;
      }
      const prBody = node.evidence.prBody;
      const activeStep = node.evidence.steps.activeStep;
      const nextPending = node.evidence.steps.nextPending;
      detail.innerHTML =
        "<h2>" +
        h(node.id) +
        "</h2>" +
        "<dl>" +
        "<dt>Status</dt><dd>" +
        h(labels[node.status]) +
        "</dd>" +
        "<dt>PR</dt><dd>" +
        h(node.githubPr ?? "planejado") +
        "</dd>" +
        "<dt>Papel</dt><dd>" +
        h(node.role) +
        "</dd>" +
        "<dt>Sequência</dt><dd>" +
        h(node.sequence ?? "n/a") +
        "</dd>" +
        "<dt>Terminal</dt><dd>" +
        h(node.terminal ? "sim" : "não") +
        "</dd>" +
        "<dt>Cursor</dt><dd>" +
        h(node.isCursor ? "sim" : "não") +
        "</dd>" +
        "</dl>" +
        '<section class="detail-section">' +
        "<h3>Leitura situada</h3>" +
        '<div class="progress-line">' +
        "<span><strong>Etapas:</strong> " +
        h(node.evidence.steps.done) +
        "/" +
        h(node.evidence.steps.total) +
        " concluídas · " +
        h(node.evidence.steps.active) +
        " ativa(s) · " +
        h(node.evidence.steps.pending) +
        " pendente(s)</span>" +
        "<span><strong>Tarefas:</strong> " +
        h(node.evidence.tasks.done) +
        "/" +
        h(node.evidence.tasks.total) +
        " concluídas · " +
        h(node.evidence.tasks.open) +
        " aberta(s)</span>" +
        (activeStep
          ? "<span><strong>Etapa ativa:</strong> " +
            h(activeStep.id) +
            " — " +
            h(activeStep.title) +
            " (linha " +
            h(activeStep.line) +
            ")</span>"
          : "") +
        (nextPending
          ? "<span><strong>Próxima pendente:</strong> " +
            h(nextPending.id) +
            " — " +
            h(nextPending.title) +
            " (linha " +
            h(nextPending.line) +
            ")</span>"
          : "") +
        "</div>" +
        "</section>" +
        (prBody
          ? '<section class="detail-section">' +
            "<h3>PR body versionado</h3>" +
            (prBody.summary ? "<p>" + h(prBody.summary) + "</p>" : "") +
            renderMiniList("Valor entregue", prBody.deliveredValue) +
            renderMiniList("Dentro do escopo", prBody.inScope) +
            renderMiniList("Evidências e gates", prBody.gates) +
            '<p class="node-note"><strong>Fonte:</strong> <code>' +
            h(prBody.sourcePath) +
            "</code></p>" +
            "</section>"
          : '<section class="detail-section"><h3>PR body versionado</h3><p>Sem body versionado associado a este nó.</p></section>') +
        renderMiniList("Tarefas abertas / próximas", node.evidence.tasks.samples) +
        "<h3>Checkpoints</h3>" +
        '<ol class="checkpoint-list">' +
        node.checkpoints.map((cp) => "<li><code>" + h(cp) + "</code></li>").join("") +
        "</ol>";
    }

    function renderMiniList(title, items) {
      if (!items || items.length === 0) return "";
      return (
        '<section class="detail-section">' +
        "<h3>" +
        h(title) +
        "</h3>" +
        '<ul class="mini-list">' +
        items.map((item) => "<li>" + h(item) + "</li>").join("") +
        "</ul>" +
        "</section>"
      );
    }

    for (const button of document.querySelectorAll("[data-filter]")) {
      button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;
        for (const other of document.querySelectorAll("[data-filter]")) other.classList.remove("active");
        button.classList.add("active");
        applyFilters();
      });
    }
    for (const button of document.querySelectorAll("[data-mode]")) {
      button.addEventListener("click", () => {
        for (const other of document.querySelectorAll("[data-mode]")) other.classList.remove("active");
        for (const view of document.querySelectorAll(".view")) view.classList.remove("active");
        button.classList.add("active");
        document.getElementById(button.dataset.mode).classList.add("active");
        applyFilters();
      });
    }
    for (const nodeElement of document.querySelectorAll(".node")) {
      const select = () => {
        selectedId = nodeElement.dataset.node;
        for (const other of document.querySelectorAll(".node")) other.classList.remove("active-node");
        nodeElement.classList.add("active-node");
        renderDetail(data.nodes.find((node) => node.id === selectedId));
      };
      nodeElement.addEventListener("click", select);
      nodeElement.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select();
        }
      });
    }
    search.addEventListener("input", applyFilters);
    renderDetail(data.nodes.find((node) => node.id === selectedId) ?? data.nodes[0]);
    applyFilters();
  </script>
</body>
</html>
`;
}

function activeNodeSummary(node: GovernedWorkNode | undefined, fallbackCheckpoint: string): string {
  if (node === undefined) return fallbackCheckpoint;
  const activeStep = node.evidence.steps.activeStep;
  if (activeStep !== null) {
    return truncateText(
      `PR ${node.githubPr ?? "ativo"} · etapa ativa ${activeStep.id}: ${activeStep.title}`,
      180
    );
  }
  const summary = node.evidence.prBody?.summary;
  if (summary) return `PR ${node.githubPr ?? "ativo"} · ${summary}`;
  return `PR ${node.githubPr ?? "ativo"} · ${node.checkpoints[0] ?? fallbackCheckpoint}`;
}

function nextNarrativeSummary(
  next: readonly string[],
  fallbackNode: GovernedWorkNode | undefined
): { readonly title: string; readonly description: string } {
  const joined = next.join(" ");
  const afterCurrent = /Depois:\s*([^.]+)\./i.exec(joined);
  if (afterCurrent) {
    const candidates = afterCurrent[1]
      .split(/\s+e\s+|,\s*/)
      .map((item) => item.trim())
      .filter(Boolean);
    return {
      title: candidates[0] ?? "próximo checkpoint",
      description: truncateText(afterCurrent[1], 260),
    };
  }
  const canonical = /canonical-next:\s*([a-z0-9-]+)/i.exec(joined);
  if (canonical) {
    return {
      title: canonical[1],
      description: truncateText(joined, 260),
    };
  }
  if (fallbackNode !== undefined) {
    return {
      title: fallbackNode.id,
      description:
        fallbackNode.evidence.prBody?.summary ??
        "Nó planejado topológico; o mapa não abre PR, aprova gate ou decide Ready.",
    };
  }
  return {
    title: "sem nó planejado",
    description: "Sem nó planejado. O mapa não abre PR, aprova gate ou decide Ready.",
  };
}

function renderHumanNodeCard(node: GovernedWorkNode, label: string): string {
  const chips = node.checkpoints
    .slice(0, 4)
    .map((checkpoint) => `<span class="chip">${escapeHtml(checkpoint)}</span>`)
    .join("");
  const extra =
    node.checkpoints.length > 4 ? `<span class="chip">+${node.checkpoints.length - 4}</span>` : "";
  const activeStep = node.evidence.steps.activeStep;
  const nodeNote =
    activeStep !== null
      ? truncateText(`Etapa ativa: ${activeStep.id} — ${activeStep.title}`, 130)
      : (node.evidence.prBody?.summary ?? "Sem detalhe adicional no body versionado.");
  return `<article class="node status-${node.status} filterable${
    node.isCursor ? " active-node" : ""
  }" tabindex="0" role="button" data-node="${escapeHtml(node.id)}" data-status="${
    node.status
  }" data-search="${escapeHtml(nodeSearchText(node))}" aria-label="Abrir detalhes de ${escapeHtml(
    node.id
  )}">
    <span class="chip">${escapeHtml(label)}</span>
    <h3>${escapeHtml(node.id)}</h3>
    <p>PR ${node.githubPr ?? "futuro"} · ${escapeHtml(node.role)} · seq ${
      node.sequence ?? "n/a"
    }</p>
    <p class="node-summary">${node.evidence.steps.done}/${node.evidence.steps.total} etapa(s) concluída(s) · ${
      node.evidence.tasks.open
    } tarefa(s) aberta(s)</p>
    <p class="node-note">${escapeHtml(nodeNote)}</p>
    <div class="chips">${chips}${extra}</div>
  </article>`;
}

function nodeSearchText(node: GovernedWorkNode): string {
  const prBody = node.evidence.prBody;
  return [
    node.id,
    node.status,
    node.role,
    String(node.githubPr ?? ""),
    ...node.checkpoints,
    node.evidence.steps.activeStep?.title ?? "",
    node.evidence.steps.nextPending?.title ?? "",
    ...node.evidence.tasks.samples,
    prBody?.summary ?? "",
    ...(prBody?.deliveredValue.slice(0, 3) ?? []),
    ...(prBody?.gates.slice(0, 3) ?? []),
  ].join(" ");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function formatGenerated(
  repoRoot: string,
  relPath: string,
  content: string,
  parser: "html" | "json"
): Promise<string> {
  const prettier = await import("prettier");
  const config = (await prettier.resolveConfig(path.join(repoRoot, relPath))) ?? {};
  return prettier.format(content, { ...config, parser });
}

export async function runBuild(repoRoot: string, logger: Logger = defaultLogger): Promise<number> {
  const data = deriveGovernedWorkMapData(repoRoot);
  writeGeneratedFile(
    repoRoot,
    DATA_REL,
    await formatGenerated(repoRoot, DATA_REL, renderData(data), "json")
  );
  writeGeneratedFile(
    repoRoot,
    HTML_REL,
    await formatGenerated(repoRoot, HTML_REL, renderHtml(data), "html")
  );
  logger.info(`✅ governed-work-map:build — ${DATA_REL} e ${HTML_REL} sincronizados.`);
  return 0;
}

export async function runCheck(repoRoot: string, logger: Logger = defaultLogger): Promise<number> {
  const data = deriveGovernedWorkMapData(repoRoot);
  const expected = new Map([
    [DATA_REL, await formatGenerated(repoRoot, DATA_REL, renderData(data), "json")],
    [HTML_REL, await formatGenerated(repoRoot, HTML_REL, renderHtml(data), "html")],
  ]);
  const stale: string[] = [];
  for (const [rel, content] of expected) {
    const abs = path.join(repoRoot, rel);
    const current = fs.existsSync(abs) ? fs.readFileSync(abs, "utf-8") : "";
    if (current !== content) stale.push(rel);
  }
  if (stale.length === 0) {
    logger.info(
      `✅ governed-work-map:check — projeção viva sincronizada (${data.nodes.length} nós).`
    );
    return 0;
  }
  logger.error(`❌ governed-work-map:check — ${stale.length} arquivo(s) stale:`);
  for (const rel of stale) logger.error(`  ${rel}`);
  logger.error("   Rode: npm run governed-work-map:build");
  return 1;
}

function writeGeneratedFile(repoRoot: string, rel: string, content: string): void {
  const abs = path.join(repoRoot, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
}

export function main(
  args: readonly string[],
  repoRoot: string,
  logger: Logger = defaultLogger
): Promise<number> {
  const subcommand = args[0];
  if (subcommand === "build") return runBuild(repoRoot, logger);
  if (subcommand === "check") return runCheck(repoRoot, logger);
  logger.error("Usage: governed-work-map <build|check>");
  return Promise.resolve(2);
}
