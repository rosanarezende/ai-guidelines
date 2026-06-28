import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useIntents } from "../store";
import type { AppProposal, Level } from "../types";

const LEVELS: Level[] = ["low", "medium", "high"];

export function RegisterProposal() {
  const { proposals, addProposal } = useIntents();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const raisedFrom = params.get("from") ?? undefined; // proveniência (quando levantada de um contexto)

  const [what, setWhat] = useState("");
  const [owner, setOwner] = useState("");
  const [tags, setTags] = useState("");
  const [impact, setImpact] = useState<Level>("medium");
  const [confidence, setConfidence] = useState<Level>("medium");
  const [effort, setEffort] = useState<Level>("medium");

  const nextId = `prop-${String(proposals.length + 1).padStart(3, "0")}`;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const proposal: AppProposal = {
      id: nextId,
      what: what.trim(),
      raisedFrom,
      owner: owner.trim(),
      status: "open",
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      impact,
      confidence,
      effort,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    await addProposal(proposal);
    nav("/propostas");
  }

  return (
    <>
      <header>
        <h1>Levantar proposta</h1>
        <p className="lead">
          Uma <strong>proposta</strong> é uma ideia/problema que você <strong>captura</strong>{" "}
          durante o trabalho — <strong>a qualquer momento</strong>, sem parar o que faz. Depois
          alguém <strong>tria</strong> (promove ou descarta).
        </p>
        {raisedFrom && (
          <p className="hint">
            proveniência: <code>{raisedFrom}</code>
          </p>
        )}
      </header>

      <form onSubmit={submit} className="form">
        <p className="hint">
          <span className="req">*</span> campos obrigatórios
        </p>
        <label>
          O quê <span className="req">*</span>
          <input
            value={what}
            onChange={(e) => setWhat(e.target.value)}
            required
            placeholder="ex.: testar se o suporte proativo melhora o login"
          />
        </label>
        <label>
          Owner / time <span className="req">*</span> <span className="hint">(quem TRIA)</span>
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            required
            placeholder="ex.: @produto-growth"
          />
        </label>
        <label>
          Tags <span className="hint">(separadas por vírgula)</span>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="ex.: growth, login, suporte-proativo"
          />
        </label>
        <div className="row">
          <LevelSelect label="Impacto" value={impact} set={setImpact} />
          <LevelSelect label="Confiança" value={confidence} set={setConfidence} />
          <LevelSelect label="Esforço" value={effort} set={setEffort} />
        </div>
        <div className="row">
          <button type="submit" className="btn primary">
            Capturar como {nextId}
          </button>
        </div>
      </form>
    </>
  );
}

function LevelSelect({
  label,
  value,
  set,
}: {
  label: string;
  value: Level;
  set: (v: Level) => void;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => set(e.target.value as Level)}>
        {LEVELS.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
