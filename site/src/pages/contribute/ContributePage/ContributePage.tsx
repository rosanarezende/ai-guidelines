import { contributorBlock, scenarioById } from "@content/flowData";
import { SiteLink } from "@shared/ui/SiteLink/SiteLink";
import { ScenarioTerminal } from "@features/terminal/ScenarioTerminal/ScenarioTerminal";
import copy from "./locales/pt-BR.json";

import "./ContributePage.css";

export function ContributePage(): JSX.Element {
  const scenario = scenarioById(contributorBlock.scenarioId);
  return (
    <section className="contributeSection">
      <p className="eyebrow">{contributorBlock.eyebrow}</p>
      <h1>{contributorBlock.title}</h1>
      <p className="lead">{contributorBlock.lead}</p>
      <aside className="callout calloutInternal" role="note">
        <strong>{copy.internalLabel}</strong> {contributorBlock.note}
      </aside>
      <div className="contributeGrid">
        {contributorBlock.points.map((point) => (
          <article className="contributeCard" key={point.title}>
            <h3>{point.title}</h3>
            <p>{point.text}</p>
          </article>
        ))}
      </div>
      <div className="contributeCommands">
        {contributorBlock.commands.map((command) => (
          <div className="contributeCommand" key={command.label}>
            <code>{command.label}</code>
            <span>{command.hint}</span>
          </div>
        ))}
      </div>
      {scenario ? (
        <div className="scenarioPanel">
          <p className="scenarioNote">{scenario.note}</p>
          <ScenarioTerminal scenario={scenario} />
        </div>
      ) : null}
      <div className="heroActions">
        <SiteLink className="secondaryAction" route="home">
          {copy.backLink}
        </SiteLink>
      </div>
    </section>
  );
}
