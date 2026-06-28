import { useEffect, useState } from "react";
import type { Snapshot, QuestionResolution, WorkProjection, BreaksInto } from "./types";

export function App() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onlyOpen, setOnlyOpen] = useState(false);

  function load() {
    setError(null);
    fetch(`${import.meta.env.BASE_URL}snapshot.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: Snapshot) => setSnap(data))
      .catch((e: unknown) => setError(String(e)));
  }
  useEffect(load, []);

  if (error)
    return (
      <div className="wrap">
        <p className="err">
          Sem snapshot ({error}). Rode <code>node _banks/run.ts</code> e recarregue.
        </p>
      </div>
    );
  if (!snap)
    return (
      <div className="wrap">
        <p>Carregando…</p>
      </div>
    );

  const g = snap.governance;
  const questions = onlyOpen ? g.questions.filter((q) => !q.resolved) : g.questions;

  return (
    <div className="wrap">
      <header>
        <h1>{g.title}</h1>
        <div className="sub">
          intent <code>{g.intent}</code> · projeção DERIVADA do banco
        </div>
        <div className="toolbar">
          <label>
            <input
              type="checkbox"
              checked={onlyOpen}
              onChange={(e) => setOnlyOpen(e.target.checked)}
            />{" "}
            só não-resolvidas
          </label>
          <button onClick={load}>↻ recarregar snapshot</button>
        </div>
      </header>

      <section>
        <h2>
          Perguntas <span className="hint">(respondida ≠ resolvida — o gate humano)</span>
        </h2>
        {questions.map((q) => (
          <QuestionCard key={q.id} q={q} />
        ))}
        {questions.length === 0 && <p className="hint">(nenhuma com esse filtro)</p>}
      </section>

      <section>
        <h2>Contratos</h2>
        <div className="chips">
          {g.contracts.map((c) => (
            <span key={c.name} className={`badge ${c.known ? "ok" : "warn"}`}>
              {c.name}: {c.known ? "known" : "pending"}
              {c.awaits ? ` (awaits ${c.awaits})` : ""}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2>
          Plano <span className="hint">(breaks-into — derivado dos works)</span>
        </h2>
        <div className="cols">
          {(["done", "active", "draft"] as (keyof BreaksInto)[]).map((s) => (
            <div key={s} className="col">
              <div className="col-head">{s}</div>
              {g.breaksInto[s].length > 0 ? (
                g.breaksInto[s].map((r) => (
                  <div key={r} className="item">
                    {r}
                  </div>
                ))
              ) : (
                <div className="item muted">—</div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>
          Bancos de repo <span className="hint">(cada um deriva só os arquivos dele)</span>
        </h2>
        {snap.repos.map((repo) => (
          <div key={repo.repo}>
            <h3>{repo.repo}</h3>
            {repo.explorations.map((w) => (
              <WorkCard key={w.ref} w={w} />
            ))}
          </div>
        ))}
      </section>
    </div>
  );
}

function QuestionCard({ q }: { q: QuestionResolution }) {
  const [open, setOpen] = useState(false);
  const [kind, label] = q.resolved
    ? (["ok", "RESOLVED"] as const)
    : q.answered
      ? (["warn", `respondida · decisão ${q.decision}`] as const)
      : (["muted", "open"] as const);
  return (
    <div className="card click" onClick={() => setOpen((o) => !o)}>
      <div className="card-head">
        <strong>{q.id}</strong>
        <span className={`badge ${kind}`}>{label}</span>
        {q.answeredBy && <span className="meta">← {q.answeredBy}</span>}
      </div>
      {open && q.verdict && <div className="verdict">{q.verdict}</div>}
      {!open && q.verdict && <div className="hint">(clique p/ ver o verdict)</div>}
    </div>
  );
}

function WorkCard({ w }: { w: WorkProjection }) {
  return (
    <div className="card">
      <div className="card-head">
        <strong>{w.ref}</strong>
        <span className={`badge ${w.status === "done" ? "ok" : "muted"}`}>{w.status}</span>
        {w.fate && <span className="badge info">fate {w.fate}</span>}
      </div>
      {w.verdict && <div className="verdict">{w.verdict}</div>}
      {w.promotedOutput && (
        <div className="meta">
          promovido → <code>{w.promotedOutput}</code>
        </div>
      )}
    </div>
  );
}
