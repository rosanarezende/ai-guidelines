import { audiencePaths } from "@content/flowData";
import { DirectCommandAside } from "@features/command-surface/DirectCommandAside/DirectCommandAside";
import { SectionHead } from "@shared/ui/SectionHead/SectionHead";
import { SiteLink } from "@shared/ui/SiteLink/SiteLink";
import copy from "./locales/pt-BR.json";

import "./AudiencePathCards.css";

export function AudiencePathCards(): JSX.Element {
  return (
    <section className="audienceSection">
      <SectionHead eyebrow={copy.eyebrow} title={copy.title} />
      <div className="audienceGrid">
        {audiencePaths.map((path) => (
          <article className="audienceCard" key={path.id}>
            <span className="pill">{path.label}</span>
            <h3>{path.title}</h3>
            <p>{path.text}</p>
            <div className="primaryCommand">
              <span>{copy.primaryCommand}</span>
              <code>{path.command}</code>
            </div>
            <DirectCommandAside command={path.directCommand} />
            <SiteLink route={path.route}>{copy.stepByStepLink}</SiteLink>
          </article>
        ))}
      </div>
    </section>
  );
}
