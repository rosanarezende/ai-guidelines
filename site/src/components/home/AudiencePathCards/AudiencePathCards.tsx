import { audiencePaths } from "../../../flowData";
import { DirectCommandAside } from "../../common/DirectCommandAside/DirectCommandAside";
import { SectionHead } from "../../common/SectionHead/SectionHead";
import { SiteLink } from "../../common/SiteLink/SiteLink";

import "./AudiencePathCards.css";

export function AudiencePathCards(): JSX.Element {
  return (
    <section className="audienceSection">
      <SectionHead
        eyebrow="Por onde começar"
        title="Três caminhos, conforme o momento do repositório."
      />
      <div className="audienceGrid">
        {audiencePaths.map((path) => (
          <article className="audienceCard" key={path.id}>
            <span className="pill">{path.label}</span>
            <h3>{path.title}</h3>
            <p>{path.text}</p>
            <div className="primaryCommand">
              <span>Caminho principal</span>
              <code>{path.command}</code>
            </div>
            <DirectCommandAside command={path.directCommand} />
            <SiteLink route={path.route}>Ver passo a passo →</SiteLink>
          </article>
        ))}
      </div>
    </section>
  );
}
