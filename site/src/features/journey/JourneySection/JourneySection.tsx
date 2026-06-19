import type { Journey } from "@content/flowData";
import { DirectCommandAside } from "@features/command-surface/DirectCommandAside/DirectCommandAside";
import { ScenarioPanel } from "@features/terminal/ScenarioPanel/ScenarioPanel";
import { StepNavigator } from "@features/journey/StepNavigator/StepNavigator";
import copy from "./locales/pt-BR.json";

import "./JourneySection.css";

export function JourneySection({ journey }: { readonly journey: Journey }): JSX.Element {
  return (
    <section className="journeySection">
      <div className="journeyIntro">
        <span className="pill">{journey.eyebrow}</span>
        <h2>{journey.title}</h2>
        <p>{journey.summary}</p>
        <div className="primaryCommand">
          <span>{copy.primaryCommand}</span>
          <code>{journey.command}</code>
        </div>
        <div className="whenBox">
          <h3>{copy.whenToUse}</h3>
          <ul>
            {journey.whenToUse.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="journeyBody">
        <StepNavigator steps={journey.steps} />
        {journey.scenarioId ? <ScenarioPanel scenarioId={journey.scenarioId} /> : null}
        <DirectCommandAside command={journey.directCommand} />
      </div>
    </section>
  );
}
