// company-app.js — o PORTAL da empresa: navegável com drill-down (visão geral → objetivos →
// intents → operacional → perfil & cultura). Tudo DERIVADO de ../graph.js (gerado) — ninguém preenche.
const html = htm.bind(React.createElement);
const { useState } = React;
const G = window.GRAPH;

const nodesBy = (t) => G.nodes.filter((n) => n.type === t);
const node = (id) => G.nodes.find((n) => n.id === id);
const objectives = nodesBy("objective");
const theses = nodesBy("thesis");
const areas = nodesBy("area");
const teams = nodesBy("team");
const targets = nodesBy("target");
const intents = nodesBy("intent");
const standalone = nodesBy("standalone");
const contracts = nodesBy("contract");

const PROFILE_LABEL = { full: "grande (full)", compact: "média (compact)", solo: "solo" };

function intentInfo(it) {
  const ws = it.data.works || [];
  const hard = ws.filter((w) => (w["blocked-by"] || []).length > 0);
  const par = ws.filter(
    (w) => !(w["blocked-by"] || []).length && (w["delivery-after"] || []).length
  );
  const free = ws.filter(
    (w) => !(w["blocked-by"] || []).length && !(w["delivery-after"] || []).length
  );
  const ext = ws.filter((w) => String(w.review || "").startsWith("externo"));
  const changed = it.data["contracts-changed"] || [];
  const gate =
    it.data.approach === "validate-first"
      ? "accept-verdict"
      : changed.length > 0
        ? "release-rollout"
        : "—";
  return { ws, hard, par, free, ext, gate, changed };
}

function Crumb({ label, onClick }) {
  return html`<span className="crumb" onClick=${onClick}>← ${label}</span>`;
}

// ─── visão geral ────────────────────────────────────────────────────────────
function Home({ go }) {
  const totWorks = intents.reduce((s, it) => s + (it.data.works || []).length, 0);
  const totHard = intents.reduce((s, it) => s + intentInfo(it).hard.length, 0);
  const totExt = intents.reduce((s, it) => s + intentInfo(it).ext.length, 0);
  const windows = intents.reduce((s, it) => s + intentInfo(it).changed.length, 0);
  return html`<div>
    <div className="grid">
      ${objectives.map((o) => {
        const tgts = targets.filter((t) => t.data["contributes-to"] === o.id);
        const its = intents.filter((i) => i.data["authorized-by"] === o.id);
        return html`<div
          className="card orange click"
          key=${o.id}
          onClick=${() => go("objetivos", o.id)}
        >
          <h2>${o.label}</h2>
          <div className="kv">${o.data.period} · ${tgts.length} metas · ${its.length} intents</div>
          <div className="kv"><b>actual:</b> aguardando outcomes válidos</div>
        </div>`;
      })}
      <div className="card click" onClick=${() => go("intents", null)}>
        <h2>execução</h2>
        <div className="kv"><span className="big">${intents.length}</span>intents em andamento</div>
        <div className="kv">
          ${totWorks} peças · ${totHard} sem poder começar · ${totExt} reviews externos · ${windows}
          janela(s) a abrir
        </div>
      </div>
      <div className="card click" onClick=${() => go("operacional", null)}>
        <h2>operacional (nada some)</h2>
        <div className="kv">
          <span className="big">${standalone.length}</span>itens reativos/avulsos
        </div>
        <div className="kv">${standalone.map((s) => s.data.kind).join(" · ")}</div>
      </div>
      <div className="card click" onClick=${() => go("perfil", null)}>
        <h2>governança</h2>
        <div className="kv"><b>perfil:</b> ${G.profileDeclaration.profile} (badge declarado)</div>
        <div className="kv">
          issues do validador: ${G.issues.length} · contratos vivos: ${contracts.length}
        </div>
      </div>
    </div>
    <p className="muted" style=${{ marginTop: "10px" }}>
      tudo nesta página é DERIVADO do grafo — clique nos cards p/ navegar; grafo completo no
      <a href="../owner/index.html"> app da owner</a>
    </p>
  </div>`;
}

