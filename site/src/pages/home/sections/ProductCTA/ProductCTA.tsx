import { SiteLink } from "@shared/ui/SiteLink/SiteLink";
import copy from "./locales/pt-BR.json";

import "./ProductCTA.css";

export function ProductCTA(): JSX.Element {
  return (
    <section className="ctaBand">
      <h2>{copy.title}</h2>
      <p>{copy.text}</p>
      <div className="ctaActions">
        <SiteLink className="primaryAction" route="start">
          {copy.primaryAction}
        </SiteLink>
        <a className="secondaryAction" href="https://www.npmjs.com/package/ai-guidelines">
          {copy.secondaryAction}
        </a>
      </div>
    </section>
  );
}
