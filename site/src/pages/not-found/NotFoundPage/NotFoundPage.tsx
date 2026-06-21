import { SiteLink } from "@shared/ui/SiteLink/SiteLink";
import copy from "./locales/pt-BR.json";

import "./NotFoundPage.css";

export function NotFoundPage(): JSX.Element {
  return (
    <section className="notFound">
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1>{copy.title}</h1>
      <p className="lead">{copy.lead}</p>
      <div className="heroActions">
        <SiteLink className="primaryAction" route="home">
          {copy.homeAction}
        </SiteLink>
        <SiteLink className="secondaryAction" route="reference">
          {copy.flowAction}
        </SiteLink>
      </div>
    </section>
  );
}
