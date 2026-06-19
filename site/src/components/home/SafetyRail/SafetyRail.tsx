import { publicHumanDecisions, safetyRails } from "../../../flowData";
import { SectionHead } from "../../common/SectionHead/SectionHead";

import "./SafetyRail.css";

function HumanDecisionCallout(): JSX.Element {
  return (
    <aside className="callout calloutHuman" aria-label="O que o humano decide">
      <h3>O que o humano decide</h3>
      <p>
        Estas decisões são reservadas a pessoas — o sistema prepara, mas não executa por conta
        própria.
      </p>
      <ul>
        {publicHumanDecisions.map((decision) => (
          <li key={decision.id}>{decision.title}</li>
        ))}
      </ul>
    </aside>
  );
}

export function SafetyRail(): JSX.Element {
  return (
    <section className="safetySection">
      <SectionHead
        eyebrow="Segurança do fluxo"
        title="O que o framework impede para evitar erro humano."
        lead="Ações sensíveis não viram atalhos: aparecem como decisões explícitas ou bloqueios com motivo."
      />
      <div className="safetyLayout">
        <div className="safetyGrid">
          {safetyRails.map((rail) => (
            <article className="safetyCard" key={rail.title}>
              <h3>{rail.title}</h3>
              <p>{rail.text}</p>
            </article>
          ))}
        </div>
        <HumanDecisionCallout />
      </div>
    </section>
  );
}
