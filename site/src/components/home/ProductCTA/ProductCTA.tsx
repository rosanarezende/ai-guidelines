import { SiteLink } from "../../common/SiteLink/SiteLink";

import "./ProductCTA.css";

export function ProductCTA(): JSX.Element {
  return (
    <section className="ctaBand">
      <h2>Pronto para experimentar?</h2>
      <p>
        Comece em uma pasta nova ou adote em um repo existente — o preview mostra tudo antes de
        aplicar.
      </p>
      <div className="ctaActions">
        <SiteLink className="primaryAction" route="start">
          Começar agora
        </SiteLink>
        <a className="secondaryAction" href="https://www.npmjs.com/package/ai-guidelines">
          Ver pacote npm
        </a>
      </div>
    </section>
  );
}
