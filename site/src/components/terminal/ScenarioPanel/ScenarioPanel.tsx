import { scenarioById } from "../../../flowData";
import { ScenarioTerminal } from "../ScenarioTerminal/ScenarioTerminal";

import "./ScenarioPanel.css";

export function ScenarioPanel({ scenarioId }: { readonly scenarioId: string }): JSX.Element | null {
  const scenario = scenarioById(scenarioId);
  if (!scenario) return null;
  return (
    <div className="scenarioPanel">
      <p className="scenarioNote">{scenario.note}</p>
      <ScenarioTerminal scenario={scenario} />
    </div>
  );
}
