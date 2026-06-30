import { useEffect, useState } from "react";
import { api, type Intent, type Proposal } from "../api.ts";

// Início: a visão geral da org — as iniciativas (intents) + o intake (proposals), lidas dos arquivos .governance/ reais.
export function Home() {
  const [intents, setIntents] = useState<Intent[] | null>(null);
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.intents(), api.proposals()])
      .then(([i, p]) => {
        setIntents(i);
        setProposals(p);
      })
      .catch((e: unknown) => setError(String(e instanceof Error ? e.message : e)));
  }, []);

  if (error)
    return (
      <p className="error">
        Sem conexão com o backend ({error}). Rode <code>npm run dev</code> em <code>_app/</code>.
      </p>
    );
  if (!intents || !proposals) return <p className="muted">carregando…</p>;

  return (
    <>
      <section className="block">
        <h2>
          Iniciativas <small>intents · o objetivo durável</small>{" "}
          <span className="count">{intents.length}</span>
        </h2>
        <div className="grid">
          {intents.length === 0 && <p className="muted">(nenhuma intent ainda)</p>}
          {intents.map((i) => (
            <article className="card" key={i.id}>
              <div className="card-head">
                <strong>{i.title}</strong>
                <span className={`badge st-${i.status ?? "active"}`}>{i.status ?? "active"}</span>
              </div>
              <div className="meta">
                <code>{i.id}</code> · dona {i.owner ?? "—"}
              </div>
              <div className="chips">
                <span className="chip">{i.explores.length} explore-points</span>
                <span className="chip">{i.contracts.length} contratos</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="block">
        <h2>
          Propostas <small>proposals · o intake (backlog)</small>{" "}
          <span className="count">{proposals.length}</span>
        </h2>
        <div className="grid">
          {proposals.length === 0 && <p className="muted">(nenhuma proposta ainda)</p>}
          {proposals.map((p) => (
            <article className="card" key={p.id}>
              <div className="card-head">
                <strong>{p.what}</strong>
                <span className={`badge st-${p.status}`}>{p.status}</span>
              </div>
              <div className="meta">
                <code>{p.id}</code> · tria {p.owner}
              </div>
              <div className="chips">
                <span className="chip">I {p.impact}</span>
                <span className="chip">C {p.confidence}</span>
                <span className="chip">E {p.effort}</span>
                {p.promoteTo && <span className="chip">→ {p.promoteTo}</span>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
