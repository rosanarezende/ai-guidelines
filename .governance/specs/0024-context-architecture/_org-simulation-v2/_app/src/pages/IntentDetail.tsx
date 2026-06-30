import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Intent } from "../api.ts";
import type { RoutingSuggestion } from "../../../_lib/domain/routing.ts";

const today = (): string => new Date().toISOString().slice(0, 10);

// Detalhe de uma INICIATIVA: enquadramento + pessoas + explore-points + as CONEXÕES SUGERIDAS pelo matcher (D5).
export function IntentDetail() {
  const { id = "" } = useParams();
  const [intent, setIntent] = useState<Intent | null>(null);
  const [routing, setRouting] = useState<RoutingSuggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function load(): void {
    setError(null);
    setIntent(null);
    Promise.all([api.intent(id), api.graph()])
      .then(([i, g]) => {
        setIntent(i);
        setRouting(g.routing.find((r) => r.intent === id)?.suggestions ?? []);
      })
      .catch((e: unknown) => setError(String(e instanceof Error ? e.message : e)));
  }
  useEffect(load, [id]);

  async function activate(): Promise<void> {
    if (!intent) return;
    setBusy(true);
    try {
      const next = { ...intent, status: "active" as const, updatedAt: today() };
      await api.updateIntent(intent.id, next);
      setIntent(next);
    } catch (e: unknown) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p className="error">Erro: {error}</p>;
  if (!intent || !routing) return <p className="muted">carregando…</p>;

  const p = intent.problem;
  const bc = intent.businessConnection;

  return (
    <article className="block">
      <p className="crumb">
        <Link to="/">← início</Link>
      </p>
      <div className="detail-head">
        <div>
          <h2>{intent.title}</h2>
          <div className="meta">
            <code>{intent.id}</code>
            {intent.registeredBy ? ` · cadastrou ${intent.registeredBy}` : ""} · dona{" "}
            {intent.owner ?? "—"} · criada {intent.createdAt ?? "—"}
            {intent.updatedAt ? ` · atualizada ${intent.updatedAt}` : ""}
          </div>
        </div>
        <div className="detail-actions">
          <span className={`badge st-${intent.status ?? "draft"}`}>{intent.status ?? "draft"}</span>
          {intent.status === "draft" && (
            <button className="btn primary" onClick={activate} disabled={busy}>
              {busy ? "…" : "ativar"}
            </button>
          )}
          <Link className="btn" to={`/intent/${intent.id}/editar`}>
            editar
          </Link>
        </div>
      </div>

      {(p?.business || p?.customer || bc?.driver || bc?.metric || intent.details) && (
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
          {intent.details && <p>{intent.details}</p>}
        </>
      )}

      {intent.stakeholders && intent.stakeholders.length > 0 && (
        <>
          <h3>stakeholders</h3>
          <div className="chips">
            {intent.stakeholders.map((s) => (
              <span className="chip" key={`${s.role}-${s.who}`}>
                {s.role}: {s.who}
              </span>
            ))}
          </div>
        </>
      )}

      {intent.references && intent.references.length > 0 && (
        <>
          <h3>referências</h3>
          <ul className="rows">
            {intent.references.map((r, i) => (
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

      <h3>
        explore-points <small>o que investigar (abre explorations)</small>
      </h3>
      {intent.explores.length === 0 ? (
        <p className="muted">(nenhum)</p>
      ) : (
        <ul className="rows">
          {intent.explores.map((e) => (
            <li key={e.id}>
              <code>{e.id}</code> <b>{e.title}</b>
              {e.details ? <div className="muted">{e.details}</div> : null}
            </li>
          ))}
        </ul>
      )}

      <h3>
        conexões sugeridas <small>matcher (advisory) — onde investigar / quem entrega</small>
      </h3>
      {intent.contracts.length > 0 && (
        <div className="chips" style={{ marginBottom: ".5rem" }}>
          {intent.contracts.map((c) => (
            <span className="chip" key={c.name}>
              📄 {c.name}
              {c.awaits ? ` · aguarda ${c.awaits}` : ""}
            </span>
          ))}
        </div>
      )}
      <div className="grid">
        {routing.map((s) => {
          const hits = s.ranked.filter((m) => m.score > 0);
          return (
            <div className="card" key={s.need}>
              <div className="card-head">
                <strong>
                  {s.kind === "contract" ? s.need.replace("contrato: ", "📄 ") : s.need}
                </strong>
              </div>
              <ul className="rows">
                {hits.length === 0 && <li className="muted">(sem sugestão)</li>}
                {hits.map((m) => (
                  <li key={m.repo}>
                    <strong>{m.repo}</strong> <span className="chip">{m.score}</span>{" "}
                    <span className="muted">{m.why}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </article>
  );
}
