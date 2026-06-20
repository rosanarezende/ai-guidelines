import {
  lineTone,
  ORIGIN_LABEL,
  resolveOutput,
  terminalKindForOrigin,
} from "@content/scenarios/resolve";
import type { CatalogScenario } from "@content/scenarios/types";
import { TerminalFrame } from "@features/terminal/TerminalFrame/TerminalFrame";

import "./ScenarioPlayer.css";
import copy from "./locales/pt-BR.json";

/**
 * Motor de passos do simulador: avança pelo cenário, mostra as opções e o
 * terminal de cada passo. Procedência (real/modelo alvo/em evolução) é visível
 * por saída — o real vem do transcript gerado, o resto é autoral e badgeado.
 */
export function ScenarioPlayer({
  scenario,
  stepIndex,
  onStepChange,
  technical,
}: {
  readonly scenario: CatalogScenario;
  readonly stepIndex: number;
  readonly onStepChange: (index: number) => void;
  readonly technical: boolean;
}): JSX.Element {
  const total = scenario.steps.length;
  const current = Math.min(Math.max(stepIndex, 0), total - 1);
  const step = scenario.steps[current];

  return (
    <div className="scenarioPlayer">
      <p className="playerEntry">
        <span className="playerEntryLabel">{copy.entry}</span> <code>{scenario.entryCommand}</code>
      </p>

      <ol className="playerTimeline" aria-label={copy.timelineAria}>
        {scenario.steps.map((item, index) => (
          <li
            key={item.id}
            className={index === current ? "isCurrent" : index < current ? "isDone" : "isUpcoming"}
          >
            <button
              type="button"
              onClick={() => onStepChange(index)}
              aria-current={index === current ? "step" : undefined}
              aria-label={`${copy.stepLabel} ${index + 1}`}
            >
              {index + 1}
            </button>
          </li>
        ))}
      </ol>

      <p className="playerPrompt">{step.prompt}</p>

      {step.options && step.options.length > 0 ? (
        <ul className="playerOptions" role="list" aria-label={copy.optionsAria}>
          {step.options.map((option) => (
            <li key={option} className="playerOption">
              {option}
            </li>
          ))}
        </ul>
      ) : null}

      {step.outputs.map((output, index) => {
        const resolved = resolveOutput(output);
        return (
          <div className="playerOutput" key={`${step.id}-${index}`}>
            <span className={`originBadge origin-${resolved.origin}`}>
              {ORIGIN_LABEL[resolved.origin]}
              {technical && resolved.transcriptId ? ` · ${resolved.transcriptId}` : ""}
            </span>
            <TerminalFrame
              title={resolved.command ?? scenario.entryCommand}
              kind={terminalKindForOrigin(resolved.origin)}
              exitCode={technical ? resolved.exitCode : undefined}
            >
              {resolved.lines.map((line, lineIndex) => (
                <span className={`terminalLine ${lineTone(line)}`} key={`${lineIndex}-${line}`}>
                  {line === "" ? " " : line}
                </span>
              ))}
            </TerminalFrame>
          </div>
        );
      })}

      <div className="playerNav">
        <button type="button" disabled={current === 0} onClick={() => onStepChange(current - 1)}>
          {copy.prev}
        </button>
        <span className="playerProgress">
          {current + 1} / {total}
        </span>
        <button
          type="button"
          disabled={current >= total - 1}
          onClick={() => onStepChange(current + 1)}
        >
          {copy.next}
        </button>
      </div>
    </div>
  );
}
