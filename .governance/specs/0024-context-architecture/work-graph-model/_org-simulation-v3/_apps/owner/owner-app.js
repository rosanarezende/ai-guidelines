// owner-app.js — o grafo INTEIRO da acme, navegável (Cytoscape) + painel + issues do validador.
// Dados: ../graph.js (GERADO por _tools/build-graph.mjs). Loop: editar YAML → validate → build → recarregar.
const html = htm.bind(React.createElement);
const { useState, useEffect, useRef } = React;
const G = window.GRAPH;

const TYPE_COLOR = {
  objective: "#ba7517",
  thesis: "#e0aa3e",
  area: "#e09f3e",
  team: "#8a8477",
  repo: "#378add",
  module: "#85b7eb",
  contract: "#d4537e",
  intent: "#1d9e75",
  work: "#5dcaa5",
  target: "#7f77dd",
  metric: "#afa9ec",
  standalone: "#d85a30",
  authority: "#d3d1c7",
};
const TYPE_SHAPE = {
  objective: "round-rectangle",
  thesis: "pentagon",
  area: "round-rectangle",
  team: "round-rectangle",
  repo: "barrel",
  module: "cut-rectangle",
  contract: "diamond",
  intent: "hexagon",
  work: "ellipse",
  target: "round-tag",
  metric: "tag",
  standalone: "octagon",
  authority: "tag",
};
const EDGE_DASH = { "delivery-after": [6, 3], "consumed-by": [2, 3], consumes: [2, 3] };
const ALL_TYPES = Object.keys(TYPE_COLOR);

let cy = null;

function initCy(container, onSelect) {
  cy = cytoscape({
    container,
    elements: [
      ...G.nodes.map((n) => ({ data: { id: n.id, label: n.label, type: n.type } })),
      ...G.edges.map((e) => ({
        data: { id: e.id, source: e.source, target: e.target, type: e.type },
      })),
    ],
    style: [
      {
        selector: "node",
        style: {
          label: "data(label)",
          "font-size": 9,
          "text-wrap": "wrap",
          "text-max-width": 90,
          "text-valign": "center",
          color: "#23231f",
          "background-opacity": 0.9,
          width: 34,
          height: 34,
          shape: (ele) => TYPE_SHAPE[ele.data("type")] || "ellipse",
          "background-color": (ele) => TYPE_COLOR[ele.data("type")] || "#888",
        },
      },
      {
        selector: "edge",
        style: {
          width: 1.2,
          "curve-style": "bezier",
          "target-arrow-shape": "triangle",
          "arrow-scale": 0.8,
          "line-color": "#b4b2a9",
          "target-arrow-color": "#b4b2a9",
          label: "data(type)",
          "font-size": 6,
          color: "#8a887f",
          "text-rotation": "autorotate",
          "line-dash-pattern": (ele) => EDGE_DASH[ele.data("type")] || [1, 0],
          "line-style": (ele) => (EDGE_DASH[ele.data("type")] ? "dashed" : "solid"),
        },
      },
      { selector: "node:selected", style: { "border-width": 3, "border-color": "#e24b4a" } },
      { selector: ".dim", style: { opacity: 0.15 } },
    ],
    layout: { name: "cose", animate: false, nodeRepulsion: 12000 },
    wheelSensitivity: 0.2,
  });
  cy.on("tap", "node", (ev) => onSelect(ev.target.id()));
  cy.on("tap", (ev) => {
    if (ev.target === cy) onSelect(null);
  });
}

function applyFilter(visible) {
  if (!cy) return;
  cy.batch(() => {
    for (const t of ALL_TYPES)
      cy.nodes(`[type="${t}"]`).style("display", visible.has(t) ? "element" : "none");
  });
}

function focus(id) {
  if (!cy) return;
  const n = cy.getElementById(id);
  if (!n || n.empty()) return;
  cy.elements().unselect();
  n.select();
  cy.animate({ center: { eles: n }, zoom: 1.4, duration: 250 });
  cy.elements().addClass("dim");
  n.closedNeighborhood().removeClass("dim");
  setTimeout(() => cy.elements().removeClass("dim"), 1600);
}

function runLayout(name) {
  if (!cy) return;
  const opts =
    name === "breadthfirst"
      ? { name, roots: cy.nodes('[type="objective"]'), directed: true, spacingFactor: 1.1 }
      : name === "concentric"
        ? {
            name,
            concentric: (n) =>
              ({ objective: 6, area: 5, team: 4, intent: 3, work: 2, repo: 1 })[n.data("type")] ||
              0,
            levelWidth: () => 1,
          }
        : { name: "cose", animate: false, nodeRepulsion: 12000 };
  cy.layout(opts).run();
}

