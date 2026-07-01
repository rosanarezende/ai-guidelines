import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useIntents } from "../store";
import type { AppProposal, Level, PromoteTo } from "../types";

type UpdateProposal = (id: string, fn: (p: AppProposal) => AppProposal) => Promise<void>;

const NUM: Record<Level, number> = { low: 1, medium: 2, high: 3 };
const ice = (p: AppProposal) => (NUM[p.impact] * NUM[p.confidence]) / NUM[p.effort];

export function Proposals() {
  const { proposals } = useIntents();
  const [status, setStatus] = useState("open");
  const [owner, setOwner] = useState("");
  const [tag, setTag] = useState("");

  const owners = useMemo(() => [...new Set(proposals.map((p) => p.owner))], [proposals]);
  const tags = useMemo(() => [...new Set(proposals.flatMap((p) => p.tags))], [proposals]);

  const list = proposals
    .filter((p) => (status === "all" ? true : p.status === status))
    .filter((p) => (owner ? p.owner === owner : true))
    .filter((p) => (tag ? p.tags.includes(tag) : true))
    .sort((a, b) => ice(b) - ice(a)); // prioridade (ICE) desc

  return (
    <>
      <header>
        <h1>
          Propostas <span className="hint">(backlog de intake)</span>
        </h1>
        <p className="lead">
          Ideias/problemas capturados durante o trabalho. Ordenadas por{" "}
          <strong>prioridade (ICE)</strong>. Trie: <strong>promova</strong> (vira trabalho) ou{" "}
          <strong>descarte</strong>.
        </p>
        <Link className="btn primary" to="/propostas/nova">
          + Levantar proposta
        </Link>
      </header>

      <div className="filters">
        <label>
          status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">todas</option>
            <option value="open">open</option>
            <option value="promoted">promoted</option>
            <option value="dismissed">dismissed</option>
          </select>
        </label>
        <label>
          time
          <select value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="">todos</option>
            {owners.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label>
          tag
          <select value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="">todas</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <span className="hint">
          {list.length} de {proposals.length}
        </span>
      </div>

      {list.map((p) => (
        <ProposalCard key={p.id} p={p} />
      ))}
      {list.length === 0 && <p className="hint">(nenhuma com esses filtros)</p>}
    </>
  );
}

function ProposalCard({ p }: { p: AppProposal }) {
  const { updateProposal } = useIntents();
  const sev = p.status === "promoted" ? "ok" : p.status === "dismissed" ? "muted" : "warn";
  return (
    <div className="card">
      <div className="card-head">
        <strong>{p.id}</strong>
        <span className={`badge ${sev}`}>{p.status}</span>
        <span className="badge info">ICE {ice(p).toFixed(1)}</span>
        <span className="badge muted">{p.owner}</span>
      </div>
      <div className="meta">{p.what}</div>
      <div className="meta">
        impacto {p.impact} · confiança {p.confidence} · esforço {p.effort}
        {p.raisedFrom && (
          <>
            {" "}
            · de <code>{p.raisedFrom}</code>
          </>
        )}
      </div>
      {p.tags.length > 0 && (
        <div className="chips">
          {p.tags.map((t) => (
            <span key={t} className="badge muted">
              {t}
            </span>
          ))}
        </div>
      )}
      {p.status === "open" && <Triage p={p} updateProposal={updateProposal} />}
      {p.status === "promoted" && (
        <div className="meta">
          → promovida p/ <strong>{p.promoteTo}</strong>
          {p.opensIntent ? ` (${p.opensIntent})` : ""}
        </div>
      )}
      {p.status === "dismissed" && p.discardReason && (
        <div className="meta">→ descartada: {p.discardReason}</div>
      )}
    </div>
  );
}

function Triage({ p, updateProposal }: { p: AppProposal; updateProposal: UpdateProposal }) {
  const [promoteTo, setPromoteTo] = useState<PromoteTo>("experiment");
  const [reason, setReason] = useState("");
  const promote = () => updateProposal(p.id, (x) => ({ ...x, status: "promoted", promoteTo }));
  const dismiss = () =>
    updateProposal(p.id, (x) => ({
      ...x,
      status: "dismissed",
      discardReason: reason.trim() || undefined,
    }));
  return (
    <div className="triage">
      <div className="form inline">
        <select value={promoteTo} onChange={(e) => setPromoteTo(e.target.value as PromoteTo)}>
          {(["delivery", "experiment", "exploration", "patch", "fix"] as PromoteTo[]).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button className="btn ok" onClick={promote}>
          Promover
        </button>
      </div>
      <div className="form inline">
        <input
          placeholder="motivo do descarte…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <button className="btn warn" onClick={dismiss}>
          Descartar
        </button>
      </div>
    </div>
  );
}
