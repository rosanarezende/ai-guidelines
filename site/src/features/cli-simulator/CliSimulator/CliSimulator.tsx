import { useEffect, useState } from "react";

import { catalogScenarioById } from "@content/scenarios/catalog";
import { PROVENANCE_LABEL } from "@content/scenarios/resolve";
import { EffectPreview } from "@features/effect-preview/EffectPreview/EffectPreview";
import { GovernanceExplainer } from "@features/governance-explainer/GovernanceExplainer/GovernanceExplainer";
import { ScenarioPlayer } from "@features/scenario-player/ScenarioPlayer/ScenarioPlayer";

import "./CliSimulator.css";
import copy from "./locales/pt-BR.json";

/**
 * Simulador da CLI: orquestra um cenário escolhido. Começa sempre por
 * `npx ai-guidelines`; comandos diretos aparecem só como atalho recolhido.
 * Modo iniciante × detalhes técnicos controla o quanto é exposto.
 */
export function CliSimulator({ scenarioId }: { readonly scenarioId: string }): JSX.Element | null {
  const scenario = catalogScenarioById(scenarioId);
  const [stepIndex, setStepIndex] = useState(0);
  const [technical, setTechnical] = useState(false);

  useEffect(() => {
    setStepIndex(0);
  }, [scenarioId]);

  if (!scenario) return null;
  const step = scenario.steps[Math.min(stepIndex, scenario.steps.length - 1)];

  return (
    <section className="cliSimulator" aria-label={`${copy.aria}: ${scenario.name}`}>
      <header className="simulatorHeader">
        <div className="simulatorHeading">
          <h2 className="simulatorName">{scenario.name}</h2>
          <span className={`provenanceBadge provenance-${scenario.provenance}`}>
            {PROVENANCE_LABEL[scenario.provenance]}
          </span>
        </div>
        <div className="simulatorMode" role="group" aria-label={copy.modeAria}>
          <button
            type="button"
            className={technical ? "modeButton" : "modeButton isActive"}
            aria-pressed={!technical}
            onClick={() => setTechnical(false)}
          >
            {copy.modeBeginner}
          </button>
          <button
            type="button"
            className={technical ? "modeButton isActive" : "modeButton"}
            aria-pressed={technical}
            onClick={() => setTechnical(true)}
          >
            {copy.modeTechnical}
          </button>
        </div>
      </header>

      <div className="simulatorGrid">
        <div className="simulatorMain">
          <ScenarioPlayer
            scenario={scenario}
            stepIndex={stepIndex}
            onStepChange={setStepIndex}
            technical={technical}
          />
        </div>
        <div className="simulatorSide">
          <GovernanceExplainer scenario={scenario} step={step} />
          <EffectPreview scenario={scenario} />
        </div>
      </div>

      <details className="simulatorShortcuts">
        <summary>{copy.shortcutsSummary}</summary>
        <p className="shortcutsNote">{copy.shortcutsNote}</p>
        <ul role="list">
          {scenario.shortcuts.length > 0 ? (
            scenario.shortcuts.map((shortcut) => (
              <li key={shortcut}>
                <code>{shortcut}</code>
              </li>
            ))
          ) : (
            <li>{copy.shortcutsEmpty}</li>
          )}
        </ul>
      </details>
    </section>
  );
}
