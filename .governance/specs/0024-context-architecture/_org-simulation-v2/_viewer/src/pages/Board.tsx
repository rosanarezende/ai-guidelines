import { useEffect, useState } from "react";
import type { Snapshot, BoardQuestion } from "../types";

// Board = a projeção DERIVADA pelo banco a partir do db.json (autoria → banco → board).
export function Board() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setError(null);
    // cache-bust p/ pegar o snapshot recém-derivado pelo watcher
    fetch(`${import.meta.env.BASE_URL}snapshot.json?t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: Snapshot) => setSnap(d))
      .catch((e: unknown) => setError(String(e)));
  }
  useEffect(load, []);

  if (error)
    return (
      <p className="err">
        Sem snapshot ({error}). O banco gera em <code>npm run dev:all</code> (ou{" "}
        <code>npm run bank</code>).
      </p>
    );
  if (!snap) return <p>Carregando…</p>;

  return (
    <>
      <header>
        <h1>
          Board <span className="hint">(DERIVADO pelo banco a partir do db.json)</span>
        </h1>
        <div className="toolbar">
          <button onClick={load}>↻ recarregar</button>
          <span className="hint">cadastrou/decidiu? o watcher re-deriva — clique aqui</span>
        </div>
      </header>

      {snap.intents.length === 0 && <p className="hint">Nenhuma iniciativa ainda.</p>}
      {snap.intents.map((i) => (
        <section key={i.id}>
          <h2>
            {i.title}{" "}
            <span className="hint">
              ({i.resolved}/{i.total} resolvidas)
            </span>
          </h2>
          {i.questions.map((q) => (
            <QuestionRow key={q.id} q={q} />
          ))}
          {i.questions.length === 0 && <p className="hint">(sem perguntas)</p>}
        </section>
      ))}
    </>
  );
}

function QuestionRow({ q }: { q: BoardQuestion }) {
  const [open, setOpen] = useState(false);
  const [kind, label] = q.resolved
    ? (["ok", "RESOLVED"] as const)
    : q.answered
      ? (["warn", `respondida · decisão ${q.decision}`] as const)
      : (["muted", "aguardando exploração"] as const);
  return (
    <div className="card click" onClick={() => setOpen((o) => !o)}>
      <div className="card-head">
        <strong>{q.id}</strong>
        <span className={`badge ${kind}`}>{label}</span>
      </div>
      <div className="meta">{q.question}</div>
      {open && q.verdict && <div className="verdict">{q.verdict}</div>}
      {!open && q.verdict && <div className="hint">(clique p/ ver o verdict)</div>}
    </div>
  );
}
