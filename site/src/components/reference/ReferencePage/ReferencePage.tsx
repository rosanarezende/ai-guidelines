import { glossary, referenceGroups } from "../../../flowData";
import { SectionHead } from "../../common/SectionHead/SectionHead";
import { FlowShell } from "../../layout/FlowShell/FlowShell";

import "./ReferencePage.css";

export function ReferencePage(): JSX.Element {
  return (
    <FlowShell
      eyebrow="Referência"
      title="Comandos, conceitos e glossário em um lugar só."
      lead="Os comandos e práticas vêm do mesmo catálogo da CLI — site e wizard nunca divergem."
    >
      <div className="referenceGrid">
        {referenceGroups.map((group) => (
          <section className="referenceGroup" key={group.title}>
            <h2>{group.title}</h2>
            <p>{group.text}</p>
            <div className="referenceList">
              {group.items.map((item) => (
                <article key={`${group.title}-${item.label}`}>
                  <strong>{item.label}</strong>
                  <span>{item.hint}</span>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="glossarySection">
        <SectionHead eyebrow="Glossário" title="Termos que aparecem no fluxo." />
        <dl className="glossary">
          {glossary.map((entry) => (
            <div className="glossaryItem" key={entry.term}>
              <dt>{entry.term}</dt>
              <dd>{entry.definition}</dd>
            </div>
          ))}
        </dl>
      </section>
    </FlowShell>
  );
}
