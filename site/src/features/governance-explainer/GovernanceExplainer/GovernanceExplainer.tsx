import type { CatalogScenario, ScenarioStep } from "@content/scenarios/types";

import "./GovernanceExplainer.css";
import copy from "./locales/pt-BR.json";

/**
 * Painel "por que isso apareceu": explica, em linguagem humana, por que a CLI
 * ofereceu (ou bloqueou) o passo atual. Para cenários simulado/gap, deixa claro
 * que é modelo alvo, não captura real.
 */
export function GovernanceExplainer({
  scenario,
  step,
}: {
  readonly scenario: CatalogScenario;
  readonly step: ScenarioStep;
}): JSX.Element {
  return (
    <aside className="governanceExplainer" aria-label={copy.aria}>
      <h3 className="explainerTitle">{copy.title}</h3>
      <p className="explainerContext">{scenario.context}</p>
      <p className="explainerWhy">{step.why}</p>
      {scenario.provenance !== "real" ? <p className="explainerEvolving">{copy.evolving}</p> : null}
    </aside>
  );
}