// ─── objetivos & metas (stakeholders) ───────────────────────────────────────
function Objetivos({ sel, go }) {
  if (!sel)
    return html`<div className="grid">
      ${objectives.map(
        (o) =>
          html`<div
            className="card orange click"
            key=${o.id}
            onClick=${() => go("objetivos", o.id)}
          >
            <h2>${o.label}</h2>
            <div className="kv">${o.data.period} · owner: ${o.data.owner}</div>
          </div>`
      )}
    </div>`;
  const o = node(sel);
  const oTheses = theses.filter((t) => t.data.frames === sel);
  const tgts = targets.filter((t) => t.data["contributes-to"] === sel);
  const its = intents.filter((i) => i.data["authorized-by"] === sel);
  return html`<div>
    <${Crumb} label="todos os objetivos" onClick=${() => go("objetivos", null)} />
    <div className="card orange">
      <h2>${o.label}</h2>
      <div className="kv">${o.data.period} · owner: ${o.data.owner} · status: ${o.data.status}</div>
    </div>
    ${oTheses.map(
      (t) =>
        html`<div className="card" key=${t.id}>
          <h2>tese <span className="pill">hipótese causal</span></h2>
          <div className="kv">"${t.data.says}" · owner: ${t.data.owner}</div>
        </div>`
    )}
    <div className="card">
      <h2>metas (targets) — actual só entra com outcome VÁLIDO</h2>
      ${tgts.map(
        (t) =>
          html`<div className="row" key=${t.id}>
            <b>${t.data.node}</b>: ${t.label} <span className="pill">${t.data.metric}</span><br />
            <span className="muted">
              define: ${t.data.definer} · atesta: ${t.data.attester} (independente) ·
              <b> actual: aguardando</b> — melhor vazio que mentira
            </span>
          </div>`
      )}
    </div>
    <div className="card">
      <h2>intents autorizadas por este objetivo</h2>
      ${its.map(
        (i) =>
          html`<div className="row click" key=${i.id} onClick=${() => go("intents", i.id)}>
            ${i.label} <span className="pill">${i.data.approach}</span>
            <span className="pill">${i.data.team}</span>
          </div>`
      )}
    </div>
  </div>`;
}

// ─── intents (acompanhamento com drill-down) ────────────────────────────────
function depState(w) {
  if ((w["blocked-by"] || []).length)
    return html`<span className="st blocked">⛓ espera ${w["blocked-by"].join(" · ")}</span>`;
  if ((w["delivery-after"] || []).length)
    return html`<span className="st waiting"
      >⇉ entrega espera ${w["delivery-after"].join(" · ")}</span
    >`;
  return html`<span className="st free">livre</span>`;
}

function Intents({ sel, go }) {
  if (!sel)
    return html`<div>
      ${intents.map((i) => {
        const inf = intentInfo(i);
        return html`<div className="row click" key=${i.id} onClick=${() => go("intents", i.id)}>
          <b>${i.label}</b> <span className="pill">${i.data.approach}</span>
          <span className="pill">${i.data.team}</span><br />
          <span className="muted">
            ${inf.ws.length} peças · ${inf.hard.length} bloqueadas · ${inf.par.length} em paralelo ·
            ${inf.ext.length} reviews externos · gate: ${inf.gate}
          </span>
        </div>`;
      })}
    </div>`;
  const it = node(sel);
  const inf = intentInfo(it);
  const obj = node(it.data["authorized-by"]);
  const tgt = node(it.data["primary-target"]);
  const th = it.data.thesis ? node(it.data.thesis) : null;
  return html`<div>
    <${Crumb} label="todas as intents" onClick=${() => go("intents", null)} />
    <div className="card">
      <h2>${it.label} <span className="pill">${it.data.approach}</span></h2>
      <div className="kv"><b>time:</b> ${it.data.team}</div>
      <div className="kv">
        <b>autorizada por:</b>
        <span className="crumb" onClick=${() => go("objetivos", obj.id)}> ${obj.label}</span>
      </div>
      ${th ? html`<div className="kv"><b>tese:</b> "${th.data.says}"</div>` : null}
      ${tgt
        ? html`<div className="kv"><b>meta primária:</b> ${tgt.label} (${tgt.data.metric})</div>`
        : null}
      ${it.data.hypothesis
        ? html`<div className="kv"><b>hipótese:</b> ${it.data.hypothesis}</div>
            <div className="kv"><b>regra de decisão:</b> ${it.data["decision-rule"]}</div>`
        : null}
      ${inf.changed.length
        ? html`<div className="kv">
            <b>muda contrato:</b> ${inf.changed.join(" · ")} — abre janela de compatibilidade
          </div>`
        : null}
      <div className="kv"><b>gate à frente:</b> ${inf.gate}</div>
    </div>
    <div className="card">
      <h2>peças (${inf.ws.length})</h2>
      ${inf.ws.map(
        (w) =>
          html`<div className="row" key=${w.id}>
            <b>${w.id}</b> <span className="pill">${w.purpose}</span>
            <span className="pill">${w.repo}</span> ${depState(w)}
            ${String(w.review || "").startsWith("externo")
              ? html`<span className="st ext">review ${w.review}</span>`
              : null}<br />
            <span className="muted">${w.desc}</span>
          </div>`
      )}
    </div>
    <div className="card">
      <h2>próxima etapa — ramifica</h2>
      ${(it.data.next || []).map(
        (n, k) =>
          html`<div className="row" key=${k}>
            <b>${n.when}</b> → ${n.then}
            ${n.gate ? html`<span className="pill">gate: ${n.gate}</span>` : null}
          </div>`
      )}
    </div>
  </div>`;
}

