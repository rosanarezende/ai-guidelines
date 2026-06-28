import { useState } from "react";
import { Link } from "react-router-dom";
import { useIntents } from "../store";
import type { AppIntent, AppQuestion, AppWork, AppExploration } from "../types";
import { workPhase, criticalPath, questionView, contractKnown, blockedReasons } from "../derive";
import type { WorkPhase } from "../derive";

// Board = PAINEL das iniciativas, derivado AO VIVO do db.json (via o store). Conta a história pra um humano.
export function Board() {
  const { intents, works, explorations } = useIntents();
  return (
    <>
      <header>
        <h1>
          Board <span className="hint">(painel das iniciativas — ao vivo do db.json)</span>
        </h1>
      </header>
      {intents.length === 0 && <p className="hint">Nenhuma iniciativa ainda.</p>}
      {intents.map((intent) => (
        <IntentPanel
          key={intent.id}
          intent={intent}
          works={works.filter((w) => w.intent === intent.id)}
          explorations={explorations.filter((e) => e.answers.startsWith(`${intent.id}#`))}
        />
      ))}
    </>
  );
}

function IntentPanel({
  intent,
  works,
  explorations,
}: {
  intent: AppIntent;
  works: AppWork[];
  explorations: AppExploration[];
}) {
  const qResolved = intent.questions.filter((q) => questionView(intent, q.id).resolved).length;
  const contracts = intent.contracts ?? [];
  const known = contracts.filter((c) => contractKnown(intent, c)).length;
  const phases: Record<WorkPhase, AppWork[]> = { ready: [], active: [], blocked: [], done: [] };
  for (const w of works) phases[workPhase(intent, w, works)].push(w);
  const cp = criticalPath(works);

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>
            <Link to={`/intent/${intent.id}`} className="panel-title">
              {intent.title}
            </Link>
          </h2>
          <div className="meta">{intent.objective}</div>
        </div>
        <span className="badge ok">{intent.status ?? "active"}</span>
      </div>
      <div className="metarow">
        <span>👤 dona: {intent.owner ?? "—"}</span>
        <span>
          🗓️ criada {intent.createdAt}
          {intent.updatedAt ? ` · atualizada ${intent.updatedAt}` : ""}
        </span>
        {intent.references.length > 0 && <span>🔗 {intent.references.length} referência(s)</span>}
        <Link to={`/intent/${intent.id}`} className="open-link">
          abrir detalhes →
        </Link>
      </div>

      <div className="metrics">
        <Metric label="perguntas resolvidas" value={`${qResolved} / ${intent.questions.length}`} />
        <Metric label="contratos known" value={`${known} / ${contracts.length}`} />
        <Metric
          label="trabalhos"
          value={String(works.length)}
          sub={`${phases.ready.length} ready · ${phases.active.length} active · ${phases.blocked.length} blocked · ${phases.done.length} done`}
        />
      </div>

      {contracts.length > 0 && (
        <>
          <h3>
            Contratos{" "}
            <span className="hint">
              (o que a feature coordena — known/pending derivado das decisões)
            </span>
          </h3>
          <div className="chips">
            {contracts.map((c) => {
              const k = contractKnown(intent, c);
              return (
                <span key={c.name} className={`badge ${k ? "ok" : "warn"}`}>
                  {c.name}: {k ? "known" : "pending"}
                  {c.awaits ? ` (${c.awaits})` : ""}
                </span>
              );
            })}
          </div>
        </>
      )}

      <h3>
        Perguntas <span className="hint">(respondida ≠ resolvida)</span>
      </h3>
      {intent.questions.map((q) => (
        <QuestionRow key={q.id} intent={intent} q={q} />
      ))}

      {explorations.length > 0 && (
        <>
          <h3>
            Investigação{" "}
            <span className="hint">(as explorations que responderam — ferramenta, Lente 4)</span>
          </h3>
          {explorations.map((e) => (
            <div className="workline" key={e.id}>
              <span className={`badge ${e.status === "done" ? "ok" : "info"}`}>{e.status}</span>
              <strong>{e.id}</strong>
              <span className="hint">
                {e.repo} · responde {e.answers.split("#")[1]}
                {e.fate ? ` · ${e.fate}` : ""}
              </span>
              <span className="who">{e.assignee ? <>👤 {e.assignee}</> : "sem dono"}</span>
            </div>
          ))}
        </>
      )}

      <h3>Trabalhos — quem está em quê</h3>
      {works.length === 0 && <p className="hint">(sem trabalhos — faça o breakdown no detalhe)</p>}
      {works.map((w) => (
        <WorkLine key={w.id} intent={intent} work={w} works={works} />
      ))}

      {works.length > 0 && (
        <div className="next">
          {cp.refs.length > 1 && (
            <>
              ⏱️ caminho crítico (peso {cp.weight}): <strong>{cp.refs.join(" → ")}</strong>.{" "}
            </>
          )}
          ⚡ pode rodar agora:{" "}
          <strong>
            {phases.ready.length
              ? phases.ready.map((w) => w.id).join(", ")
              : "(nada destravado — alguém precisa pegar / destravar)"}
          </strong>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

function WorkLine({ intent, work, works }: { intent: AppIntent; work: AppWork; works: AppWork[] }) {
  const phase = workPhase(intent, work, works);
  const reasons = blockedReasons(intent, work, works);
  const badge =
    phase === "done" ? "ok" : phase === "active" ? "info" : phase === "ready" ? "ok" : "warn";
  return (
    <div className="workline">
      <span className={`badge ${badge}`}>{phase}</span>
      <Link to={`/work/${work.id}`}>
        <strong>{work.id}</strong>
      </Link>
      <span className="hint">
        {work.repo} · peso {work.weight}
      </span>
      {work.coordinatesWith.map((c) => (
        <span key={c} className="tag" title="contrato que este trabalho coordena">
          🔗 {c}
        </span>
      ))}
      <span className="who">
        {phase === "blocked" ? (
          <>⟵ espera {reasons.join(" · ")}</>
        ) : work.assignee ? (
          <>👤 {work.assignee}</>
        ) : (
          "sem dono — alguém pode pegar"
        )}
      </span>
    </div>
  );
}

function QuestionRow({ intent, q }: { intent: AppIntent; q: AppQuestion }) {
  const [open, setOpen] = useState(false);
  const v = questionView(intent, q.id);
  const [kind, label] = v.resolved
    ? (["ok", "RESOLVED"] as const)
    : v.reopened
      ? (["warn", "REABERTA"] as const)
      : v.answered
        ? (["warn", `respondida · ${v.decision}`] as const)
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
