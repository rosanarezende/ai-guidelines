import { productSolutions } from "../../../flowData";
import { OptimizedImage } from "../../common/OptimizedImage/OptimizedImage";
import { SectionHead } from "../../common/SectionHead/SectionHead";

import "./SolutionSection.css";

const layersImageWebp = new URL(
  "../../../assets/generated/ai-guidelines-governance-layers.webp",
  import.meta.url
).href;

export function SolutionSection(): JSX.Element {
  return (
    <section className="solutionSection">
      <div className="solutionCopy">
        <SectionHead
          eyebrow="A solução"
          title="Um fluxo governado que vive no repositório."
          lead="Automação absorve o mecânico, a governança organiza o sistema e o humano decide o que importa."
        />
        <div className="solutionGrid">
          {productSolutions.map((point) => (
            <article className="solutionCard" key={point.title}>
              <h3>{point.title}</h3>
              <p>{point.text}</p>
            </article>
          ))}
        </div>
      </div>
      <figure className="visualFrame">
        <OptimizedImage
          webp={layersImageWebp}
          alt="Camadas do ai-guidelines: automação estrutural, governança operacional e julgamento humano"
        />
      </figure>
    </section>
  );
}
