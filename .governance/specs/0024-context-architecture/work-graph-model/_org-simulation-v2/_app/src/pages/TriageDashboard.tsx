import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Register } from "../api.ts";

// Dashboard de TRIAGEM (engenharia): a fila de candidatas (registers) aguardando/em triagem/investigação.
export function TriageDashboard() {
  const [registers, setRegisters] = useState<Register[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .registers()
      .then(setRegisters)
      .catch((e: unknown) => setError(String(e instanceof Error ? e.message : e)));
  }, []);

  if (error) return <p className="error">Erro: {error}</p>;
  if (!registers) return <p className="muted">carregando…</p>;

  return (
    <section className="block">
      <h2>
        Triagem <small>candidatas a intent · engenharia avalia e decide o gate</small>{" "}
        <span className="count">{registers.length}</span>
      </h2>
      <div className="grid">
        {registers.length === 0 && (
          <p className="muted">
            (nenhuma candidata) — cadastre uma em <Link to="/register/novo">+ iniciativa</Link>.
          </p>
        )}
        {registers.map((r) => (
          <Link className="card card-link" key={r.id} to={`/triagem/${r.id}`}>
            <div className="card-head">
              <strong>{r.title}</strong>
              <span className={`badge st-${r.status}`}>{r.status}</span>
            </div>
            <div className="meta">
              <code>{r.id}</code> · dona {r.owner ?? "—"}
            </div>
            <div className="chips">
              <span className="chip">{(r.openQuestions ?? []).length} dúvidas</span>
              {r.problem?.business && <span className="chip">tem problema de negócio</span>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
