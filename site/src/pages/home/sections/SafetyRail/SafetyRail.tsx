import { publicHumanDecisions, safetyRails } from "@content/flowData";
import { SectionHead } from "@shared/ui/SectionHead/SectionHead";
import copy from "./locales/pt-BR.json";

import "./SafetyRail.css";

function HumanDecisionCallout(): JSX.Element {
  return (
    <aside className="callout calloutHuman" aria-label={copy.calloutAria}>
      <h3>{copy.calloutTitle}</h3>
      <p>{copy.calloutText}</p>
      <ul>
        {publicHumanDecisions.map((decision) => (
          <li key={decision.id}>{decision.title}</li>
        ))}
      </ul>
    </aside>
  );
}

export function SafetyRail(): JSX.Element {
  return (
    <section className="safetySection">
      <SectionHead eyebrow={copy.eyebrow} title={copy.title} lead={copy.lead} />
      <div className="safetyLayout">
        <div className="safetyGrid">
          {safetyRails.map((rail) => (
            <article className="safetyCard" key={rail.title}>
              <h3>{rail.title}</h3>
              <p>{rail.text}</p>
            </article>
          ))}
        </div>
        <HumanDecisionCallout />
      </div>
    </section>
  );
}
