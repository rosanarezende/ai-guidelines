// flow-app.js — explorador do fluxo (proposta P12): org-exemplo (negócio → intent) + abordagem × sinais → forma.
// Dados GERADOS de ../model.yml § approach-proposal por generate.mjs — editar lá e regenerar.
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

function ExampleOrg() {
  const org = FX.exampleOrg;
  const objTitle = (id) => (org.objectives.find((o) => o.id === id) || {}).title;
  return html`<div>
    <p className="cap">
      org-exemplo: ${org.company} — 2 objetivos de empresa · 2 áreas · 5 times (a base p/ validar
      camada a camada)
    </p>
    <div className="intent org-company">
      <div className="hd">
        <span className="lvl">empresa</span> os objetivos do ciclo
        <${Id}>business-objective · company<//>
      </div>
      ${org.objectives.map(
        (o, i) => html`<p className="sub" key=${i}>◦ ${o.title} — ${o.period}</p>`
      )}
    </div>
    <div className="down">↓ cada área traduz p/ um driver seu <${Id}>cascades-to<//></div>
    ${org.areas.map(
      (a, i) =>
        html`<div className="intent" key=${i}>
          <div className="hd">
            <span className="lvl">área</span> ${a.title}
            <${Id}>business-objective · area<//>
          </div>
          <p className="sub">driver: ${a.driver} · nasce de: "${objTitle(a["cascades-from"])}"</p>
          <div className="works">
            ${org.teams
              .filter((t) => t.area === a.id)
              .map(
                (t, j) =>
                  html`<div className="w" key=${j}>
                    <span className="r">${t.id}</span>
                    <div className="d">${t.priority}</div>
                  </div>`
              )}
          </div>
          <p className="note">
            prioridades dos times — cada uma com placar próprio
            <${Id}>business-objective · team-priority<//> <${Id}>target<//>
          </p>
        </div>`
    )}
    <div className="down">
      ↓ o objetivo autoriza a intent e entrega o placar <${Id}>authorizes<//>
      <${Id}>primary-target<//>
    </div>
    ${org.intents.map(
      (it, i) =>
        html`<div className="unit" key=${i}>
          <div className="hd">
            <span className="lvl">intent</span> ${it.title}
            <${Id}>approach: ${it.approach}<//>
          </div>
          <p className="sub">
            ${it.team} · autorizada por: "${objTitle(it["authorized-by"])}" · sinal detectado:
            <${Id}>${it.signal}<//>
          </p>
          <p className="note">deriva: ${it.derived}</p>
        </div>`
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
  </div>`;
}

function App() {
  const keys = Object.keys(FX.approach.values);
  const [i, setI] = useState(keys.indexOf("direct"));
  const k = keys[i];
  return html`<div className="wrap">
    <h1>Explorador do fluxo — do negócio à forma</h1>
    <p className="lead">
      Proposta ${FX.provocation} (status: ${FX.status} — nada aplicado nas camadas). Cada elemento
      carrega a etiqueta do id atual, p/ você julgar os nomes. A única escolha estrutural do humano
      é a abordagem; o resto deriva de SINAIS (o conceito "natureza" foi removido).
    </p>
    <${ExampleOrg} />
    <p className="cap" style=${{ marginTop: "18px" }}>explore genericamente (qualquer intent)</p>
    <div className="intent">
      <div className="hd">
        <span className="lvl">intent</span> a escolha humana: a abordagem <${Id}>approach<//>
        <${Id}>assisted-authoring<//>
      </div>
      <${Tabs}
        items=${keys.map((key) => `${FX.approach.values[key].split(" — ")[0]} · ${key}`)}
        active=${i}
        onPick=${setI}
      />
      <p className="sub" style=${{ margin: "4px 0 0" }}>${FX.approach.values[k]}</p>
      <p className="note">${FX.approach["golden-rule"]} · ${FX.approach.applicability}</p>
    </div>
    <div className="down">↓ o que deriva da abordagem escolhida</div>
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
      <a href="model-map.html">← mapa do modelo</a> · <code>data.js</code> é GERADO de
      <code> ../model.yml § approach-proposal</code> por <code>generate.mjs</code> — itere no
      model.yml e regenere.
    </p>
  </div>`;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);
