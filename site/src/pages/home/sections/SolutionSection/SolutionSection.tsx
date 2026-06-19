import layersImageWebp from "@assets/generated/ai-guidelines-governance-layers.webp";
import { productSolutions } from "@content/flowData";
import { OptimizedImage } from "@shared/ui/OptimizedImage/OptimizedImage";
import { SectionHead } from "@shared/ui/SectionHead/SectionHead";
import copy from "./locales/pt-BR.json";

import "./SolutionSection.css";

export function SolutionSection(): JSX.Element {
  return (
    <section className="solutionSection">
      <div className="solutionCopy">
        <SectionHead eyebrow={copy.eyebrow} title={copy.title} lead={copy.lead} />
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
        <OptimizedImage webp={layersImageWebp} alt={copy.imageAlt} />
      </figure>
    </section>
  );
}