function NodePanel({ selId, onGo }) {
  if (!selId)
    return html`<div>
      <h2>acme — ${G.nodes.length} nós · ${G.edges.length} arestas</h2>
      <p className="muted">clique num nó p/ detalhes e conexões · versão ${G.contentHash}</p>
      <p className="muted"><b>perfil:</b> ${G.profileDeclaration.badge}</p>
      <h2 style=${{ marginTop: "14px" }}>issues do validador (${G.issues.length})</h2>
      ${G.issues.length === 0
        ? html`<p className="muted">✓ nenhum — edite os YAML p/ testar (o validador pega)</p>`
        : G.issues.map(
            (i, k) =>
              html`<div
                key=${k}
                className=${"row " + (i.level === "error" ? "err" : "wrn")}
                onClick=${() => onGo(i.node)}
              >
                [${i.rule}] <b>${i.node}</b> — ${i.msg}
              </div>`
          )}
    </div>`;
  const n = G.nodes.find((x) => x.id === selId);
  if (!n) return html`<p className="muted">nó não encontrado</p>`;
  const out = G.edges.filter((e) => e.source === selId);
  const inn = G.edges.filter((e) => e.target === selId);
  const nodeIssues = G.issues.filter((i) => i.node === selId || i.node.startsWith(selId + "::"));
  return html`<div>
    <h2><span className="sw" style=${{ background: TYPE_COLOR[n.type] }}></span> ${n.label}</h2>
    <p className="muted">${n.type} · ${n.id}</p>
    ${Object.entries(n.data || {})
      .filter(([k, v]) => v !== null && v !== undefined && typeof v !== "object")
      .map(([k, v]) => html`<div className="kv" key=${k}><b>${k}:</b> ${String(v)}</div>`)}
    ${nodeIssues.length > 0
      ? html`<h2 style=${{ marginTop: "10px" }}>issues</h2>
          ${nodeIssues.map(
            (i, k) =>
              html`<div key=${k} className=${"row " + (i.level === "error" ? "err" : "wrn")}>
                [${i.rule}] ${i.msg}
              </div>`
          )}`
      : null}
    <h2 style=${{ marginTop: "10px" }}>conexões (${out.length + inn.length})</h2>
    ${out.map(
      (e, k) =>
        html`<div className="row" key=${"o" + k} onClick=${() => onGo(e.target)}>
          ${e.type} → <b>${e.target}</b>
        </div>`
    )}
    ${inn.map(
      (e, k) =>
        html`<div className="row" key=${"i" + k} onClick=${() => onGo(e.source)}>
          <b>${e.source}</b> → ${e.type}
        </div>`
    )}
  </div>`;
}

function App() {
  const [visible, setVisible] = useState(new Set(ALL_TYPES));
  const [selId, setSelId] = useState(null);
  const [layout, setLayout] = useState("cose");
  const cyRef = useRef(null);

  useEffect(() => {
    initCy(cyRef.current, (id) => setSelId(id));
  }, []);
  useEffect(() => applyFilter(visible), [visible]);

  const toggle = (t) => {
    const v = new Set(visible);
    v.has(t) ? v.delete(t) : v.add(t);
    setVisible(v);
  };
  const go = (id) => {
    setSelId(id);
    focus(id);
  };
  const search = (ev) => {
    if (ev.key !== "Enter") return;
    const q = ev.target.value.toLowerCase();
    const hit = G.nodes.find(
      (n) => n.id.toLowerCase().includes(q) || String(n.label).toLowerCase().includes(q)
    );
    if (hit) go(hit.id);
  };

  return html`<div
    id="root-inner"
    style=${{ display: "flex", flexDirection: "column", height: "100vh" }}
  >
    <div className="toolbar">
      <h1>acme · grafo da org</h1>
      ${ALL_TYPES.map(
        (t) =>
          html`<button
            key=${t}
            className=${"btn" + (visible.has(t) ? " on" : "")}
            onClick=${() => toggle(t)}
          >
            <span className="sw" style=${{ background: TYPE_COLOR[t], marginRight: "4px" }}></span
            >${t}
          </button>`
      )}
      ${["cose", "breadthfirst", "concentric"].map(
        (l) =>
          html`<button
            key=${l}
            className=${"btn" + (layout === l ? " on" : "")}
            onClick=${() => {
              setLayout(l);
              runLayout(l);
            }}
          >
            ${l}
          </button>`
      )}
      <input className="search" placeholder="buscar nó (Enter)" onKeyDown=${search} />
    </div>
    <div className="main">
      <div id="cy" ref=${cyRef}></div>
      <aside className="panel"><${NodePanel} selId=${selId} onGo=${go} /></aside>
    </div>
  </div>`;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);
