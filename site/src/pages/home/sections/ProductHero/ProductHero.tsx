import flowImageWebp from "@assets/generated/ai-guidelines-flow.webp";
import { OptimizedImage } from "@shared/ui/OptimizedImage/OptimizedImage";
import { SiteLink } from "@shared/ui/SiteLink/SiteLink";
import copy from "./locales/pt-BR.json";

import "./ProductHero.css";

export function ProductHero(): JSX.Element {
  return (
    <section className="hero">
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1>{copy.title}</h1>
      <p className="lead heroLead">
        {copy.leadPrefix} <strong>{copy.leadStrong}</strong> {copy.leadSuffix}
      </p>
      <div className="heroActions">
        <SiteLink className="primaryAction" route="flow">
          {copy.primaryAction}
        </SiteLink>
        <SiteLink className="secondaryAction" route="start">
          {copy.secondaryAction}
        </SiteLink>
      </div>
      <figure className="heroFigure">
        <OptimizedImage webp={flowImageWebp} alt={copy.imageAlt} />
      </figure>
    </section>
  );
}
