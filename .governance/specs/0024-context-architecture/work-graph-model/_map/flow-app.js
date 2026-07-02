// flow-app.js — jornada da org-exemplo (proposta P12), navegável em 5 etapas com NÓS CLICÁVEIS.
// Clique num nó (objetivo, área, time, intent, repo, contrato) → painel de conexões com saltos.
// Cores de cadeia: cada objetivo da empresa tem uma cor que acompanha área → time → intent.
// Dados GERADOS de ../model.yml § approach-proposal por generate.mjs. Visão genérica: flow-generic.html.
const html = htm.bind(React.createElement);
const { useState } = React;
const FX = window.MODEL.flowExplorer;
const ORG = FX.exampleOrg;

const SECTIONS = [
  "1 · negócio",
  "2 · terreno",
  "3 · as intents",
  "4 · sem intent",
  "5 · dashboards",
];

const objTitle = (id) => (ORG.objectives.find((o) => o.id === id) || {}).title;
const areaOf = (id) => ORG.areas.find((a) => a.id === id);
const chainOfObjective = (oid) => (oid === ORG.objectives[0].id ? "a" : "b");
const chainOfArea = (a) => chainOfObjective(a["cascades-from"]);
const chainOfTeam = (t) => chainOfArea(areaOf(t.area));
const chainOfIntent = (it) => chainOfObjective(it["authorized-by"]);

