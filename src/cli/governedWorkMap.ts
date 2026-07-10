/**
 * Generated projection for the governed work map.
 *
 * Source of truth remains `.governance/specs/0024-context-architecture/state.yml`.
 * This module only derives a browser-friendly data snapshot + static HTML view.
 */
import * as fs from "node:fs";
import * as path from "node:path";
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
const DATA_REL = `${SPEC_REL}/assets/governed-work-map-data.json`;
const HTML_REL = `${SPEC_REL}/assets/governed-work-map.html`;

type GovernedWorkNodeStatus = "concluded" | "active" | "planned";

interface GovernedWorkNode {
  readonly id: string;
  readonly status: GovernedWorkNodeStatus;
  readonly githubPr: number | null;
  readonly role: string;
  readonly terminal: boolean;
  readonly sequence: number | null;
  readonly checkpoints: readonly string[];
  readonly isCursor: boolean;
}

interface GovernedWorkMapData {
  readonly schemaVersion: 1;
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
  if (state.topology === undefined) {
    throw new Error(`${STATE_REL} não declara topology; mapa vivo não pode ser derivado.`);
  }

  const cursor = state.topology.cursor;
  const nodes = [
    ...mapNodes("concluded", state.topology.prs.concluded, cursor.pr),
    ...mapNodes("active", state.topology.prs.active, cursor.pr),
    ...mapNodes("planned", state.topology.prs.planned, cursor.pr),
  ];
  const checkpointCount = nodes.reduce((sum, node) => sum + node.checkpoints.length, 0);

