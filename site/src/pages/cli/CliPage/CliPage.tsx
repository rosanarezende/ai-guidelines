import { useState } from "react";

import { promptFlows, PROMPT_FLOW_IDS, promptFlowById } from "@content/promptFlows";
import { SiteLink } from "@shared/ui/SiteLink/SiteLink";
import { CliTerminal } from "@features/cli-simulator/CliTerminal/CliTerminal";

import "./CliPage.css";
import copy from "./locales/pt-BR.json";

const CONTEXT_LABEL: Record<string, string> = copy.contexts;

function initialFlowId(): string {
  const fallback = PROMPT_FLOW_IDS[0];
  if (typeof window === "undefined") return fallback;
  const requested = new URLSearchParams(window.location.search).get("scenario");
  return requested && PROMPT_FLOW_IDS.includes(requested) ? requested : fallback;
}

/**
 * /cli — o simulador. Padrão = a projeção gerada do runtime (mobile-first,
 * offline, drift-checked). A pessoa escolhe um contexto e SENTE a CLI real:
 * mesma sequência, mesmos textos, navegação por teclado/clique. As saídas são
 * transcripts de dry-run reais; o modo ativo é declarado de forma visível.
 */
export function CliPage(): JSX.Element {
  const [selectedId, setSelectedId] = useState<string>(initialFlowId);
  const flow = promptFlowById(selectedId) ?? promptFlows[0];

  function select(id: string): void {
    setSelectedId(id);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("scenario", id);
      window.history.replaceState({}, "", url);
    }
  }

  return (
    <div className="cliPage">
      <header className="cliPageHead">
        <p className="cliPageEyebrow">{copy.eyebrow}</p>
        <h1 className="cliPageTitle">{copy.title}</h1>
        <p className="cliPageLead">{copy.lead}</p>
        <p className="cliPageEntry">
          <code>npx ai-guidelines</code>
        </p>
      </header>

      <nav className="cliContextPicker" aria-label={copy.pickerAria}>
        {PROMPT_FLOW_IDS.map((id) => {
          const candidate = promptFlowById(id);
          if (!candidate) return null;
          return (
            <button
              key={id}
              type="button"
              className={`cliContextCard ${id === selectedId ? "cliContextActive" : ""}`}
              aria-pressed={id === selectedId}
              onClick={() => select(id)}
            >
              <strong>{CONTEXT_LABEL[id] ?? id}</strong>
              <span>{candidate.detection.title}</span>
            </button>
          );
        })}
      </nav>

      <CliTerminal key={flow.id} flow={flow} />

      <footer className="cliPageFoot">
        <p>{copy.footNote}</p>
        <p>
          {copy.shortcutsLead} <SiteLink route="reference">{copy.shortcutsLink}</SiteLink>.
        </p>
      </footer>
    </div>
  );
}