function Id({ children }) {
  return html`<span className="tag">${children}</span>`;
}
function Dot({ chain }) {
  return html`<span className=${"dot dot-" + chain}></span>`;
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

function labelOf(sel) {
  if (!sel) return "";
  if (sel.type === "objective") return `objetivo: ${objTitle(sel.id)}`;
  if (sel.type === "area") return `área: ${(areaOf(sel.id) || {}).title}`;
  if (sel.type === "team") return `time: ${sel.id}`;
  if (sel.type === "intent")
    return `intent: ${(ORG.intents.find((x) => x.id === sel.id) || {}).title}`;
  if (sel.type === "repo") return `repo: ${sel.id}`;
  if (sel.type === "contract") return `contrato: ${sel.id}`;
  return sel.id;
}

function connectionsOf(sel) {
  const c = [];
  if (!sel) return c;
  if (sel.type === "objective") {
    ORG.areas
      .filter((a) => a["cascades-from"] === sel.id)
      .forEach((a) =>
        c.push({ label: `cascades-to → ${a.title}`, sec: 0, sel: { type: "area", id: a.id } })
      );
    ORG.intents
      .filter((it) => it["authorized-by"] === sel.id)
      .forEach((it) =>
        c.push({ label: `authorizes → ${it.title}`, sec: 2, sel: { type: "intent", id: it.id } })
      );
    c.push({ label: "ver no dashboard de stakeholders", sec: 4 });
  } else if (sel.type === "area") {
    const a = areaOf(sel.id);
    c.push({
      label: `nasce de → ${objTitle(a["cascades-from"])}`,
      sec: 0,
      sel: { type: "objective", id: a["cascades-from"] },
    });
    ORG.teams
      .filter((t) => t.area === sel.id)
      .forEach((t) => c.push({ label: `time → ${t.id}`, sec: 0, sel: { type: "team", id: t.id } }));
    ORG.repos
      .filter((r) => r.owner === sel.id)
      .forEach((r) =>
        c.push({ label: `repo compartilhado → ${r.id}`, sec: 1, sel: { type: "repo", id: r.id } })
      );
  } else if (sel.type === "team") {
    const t = ORG.teams.find((x) => x.id === sel.id);
    c.push({
      label: `área → ${areaOf(t.area).title}`,
      sec: 0,
      sel: { type: "area", id: t.area },
    });
    ORG.intents
      .filter((it) => it.team === sel.id)
      .forEach((it) =>
        c.push({ label: `intent → ${it.title}`, sec: 2, sel: { type: "intent", id: it.id } })
      );
    ORG.repos
      .filter((r) => r.owner === sel.id)
      .forEach((r) => c.push({ label: `repo → ${r.id}`, sec: 1, sel: { type: "repo", id: r.id } }));
  } else if (sel.type === "intent") {
    const it = ORG.intents.find((x) => x.id === sel.id);
    c.push({
      label: `autorizada por → ${objTitle(it["authorized-by"])}`,
      sec: 0,
      sel: { type: "objective", id: it["authorized-by"] },
    });
    c.push({ label: `time → ${it.team}`, sec: 0, sel: { type: "team", id: it.team } });
    [...new Set((it.works || []).map((w) => w.repo))].forEach((rid) =>
      c.push({ label: `peça em → ${rid}`, sec: 1, sel: { type: "repo", id: rid } })
    );
    (it["contracts-changed"] || []).forEach((cid) =>
      c.push({ label: `MUDA o contrato → ${cid}`, sec: 1, sel: { type: "contract", id: cid } })
    );
    (it["contracts-consumed"] || []).forEach((cid) =>
      c.push({ label: `consome → ${cid}`, sec: 1, sel: { type: "contract", id: cid } })
    );
    c.push({ label: "ver nos dashboards", sec: 4 });
  } else if (sel.type === "repo") {
    const r = ORG.repos.find((x) => x.id === sel.id);
    const t = r.owner.startsWith("area-") ? "area" : "team";
    c.push({ label: `dono → ${r.owner}`, sec: 0, sel: { type: t, id: r.owner } });
    ORG.contracts
      .filter((k) => k.owner === sel.id)
      .forEach((k) =>
        c.push({
          label: `publica o contrato → ${k.id}`,
          sec: 1,
          sel: { type: "contract", id: k.id },
        })
      );
    ORG.intents
      .filter((it) => (it.works || []).some((w) => w.repo === sel.id))
      .forEach((it) =>
        c.push({
          label: `recebe peça de → ${it.title}`,
          sec: 2,
          sel: { type: "intent", id: it.id },
        })
      );
  } else if (sel.type === "contract") {
    const k = ORG.contracts.find((x) => x.id === sel.id);
    if (k) c.push({ label: `owner → ${k.owner}`, sec: 1, sel: { type: "repo", id: k.owner } });
    ORG.intents.forEach((it) => {
      if ((it["contracts-changed"] || []).includes(sel.id))
        c.push({ label: `MUDADA por → ${it.title}`, sec: 2, sel: { type: "intent", id: it.id } });
      if ((it["contracts-consumed"] || []).includes(sel.id))
        c.push({
          label: `consumida por → ${it.title}`,
          sec: 2,
          sel: { type: "intent", id: it.id },
        });
    });
  }
  return c;
}

function ConnectionsBar({ ctx }) {
  if (!ctx.sel) {
    return html`<p className="src">
      clique num nó (objetivo · área · time · intent · repo · contrato) p/ ver as conexões dele
    </p>`;
  }
  const conns = connectionsOf(ctx.sel);
  return html`<div className="intent dashed" style=${{ marginBottom: "10px" }}>
    <div className="hd">
      <span className="lvl">nó selecionado</span> ${labelOf(ctx.sel)}
      <${Id}>${ctx.sel.type}<//>
    </div>
    <div className="tabs" style=${{ margin: "8px 0 0" }}>
      ${conns.map(
        (cn, i) =>
          html`<button key=${i} className="tab" onClick=${() => ctx.go(cn)}>${cn.label}</button>`
      )}
      <button className="tab" onClick=${() => ctx.clear()}>× limpar</button>
    </div>
  </div>`;
}

function BusinessSection({ ctx }) {
  return html`<div>
    <p className="cap">
      a camada de negócio — cada objetivo tem uma COR; a cor acompanha a cadeia (área → time →
      intent)
    </p>
    ${ORG.objectives.map((o, i) => {
      const ch = chainOfObjective(o.id);
      return html`<div
        key=${i}
        className=${"intent org-company clickable chain-" +
        ch +
        (ctx.isSel("objective", o.id) ? " sel-node" : "")}
        style=${{ marginBottom: "8px" }}
        onClick=${() => ctx.pick("objective", o.id)}
      >
        <div className="hd">
          <${Dot} chain=${ch} /><span className="lvl">empresa</span> ${o.title} — ${o.period}
          <${Id}>business-objective<//>
        </div>
      </div>`;
    })}
    <div className="down">↓ cada área traduz p/ um driver seu <${Id}>cascades-to<//></div>
    ${ORG.areas.map((a, i) => {
      const ch = chainOfArea(a);
      return html`<div
        key=${i}
        className=${"intent chain-" + ch + (ctx.isSel("area", a.id) ? " sel-node" : "")}
        style=${{ marginBottom: "8px" }}
      >
        <div className="hd clickable" onClick=${() => ctx.pick("area", a.id)}>
          <${Dot} chain=${ch} /><span className="lvl">área</span> ${a.title}
          <${Id}>business-objective · area<//>
        </div>
        <p className="sub">driver: ${a.driver} · nasce de: "${objTitle(a["cascades-from"])}"</p>
        <div className="works">
          ${ORG.teams
            .filter((t) => t.area === a.id)
            .map(
              (t, j) =>
                html`<div
                  className=${"w clickable" + (ctx.isSel("team", t.id) ? " sel-node" : "")}
                  key=${j}
                  onClick=${() => ctx.pick("team", t.id)}
                >
                  <span className="r"><${Dot} chain=${ch} />${t.id}</span>
                  <div className="d">${t.priority}</div>
                </div>`
            )}
        </div>
      </div>`;
    })}
    <p className="note">
      → na etapa 3, os objetivos AUTORIZAM as intents e entregam o placar <${Id}>authorizes<//>
      <${Id}>primary-target<//>
    </p>
  </div>`;
}

function TerrainSection({ ctx }) {
  return html`<div>
    <p className="cap">o terreno: repos, capabilities e contratos vivos da ${ORG.company}</p>
    <div className="intent dashed">
      <div className="hd">
        <span className="lvl">repos</span> quem é dono do quê <${Id}>repo<//> <${Id}>capability<//>
      </div>
      <div className="works">
        ${ORG.repos.map(
          (r, i) =>
            html`<div
              className=${"w clickable" + (ctx.isSel("repo", r.id) ? " sel-node" : "")}
              key=${i}
              onClick=${() => ctx.pick("repo", r.id)}
            >
              <span className="r">${r.id}</span>
              <div className="d">
                ${r.owner}${r.note ? " (" + r.note + ")" : ""} · caps: ${r.caps}
              </div>
            </div>`
        )}
      </div>
      <p className="note">${ORG["matcher-note"]} <${Id}>matcher<//></p>
    </div>
    <div className="intent dashed">
      <div className="hd">
        <span className="lvl">contratos</span> a janela de compatibilidade mora aqui
        <${Id}>contract<//>
      </div>
      <div className="works">
        ${ORG.contracts.map(
          (c, i) =>
            html`<div
              className=${"w clickable" + (ctx.isSel("contract", c.id) ? " sel-node" : "")}
              key=${i}
              onClick=${() => ctx.pick("contract", c.id)}
            >
              <span className="r">${c.id}</span>
              <div className="d">
                owner: ${c.owner} · consumers: ${c.consumers}${c.note ? " · " + c.note : ""}
              </div>
            </div>`
        )}
      </div>
      <p className="note">${ORG["contracts-note"]}</p>
    </div>
  </div>`;
}

function IntentCard({ it, ctx }) {
  const ch = chainOfIntent(it);
  return html`<div className=${"unit chain-" + ch}>
    <div className="hd clickable" onClick=${() => ctx.pick("intent", it.id)}>
      <${Dot} chain=${ch} /><span className="lvl">intent</span> ${it.title}
      <${Id}>approach: ${it.approach}<//>
    </div>
    <p className="sub">
      ${it.team} · autorizada por: "${objTitle(it["authorized-by"])}" · sinal detectado:
      <${Id}>${it.signal}<//>
    </p>
    <p className="note">deriva: ${it.derived}</p>
    ${it.works
      ? html`<p className="note"><b>↓ desdobramento interno — as peças por repo</b></p>
          <div className="works">
            ${it.works.map(
              (w, j) =>
                html`<div className="w" key=${j}>
                  <span className="r">${w.id ? w.id : w.repo}</span>
                  <span className=${"pp " + w.purpose}>${w.purpose}</span>
                  <div className="d">
                    <span
                      className="clickable"
                      style=${{ textDecoration: "underline" }}
                      onClick=${() => ctx.go({ sec: 1, sel: { type: "repo", id: w.repo } })}
                      >${w.repo}</span
                    >
                    — ${w.desc}
                  </div>
                  <div className="d">
                    ${w["blocked-by"]
                      ? html`⛓ NÃO começa antes de: <b>${w["blocked-by"].join(" · ")}</b> · `
                      : null}
                    ${w["delivery-after"]
                      ? html`⇉ paraleliza, mas a ENTREGA espera:
                          <b>${w["delivery-after"].join(" · ")}</b> · `
                      : null}
                    ${!w["blocked-by"] && !w["delivery-after"] ? "livre p/ começar · " : null}
                    review:
                    ${w.review && w.review.startsWith("EXTERNO")
                      ? html` <b>${w.review}</b>`
                      : " " + w.review}
                  </div>
                </div>`
            )}
          </div>`
      : null}
    ${it.next
      ? html`<p className="note"><b>↓ próxima etapa — ramifica</b></p>
          <div className="works">
            ${it.next.map(
              (n, j) =>
                html`<div className="w" key=${j}>
                  <span className="r">${n.when}</span>
                  <div className="d">
                    ${n.then} ${n.gate ? html` <span className="tag">gate: ${n.gate}</span>` : null}
                  </div>
                </div>`
            )}
          </div>`
      : null}
  </div>`;
}

function IntentsSection({ ctx }) {
  const selIdx =
    ctx.sel && ctx.sel.type === "intent" ? ORG.intents.findIndex((x) => x.id === ctx.sel.id) : -1;
  const [loc, setLoc] = useState(0);
  const i = selIdx >= 0 ? selIdx : loc;
  const onPick = (idx) => {
    setLoc(idx);
    ctx.pick("intent", ORG.intents[idx].id);
  };
  return html`<div>
    <p className="cap">as 3 intents da org-exemplo (uma aba por vez; a cor liga ao objetivo)</p>
    <div className="intent dashed">
      <div className="hd">
        <span className="lvl">regras</span> bloqueios e reviews no desdobramento
        <${Id}>blocked-by<//> <${Id}>delivery-after<//> <${Id}>review<//>
      </div>
      <p className="note" style=${{ borderTop: "none", paddingTop: "2px" }}>${FX.depsRule}</p>
      <p className="note">${FX.reviewRule}</p>
    </div>
    <${Tabs}
      items=${ORG.intents.map((it) => `${it.title} · ${it.approach}`)}
      active=${i}
      onPick=${onPick}
    />
    <${IntentCard} it=${ORG.intents[i]} ctx=${ctx} />
  </div>`;
}

function StandaloneSection() {
  return html`<div>
    <p className="cap">sem intent: reativo e avulso — bug · incidente · manutenção</p>
    ${ORG.standalone.map(
      (s, i) =>
        html`<div className="intent dashed" key=${i} style=${{ marginBottom: "8px" }}>
          <div className="hd"><span className="lvl">${s.id}</span> ${s.origin}</div>
          <p className="sub">${s.path}</p>
          <p className="sub">review: ${s.review}</p>
          <p className="note">placar: ${s.placar}</p>
        </div>`
    )}
  </div>`;
}

function DashboardsSection() {
  return html`<div>
    <p className="cap">o fim da cadeia: dashboards DERIVADOS do grafo (ninguém preenche à mão)</p>
    <div className="intent">
      <div className="hd">
        <span className="lvl">acompanhamento</span> execução, por intent <${Id}>blocked<//>
        <${Id}>delivery-after<//> <${Id}>review<//> <${Id}>gates<//>
      </div>
      <ul className="gaplist">
        ${ORG.dashboards.execution.map((d, i) => html`<li key=${i}>${d}</li>`)}
      </ul>
    </div>
    <div className="intent org-company" style=${{ marginTop: "10px" }}>
      <div className="hd">
        <span className="lvl">stakeholders</span> negócio, por objetivo
        <${Id}>outcome válido → target.actual<//>
      </div>
      <ul className="gaplist">
        ${ORG.dashboards.stakeholders.map((d, i) => html`<li key=${i}>${d}</li>`)}
      </ul>
    </div>
  </div>`;
}

function PrevNext({ sec, setSec }) {
  return html`<div className="tabs" style=${{ marginTop: "16px" }}>
    ${sec > 0
      ? html`<button className="tab" onClick=${() => setSec(sec - 1)}>
          ← ${SECTIONS[sec - 1]}
        </button>`
      : null}
    ${sec < SECTIONS.length - 1
      ? html`<button className="tab" onClick=${() => setSec(sec + 1)}>
          ${SECTIONS[sec + 1]} →
        </button>`
      : null}
  </div>`;
}

function App() {
  const [sec, setSec] = useState(0);
  const [sel, setSel] = useState(null);
  const ctx = {
    sel,
    isSel: (type, id) => !!sel && sel.type === type && sel.id === id,
    pick: (type, id) => setSel(sel && sel.type === type && sel.id === id ? null : { type, id }),
    go: (cn) => {
      if (cn.sel) setSel(cn.sel);
      if (cn.sec !== undefined) setSec(cn.sec);
    },
    clear: () => setSel(null),
  };
  const Body = [
    BusinessSection,
    TerrainSection,
    IntentsSection,
    StandaloneSection,
    DashboardsSection,
  ][sec];
  return html`<div className="wrap">
    <h1>Jornada da org-exemplo — do negócio aos dashboards</h1>
    <p className="lead">
      Proposta ${FX.provocation} (status: ${FX.status}). Clique nos NÓS p/ ver e saltar pelas
      conexões; as cores ligam cada objetivo à sua cadeia. Visão genérica:
      <a href="flow-generic.html"> flow-generic.html</a>.
    </p>
    <${Tabs} items=${SECTIONS} active=${sec} onPick=${setSec} />
    <${ConnectionsBar} ctx=${ctx} />
    <${Body} ctx=${ctx} />
    <${PrevNext} sec=${sec} setSec=${setSec} />
    <p className="src">
      <a href="model-map.html">← mapa do modelo</a> ·
      <a href="flow-generic.html"> explorador genérico</a> · <code>data.js</code> é GERADO de
      <code> ../model.yml § approach-proposal</code> por <code>generate.mjs</code>.
    </p>
  </div>`;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);
