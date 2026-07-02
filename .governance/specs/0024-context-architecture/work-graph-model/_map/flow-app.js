// flow-app.js — explorador do fluxo abordagem × natureza (proposta P12). Dados em data.js
// (GERADOS de ../model.yml § approach-proposal por generate.mjs — editar lá e regenerar).
const html = htm.bind(React.createElement);
const { useState } = React;
const FX = window.MODEL.flowExplorer;

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

function rowsFor(approach, nature) {
  return FX.derivation.filter(
    (r) => r.approach === approach && (r.nature === nature || r.nature === "any")
  );
}

function FormChips({ rows }) {
  return html`<div className="works">
    ${rows.map((r, i) => {
      const scope =
        r["multi-repo"] === true
          ? "vários repos"
          : r["multi-repo"] === false
            ? "um repo só"
            : "qualquer escopo";
      return html`<div className="w" key=${i}>
        <span className="r">${scope}</span>
        <span className="pp create">${r.form}</span>
        ${r.note ? html`<div className="d">${r.note}</div>` : null}
      </div>`;
    })}
  </div>`;
}

function NatureCard({ nk, approach }) {
  const n = FX.nature.values[nk];
  return html`<div className="intent">
    <div className="hd">
      <span className="lvl">natureza</span> ${n.label}
      <span className="tag">derivada — ninguém escolhe</span>
    </div>
    <p className="sub">${n.says}</p>
    <${FormChips} rows=${rowsFor(approach, nk)} />
    <p className="note"><b>o que muda quando é esta natureza</b></p>
    <ul className="gaplist">
      ${n.impacts.map((im, i) => html`<li key=${i}>${im}</li>`)}
    </ul>
  </div>`;
}

function ValidateFirstView() {
  const lead = rowsFor("validate-first", "any")[0];
  return html`<div>
    <div className="unit">
      <div className="hd">
        <span className="lvl">forma derivada</span> ${lead ? lead.form : "experiment-run"}
        <span className="tag">a unit líder é o experimento</span>
      </div>
      <p className="sub">${lead ? lead.note : ""}</p>
    </div>
    <div className="band">
      <div className="h">
        <span className="t">a natureza diz O QUE está sendo validado</span>
      </div>
      <div className="vals">
        ${Object.keys(FX.nature.values).map(
          (nk, i) => html`<span key=${i} className="v">${FX.nature.values[nk].label}</span>`
        )}
      </div>
    </div>
    <p className="note">
      exige hipótese + regra de decisão (lint da regra de ouro) · gate: aceitar o veredito ·
      ${FX.consequences}
    </p>
  </div>`;
}

function DeliverDirectView() {
  return html`<div>
    ${Object.keys(FX.nature.values).map(
      (nk, i) => html`<${NatureCard} key=${i} nk=${nk} approach="deliver-direct" />`
    )}
  </div>`;
}

function Renames() {
  return html`<div>
    <p className="cap">os nomes, antes → depois</p>
    <div className="works">
      ${FX.renames.map(
        (r, i) =>
          html`<div className="w" key=${i}>
            <span className="r">${r.from ? r.from : "(novo)"}</span>
            <span className="pp sustain">${r.to}</span>
            <div className="d">${r.label}${r.note ? " — " + r.note : ""}</div>
          </div>`
      )}
    </div>
  </div>`;
}

function App() {
  const [i, setI] = useState(0);
  const keys = Object.keys(FX.approach.values);
  const k = keys[i];
  return html`<div className="wrap">
    <h1>Explorador do fluxo — abordagem × natureza</h1>
    <p className="lead">
      Proposta ${FX.provocation} (status: ${FX.status} — nada aplicado nas camadas ainda). A única
      escolha estrutural do humano é a ABORDAGEM; a natureza e a forma DERIVAM. Troque a abordagem
      na aba e veja o impacto de cada natureza.
    </p>
    <div className="intent dashed">
      <div className="hd"><span className="lvl">regra de ouro</span></div>
      <p className="note" style=${{ borderTop: "none", paddingTop: "2px" }}>
        ${FX.approach["golden-rule"]} · ${FX.approach.applicability}
      </p>
    </div>
    <p className="cap">a abordagem (escolha humana, assistível)</p>
    <${Tabs}
      items=${keys.map((key) => FX.approach.values[key].split(" — ")[0])}
      active=${i}
      onPick=${setI}
    />
    <p className="sub" style=${{ margin: "4px 0 10px" }}>${FX.approach.values[k]}</p>
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
    <${Renames} />
    <p className="src">
      <a href="model-map.html">← mapa do modelo</a> · <code>data.js</code> é GERADO de
      <code> ../model.yml § approach-proposal</code> por <code>generate.mjs</code> — itere no
      model.yml e regenere.
    </p>
  </div>`;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);
