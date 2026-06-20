import { BIN_WIZARD } from "@content/flowData";
import governanceLayersWebp from "@assets/generated/ai-guidelines-governance-layers.webp";
import { SiteLink } from "@shared/ui/SiteLink/SiteLink";
import { OptimizedImage } from "@shared/ui/OptimizedImage/OptimizedImage";

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
        <div className="homeHeroText">
          <p className="homeEyebrow">{copy.eyebrow}</p>
          <h1 className="homeTitle">{copy.title}</h1>
        </div>
        <figure className="homeHeroFigure">
          <OptimizedImage webp={governanceLayersWebp} alt={copy.heroImageAlt} />
        </figure>
      </section>

      <section className="homeHowWorks">
        <div className="homeSectionIntro">
          <h2>{copy.howItWorks.title}</h2>
          <p>{copy.howItWorks.body}</p>
        </div>
        <ol className="homeStepList">
          {copy.howItWorks.steps.map((step, index) => (
            <li key={step.title} className="homeStep">
              <span className="homeStepNumber">{index + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                {index === 0 ? <code>{BIN_WIZARD}</code> : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="homeSimulatorPaths">
        <div className="homeSectionIntro">
          <h2>{copy.simulator.title}</h2>
          <p>{copy.simulator.body}</p>
        </div>
        <div className="homePathGrid">
          <SiteLink route="cliStart" className="homePathCard">
            <JourneyIcon type="start" />
            <strong>{copy.simulator.startLabel}</strong>
            <span>{copy.simulator.startDescription}</span>
            <em>{copy.simulator.startAction}</em>
          </SiteLink>
          <SiteLink route="cliDaily" className="homePathCard">
            <JourneyIcon type="daily" />
            <strong>{copy.simulator.dailyLabel}</strong>
            <span>{copy.simulator.dailyDescription}</span>
            <em>{copy.simulator.dailyAction}</em>
          </SiteLink>
        </div>
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
    </div>
  );
}

function JourneyIcon({ type }: { readonly type: "start" | "daily" }): JSX.Element {
  if (type === "start") {
    return (
      <span className="homePathIcon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M4 6.8A2.8 2.8 0 0 1 6.8 4h4.4l2 2H18a2 2 0 0 1 2 2v1.2H4V6.8Z" />
          <path d="M4 10.2h16l-1.4 7.2A2 2 0 0 1 16.6 19H7.4a2 2 0 0 1-2-1.6L4 10.2Z" />
          <path d="M12 12.5v4M10 14.5h4" />
        </svg>
      </span>
    );
  }

  return (
    <span className="homePathIcon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M6.8 8.2A6.5 6.5 0 0 1 18 9.4l1.4-1.4" />
        <path d="M18 9.4h-4" />
        <path d="M17.2 15.8A6.5 6.5 0 0 1 6 14.6L4.6 16" />
        <path d="M6 14.6h4" />
        <path d="m9.8 12.2 1.6 1.6 3.3-3.6" />
      </svg>
    </span>
  );
}
