import { productProblems } from "@content/flowData";
import { SectionHead } from "@shared/ui/SectionHead/SectionHead";
import copy from "./locales/pt-BR.json";

import "./ProblemSection.css";

export function ProblemSection(): JSX.Element {
  return (
    <section className="problemSection">
      <SectionHead eyebrow={copy.eyebrow} title={copy.title} />
      <div className="problemGrid">
        {productProblems.map((problem) => (
          <article className="problemCard" key={problem.title}>
            <h3>{problem.title}</h3>
            <p>{problem.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
