// generic-app.js — explorador GENÉRICO da proposta P12 (abordagem × sinais, sem a org-exemplo).
// Dados GERADOS de ../model.yml § approach-proposal por generate.mjs — editar lá e regenerar.
// A jornada com a org-exemplo (acme) mora em flow-explorer.html.
const html = htm.bind(React.createElement);
const { useState } = React;
const FX = window.MODEL.flowExplorer;

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
  </div>`;
}

function DirectView() {
  return html`<div>
    <p className="sub" style=${{ margin: "6px 0 10px" }}>
      aqui o humano NÃO escolhe mais nada — o sistema lê os SINAIS da descrição e das peças, e cada
      sinal acorda um mecanismo:
    </p>
    ${FX.signals.list.map((s, i) => html`<${SignalCard} key=${i} s=${s} />`)}
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
        ${FX.signals.list.map((s, i) => html`<span key=${i} className="v">${s.id}</span>`)}
      </div>
    </div>
  </div>`;
}

function App() {
  const keys = Object.keys(FX.approach.values);
  const [i, setI] = useState(keys.indexOf("direct"));
  const k = keys[i];
  return html`<div className="wrap">
    <h1>Explorador genérico — abordagem × sinais</h1>
    <p className="lead">
      As REGRAS da proposta ${FX.provocation} (status: ${FX.status}), sem exemplo: a única escolha
      estrutural é a abordagem; sinais e formas derivam. A jornada com a org-exemplo está em
      <a href="flow-explorer.html"> flow-explorer.html</a>.
    </p>
    <div className="intent dashed">
      <div className="hd"><span className="lvl">regra de ouro</span></div>
      <p className="note" style=${{ borderTop: "none", paddingTop: "2px" }}>
        ${FX.approach["golden-rule"]} · ${FX.approach.applicability}
      </p>
    </div>
    <p className="cap">a abordagem (escolha humana, assistível)</p>
    <${Tabs}
      items=${keys.map((key) => `${FX.approach.values[key].split(" — ")[0]} · ${key}`)}
      active=${i}
      onPick=${setI}
    />
    <p className="sub" style=${{ margin: "4px 0 10px" }}>${FX.approach.values[k]}</p>
    ${k === "validate-first" ? html`<${ValidateFirstView} />` : html`<${DirectView} />`}
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
      <a href="model-map.html">← mapa do modelo</a> ·
      <a href="flow-explorer.html"> jornada da org-exemplo</a> · <code>data.js</code> é GERADO de
      <code> ../model.yml § approach-proposal</code> por <code>generate.mjs</code>.
    </p>
  </div>`;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);
