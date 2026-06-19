import { OptimizedImage } from "../../common/OptimizedImage/OptimizedImage";
import { SiteLink } from "../../common/SiteLink/SiteLink";

import "./ProductHero.css";

const flowImageWebp = new URL("../../../assets/generated/ai-guidelines-flow.webp", import.meta.url)
  .href;

export function ProductHero(): JSX.Element {
  return (
    <section className="hero">
      <p className="eyebrow">Governança de engenharia para times com IA</p>
      <h1>Trabalho com IA que não esquece o contexto.</h1>
      <p className="lead heroLead">
        O <strong>ai-guidelines</strong> guarda o estado do projeto no próprio repositório e mostra
        a próxima ação certa — para humanos e múltiplas IAs trabalharem do mesmo mapa.
      </p>
      <div className="heroActions">
        <SiteLink className="primaryAction" route="flow">
          Ver o guia interativo
        </SiteLink>
        <SiteLink className="secondaryAction" route="start">
          Começar
        </SiteLink>
      </div>
      <figure className="heroFigure">
        <OptimizedImage
          webp={flowImageWebp}
          alt="Ciclo ai-guidelines: backlog, spec, plano, execução, PR, gate humano e merge"
        />
      </figure>
    </section>
  );
}
