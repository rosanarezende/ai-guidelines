import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Proposal } from "../api.ts";

// Detalhe de uma PROPOSTA (intake): a triagem (ICE) + proveniência + disposição.
export function ProposalDetail() {
  const { id = "" } = useParams();
  const [p, setP] = useState<Proposal | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setP(null);
    api
      .proposal(id)
      .then(setP)
      .catch((e: unknown) => setError(String(e instanceof Error ? e.message : e)));
  }, [id]);

  if (error) return <p className="error">Erro: {error}</p>;
  if (!p) return <p className="muted">carregando…</p>;

  return (
    <article className="block">
      <p className="crumb">
        <Link to="/">← início</Link>
      </p>
      <div className="detail-head">
        <div>
          <h2>{p.what}</h2>
          <div className="meta">
            <code>{p.id}</code> · tria {p.owner} · criada {p.createdAt || "—"}
            {p.updatedAt ? ` · atualizada ${p.updatedAt}` : ""}
          </div>
        </div>
        <div className="detail-actions">
          <span className={`badge st-${p.status}`}>{p.status}</span>
          <Link className="btn" to={`/proposal/${p.id}/editar`}>
            editar
          </Link>
        </div>
      </div>

      <h3>triagem (ICE)</h3>
      <div className="chips">
        <span className="chip">impacto {p.impact}</span>
        <span className="chip">confiança {p.confidence}</span>
        <span className="chip">esforço {p.effort}</span>
        {p.promoteTo && <span className="chip">→ promove a {p.promoteTo}</span>}
      </div>

      {p.tags.length > 0 && (
        <>
          <h3>tags</h3>
          <div className="chips">
            {p.tags.map((t) => (
              <span className="chip" key={t}>
                {t}
              </span>
            ))}
          </div>
        </>
      )}

      <h3>proveniência & disposição</h3>
      <ul className="rows">
        <li>
          <span className="muted">levantada de:</span>{" "}
          {p.raisedFrom ? <code>{p.raisedFrom}</code> : "—"}
        </li>
        {p.opensIntent && (
          <li>
            <span className="muted">abre a intent:</span> <code>{p.opensIntent}</code>
          </li>
        )}
        {p.discardReason && (
          <li>
            <span className="muted">motivo do descarte:</span> {p.discardReason}
          </li>
        )}
        {p.evidence && p.evidence.length > 0 && (
          <li>
            <span className="muted">evidência:</span>{" "}
            {p.evidence.map((e) => (
              <code key={e}>{e}</code>
            ))}
          </li>
        )}
      </ul>
    </article>
  );
}
