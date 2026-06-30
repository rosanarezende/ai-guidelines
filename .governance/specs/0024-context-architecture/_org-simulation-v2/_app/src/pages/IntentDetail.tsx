import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Intent } from "../api.ts";
import type { RoutingSuggestion } from "../../../_lib/domain/routing.ts";

// Detalhe de uma INICIATIVA: os campos do domínio (a intent NÃO delibera) + o roteamento advisory derivado.
export function IntentDetail() {
  const { id = "" } = useParams();
  const [intent, setIntent] = useState<Intent | null>(null);
  const [routing, setRouting] = useState<RoutingSuggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setIntent(null);
    Promise.all([api.intent(id), api.graph()])
      .then(([i, g]) => {
        setIntent(i);
        setRouting(g.routing.find((r) => r.intent === id)?.suggestions ?? []);
      })
      .catch((e: unknown) => setError(String(e instanceof Error ? e.message : e)));
  }, [id]);

  if (error) return <p className="error">Erro: {error}</p>;
  if (!intent || !routing) return <p className="muted">carregando…</p>;

  return (
    <article className="block">
      <p className="crumb">
        <Link to="/">← início</Link>
      </p>
      <div className="detail-head">
        <div>
          <h2>{intent.title}</h2>
          <div className="meta">
            <code>{intent.id}</code> · dona {intent.owner ?? "—"} · criada {intent.createdAt ?? "—"}
            {intent.updatedAt ? ` · atualizada ${intent.updatedAt}` : ""}
          </div>
        </div>
        <div className="detail-actions">
          <span className={`badge st-${intent.status ?? "active"}`}>
            {intent.status ?? "active"}
          </span>
          <Link className="btn" to={`/intent/${intent.id}/editar`}>
            editar
          </Link>
        </div>
      </div>

      <h3>
        explore-points <small>o que investigar (a intent não delibera — só aponta)</small>
      </h3>
      {intent.explores.length === 0 ? (
        <p className="muted">(nenhum)</p>
      ) : (
        <ul className="rows">
          {intent.explores.map((e) => (
            <li key={e.id}>
              <code>{e.id}</code> {e.subject}
            </li>
          ))}
        </ul>
      )}

      <h3>contratos</h3>
      {intent.contracts.length === 0 ? (
        <p className="muted">(nenhum)</p>
      ) : (
        <div className="chips">
          {intent.contracts.map((c) => (
            <span className="chip" key={c.name}>
              {c.name}
              {c.awaits ? ` · aguarda ${c.awaits}` : ""}
            </span>
          ))}
        </div>
      )}

      <h3>
        roteamento <small>advisory — onde investigar / quem entrega</small>
      </h3>
      <div className="grid">
        {routing.map((s) => (
          <div className="card" key={s.need}>
            <div className="card-head">
              <strong>
                {s.kind === "contract" ? s.need.replace("contrato: ", "📄 ") : s.need}
              </strong>
            </div>
            <ul className="rows">
              {s.ranked
                .filter((m) => m.score > 0)
                .map((m) => (
                  <li key={m.repo}>
                    <strong>{m.repo}</strong> <span className="chip">{m.score}</span>{" "}
                    <span className="muted">{m.why}</span>
                  </li>
                ))}
              {s.ranked.filter((m) => m.score > 0).length === 0 && (
                <li className="muted">(sem sugestão)</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </article>
  );
}
