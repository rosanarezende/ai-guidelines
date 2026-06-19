import { SectionHead } from "@shared/ui/SectionHead/SectionHead";
import { SiteLink } from "@shared/ui/SiteLink/SiteLink";
import copy from "./locales/pt-BR.json";

import "./TeamTeaser.css";

export function TeamTeaser(): JSX.Element {
  return (
    <section className="teamTeaser">
      <div>
        <SectionHead eyebrow={copy.eyebrow} title={copy.title} lead={copy.lead} />
        <div className="teaserActions">
          <SiteLink className="textLink" route="team">
            {copy.teamLink}
          </SiteLink>
          <SiteLink className="textLink" route="peerReview">
            {copy.reviewLink}
          </SiteLink>
        </div>
      </div>
    </section>
  );
}
