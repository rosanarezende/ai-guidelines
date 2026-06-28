import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useIntents } from "../store";
import { LABEL } from "../labels";
import type { AppIntent } from "../types";

export function RegisterIntent() {
  const { intents, addIntent } = useIntents();
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [details, setDetails] = useState("");
  const [questions, setQuestions] = useState("");

  const nextId = `intent-${String(intents.length + 1).padStart(4, "0")}`;

  function submit(e: FormEvent) {
    e.preventDefault();
    const qs = questions
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((q, idx) => ({ id: `q${idx + 1}`, question: q }));
    const intent: AppIntent = {
      id: nextId,
      title: title.trim(),
      objective: objective.trim(),
      details: details.trim() || undefined,
      references: [],
      questions: qs,
      decisions: [],
      createdAt: new Date().toISOString().slice(0, 10),
    };
    addIntent(intent);
    nav(`/intent/${intent.id}`);
  }

  return (
    <>
      <header>
        <h1>Cadastrar {LABEL.toLowerCase()}</h1>
        <p className="lead">
          Um <strong>{LABEL.toLowerCase()}</strong> é o que você quer alcançar. As{" "}
          <strong>perguntas em aberto</strong> viram explorações; quando respondidas, você{" "}
          <strong>decide</strong> — e isso libera as entregas.
        </p>
      </header>

      <form onSubmit={submit} className="form">
        <label>
          Título <span className="hint">(o objetivo, em uma frase)</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="ex.: Novo fluxo de login"
          />
        </label>
        <label>
          Objetivo <span className="hint">(o resultado durável que se quer no mundo)</span>
          <input value={objective} onChange={(e) => setObjective(e.target.value)} required />
        </label>
        <label>
          Detalhes <span className="hint">(opcional)</span>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} />
        </label>
        <label>
          Perguntas em aberto <span className="hint">(uma por linha — opcional)</span>
          <textarea
            value={questions}
            onChange={(e) => setQuestions(e.target.value)}
            rows={3}
            placeholder="ex.: o design system tem um formulário validado?"
          />
        </label>
        <div className="row">
          <button type="submit" className="btn primary">
            Cadastrar como {nextId}
          </button>
        </div>
      </form>
    </>
  );
}
