import { scenarioCatalog } from "@content/scenarios/catalog";
import { PROVENANCE_LABEL } from "@content/scenarios/resolve";

import "./ScenarioChooser.css";
import copy from "./locales/pt-BR.json";

/**
 * Tela inicial do simulador: "Escolha um cenário para simular".
 * Não exige decorar comandos — a pessoa escolhe um contexto, não um verbo.
 */
export function ScenarioChooser({
  selectedId,
  onSelect,
}: {
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
}): JSX.Element {
  return (
    <section className="scenarioChooser" aria-label={copy.aria}>
      <h2 className="scenarioChooserTitle">{copy.title}</h2>
      <p className="scenarioChooserLead">{copy.lead}</p>
      <ul className="scenarioChooserGrid" role="list">
        {scenarioCatalog.map((scenario) => {
          const active = scenario.id === selectedId;
          return (
            <li key={scenario.id}>
              <button
                type="button"
                className={active ? "scenarioCard isActive" : "scenarioCard"}
                aria-pressed={active}
                onClick={() => onSelect(scenario.id)}
              >
                <span className={`provenanceBadge provenance-${scenario.provenance}`}>
                  {PROVENANCE_LABEL[scenario.provenance]}
                </span>
                <strong className="scenarioCardName">{scenario.name}</strong>
                <span className="scenarioCardContext">{scenario.context}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
