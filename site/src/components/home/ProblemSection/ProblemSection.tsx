import { productProblems } from "../../../flowData";
import { SectionHead } from "../../common/SectionHead/SectionHead";

import "./ProblemSection.css";

export function ProblemSection(): JSX.Element {
  return (
    <section className="problemSection">
      <SectionHead
        eyebrow="O problema"
        title="Construir com IA hoje vaza contexto por todos os lados."
      />
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
