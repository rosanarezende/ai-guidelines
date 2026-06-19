import { publicWizardDemo } from "../../../flowData";
import { SectionHead } from "../../common/SectionHead/SectionHead";
import { SiteLink } from "../../common/SiteLink/SiteLink";
import { FlowShell } from "../../layout/FlowShell/FlowShell";
import { ScenarioTabs } from "../../terminal/ScenarioTabs/ScenarioTabs";
import { WizardDemoPanel } from "../../wizard/WizardDemoPanel/WizardDemoPanel";

import "./FlowOverview.css";

export function FlowOverview(): JSX.Element {
  const areas = [
    {
      route: "start" as const,
      label: "Começar",
      text: "Init para projeto novo, adopt para repo existente.",
    },
    {
      route: "daily" as const,
      label: "Uso diário",
      text: "Próxima ação, validação, review e decisões.",
    },
    {
      route: "team" as const,
      label: "Em time",
      text: "Múltiplas specs e troca segura de contexto.",
    },
    {
      route: "peerReview" as const,
      label: "Review entre pares",
      text: "Revisar o PR de um colega sem perder sua branch.",
    },
  ];

  return (
    <FlowShell
      eyebrow="Como funciona"
      title="O caminho muda conforme o momento do repositório."
      lead="Comece pela intenção. Cada área tem um passo a passo e um exemplo de terminal de apoio."
    >
      <WizardDemoPanel demo={publicWizardDemo} />

      <div className="overviewGrid">
        {areas.map((area) => (
          <SiteLink className="overviewCard" key={area.route} route={area.route}>
            <span className="pill">{area.label}</span>
            <p>{area.text}</p>
            <span className="textLink">Abrir →</span>
          </SiteLink>
        ))}
      </div>

      <section className="previewSection">
        <SectionHead
          eyebrow="Veja de verdade"
          title="Exemplos de terminal gerados do runtime real."
          lead="Estes transcripts são atalhos diretos equivalentes. O caminho principal continua sendo abrir o guia interativo."
        />
        <ScenarioTabs
          scenarioIds={["new-project", "existing-repo", "governed-repo", "update-providers"]}
        />
      </section>
    </FlowShell>
  );
}
