import { useState } from "react";

import {
  desencontroScenarioById,
  desencontroScenarios,
  type DesencontroScenario,
  type DesencontroStage,
} from "@content/advancedCases";
import { TerminalFrame } from "@features/terminal/TerminalFrame/TerminalFrame";
import { FlowShell } from "@shared/layout/FlowShell/FlowShell";
import copy from "./locales/pt-BR.json";

import "./AdvancedPage.css";

const initialScenario = desencontroScenarios[0];

export function AdvancedPage(): JSX.Element {
  const [selectedId, setSelectedId] = useState(initialScenario.id);
  const selected = desencontroScenarioById(selectedId) ?? initialScenario;

  return (
    <FlowShell eyebrow={copy.eyebrow} title={copy.title} lead={copy.lead}>
      <section className="desencontroLab" aria-labelledby="desencontro-title">
        <div className="desencontroLabHead">
          <p className="eyebrow">{copy.desencontros.eyebrow}</p>
          <h2 id="desencontro-title">{copy.desencontros.title}</h2>
          <p>{copy.desencontros.lead}</p>
        </div>

        <div className="desencontroLayout">
          <div className="desencontroPicker" role="list">
            {desencontroScenarios.map((scenario) => (
              <button
                aria-pressed={selected.id === scenario.id}
                className={
                  selected.id === scenario.id ? "desencontroOption isSelected" : "desencontroOption"
                }
                key={scenario.id}
                onClick={() => setSelectedId(scenario.id)}
                type="button"
              >
                <span>#{scenario.number}</span>
                <strong>{scenario.title}</strong>
                <em>{scenario.summary}</em>
                {selected.id === scenario.id ? <small>{copy.desencontros.selected}</small> : null}
              </button>
            ))}
          </div>

          <div className="desencontroWorkArea">
            <DiagnosticTerminal scenario={selected} />
            <ScenarioBrief scenario={selected} />
          </div>
        </div>
      </section>
    </FlowShell>
  );
}

function DiagnosticTerminal({ scenario }: { readonly scenario: DesencontroScenario }): JSX.Element {
  return (
    <div className="desencontroTerminalBlock">
      <p className="commandHint">
        {copy.desencontros.commandLabel}: <code>{scenario.userRuns}</code>
      </p>
      <TerminalFrame title={copy.desencontros.terminalTitle} kind="illustrative">
        {scenario.terminal.map((line, index) => (
          <span className={terminalLineClass(line)} key={`${scenario.id}-${index}-${line}`}>
            {line === "" ? " " : line}
          </span>
        ))}
      </TerminalFrame>
    </div>
  );
}

function ScenarioBrief({ scenario }: { readonly scenario: DesencontroScenario }): JSX.Element {
  return (
    <aside className="desencontroBrief" aria-label={scenario.title}>
      <section>
        <h3>{copy.desencontros.projectLabel}</h3>
        <p>{scenario.miniProject}</p>
      </section>
      <section>
        <h3>{copy.desencontros.whatHappenedLabel}</h3>
        <p>{scenario.whatHappened}</p>
      </section>
      <section>
        <h3>{copy.desencontros.nextStepLabel}</h3>
        <p>{scenario.humanNextStep}</p>
      </section>
      <section>
        <h3>{copy.desencontros.stageTitle}</h3>
        <dl className="desencontroStages">
          {scenario.stages.map((stage) => (
            <div className={`stageRow stage-${stage.state}`} key={stage.label}>
              <dt>
                <span>{stage.label}</span>
                <strong>{statusLabel(stage.state)}</strong>
              </dt>
              <dd>{stage.text}</dd>
            </div>
          ))}
        </dl>
      </section>
    </aside>
  );
}

function statusLabel(stage: DesencontroStage): string {
  return copy.status[stage];
}

function terminalLineClass(line: string): string {
  if (/^\$ /.test(line)) return "terminalLine active";
  if (/^# /.test(line)) return "terminalLine muted";
  if (/^Status:/.test(line)) return "terminalLine warn";
  if (/Classificação do reparo:/.test(line)) return "terminalLine success";
  return "terminalLine";
}
