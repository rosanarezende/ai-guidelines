import { publicWizardDemo, type RouteId } from "@content/flowData";
import { SectionHead } from "@shared/ui/SectionHead/SectionHead";
import { SiteLink } from "@shared/ui/SiteLink/SiteLink";
import { FlowShell } from "@shared/layout/FlowShell/FlowShell";
import { ScenarioTabs } from "@features/terminal/ScenarioTabs/ScenarioTabs";
import { WizardDemoPanel } from "@features/wizard-demo/WizardDemoPanel/WizardDemoPanel";
import copy from "./locales/pt-BR.json";

import "./FlowOverview.css";

export function FlowOverview(): JSX.Element {
  return (
    <FlowShell eyebrow={copy.eyebrow} title={copy.title} lead={copy.lead}>
      <WizardDemoPanel demo={publicWizardDemo} />

      <div className="overviewGrid">
        {copy.areas.map((area) => (
          <SiteLink className="overviewCard" key={area.route} route={area.route as RouteId}>
            <span className="pill">{area.label}</span>
            <p>{area.text}</p>
            <span className="textLink">{copy.openLink}</span>
          </SiteLink>
        ))}
      </div>

      <section className="previewSection">
        <SectionHead
          eyebrow={copy.previewEyebrow}
          title={copy.previewTitle}
          lead={copy.previewLead}
        />
        <ScenarioTabs
          scenarioIds={[
            "consumer-empty-entry",
            "consumer-existing-entry",
            "consumer-governed-solo-entry",
            "consumer-multiple-specs-entry",
          ]}
        />
      </section>
    </FlowShell>
  );
}
