// app.js — mapa navegável do modelo (React + htm, sem build). Dados em data.js (GERADO de ../model.yml por generate.mjs).
const html = htm.bind(React.createElement);
const { useState } = React;

function Works({ works }) {
  return html`<div className="works">
    ${works.map(
      (w, i) =>
        html`<div className="w" key=${i}>
          <span className="r">${w.r}</span><span className=${"pp " + w.p}>${w.p}</span>
          <div className="d">${w.d}</div>
        </div>`
    )}
  </div>`;
}

function Tabs({ items, active, onPick }) {
  return html`<div className="tabs">
    ${items.map(
      (it, i) =>
        html`<button
          key=${i}
          className="tab"
          aria-current=${active === i ? "true" : "false"}
          onClick=${() => onPick(i)}
        >
          ${it}
        </button>`
    )}
  </div>`;
}

function LayerLegend() {
  return html`<div>
    <p className="cap">a estrutura</p>
    ${MODEL.layers.map(
      (l, i) =>
        html`<div className="band" key=${i}>
          <div className="h">
            <span className="t">${l.id}</span><span className="ax">— ${l.ax}</span>
          </div>
          <div className="vals">
            ${l.vals.map(
              (v, j) => html`<span key=${j} className=${v.p ? "v " + v.p : "v"}>${v.t}</span>`
            )}
          </div>
        </div>`
    )}
  </div>`;
}

function ExamplePanel({ ex }) {
  if (ex.contractCard) {
    const c = ex.contractCard;
    return html`<div className="intent dashed">
      <div className="hd">
        <span className="lvl">contrato</span> ${c.id} <span className="tag">nó versionado</span>
      </div>
      <p className="sub">${c.sub}</p>
      <div className="unit">
        <div className="hd"><span className="lvl">${c.unit.kind}</span> ${c.unit.title}</div>
        <${Works} works=${c.works} />
      </div>
      <p className="note">${c.note}</p>
    </div>`;
  }
  const unit = ex.unit
    ? html`<div className="unit">
        <div className="hd">
          <span className="lvl">execution-unit</span> ${ex.unit.title}
          <span className="tag">${ex.unit.kind}</span>
        </div>
        <p className="sub">dona: ${ex.unit.owns}</p>
        <${Works} works=${ex.works} />
      </div>`
    : html`<div>
        <p className="collapsed">execution-unit colapsa (trivial) — a intent liga direto na peça</p>
        <${Works} works=${ex.works} />
      </div>`;
  const head = ex.intent
    ? html`<div className="hd">
        <span className="lvl">intent</span> ${ex.intent.title}
        <span className="tag">${ex.intent.strategy}</span>
      </div>`
    : html`<div className="hd">
        <span className="lvl">intent</span>
        <span className="tag">— (nenhuma · trabalho standalone)</span>
      </div>`;
  return html`<div className="intent">
    ${head} ${unit}
    ${ex.contract
      ? html`<div className="side"><span className="chip">contrato · ${ex.contract}</span></div>`
      : null}
    ${ex.fork ? html`<p className="note">${ex.fork}</p>` : null}
    <p className="note">${ex.note}</p>
  </div>`;
}

function ExampleExplorer() {
  const [i, setI] = useState(0);
  return html`<div>
    <p className="cap">as situações</p>
    <${Tabs} items=${MODEL.examples.map((e) => e.label)} active=${i} onPick=${setI} />
    <${ExamplePanel} ex=${MODEL.examples[i]} />
  </div>`;
}

function OrgPanel({ o }) {
  return html`<div className="intent">
    <div className="hd">${o.label}</div>
    <div className="side"><span className="chip">SoD: ${o.sod}</span></div>
    <div className="works">
      ${o.participation.map(
        (p, i) =>
          html`<div className="w" key=${i}>
            <span className="r">${p.phase}</span>
            <div className="d">${p.who}</div>
          </div>`
      )}
    </div>
    <p className="note"><b>gaps</b></p>
    <ul className="gaplist">
      ${o.gaps.map((g, i) => html`<li key=${i}>${g}</li>`)}
    </ul>
    ${o.degenerate ? html`<p className="note">${o.degenerate}</p>` : null}
  </div>`;
}

function SimExplorer() {
  const [i, setI] = useState(0);
  return html`<div>
    <p className="cap">simulação de fluxo × papéis (3 formas de org)</p>
    <${Tabs} items=${MODEL.sim.map((o) => o.label)} active=${i} onPick=${setI} />
    <${OrgPanel} o=${MODEL.sim[i]} />
    <div className="intent" style=${{ marginTop: "10px" }}>
      <div className="hd">
        <span className="lvl">achado</span> escala da governança · F-governance-scaling
      </div>
      <p className="note" style=${{ borderTop: "none", paddingTop: "2px" }}>${MODEL.finding}</p>
    </div>
  </div>`;
}

