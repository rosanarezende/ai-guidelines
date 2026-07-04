// q/r/d REUSÁVEL — serve qualquer DeliberationHost (intent E work). Prova "intent ≈ work como host".
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { AppDecision, AppQuestion, DeliberationHost } from "./types";
import { questionView, supersededIds } from "./derive";

const today = () => new Date().toISOString().slice(0, 10);

type Next = { questions: AppQuestion[]; decisions: AppDecision[] };
interface RowProps {
  host: DeliberationHost;
  q: AppQuestion;
  onChange: (next: Next) => void;
}

export function Deliberation({
  host,
  onChange,
  renderExtra,
}: {
  host: DeliberationHost;
  onChange: (next: Next) => void;
  renderExtra?: (q: AppQuestion) => ReactNode;
}) {
  return (
    <>
      {host.questions.map((q) => (
        <QuestionRow key={q.id} host={host} q={q} onChange={onChange} renderExtra={renderExtra} />
      ))}
      {host.questions.length === 0 && <p className="hint">Nenhuma pergunta ainda.</p>}
      <AddQuestion host={host} onChange={onChange} />
      <DeliberationLog decisions={host.decisions} />
    </>
  );
}

function QuestionRow({
  host,
  q,
  onChange,
  renderExtra,
}: RowProps & { renderExtra?: (q: AppQuestion) => ReactNode }) {
  const v = questionView(host, q.id);
  const [kind, label] = v.resolved
    ? (["ok", "RESOLVED"] as const)
    : v.reopened
      ? (["warn", "REABERTA (decisão caiu)"] as const)
      : v.decision === "rejected"
        ? (["warn", "rejeitada"] as const)
        : v.answered
          ? (["warn", "respondida · decisão pendente"] as const)
          : (["muted", "aguardando exploração"] as const);
  return (
    <div className="card">
      <div className="card-head">
        <strong>{q.id}</strong>
        <span className={`badge ${kind}`}>{label}</span>
      </div>
      <div className="meta">{q.question}</div>
      {q.verdict && <div className="verdict">resultado da exploração: {q.verdict}</div>}
      {v.inEffect?.rationale && (
        <div className="meta">
          → {v.inEffect.rationale} <span className="hint">({v.inEffect.id})</span>
        </div>
      )}
      {!q.verdict && <RecordVerdict host={host} q={q} onChange={onChange} />}
      {q.verdict && !v.inEffect && <DecideForm host={host} q={q} onChange={onChange} />}
      {v.inEffect && <ReopenForm host={host} q={q} onChange={onChange} supersede={v.inEffect.id} />}
      {renderExtra?.(q)}
    </div>
  );
}

function RecordVerdict({ host, q, onChange }: RowProps) {
  const [verdict, setVerdict] = useState("");
  function record(e: FormEvent) {
    e.preventDefault();
    if (!verdict.trim()) return;
    onChange({
      questions: host.questions.map((x) => (x.id === q.id ? { ...x, verdict: verdict.trim() } : x)),
      decisions: host.decisions,
    });
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

function DecideForm({ host, q, onChange, supersede }: RowProps & { supersede?: string }) {
  const [rationale, setRationale] = useState("");
  function decide(status: "accepted" | "rejected") {
    const dec: AppDecision = {
      id: `d${host.decisions.length + 1}`,
      decides: [q.id],
      status,
      rationale: rationale.trim() || undefined,
      at: today(),
    };
    if (supersede) dec.supersedes = [supersede];
    onChange({ questions: host.questions, decisions: [...host.decisions, dec] });
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

function ReopenForm({ host, q, onChange, supersede }: RowProps & { supersede: string }) {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <div className="form inline">
        <button className="btn" onClick={() => setOpen(true)}>
          reabrir (nova decisão supersedes {supersede})
        </button>
      </div>
    );
  return <DecideForm host={host} q={q} onChange={onChange} supersede={supersede} />;
}

function AddQuestion({
  host,
  onChange,
}: {
  host: DeliberationHost;
  onChange: (next: Next) => void;
}) {
  const [text, setText] = useState("");
  function add(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onChange({
      questions: [
        ...host.questions,
        { id: `q${host.questions.length + 1}`, question: text.trim() },
      ],
      decisions: host.decisions,
    });
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

function DeliberationLog({ decisions }: { decisions: AppDecision[] }) {
  if (decisions.length === 0) return null;
  const dead = supersededIds(decisions);
  return (
    <div className="log">
      <h3>
        Deliberação <span className="hint">(append-only — nada se reescreve)</span>
      </h3>
      {decisions.map((d) => (
        <div key={d.id} className={`logitem${dead.has(d.id) ? " dead" : ""}`}>
          <strong>{d.id}</strong>{" "}
          <span className={`badge ${d.status === "accepted" ? "ok" : "warn"}`}>{d.status}</span>{" "}
          decide <code>{d.decides.join(", ")}</code>
          {d.supersedes && (
            <>
              {" "}
              · supersedes <code>{d.supersedes.join(", ")}</code>
            </>
          )}
          {dead.has(d.id) && <span className="badge muted">superseded</span>}
          {d.rationale && <div className="meta">{d.rationale}</div>}
        </div>
      ))}
    </div>
  );
}
