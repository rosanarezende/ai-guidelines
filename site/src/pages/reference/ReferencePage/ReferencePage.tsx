import { glossary, referenceGroups } from "@content/flowData";
import { SectionHead } from "@shared/ui/SectionHead/SectionHead";
import { FlowShell } from "@shared/layout/FlowShell/FlowShell";
import copy from "./locales/pt-BR.json";

import "./ReferencePage.css";

export function ReferencePage(): JSX.Element {
  return (
    <FlowShell eyebrow={copy.eyebrow} title={copy.title} lead={copy.lead}>
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
        <SectionHead eyebrow={copy.glossaryEyebrow} title={copy.glossaryTitle} />
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