function ProfilesView() {
  const [i, setI] = useState(0);
  const p = MODEL.profiles;
  const it = p.items[i];
  return html`<div>
    <p className="cap">perfis de governança (a lei de escala executável)</p>
    <${Tabs} items=${p.items.map((x) => x.id)} active=${i} onPick=${setI} />
    <div className="intent">
      <div className="hd"><span className="lvl">${it.id}</span> ${it.for}</div>
      <div className="works">
        <div className="w">
          <span className="r">nós</span>
          <div className="d">${it.nodes}</div>
        </div>
        <div className="w">
          <span className="r">gates</span>
          <div className="d">${it.gates}</div>
        </div>
        <div className="w">
          <span className="r">SoD</span>
          <div className="d">${it.sod}</div>
        </div>
        <div className="w">
          <span className="r">obrigatório</span>
          <div className="d">${it.required}</div>
        </div>
        <div className="w">
          <span className="r">enforcement</span>
          <div className="d">${it.enforcement}</div>
        </div>
      </div>
      <p className="note">${p.law}</p>
    </div>
  </div>`;
}

function ObjectiveChain({ objective }) {
  return html`<div className="intent">
    <div className="hd">
      <span className="lvl">business-objective</span>
      <span className="tag">recursivo · cascades-to</span>
    </div>
    ${objective.map(
      (o, i) =>
        html`<div className="w" key=${i} style=${{ marginTop: "6px", marginLeft: i * 14 + "px" }}>
          <span className="r">${o.title}</span><span className="pp create">${o.level}</span>
          <div className="d">${o.period}${o.meta ? " · " + o.meta : ""}</div>
        </div>`
    )}
  </div>`;
}

function GraphView() {
  const g = MODEL.graph;
  const down = (t) => html`<div className="down">↓ ${t}</div>`;
  return html`<div>
    <p className="cap">o grafo completo (do negócio à peça)</p>
    <${ObjectiveChain} objective=${g.objective} />
    <div className="side"><span className="chip">framed-by · thesis: ${g.thesis}</span></div>
    <div className="side">
      ${g.opportunities.map(
        (o, i) => html`<span className="chip" key=${i}>opportunity-area · ${o}</span>`
      )}
    </div>
    ${down("authorizes")}
    <div className="intent">
      <div className="hd">
        <span className="lvl">intent</span> ${g.intent.title}
        <span className="tag">${g.intent.strategy}</span>
      </div>
    </div>
    ${down("breaks-into")}
    <div className="unit">
      <div className="hd">
        <span className="lvl">execution-unit</span> ${g.unit.title}
        <span className="tag">${g.unit.kind} · ${g.unit.verdict}</span>
      </div>
      <div className="works">
        ${g.works.map(
          (w, i) =>
            html`<div className="w" key=${i}>
              <span className="r">${w.r}</span><span className=${"pp " + w.p}>${w.p}</span>
              <div className="d">${w.d}</div>
            </div>`
        )}
      </div>
    </div>
    ${down("emits · no veredito")}
    <div className="unit">
      <div className="hd">
        <span className="lvl">outcome</span> ${g.outcome.title}
        <span className="tag">governado · append-only</span>
      </div>
      <p className="sub">${g.outcome.fields}</p>
      <p className="note">${g.outcome.note}</p>
    </div>
    ${down("contributes-to → rollup")}
    <div className="intent dashed">
      <div className="hd"><span className="lvl">dashboard</span> medição + rollup</div>
      <p className="sub">metric-definition: ${g.measurement.metric}</p>
      <p className="sub">target: ${g.measurement.target}</p>
      <p className="sub">${g.measurement.roles}</p>
      <div className="works">
        <div className="w">
          <span className="r">contributes-to</span><span className="pp create">soma</span>
          <div className="d">${g.rollup.contributes}</div>
        </div>
        <div className="w">
          <span className="r">aligns-with</span><span className="pp sustain">não soma</span>
          <div className="d">${g.rollup.aligns}</div>
        </div>
      </div>
      <p className="note">${g.rollup.lint}</p>
    </div>
    <div className="intent" style=${{ marginTop: "10px" }}>
      <div className="hd"><span className="lvl">lei de escala</span></div>
      <p className="note" style=${{ borderTop: "none", paddingTop: "2px" }}>${MODEL.scalingLaw}</p>
    </div>
  </div>`;
}

function App() {
  return html`<div className="wrap">
    <h1>Modelo do trabalho — do negócio à peça</h1>
    <p className="lead">
      business-objective (negócio, recursivo) → intent (estratégia) → execution-unit (tipo,
      cross-repo) → repo-work (propósito, por repo) → outcome (resultado governado). Troque as
      situações e as formas de org nas abas.
    </p>
    <${LayerLegend} />
    <${ExampleExplorer} />
    <${SimExplorer} />
    <${ProfilesView} />
    <${GraphView} />
    <div className="foot">
      <span><b>contrato</b> — nó de coordenação/versionamento (janela de compat mora nele)</span>
      <span><b>q/r/d</b> — anexável a qualquer nó (alerta em mutação perigosa)</span>
      <span><b>intake</b> — funil pré-intent (authorized-by ou standalone)</span>
      <span
        ><b>autoria assistida</b> — humano descreve, IA sugere os campos (nunca decide; no máximo
        alerta)</span
      >
      <span><b>decision-points</b> — ${MODEL.decisionPoints} (colapsáveis por perfil)</span>
      <span
        ><a href="flow-explorer.html"
          >explorador do fluxo — abordagem × natureza (proposta P12) →</a
        ></span
      >
    </div>
    <p className="src">
      <code>data.js</code> é GERADO de <code>../model.yml</code> por <code>generate.mjs</code>.
    </p>
  </div>`;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);
