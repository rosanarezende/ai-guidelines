import { useState } from "react";

import { scenarioById, type FlowScenario } from "../../../flowData";
import { ScenarioTerminal } from "../ScenarioTerminal/ScenarioTerminal";

import "./ScenarioTabs.css";

export function ScenarioTabs({
  scenarioIds,
}: {
  readonly scenarioIds: readonly string[];
}): JSX.Element {
  const available = scenarioIds
    .map((id) => scenarioById(id))
    .filter((scenario): scenario is FlowScenario => Boolean(scenario));
  const [active, setActive] = useState(0);
  const scenario = available[active] ?? available[0];
  if (!scenario) return <></>;

  return (
    <div className="scenarioTabs">
      <div className="segmented" role="tablist" aria-label="Cenários de terminal">
        {available.map((item, index) => (
          <button
            aria-selected={index === active}
            className={index === active ? "segment isActive" : "segment"}
            key={item.id}
            onClick={() => setActive(index)}
            role="tab"
            type="button"
          >
            {item.title.split("—")[0].trim()}
          </button>
        ))}
      </div>
      <p className="scenarioNote">{scenario.note}</p>
      <ScenarioTerminal scenario={scenario} />
    </div>
  );
}
