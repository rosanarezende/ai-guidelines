import { useState } from "react";

import { MANDATORY_SCENARIO_IDS } from "@content/scenarios/catalog";
import { CliSimulator } from "@features/cli-simulator/CliSimulator/CliSimulator";
import { ScenarioChooser } from "@features/scenario-catalog/ScenarioChooser/ScenarioChooser";

import "./HomePage.css";
import copy from "./locales/pt-BR.json";

function initialScenarioId(): string {
  const fallback = MANDATORY_SCENARIO_IDS[0];
  if (typeof window === "undefined") return fallback;
  const requested = new URLSearchParams(window.location.search).get("scenario");
  return requested && MANDATORY_SCENARIO_IDS.includes(requested) ? requested : fallback;
}

/**
 * Porta do produto: a home É o simulador da CLI. A pessoa começa por
 * `npx ai-guidelines`, escolhe um cenário e entende o framework por experiência
 * guiada — sem decorar comandos.
 */
export function HomePage(): JSX.Element {
  const [selectedId, setSelectedId] = useState<string>(initialScenarioId);

  function select(id: string): void {
    setSelectedId(id);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("scenario", id);
      window.history.replaceState({}, "", url);
    }
  }

  return (
    <div className="homePage">
      <section className="homeHero">
        <p className="homeEyebrow">{copy.eyebrow}</p>
        <h1 className="homeTitle">{copy.title}</h1>
        <p className="homeLead">{copy.lead}</p>
        <p className="homeEntry">
          <code>npx ai-guidelines</code>
        </p>
        <p className="homeEntryNote">{copy.entryNote}</p>
      </section>

      <ScenarioChooser selectedId={selectedId} onSelect={select} />
      <CliSimulator scenarioId={selectedId} />
    </div>
  );
}
