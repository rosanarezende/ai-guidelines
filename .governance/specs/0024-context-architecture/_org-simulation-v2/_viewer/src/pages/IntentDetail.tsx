import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useIntents } from "../store";
import { LABEL, LABEL_PLURAL } from "../labels";
import type { AppIntent, AppWork, WorkKind, Weight } from "../types";
import { contractKnown, workPhase, blockedReasons, questionView } from "../derive";
import { Deliberation } from "../Deliberation";

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
        <Deliberation
          host={intent}
          onChange={(next) => updateIntent(intent.id, (i) => ({ ...i, ...next }))}
          renderExtra={(q) => (
            <div className="hint">
              <Link to={`/propostas/nova?from=${encodeURIComponent(`${intent.id}#${q.id}`)}`}>
                levantar proposta a partir desta pergunta →
              </Link>
            </div>
          )}
        />
      </section>

      <ContractsSection intent={intent} />
      <BreakdownSection intent={intent} />
    </>
  );
}

function ContractsSection({ intent }: { intent: AppIntent }) {
  const contracts = intent.contracts ?? [];
  if (contracts.length === 0) return null;
  return (
    <section>
      <h2>
        Contratos <span className="hint">(known/pending = DERIVADO das decisões)</span>
      </h2>
      <div className="chips">
        {contracts.map((c) => {
          const known = contractKnown(intent, c);
          return (
            <span key={c.name} className={`badge ${known ? "ok" : "warn"}`}>
              {c.name}: {known ? "known" : "pending"}
              {c.awaits ? ` (awaits ${c.awaits})` : ""}
            </span>
          );
        })}
      </div>
    </section>
  );
}

function BreakdownSection({ intent }: { intent: AppIntent }) {
  const { works } = useIntents();
  const mine = works.filter((w) => w.intent === intent.id);
  return (
    <section>
      <h2>
        Quebra em trabalhos{" "}
        <span className="hint">(o breakdown do dono: criar trabalhos com peso + dependências)</span>
      </h2>
      {mine.length === 0 && <p className="hint">Nenhum trabalho ainda — crie abaixo.</p>}
      {mine.map((w) => (
        <WorkRow key={w.id} intent={intent} work={w} works={mine} />
      ))}
      <CreateWork intent={intent} works={mine} />
    </section>
  );
}

function WorkRow({ intent, work, works }: { intent: AppIntent; work: AppWork; works: AppWork[] }) {
  const { updateWork } = useIntents();
  const [who, setWho] = useState("");
  const phase = workPhase(intent, work, works);
  const reasons = blockedReasons(intent, work, works);
  const badge =
    phase === "done" ? "ok" : phase === "active" ? "info" : phase === "ready" ? "ok" : "warn";
  const qs = work.questions ?? [];
  const decs = work.decisions ?? [];
  const open = qs.filter(
    (q) => !questionView({ questions: qs, decisions: decs }, q.id).resolved
  ).length;
  return (
    <div className="card">
      <div className="card-head">
        <Link to={`/work/${work.id}`}>
          <strong>{work.id}</strong>
        </Link>
        <span className={`badge ${badge}`}>{phase}</span>
        <span className="badge muted">peso {work.weight}</span>
        {work.repo && <span className="badge muted">{work.repo}</span>}
        {work.assignee ? (
          <span className="badge info">{work.assignee}</span>
        ) : (
          <span className="badge muted">sem dono</span>
        )}
        {open > 0 && <span className="badge warn">❓ {open} aberta(s)</span>}
      </div>
      <div className="meta">{work.title}</div>
      {work.coordinatesWith.length > 0 && (
        <div className="meta">coordinates-with: {work.coordinatesWith.join(", ")}</div>
      )}
      {phase === "blocked" && <div className="meta">⛔ bloqueado por: {reasons.join(" · ")}</div>}
      {work.status === "active" && (
        <div className="form inline">
          <button
            className="btn"
            onClick={() => updateWork(work.id, (w) => ({ ...w, status: "done" }))}
          >
            marcar done
          </button>
        </div>
      )}
      {work.status === "draft" && phase === "ready" && (
        <form
          className="form inline"
          onSubmit={(e) => {
            e.preventDefault();
            if (!who.trim()) return;
            updateWork(work.id, (w) => ({ ...w, assignee: who.trim(), status: "active" }));
          }}
        >
          <input
            placeholder="quem assume? (@dono)"
            value={who}
            onChange={(e) => setWho(e.target.value)}
          />
          <button type="submit" className="btn primary">
            atribuir + iniciar
          </button>
        </form>
      )}
      <div className="hint">
        <Link to={`/work/${work.id}`}>abrir trabalho (q/r/d) →</Link>
      </div>
    </div>
  );
}

function CreateWork({ intent, works }: { intent: AppIntent; works: AppWork[] }) {
  const { addWork } = useIntents();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<WorkKind>("delivery");
  const [weight, setWeight] = useState<Weight>("M");
  const [blockedBy, setBlockedBy] = useState<string[]>([]);
  const [coord, setCoord] = useState<string[]>([]);
  const contracts = intent.contracts ?? [];
  const id = `${kind === "delivery" ? "deliv" : kind}-${String(works.length + 1).padStart(3, "0")}`;

  const toggle = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await addWork({
      id,
      intent: intent.id,
      kind,
      title: title.trim(),
      weight,
      blockedBy,
      coordinatesWith: coord,
      status: "draft",
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setTitle("");
    setBlockedBy([]);
    setCoord([]);
  }

  return (
    <form className="form" onSubmit={submit}>
      <h3>+ Criar trabalho</h3>
      <label>
        Título
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ex.: componente de formulário validado"
        />
      </label>
      <div className="row">
        <label>
          Tipo
          <select value={kind} onChange={(e) => setKind(e.target.value as WorkKind)}>
            {(["delivery", "fix", "patch", "experiment", "incident"] as WorkKind[]).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <label>
          Peso
          <select value={weight} onChange={(e) => setWeight(e.target.value as Weight)}>
            {(["S", "M", "L", "XL"] as Weight[]).map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>
      </div>
      {works.length > 0 && (
        <fieldset>
          <legend>blocked-by (outros trabalhos)</legend>
          {works.map((w) => (
            <label key={w.id} className="check">
              <input
                type="checkbox"
                checked={blockedBy.includes(w.id)}
                onChange={() => setBlockedBy(toggle(blockedBy, w.id))}
              />{" "}
              {w.id}
            </label>
          ))}
        </fieldset>
      )}
      {contracts.length > 0 && (
        <fieldset>
          <legend>coordinates-with (contratos)</legend>
          {contracts.map((c) => (
            <label key={c.name} className="check">
              <input
                type="checkbox"
                checked={coord.includes(c.name)}
                onChange={() => setCoord(toggle(coord, c.name))}
              />{" "}
              {c.name}
            </label>
          ))}
        </fieldset>
      )}
      <div className="row">
        <button type="submit" className="btn primary">
          Criar como {id}
        </button>
      </div>
    </form>
  );
}