  return {
    schemaVersion: 1,
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
  cursorPr: string
): GovernedWorkNode[] {
  return nodes.map((node) => ({
    id: node.id,
    status,
    githubPr: node.github_pr,
    role: node.role,
    terminal: node.terminal,
    sequence: node.sequence,
    checkpoints: [...node.checkpoints],
    isCursor: node.id === cursorPr,
  }));
}

function renderData(data: GovernedWorkMapData): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

function renderHtml(data: GovernedWorkMapData): string {
  const embedded = JSON.stringify(data).replace(/</g, "\\u003c");
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
      --surface-2: #eee8dd;
      --ink: #142321;
      --muted: #66716d;
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
        radial-gradient(circle at 18% 18%, rgba(193, 154, 75, 0.16), transparent 32rem),
        radial-gradient(circle at 82% 10%, rgba(13, 59, 49, 0.12), transparent 36rem),
        var(--bg);
      color: var(--ink);
    }
    main { max-width: 1440px; margin: 0 auto; padding: 32px; }
    header {
      display: grid;
      grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
      gap: 24px;
      align-items: stretch;
      margin-bottom: 24px;
    }
    .hero,
    .panel,
    .toolbar,
    .node,
    .detail {
      border: 1px solid var(--line);
      background: rgba(255, 250, 242, 0.82);
      box-shadow: 0 16px 50px rgba(20, 35, 33, 0.08);
      border-radius: 8px;
    }
    .hero { padding: 34px; }
    .eyebrow {
      color: var(--green);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    h1 { font-size: clamp(38px, 5vw, 76px); line-height: 0.94; margin: 14px 0; max-width: 980px; }
    h2 { margin: 0 0 10px; font-size: 22px; }
    p { color: var(--muted); line-height: 1.58; }
    .hero p { max-width: 780px; font-size: 18px; }
    .metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 24px; }
    .metric { background: rgba(13, 59, 49, 0.06); border: 1px solid var(--line); border-radius: 8px; padding: 14px; }
    .metric strong { display: block; color: var(--green); font-size: 28px; }
    .panel { padding: 24px; }
    .toolbar {
      display: grid;
      grid-template-columns: minmax(240px, 1fr) repeat(3, auto);
      gap: 12px;
      padding: 14px;
      margin-bottom: 18px;
    }
    input, button {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      color: var(--ink);
      min-height: 42px;
      padding: 0 14px;
      font: inherit;
    }
    button { cursor: pointer; font-weight: 700; }
    button.active { background: var(--green); color: white; }
    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 360px;
      gap: 18px;
      align-items: start;
    }
    .work-map { display: grid; gap: 14px; }
    .lane { display: grid; gap: 10px; }
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
    .node { padding: 16px; cursor: pointer; position: relative; min-height: 180px; }
    .node.active-node { outline: 3px solid rgba(193, 154, 75, 0.28); }
    .node h3 { margin: 8px 0 4px; font-size: 18px; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.58);
      color: var(--muted);
      font-size: 12px;
      padding: 5px 9px;
    }
    .status-concluded { border-left: 5px solid var(--sage); }
    .status-active { border-left: 5px solid var(--brass); }
    .status-planned { border-left: 5px solid var(--graphite); }
    .detail { padding: 20px; position: sticky; top: 18px; }
    .detail dl { display: grid; grid-template-columns: 120px 1fr; gap: 8px 12px; margin: 0; }
    .detail dt { color: var(--muted); font-weight: 700; }
    .detail dd { margin: 0; }
    .checkpoint-list { margin: 16px 0 0; padding-left: 18px; }
    .hidden { display: none; }
    .empty { padding: 24px; color: var(--muted); border: 1px dashed var(--line); border-radius: 8px; }
    .matrix { width: 100%; border-collapse: collapse; }
    .matrix th, .matrix td { padding: 12px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
    .matrix th { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
    @media (max-width: 980px) {
      main { padding: 18px; }
      header, .layout { grid-template-columns: 1fr; }
      .toolbar { grid-template-columns: 1fr 1fr; }
      .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .detail { position: static; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <section class="hero">
        <div class="eyebrow">Projeção derivada · não-SSOT</div>
        <h1>Mapa Vivo do Trabalho Governado</h1>
        <p>
          Visão navegável da topologia em <code>state.yml</code>. O mapa mostra todos os nós
          concluídos, o checkpoint ativo e a cauda planejada sem substituir o contrato governado.
        </p>
        <div class="metrics" aria-label="Resumo da topologia">
          <div class="metric"><strong>${data.counts.concluded}</strong><span>nós concluídos</span></div>
          <div class="metric"><strong>${data.counts.active}</strong><span>nó ativo</span></div>
          <div class="metric"><strong>${data.counts.planned}</strong><span>nós planejados</span></div>
          <div class="metric"><strong>${data.counts.checkpoints}</strong><span>checkpoints</span></div>
        </div>
      </section>
      <aside class="panel">
        <h2>Cursor atual</h2>
        <p><strong>${escapeHtml(data.cursor.pr)}</strong><br />${escapeHtml(data.cursor.checkpoint)}</p>
        <p>Stage: <strong>${escapeHtml(data.stage)}</strong><br />Gate: <strong>${escapeHtml(data.gateStatus)}</strong></p>
        <p>Fonte: <code>${escapeHtml(data.source.statePath)}</code></p>
      </aside>
    </header>

    <section class="toolbar" aria-label="Filtros do mapa">
      <input id="search" type="search" placeholder="Buscar PR, checkpoint, papel..." />
      <button type="button" class="active" data-filter="all">Todos</button>
      <button type="button" data-filter="concluded">Concluídos</button>
      <button type="button" data-filter="active">Ativo</button>
    </section>

    <section class="layout">
      <div>
        <div id="map" class="work-map" aria-live="polite"></div>
        <div id="empty" class="empty hidden">Nenhum nó encontrado para os filtros atuais.</div>
      </div>
      <aside id="detail" class="detail"></aside>
    </section>
  </main>

  <script id="governed-work-data" type="application/json">${embedded}</script>
  <script>
    const data = JSON.parse(document.getElementById("governed-work-data").textContent);
    const byStatus = ["concluded", "active", "planned"];
    const labels = { concluded: "Concluído", active: "Ativo", planned: "Planejado" };
    const map = document.getElementById("map");
    const detail = document.getElementById("detail");
    const empty = document.getElementById("empty");
    const search = document.getElementById("search");
    let currentFilter = "all";
    let selectedId = data.cursor.pr;

    function textMatch(node, term) {
      if (!term) return true;
      const haystack = [node.id, node.status, node.role, String(node.githubPr ?? ""), ...node.checkpoints]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term.toLowerCase());
    }

    function filteredNodes() {
      const term = search.value.trim();
      return data.nodes.filter((node) => {
        const filterOk = currentFilter === "all" || node.status === currentFilter;
        return filterOk && textMatch(node, term);
      });
    }

    function render() {
      const nodes = filteredNodes();
      map.innerHTML = "";
      empty.classList.toggle("hidden", nodes.length > 0);
      for (const status of byStatus) {
        const laneNodes = nodes.filter((node) => node.status === status);
        if (laneNodes.length === 0) continue;
        const lane = document.createElement("section");
        lane.className = "lane";
        lane.innerHTML = \`
          <div class="lane-title">
            <span>\${labels[status]}</span>
            <span>\${laneNodes.length}</span>
          </div>
          <div class="nodes"></div>
        \`;
        const list = lane.querySelector(".nodes");
        for (const node of laneNodes) list.appendChild(renderNode(node));
        map.appendChild(lane);
      }
      const selected = data.nodes.find((node) => node.id === selectedId) ?? nodes[0] ?? data.nodes[0];
      renderDetail(selected);
    }

    function renderNode(node) {
      const button = document.createElement("article");
      button.className = \`node status-\${node.status}\${node.id === selectedId ? " active-node" : ""}\`;
      button.tabIndex = 0;
      button.setAttribute("role", "button");
      button.setAttribute("aria-label", \`Abrir detalhes de \${node.id}\`);
      button.innerHTML = \`
        <span class="chip">\${labels[node.status]}</span>
        <h3>\${node.id}</h3>
        <p>PR \${node.githubPr ?? "futuro"} · \${node.role} · seq \${node.sequence ?? "n/a"}</p>
        <div class="chips">
          \${node.checkpoints.slice(0, 4).map((cp) => \`<span class="chip">\${cp}</span>\`).join("")}
          \${node.checkpoints.length > 4 ? \`<span class="chip">+\${node.checkpoints.length - 4}</span>\` : ""}
        </div>
      \`;
      const select = () => {
        selectedId = node.id;
        render();
      };
      button.addEventListener("click", select);
      button.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select();
        }
      });
      return button;
    }

    function renderDetail(node) {
      detail.innerHTML = \`
        <h2>\${node.id}</h2>
        <dl>
          <dt>Status</dt><dd>\${labels[node.status]}</dd>
          <dt>PR</dt><dd>\${node.githubPr ?? "planejado"}</dd>
          <dt>Papel</dt><dd>\${node.role}</dd>
          <dt>Sequência</dt><dd>\${node.sequence ?? "n/a"}</dd>
          <dt>Terminal</dt><dd>\${node.terminal ? "sim" : "não"}</dd>
          <dt>Cursor</dt><dd>\${node.isCursor ? "sim" : "não"}</dd>
        </dl>
        <h3>Checkpoints</h3>
        <ol class="checkpoint-list">
          \${node.checkpoints.map((cp) => \`<li><code>\${cp}</code></li>\`).join("")}
        </ol>
      \`;
    }

    search.addEventListener("input", render);
    for (const button of document.querySelectorAll("[data-filter]")) {
      button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;
        for (const other of document.querySelectorAll("[data-filter]")) other.classList.remove("active");
        button.classList.add("active");
        render();
      });
    }
    render();
  </script>
</body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
