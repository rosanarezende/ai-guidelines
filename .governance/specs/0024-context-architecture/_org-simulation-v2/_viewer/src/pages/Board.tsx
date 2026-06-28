import { useState } from "react";
import { useIntents } from "../store";
import type { AppIntent, AppQuestion, BoardQuestion } from "../types";

// Board = a projeção DERIVADA, AO VIVO do db.json (via o store/API) — sem snapshot no meio, sempre reflete a autoria.
// (O banco node `derive-app.ts` também deriva o db.json → snapshot.json, mas pra uso HEADLESS/export; o app não depende dele.)
function deriveQuestion(intent: AppIntent, q: AppQuestion): BoardQuestion {
  const dec = intent.decisions.find((d) => d.decides === q.id);
  const answered = Boolean(q.verdict); // tem verdict (uma exploração respondeu)
  const decision = dec ? dec.status : answered ? "pending" : "none"; // o gate humano
  return {
    id: q.id,
    question: q.question,
    verdict: q.verdict,
    answered,
    decision,
    resolved: answered && decision === "accepted",
  };
}

export function Board() {
  const { intents } = useIntents();
  return (
    <>
      <header>
        <h1>
          Board <span className="hint">(derivado das Iniciativas — ao vivo do db.json)</span>
        </h1>
      </header>

      {intents.length === 0 && <p className="hint">Nenhuma iniciativa ainda.</p>}
      {intents.map((intent) => {
        const questions = intent.questions.map((q) => deriveQuestion(intent, q));
        const resolved = questions.filter((q) => q.resolved).length;
        return (
          <section key={intent.id}>
            <h2>
              {intent.title}{" "}
              <span className="hint">
                ({resolved}/{questions.length} resolvidas)
              </span>
            </h2>
            {questions.map((q) => (
              <QuestionRow key={q.id} q={q} />
            ))}
            {questions.length === 0 && <p className="hint">(sem perguntas)</p>}
          </section>
        );
      })}
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