// ─── operacional ────────────────────────────────────────────────────────────
function Operacional() {
  return html`<div>
    ${standalone.map(
      (s) =>
        html`<div className="card" key=${s.id}>
          <h2>${s.data.kind} <span className="pill">${s.data.repo}</span></h2>
          <div className="kv"><b>origem:</b> ${s.data.origin}</div>
          ${s.data.severity
            ? html`<div className="kv">
                <b>severidade:</b> ${s.data.severity} · MTTR: ${s.data.mttr}
              </div>`
            : null}
          ${s.data["routed-by"]
            ? html`<div className="kv"><b>roteado:</b> ${s.data["routed-by"]}</div>`
            : null}
          ${s.data.review ? html`<div className="kv"><b>review:</b> ${s.data.review}</div>` : null}
          ${(s.data["follow-ups"] || []).length
            ? html`<div className="kv">
                <b>follow-ups:</b>
                <ul>
                  ${s.data["follow-ups"].map((f, k) => html`<li key=${k}>${f}</li>`)}
                </ul>
              </div>`
            : null}
          <div className="kv">
            <b>placar:</b> ${s.data.placar} — visível, fora do rollup dos objetivos
          </div>
        </div>`
    )}
  </div>`;
}

// ─── perfil & cultura ───────────────────────────────────────────────────────
function CultureCard() {
  const rows = areas.map((a) => {
    const teamIds = new Set(teams.filter((t) => t.data.area === a.id).map((t) => t.id));
    const its = intents.filter((i) => teamIds.has(i.data.team));
    const vf = its.filter((i) => i.data.approach === "validate-first").length;
    return { area: a.label, total: its.length, vf };
  });
  return html`<div className="card">
    <h2>growth como cultura — experimentação por área (derivado do grafo)</h2>
    ${rows.map(
      (r) =>
        html`<div className="kv" key=${r.area}>
          <b>${r.area}:</b> ${r.vf} de ${r.total} intents são validate-first
        </div>`
    )}
    <div className="kv muted">
      a abordagem é de QUALQUER time — growth pode ter times dedicados, mas a cultura incentiva
      todos a experimentar (ex.: o 1-clique do time-checkout mira o objetivo de receita)
    </div>
  </div>`;
}

function Perfil() {
  const [p, setP] = useState(G.profileDeclaration.profile || "full");
  const prof = (G.profiles && G.profiles.profiles && G.profiles.profiles[p]) || {};
  return html`<div>
    <div className="tabs">
      ${Object.keys(PROFILE_LABEL).map(
        (k) =>
          html`<button
            key=${k}
            className=${"tab" + (p === k ? " on" : "")}
            onClick=${() => setP(k)}
          >
            ${PROFILE_LABEL[k]}
          </button>`
      )}
    </div>
    <div className="card">
      <h2>perfil ${PROFILE_LABEL[p]} — ${prof.for || ""}</h2>
      <div className="kv"><b>nós que existem:</b> ${prof.nodes}</div>
      <div className="kv">
        <b>gates:</b> ${Array.isArray(prof.gates) ? prof.gates.join(" · ") : prof.gates}
      </div>
      <div className="kv"><b>SoD:</b> ${prof.sod}</div>
      <div className="kv"><b>obrigatório:</b> ${prof["required-fields"]}</div>
      <div className="kv"><b>enforcement:</b> ${prof.enforcement}</div>
      ${p === G.profileDeclaration.profile
        ? html`<div className="kv">
            <b>declarado na acme:</b> ${G.profileDeclaration.badge} · aprovado por
            ${" " + G.profileDeclaration["approved-by"]} · revisão em
            ${" " + G.profileDeclaration["review-at"]}
          </div>`
        : null}
    </div>
    <${CultureCard} />
  </div>`;
}

// ─── shell ──────────────────────────────────────────────────────────────────
const VIEWS = {
  home: { label: "visão geral", C: Home },
  objetivos: { label: "objetivos & metas", C: Objetivos },
  intents: { label: "intents", C: Intents },
  operacional: { label: "operacional", C: Operacional },
  perfil: { label: "perfil & cultura", C: Perfil },
};

function App() {
  const [nav, setNav] = useState({ view: "home", sel: null });
  const go = (view, sel) => setNav({ view, sel: sel === undefined ? null : sel });
  const V = VIEWS[nav.view].C;
  return html`<div className="wrap">
    <h1>acme — portal da empresa</h1>
    <p className="muted">
      tudo derivado do grafo (${G.nodes.length} nós · ${G.edges.length} arestas) · gerado em
      ${" " + G.generatedAt.slice(0, 16)} · ${G.profiles ? G.profiles.law : ""}
    </p>
    <div className="tabs">
      ${Object.entries(VIEWS).map(
        ([k, v]) =>
          html`<button
            key=${k}
            className=${"tab" + (nav.view === k ? " on" : "")}
            onClick=${() => go(k, null)}
          >
            ${v.label}
          </button>`
      )}
    </div>
    <${V} sel=${nav.sel} go=${go} />
  </div>`;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);
