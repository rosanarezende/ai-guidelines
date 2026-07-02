// flow-app.js — explorador do fluxo (proposta P12): negócio → intent (abordagem) → sinais → forma.
// Dados GERADOS de ../model.yml (§ approach-proposal + business-tier.example) por generate.mjs.
const html = htm.bind(React.createElement);
const { useState } = React;
const FX = window.MODEL.flowExplorer;
const G = window.MODEL.graph;

function Id({ children }) {
  return html`<span className="tag">${children}</span>`;
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

function BusinessStrip() {
  const top = G.objective[0];
  const leaf = G.objective[G.objective.length - 1];
  return html`<div>
    <p className="cap">a camada de negócio (validada na P9)</p>
    <div className="intent dashed">
      <div className="hd">
        <span className="lvl">objetivo</span> ${top.title}
        <${Id}>business-objective<//>
      </div>
      <p className="sub">
        cadeia recursiva: ${G.objective.map((o) => o.level).join(" → ")} · na ponta: "${leaf.title}"
      </p>
      <p className="sub">
        meta: ${G.measurement.target} <${Id}>target<//> <${Id}>metric-definition<//>
      </p>
    </div>
    <div className="down">
      ↓ autoriza a intent e diz em qual PLACAR o resultado conta <${Id}>authorizes<//>
      <${Id}>primary-target<//>
    </div>
  </div>`;
}

function SignalCard({ s }) {
  return html`<div className="intent">
    <div className="hd">
      <span className="lvl">sinal</span> ${s.signal}
      <${Id}>${s.id}<//>
    </div>
    <p className="sub"><b>acorda:</b> ${s.wakes}</p>
    <div className="works">
      <div className="w">
        <span className="r">vários repos</span>
        <span className="pp create">${s["form-if-multi-repo"]}</span>
      </div>
      <div className="w">
        <span className="r">um repo só</span>
        <span className="pp sustain">colapsa — vira peça direto no repo</span>
      </div>
    </div>
    <p className="note">
      etiqueta derivada (só resumo p/ portfólio): ${s["tag-label"]} <${Id}>${s.tag}<//>
    </p>
  </div>`;
}

function DeliverDirectView() {
  return html`<div>
    <p className="sub" style=${{ margin: "6px 0 10px" }}>
      aqui o humano NÃO escolhe mais nada — o sistema lê os SINAIS da descrição e das peças, e cada
      sinal acorda um mecanismo:
    </p>
    ${FX.nature.signals.map((s, i) => html`<${SignalCard} key=${i} s=${s} />`)}
  </div>`;
}

function ValidateFirstView() {
  const lead = FX.derivation.find((r) => r.approach === "validate-first");
  return html`<div>
    <div className="unit">
      <div className="hd">
        <span className="lvl">forma derivada</span> experimento
        <${Id}>experiment-run<//>
      </div>
      <p className="sub">${lead ? lead.note : ""}</p>
      <p className="sub">${FX.approach.lint} <${Id}>accept-verdict<//></p>
    </div>
    <div className="band">
      <div className="h"><span className="t">os mesmos sinais dizem O QUE se valida</span></div>
      <div className="vals">
        ${FX.nature.signals.map(
          (s, i) => html`<span key=${i} className="v">${s["tag-label"]}</span>`
        )}
      </div>
    </div>
  </div>`;
}

function App() {
  const keys = Object.keys(FX.approach.values);
  const [i, setI] = useState(keys.indexOf("deliver-direct"));
  const k = keys[i];
  return html`<div className="wrap">
    <h1>Explorador do fluxo — do negócio à forma</h1>
    <p className="lead">
      Proposta ${FX.provocation} (status: ${FX.status} — nada aplicado nas camadas). Cada elemento
      carrega a etiqueta do id atual, p/ você julgar os nomes. A única escolha estrutural do humano
      é a abordagem.
    </p>
    <${BusinessStrip} />
    <div className="intent">
      <div className="hd">
        <span className="lvl">intent</span> o que queremos alcançar
        <${Id}>intent<//>
      </div>
      <p className="sub">
        escolha humana (assistível <${Id}>assisted-authoring<//>): a abordagem
        <${Id}>approach<//>
      </p>
      <${Tabs}
        items=${keys.map((key) => `${FX.approach.values[key].split(" — ")[0]} · ${key}`)}
        active=${i}
        onPick=${setI}
      />
      <p className="sub" style=${{ margin: "4px 0 0" }}>${FX.approach.values[k]}</p>
      <p className="note">${FX.approach["golden-rule"]} · ${FX.approach.applicability}</p>
    </div>
    <div className="down">↓ o que deriva da abordagem escolhida</div>
    ${k === "validate-first" ? html`<${ValidateFirstView} />` : html`<${DeliverDirectView} />`}
    <div className="intent" style=${{ marginTop: "10px" }}>
      <div className="hd"><span className="lvl">depois, sem ninguém escolher</span></div>
      <p className="note" style=${{ borderTop: "none", paddingTop: "2px" }}>${FX.consequences}</p>
    </div>
    <div className="intent" style=${{ marginTop: "10px" }}>
      <div className="hd"><span className="lvl">caminhos SEM abordagem</span></div>
      <ul className="gaplist">
        ${FX.noApproach.map((p, idx) => html`<li key=${idx}>${p}</li>`)}
      </ul>
    </div>
    <div>
      <p className="cap">os nomes, antes → depois</p>
      <div className="works">
        ${FX.renames.map(
          (r, idx) =>
            html`<div className="w" key=${idx}>
              <span className="r">${r.from ? r.from : "(novo)"}</span>
              <span className="pp sustain">${r.to}</span>
              <div className="d">${r.label}${r.note ? " — " + r.note : ""}</div>
            </div>`
        )}
      </div>
    </div>
    <p className="src">
      <a href="model-map.html">← mapa do modelo</a> · <code>data.js</code> é GERADO de
      <code> ../model.yml § approach-proposal</code> por <code>generate.mjs</code> — itere no
      model.yml e regenere.
    </p>
  </div>`;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);
