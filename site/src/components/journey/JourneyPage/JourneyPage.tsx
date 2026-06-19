import type { Journey } from "../../../flowData";
import { FlowShell } from "../../layout/FlowShell/FlowShell";
import { JourneySection } from "../JourneySection/JourneySection";

import "./JourneyPage.css";

export function JourneyPage({
  intro,
  journeys,
}: {
  readonly intro: { readonly eyebrow: string; readonly title: string; readonly lead: string };
  readonly journeys: readonly Journey[];
}): JSX.Element {
  return (
    <FlowShell eyebrow={intro.eyebrow} lead={intro.lead} title={intro.title}>
      <div className="journeyStack">
        {journeys.map((journey) => (
          <JourneySection journey={journey} key={`${journey.title}-${journey.command}`} />
        ))}
      </div>
    </FlowShell>
  );
}
