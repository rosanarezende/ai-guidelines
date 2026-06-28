import { Link } from "react-router-dom";
import { useIntents } from "../store";
import { LABEL, LABEL_PLURAL } from "../labels";

export function Home() {
  const { intents } = useIntents();
  return (
    <>
      <header>
        <h1>{LABEL_PLURAL}</h1>
        <p className="lead">
          Cadastre um <strong>{LABEL.toLowerCase()}</strong> (o que você quer alcançar). Depois você
          pode adicionar <strong>perguntas em aberto</strong> — que viram explorações — e{" "}
          <strong>tomar decisões</strong> sobre os resultados delas.
        </p>
        <Link className="btn primary" to="/novo">
          + Cadastrar {LABEL.toLowerCase()}
        </Link>
      </header>

      <section>
        {intents.length === 0 && <p className="hint">Nenhum {LABEL.toLowerCase()} ainda.</p>}
        {intents.map((i) => {
          const decided = i.decisions.length;
          const pend = i.questions.filter(
            (q) => q.verdict && !i.decisions.some((d) => d.decides === q.id)
          ).length;
          return (
            <Link key={i.id} to={`/intent/${i.id}`} className="card click block">
              <div className="card-head">
                <strong>{i.title}</strong>
                <span className="badge muted">{i.id}</span>
                {pend > 0 && <span className="badge warn">{pend} aguardando decisão</span>}
              </div>
              <div className="meta">{i.objective}</div>
              <div className="meta">
                {i.questions.length} pergunta(s) · {decided} decisão(ões)
              </div>
            </Link>
          );
        })}
      </section>
    </>
  );
}
