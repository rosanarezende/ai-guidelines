import { SiteLink } from "../../common/SiteLink/SiteLink";

import "./NotFoundPage.css";

export function NotFoundPage(): JSX.Element {
  return (
    <section className="notFound">
      <p className="eyebrow">Erro 404</p>
      <h1>Esta página não existe.</h1>
      <p className="lead">
        O endereço pedido não corresponde a nenhuma área do site. Volte ao produto ou veja como o
        fluxo funciona.
      </p>
      <div className="heroActions">
        <SiteLink className="primaryAction" route="home">
          Voltar ao produto
        </SiteLink>
        <SiteLink className="secondaryAction" route="flow">
          Ver como funciona
        </SiteLink>
      </div>
    </section>
  );
}
