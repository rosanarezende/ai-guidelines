import { contributorBlock, scenarioById } from "../../../flowData";
import { SiteLink } from "../../common/SiteLink/SiteLink";
import { ScenarioTerminal } from "../../terminal/ScenarioTerminal/ScenarioTerminal";

import "./ContributePage.css";

export function ContributePage(): JSX.Element {
  const scenario = scenarioById(contributorBlock.scenarioId);
  return (
    <section className="contributeSection">
      <p className="eyebrow">{contributorBlock.eyebrow}</p>
      <h1>{contributorBlock.title}</h1>
      <p className="lead">{contributorBlock.lead}</p>
      <aside className="callout calloutInternal" role="note">
        <strong>Uso interno.</strong> {contributorBlock.note}
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
          Voltar ao site do produto
        </SiteLink>
      </div>
    </section>
  );
}
