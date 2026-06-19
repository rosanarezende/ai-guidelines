import { SectionHead } from "../../common/SectionHead/SectionHead";
import { SiteLink } from "../../common/SiteLink/SiteLink";

import "./TeamTeaser.css";

export function TeamTeaser(): JSX.Element {
  return (
    <section className="teamTeaser">
      <div>
        <SectionHead
          eyebrow="Em time"
          title="Várias pessoas, várias specs, sem pisar no mesmo estado."
          lead="Escolher a frente certa, revisar o PR de um colega e trocar de contexto com segurança fazem parte do fluxo."
        />
        <div className="teaserActions">
          <SiteLink className="textLink" route="team">
            Trabalho em time e múltiplas specs →
          </SiteLink>
          <SiteLink className="textLink" route="peerReview">
            Review entre pares →
          </SiteLink>
        </div>
      </div>
    </section>
  );
}
