import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type Register } from "../api.ts";

const today = (): string => new Date().toISOString().slice(0, 10);

// Detalhe da CANDIDATA (pós-registro): o negócio vê/edita; um botão INICIA a triagem (pode ser outra pessoa).
export function RegisterDetail() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const [reg, setReg] = useState<Register | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setReg(null);
    api
      .register(id)
      .then(setReg)
      .catch((e: unknown) => setError(String(e instanceof Error ? e.message : e)));
  }, [id]);

  async function startTriage(): Promise<void> {
    if (!reg) return;
    setBusy(true);
    try {
      // iniciar triagem = marca a candidata como em triagem (se ainda registrada) e abre a tela do eng
      if (reg.status === "registrada")
        await api.updateRegister(reg.id, { ...reg, status: "triagem", updatedAt: today() });
      nav(`/triagem/${reg.id}`);
    } catch (e: unknown) {
      setError(String(e instanceof Error ? e.message : e));
      setBusy(false);
    }
  }

  if (error) return <p className="error">Erro: {error}</p>;
  if (!reg) return <p className="muted">carregando…</p>;

  const p = reg.problem;
  const bc = reg.businessConnection;

  return (
    <article className="block">
      <p className="crumb">
        <Link to="/">← início</Link>
      </p>
      <div className="detail-head">
        <div>
          <h2>{reg.title}</h2>
          <div className="meta">
            <code>{reg.id}</code>
            {reg.registeredBy ? ` · cadastrou ${reg.registeredBy}` : ""} · dona {reg.owner ?? "—"} ·
            criada {reg.createdAt ?? "—"}
          </div>
        </div>
        <div className="detail-actions">
          <span className={`badge st-${reg.status}`}>{reg.status}</span>
          <Link className="btn" to={`/register/${reg.id}/editar`}>
            editar
          </Link>
          <button className="btn primary" onClick={startTriage} disabled={busy}>
            {busy ? "…" : reg.status === "registrada" ? "iniciar triagem" : "ir p/ triagem"}
          </button>
        </div>
      </div>

      {reg.description && <p className="lead">{reg.description}</p>}

      {(p?.business || p?.customer || bc?.driver || bc?.metric || reg.details) && (
        <>
          <h3>enquadramento</h3>
          {p?.business && (
            <p>
              <b>Problema de negócio:</b> {p.business}
            </p>
          )}
          {p?.customer && (
            <p>
              <b>Problema do cliente:</b> {p.customer}
            </p>
          )}
          {(bc?.driver || bc?.metric) && (
            <p className="meta">
              {bc?.driver ? `driver: ${bc.driver}` : ""}
              {bc?.driver && bc?.metric ? " · " : ""}
              {bc?.metric ? `métrica: ${bc.metric}` : ""}
            </p>
          )}
          {reg.details && <p>{reg.details}</p>}
        </>
      )}

      {reg.stakeholders && reg.stakeholders.length > 0 && (
        <>
          <h3>stakeholders</h3>
          <div className="chips">
            {reg.stakeholders.map((s) => (
              <span className="chip" key={`${s.role}-${s.who}`}>
                {s.role}: {s.who}
              </span>
            ))}
          </div>
        </>
      )}

      {reg.references && reg.references.length > 0 && (
        <>
          <h3>referências</h3>
          <ul className="rows">
            {reg.references.map((r, i) => (
              <li key={i}>
                {r.type && <span className="chip">{r.type}</span>}{" "}
                {r.url ? (
                  <a href={r.url} target="_blank" rel="noreferrer">
                    {r.label}
                  </a>
                ) : (
                  r.label
                )}
                {r.note ? <span className="muted"> — {r.note}</span> : ""}
              </li>
            ))}
          </ul>
        </>
      )}

      <h3>dúvidas (do negócio)</h3>
      {(reg.openQuestions ?? []).length === 0 ? (
        <p className="muted">(nenhuma)</p>
      ) : (
        <ul className="rows">
          {reg.openQuestions?.map((q) => (
            <li key={q.id}>
              <code>{q.id}</code> {q.question}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
