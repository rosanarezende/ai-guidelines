import { SiteLink } from "@shared/ui/SiteLink/SiteLink";

import "./HomePage.css";
import copy from "./locales/pt-BR.json";

/**
 * Home institucional: explica o PRODUTO para quem chega. ai-guidelines é um
 * sistema de governança humano+IA — a CLI é a superfície que a LLM usa por
 * baixo dos panos. O simulador interativo vive em /cli; aqui a pessoa entende
 * o porquê antes de sentir o como.
 */
export function HomePage(): JSX.Element {
  return (
    <div className="homePage">
      <section className="homeHero">
        <p className="homeEyebrow">{copy.eyebrow}</p>
        <h1 className="homeTitle">{copy.title}</h1>
        <p className="homeLead">{copy.lead}</p>
        <p className="homeEntry">
          <code>npx ai-guidelines</code>
        </p>
        <div className="homeCtas">
          <SiteLink route="cli" className="homeCtaPrimary">
            {copy.ctaPrimary}
          </SiteLink>
          <SiteLink route="contribute" className="homeCtaSecondary">
            {copy.ctaSecondary}
          </SiteLink>
        </div>
      </section>

      <section className="homeUnderHood">
        <h2>{copy.underHood.title}</h2>
        <p>{copy.underHood.body}</p>
      </section>

      <section className="homePillars">
        <h2>{copy.pillarsTitle}</h2>
        <div className="homePillarGrid">
          {copy.pillars.map((pillar) => (
            <article key={pillar.title} className="homePillar">
              <h3>{pillar.title}</h3>
              <p>{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="homeClosing">
        <h2>{copy.closingTitle}</h2>
        <p>{copy.closing}</p>
        <SiteLink route="cli" className="homeCtaPrimary">
          {copy.ctaPrimary}
        </SiteLink>
      </section>
    </div>
  );
}
