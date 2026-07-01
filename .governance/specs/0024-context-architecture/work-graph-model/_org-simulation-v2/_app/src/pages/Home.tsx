import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Register, type Intent, type Proposal } from "../api.ts";

// Início: a visão geral da org — candidatas em triagem · iniciativas ativas · intake (proposals). Tudo dos arquivos reais.
export function Home() {
  const [registers, setRegisters] = useState<Register[] | null>(null);
  const [intents, setIntents] = useState<Intent[] | null>(null);
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.registers(), api.intents(), api.proposals()])
      .then(([r, i, p]) => {
        setRegisters(r);
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
  if (!registers || !intents || !proposals) return <p className="muted">carregando…</p>;

  return (
    <>
      <section className="block">
        <div className="block-head">
          <h2>
            Candidatas <small>em triagem · viram intent quando ativadas</small>{" "}
            <span className="count">{registers.length}</span>
          </h2>
          <Link className="btn primary" to="/register/novo">
            + iniciativa
          </Link>
        </div>
        <div className="grid">
          {registers.length === 0 && (
            <p className="muted">(nenhuma candidata — cadastre uma iniciativa)</p>
          )}
          {registers.map((r) => (
            <Link className="card card-link" key={r.id} to={`/register/${r.id}`}>
              <div className="card-head">
                <strong>{r.title}</strong>
                <span className={`badge st-${r.status}`}>{r.status}</span>
              </div>
              <div className="meta">
                <code>{r.id}</code> · dona {r.owner ?? "—"}
              </div>
              <div className="chips">
                <span className="chip">{(r.openQuestions ?? []).length} dúvidas</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="block">
        <h2>
          Iniciativas ativas <small>intents · ativadas pelo gate</small>{" "}
          <span className="count">{intents.length}</span>
        </h2>
        <div className="grid">
          {intents.length === 0 && <p className="muted">(nenhuma intent ativada ainda)</p>}
          {intents.map((i) => (
            <Link className="card card-link" key={i.id} to={`/intent/${i.id}`}>
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
            </Link>
          ))}
        </div>
      </section>

      <section className="block">
        <div className="block-head">
          <h2>
            Propostas <small>proposals · o intake (backlog)</small>{" "}
            <span className="count">{proposals.length}</span>
          </h2>
          <Link className="btn" to="/proposal/nova">
            + proposta
          </Link>
        </div>
        <div className="grid">
          {proposals.length === 0 && <p className="muted">(nenhuma proposta ainda)</p>}
          {proposals.map((p) => (
            <Link className="card card-link" key={p.id} to={`/proposal/${p.id}`}>
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
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
