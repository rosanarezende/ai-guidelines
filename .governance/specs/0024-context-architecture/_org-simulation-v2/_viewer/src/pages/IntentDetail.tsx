import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useIntents } from "../store";
import { LABEL, LABEL_PLURAL } from "../labels";
import type { AppIntent, AppQuestion } from "../types";

type UpdateIntent = (id: string, fn: (i: AppIntent) => AppIntent) => void;

export function IntentDetail() {
  const { id } = useParams();
  const { intents, updateIntent } = useIntents();
  const intent = intents.find((i) => i.id === id);

  if (!intent)
    return (
      <p className="err">
        {LABEL} não encontrado. <Link to="/">voltar</Link>
      </p>
    );

  return (
    <>
      <header>
        <Link to="/" className="hint">
          ← {LABEL_PLURAL}
        </Link>
        <h1>{intent.title}</h1>
        <div className="sub">
          {intent.id} · {intent.objective}
        </div>
        {intent.details && <p className="lead">{intent.details}</p>}
      </header>

      <section>
        <h2>
          Perguntas{" "}
          <span className="hint">(decidir é restrito ao resultado de uma exploração)</span>
        </h2>
        {intent.questions.map((q) => (
          <QuestionRow key={q.id} intent={intent} q={q} updateIntent={updateIntent} />
        ))}
        {intent.questions.length === 0 && <p className="hint">Nenhuma pergunta ainda.</p>}
        <AddQuestion intent={intent} updateIntent={updateIntent} />
      </section>
    </>
  );
}

function QuestionRow({
  intent,
  q,
  updateIntent,
}: {
  intent: AppIntent;
  q: AppQuestion;
  updateIntent: UpdateIntent;
}) {
  const decision = intent.decisions.find((d) => d.decides === q.id);
  return (
    <div className="card">
      <div className="card-head">
        <strong>{q.id}</strong>
        {decision ? (
          <span className={`badge ${decision.status === "accepted" ? "ok" : "warn"}`}>
            decisão: {decision.status}
          </span>
        ) : q.verdict ? (
          <span className="badge warn">aguardando decisão</span>
        ) : (
          <span className="badge muted">aguardando exploração</span>
        )}
      </div>
      <div className="meta">{q.question}</div>
      {q.verdict && <div className="verdict">resultado da exploração: {q.verdict}</div>}
      {decision?.rationale && <div className="meta">→ {decision.rationale}</div>}
      {q.verdict && !decision && <DecideForm intent={intent} q={q} updateIntent={updateIntent} />}
      {!q.verdict && <RecordVerdict intent={intent} q={q} updateIntent={updateIntent} />}
    </div>
  );
}

function DecideForm({
  intent,
  q,
  updateIntent,
}: {
  intent: AppIntent;
  q: AppQuestion;
  updateIntent: UpdateIntent;
}) {
  const [rationale, setRationale] = useState("");
  function decide(status: "accepted" | "rejected") {
    updateIntent(intent.id, (i) => ({
      ...i,
      decisions: [
        ...i.decisions,
        {
          id: `d${i.decisions.length + 1}`,
          decides: q.id,
          status,
          rationale: rationale.trim() || undefined,
          at: new Date().toISOString().slice(0, 10),
        },
      ],
    }));
  }
  return (
    <div className="form inline">
      <input
        placeholder="por quê? (rationale, opcional)"
        value={rationale}
        onChange={(e) => setRationale(e.target.value)}
      />
      <button className="btn ok" onClick={() => decide("accepted")}>
        Aceitar
      </button>
      <button className="btn warn" onClick={() => decide("rejected")}>
        Rejeitar
      </button>
    </div>
  );
}

function RecordVerdict({
  intent,
  q,
  updateIntent,
}: {
  intent: AppIntent;
  q: AppQuestion;
  updateIntent: UpdateIntent;
}) {
  const [verdict, setVerdict] = useState("");
  function record(e: FormEvent) {
    e.preventDefault();
    if (!verdict.trim()) return;
    updateIntent(intent.id, (i) => ({
      ...i,
      questions: i.questions.map((x) => (x.id === q.id ? { ...x, verdict: verdict.trim() } : x)),
    }));
  }
  return (
    <form className="form inline" onSubmit={record}>
      <input
        placeholder="registrar resultado da exploração (verdict)…"
        value={verdict}
        onChange={(e) => setVerdict(e.target.value)}
      />
      <button type="submit" className="btn">
        Registrar resultado
      </button>
    </form>
  );
}

function AddQuestion({ intent, updateIntent }: { intent: AppIntent; updateIntent: UpdateIntent }) {
  const [text, setText] = useState("");
  function add(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    updateIntent(intent.id, (i) => ({
      ...i,
      questions: [...i.questions, { id: `q${i.questions.length + 1}`, question: text.trim() }],
    }));
    setText("");
  }
  return (
    <form className="form inline" onSubmit={add}>
      <input
        placeholder="nova pergunta em aberto…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="submit" className="btn primary">
        + Pergunta
      </button>
    </form>
  );
}
