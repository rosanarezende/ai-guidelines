// company-app.js — a MESMA org vista pelos perfis de governança (grande=full · média=compact · solo)
// + os 2 dashboards DERIVADOS do grafo. Dados: ../graph.js (gerado). Perfis: snapshot do model.yml.
const html = htm.bind(React.createElement);
const { useState } = React;
const G = window.GRAPH;

const nodesBy = (t) => G.nodes.filter((n) => n.type === t);
const intents = nodesBy("intent");
const objectives = nodesBy("objective");
const targets = nodesBy("target");
const standalone = nodesBy("standalone");
const works = nodesBy("work");
const contracts = nodesBy("contract");

const PROFILE_LABEL = { full: "grande (full)", compact: "média (compact)", solo: "solo" };

function execRow(it) {
  const ws = works.filter((w) => w.data.intent === it.id);
  const hard = ws.filter((w) => (w.data["blocked-by"] || []).length > 0).length;
  const par = ws.filter((w) => (w.data["delivery-after"] || []).length > 0).length;
  const ext = ws.filter((w) => String(w.data.review || "").startsWith("externo"));
  const changed = G.edges.filter((e) => e.type === "changes" && e.source === it.id);
  const gate =
    it.data.approach === "validate-first"
      ? "accept-verdict"
      : changed.length > 0
        ? "release-rollout"
        : "—";
  return {
    id: it.id,
    title: it.label,
    approach: it.data.approach,
    pieces: ws.length,
    hard,
    par,
    ext: ext.map((w) => w.data.review),
    window: changed.length > 0 ? `abre com a próxima revisão de ${changed[0].target}` : null,
    gate,
  };
}

function ExecutionDash() {
  return html`<div className="card">
    <h2>dashboard de acompanhamento — execução, por intent (derivado do grafo)</h2>
    ${intents.map((it) => {
      const r = execRow(it);
      return html`<div className="kv" key=${r.id} style=${{ marginBottom: "8px" }}>
        <b>${r.title}</b> <span className="pill">${r.approach}</span><br />
        ${r.pieces} peças · ${r.hard} sem poder começar (⛓) · ${r.par} em paralelo aguardando
        entrega (⇉) · reviews externos: ${r.ext.length > 0 ? r.ext.join(" · ") : "nenhum"} · gate à
        frente: ${r.gate}${r.window ? html`<br />janela de compatibilidade: ${r.window}` : null}
      </div>`;
    })}
    <div className="kv"><b>issues do validador:</b> ${G.issues.length} (ver app da owner)</div>
  </div>`;
}

function StakeholdersDash() {
  return html`<div className="card orange">
    <h2>dashboard de stakeholders — negócio, por objetivo (só outcome VÁLIDO soma)</h2>
    ${objectives.map((o) => {
      const tgts = targets.filter((t) => t.data["contributes-to"] === o.id);
      return html`<div className="kv" key=${o.id} style=${{ marginBottom: "8px" }}>
        <b>${o.label}</b> (${o.data.period})
        <ul>
          ${tgts.map(
            (t) =>
              html`<li key=${t.id}>
                ${t.data.node}: ${t.label} — <b>actual: aguardando outcome válido</b> (melhor vazio
                que mentira) · attester: ${t.data.attester}
              </li>`
          )}
        </ul>
      </div>`;
    })}
    <div className="kv">
      <b>bucket operacional (nada some):</b>
      <ul>
        ${standalone.map(
          (s) =>
            html`<li key=${s.id}>
              ${s.label} — ${s.data.origin}${s.data.mttr ? ` · MTTR ${s.data.mttr}` : ""}
            </li>`
        )}
      </ul>
    </div>
    <div className="kv">
      <b>higiene:</b> perfil declarado com badge · 0 números self-attested · janela(s) de contrato:
      ${contracts.filter((c) => c.data["compatibility-window"]).length} aberta(s)
    </div>
  </div>`;
}

function ProfileCard({ pkey }) {
  const p = (G.profiles && G.profiles.profiles && G.profiles.profiles[pkey]) || {};
  return html`<div className="card">
    <h2>perfil ${PROFILE_LABEL[pkey]} — ${p.for || ""}</h2>
    <div className="kv"><b>nós que existem:</b> ${p.nodes}</div>
    <div className="kv">
      <b>gates:</b> ${Array.isArray(p.gates) ? p.gates.join(" · ") : p.gates}
    </div>
    <div className="kv"><b>SoD:</b> ${p.sod}</div>
    <div className="kv"><b>obrigatório:</b> ${p["required-fields"]}</div>
    <div className="kv"><b>enforcement:</b> ${p.enforcement}</div>
    ${pkey === "full"
      ? html`<div className="kv">
          <b>na acme:</b> tudo abaixo vale — é o perfil DECLARADO (${G.profileDeclaration.badge};
          aprovado por ${G.profileDeclaration["approved-by"]}, revisão em
          ${G.profileDeclaration["review-at"]})
        </div>`
      : pkey === "compact"
        ? html`<div className="kv">
            <b>como a acme ficaria:</b> objetivos em 1–2 níveis; as 3 intents continuam; units
            colapsam mais; gates só activate-intent + accept-verdict (o resto colapsa LOGADO);
            reviews externos viram revisão cruzada declarada
          </div>`
        : html`<div className="kv">
            <b>como a acme ficaria:</b> sem cerimônia — repos + peças + standalone com self-log
            append-only; dashboard marca self-attested; ninguém é bloqueado
          </div>`}
  </div>`;
}

function App() {
  const [p, setP] = useState("full");
  return html`<div className="wrap">
    <h1>acme — visão da empresa, por perfil de governança</h1>
    <p className="muted">
      A MESMA org, três tamanhos: o perfil decide que nós/gates existem (scaling-law executável).
      Grafo completo no <a href="../owner/index.html">app da owner</a>.
      ${G.profiles ? G.profiles.law : ""}
    </p>
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
    <${ProfileCard} pkey=${p} />
    <${ExecutionDash} />
    <${StakeholdersDash} />
  </div>`;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);
