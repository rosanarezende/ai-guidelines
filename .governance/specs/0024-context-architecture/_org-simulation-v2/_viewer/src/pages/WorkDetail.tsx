import { Link, useParams } from "react-router-dom";
import { useIntents } from "../store";
import { Deliberation } from "../Deliberation";

// Tela de um TRABALHO — o q/r/d acontece AQUI durante a execução (Lente 2: todo work delibera).
export function WorkDetail() {
  const { id } = useParams();
  const { works, updateWork } = useIntents();
  const work = works.find((w) => w.id === id);

  if (!work)
    return (
      <p className="err">
        Trabalho não encontrado. <Link to="/board">board</Link>
      </p>
    );

  const host = { questions: work.questions ?? [], decisions: work.decisions ?? [] };

  return (
    <>
      <header>
        <Link to={`/intent/${work.intent}`} className="hint">
          ← iniciativa
        </Link>
        <h1>{work.title}</h1>
        <div className="sub">
          {work.id} · {work.kind} · peso {work.weight}
          {work.repo ? ` · ${work.repo}` : ""}
        </div>
      </header>

      <section>
        <h2>
          Deliberação do trabalho{" "}
          <span className="hint">(q/r/d no nível do work — mesmo componente da iniciativa)</span>
        </h2>
        <Deliberation
          host={host}
          onChange={(next) => updateWork(work.id, (w) => ({ ...w, ...next }))}
        />
      </section>
    </>
  );
}
