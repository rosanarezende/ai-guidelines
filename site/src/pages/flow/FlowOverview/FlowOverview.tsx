import { flowSituations, type RouteId } from "@content/flowData";
import { SituationExplorer } from "@features/situation/SituationExplorer/SituationExplorer";
import { SectionHead } from "@shared/ui/SectionHead/SectionHead";
import { SiteLink } from "@shared/ui/SiteLink/SiteLink";
import { FlowShell } from "@shared/layout/FlowShell/FlowShell";
import copy from "./locales/pt-BR.json";

import "./FlowOverview.css";

export function FlowOverview(): JSX.Element {
  return (
    <FlowShell eyebrow={copy.eyebrow} title={copy.title} lead={copy.lead}>
      <SituationExplorer situations={flowSituations} />

      <section className="overviewSection">
        <SectionHead eyebrow={copy.areasEyebrow} title={copy.areasTitle} lead={copy.areasLead} />
        <div className="overviewGrid">
          {copy.areas.map((area) => (
            <SiteLink className="overviewCard" key={area.route} route={area.route as RouteId}>
              <span className="pill">{area.label}</span>
              <p>{area.text}</p>
              <span className="textLink">{copy.openLink}</span>
            </SiteLink>
          ))}
        </div>
      </section>
    </FlowShell>
  );
}
