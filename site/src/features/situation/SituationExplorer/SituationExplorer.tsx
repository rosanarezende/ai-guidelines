import { useState } from "react";

import { BIN_WIZARD, type FlowSituation } from "@content/flowData";
import { DirectCommandAside } from "@features/command-surface/DirectCommandAside/DirectCommandAside";
import { ScenarioPanel } from "@features/terminal/ScenarioPanel/ScenarioPanel";
import { SiteLink } from "@shared/ui/SiteLink/SiteLink";
import copy from "./locales/pt-BR.json";

import "./SituationExplorer.css";

function statusLabel(status: FlowSituation["status"]): string {
  return status === "ready" ? copy.status.ready : copy.status.validating;
}

function SituationList({
  title,
  items,
}: {
  readonly title: string;
  readonly items: readonly string[];
}): JSX.Element {
  return (
    <div className="situationList">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function SituationExplorer({
  situations,
}: {
  readonly situations: readonly FlowSituation[];
}): JSX.Element {
  const [activeId, setActiveId] = useState(situations[0]?.id ?? "");
  const active = situations.find((situation) => situation.id === activeId) ?? situations[0];

  if (!active) return <></>;

  return (
    <section className="situationExplorer" aria-labelledby="situation-title">
      <div className="situationHeader">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 id="situation-title">{copy.title}</h2>
        <p>{copy.lead}</p>
        <code>{BIN_WIZARD}</code>
      </div>

      <div className="situationLayout">
        <div className="situationPicker" aria-label={copy.pickerAria}>
          {situations.map((situation) => (
            <button
              aria-pressed={situation.id === active.id}
              className={
                situation.id === active.id ? "situationOption isActive" : "situationOption"
              }
              key={situation.id}
              onClick={() => setActiveId(situation.id)}
              type="button"
            >
              <span>{situation.label}</span>
              <small>{statusLabel(situation.status)}</small>
            </button>
          ))}
        </div>

        <article className="situationCard" aria-live="polite">
          <div className="situationCardHeader">
            <span className="pill">{statusLabel(active.status)}</span>
            <h3>{active.headline}</h3>
            <p>{active.summary}</p>
          </div>

          <div className="situationCommand">
            <span>{copy.primaryCommand}</span>
            <code>{BIN_WIZARD}</code>
          </div>

          <div className="situationColumns">
            <SituationList title={copy.detectedTitle} items={active.detected} />
            <SituationList title={copy.offeredTitle} items={active.offered} />
            <SituationList title={copy.safetyTitle} items={active.safety} />
          </div>

          <ScenarioPanel scenarioId={active.scenarioId} />

          <div className="situationFooter">
            <SiteLink className="textLink" route={active.route}>
              {copy.detailsLink}
            </SiteLink>
            <DirectCommandAside command={active.shortcut} />
          </div>
        </article>
      </div>
    </section>
  );
}
