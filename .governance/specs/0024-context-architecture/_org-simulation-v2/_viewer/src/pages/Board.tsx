import { useState } from "react";
import { useIntents } from "../store";
import type { AppIntent, AppQuestion, AppWork, BoardQuestion } from "../types";
import { workPhase, criticalPath, questionView } from "../derive";
import type { WorkPhase } from "../derive";

// Board = a projeção DERIVADA, AO VIVO do db.json (via o store/API). Sem snapshot no meio.
function deriveQuestion(intent: AppIntent, q: AppQuestion): BoardQuestion {
  const v = questionView(intent, q.id);
  return {
    id: q.id,
    question: q.question,
    verdict: q.verdict,
    answered: v.answered,
    decision: v.decision,
    resolved: v.resolved,
  };
}

export function Board() {
  const { intents, works } = useIntents();
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
        const mine = works.filter((w) => w.intent === intent.id);
        return (
          <section key={intent.id}>
            <h2>{intent.title}</h2>

            <h3>
              Perguntas{" "}
              <span className="hint">
                ({resolved}/{questions.length} resolvidas — respondida ≠ resolvida)
              </span>
            </h3>
            {questions.map((q) => (
              <QuestionRow key={q.id} q={q} />
            ))}

            <Plan intent={intent} works={mine} />
          </section>
        );
      })}
    </>
  );
}

function Plan({ intent, works }: { intent: AppIntent; works: AppWork[] }) {
  if (works.length === 0)
    return (
      <>
        <h3>Plano</h3>
        <p className="hint">(sem trabalhos — faça o breakdown no detalhe da iniciativa)</p>
      </>
    );

  const phases: Record<WorkPhase, AppWork[]> = { ready: [], active: [], blocked: [], done: [] };
  for (const w of works) phases[workPhase(intent, w, works)].push(w);
  const cp = criticalPath(works);
  const parallel = phases.ready.map((w) => w.id); // os "ready" podem começar AGORA, em paralelo

  return (
    <>
      <h3>
        Plano{" "}
        <span className="hint">(breaks-into derivado · caminho crítico · o que paraleliza)</span>
      </h3>
      <div className="cols four">
        {(["ready", "active", "blocked", "done"] as WorkPhase[]).map((ph) => (
          <div className="col" key={ph}>
            <div className="col-head">
              {ph} ({phases[ph].length})
            </div>
            {phases[ph].length === 0 ? (
              <div className="item muted">—</div>
            ) : (
              phases[ph].map((w) => (
                <div className="item" key={w.id}>
                  {w.id} <span className="hint">[{w.weight}]</span>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
      <p className="meta">
        ⏱️ caminho crítico (peso {cp.weight}): <strong>{cp.refs.join(" → ") || "—"}</strong>
      </p>
      <p className="meta">
        ⚡ pode rodar AGORA em paralelo:{" "}
        <strong>{parallel.length ? parallel.join(", ") : "(nada destravado)"}</strong>
      </p>
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
