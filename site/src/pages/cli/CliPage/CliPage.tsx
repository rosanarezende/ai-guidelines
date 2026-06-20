import { useState } from "react";

import { promptFlowById } from "@content/promptFlows";
import { SiteLink } from "@shared/ui/SiteLink/SiteLink";
import { CliTerminal } from "@features/cli-simulator/CliTerminal/CliTerminal";

import "./CliPage.css";
import copy from "./locales/pt-BR.json";

type SetupChoice = "empty" | "existing";
type DailyChoice = "resume" | "focus" | "peer";
type CliPageMode = "hub" | "start" | "daily";

const SETUP_FLOW: Record<SetupChoice, string> = {
  empty: "empty",
  existing: "existing",
};

const DAILY_FLOW: Record<DailyChoice, string> = {
  resume: "daily-resume",
  focus: "daily-focus",
  peer: "daily-peer",
};

function initialSetupChoice(): SetupChoice | undefined {
  if (typeof window === "undefined") return undefined;
  const requested = new URLSearchParams(window.location.search).get("scenario");
  return Object.entries(SETUP_FLOW).find(([, flowId]) => flowId === requested)?.[0] as
    | SetupChoice
    | undefined;
}

function initialDailyChoice(): DailyChoice | undefined {
  if (typeof window === "undefined") return undefined;
  const requested = new URLSearchParams(window.location.search).get("scenario");
  return Object.entries(DAILY_FLOW).find(([, flowId]) => flowId === requested)?.[0] as
    | DailyChoice
    | undefined;
}

/**
 * /cli — o simulador. Padrão = a projeção gerada do runtime (mobile-first,
 * offline, drift-checked). A pessoa escolhe um contexto e SENTE a CLI real:
 * mesma sequência, mesmos textos, navegação por teclado/clique. As saídas são
 * transcripts de dry-run reais; o modo ativo é declarado de forma visível.
 */
export function CliPage({ mode }: { readonly mode: CliPageMode }): JSX.Element {
  const [setupChoice, setSetupChoice] = useState<SetupChoice | undefined>(initialSetupChoice);
  const [dailyChoice, setDailyChoice] = useState<DailyChoice | undefined>(initialDailyChoice);
  const selectedId = setupChoice ? SETUP_FLOW[setupChoice] : undefined;
  const flow = selectedId ? promptFlowById(selectedId) : undefined;
  const dailyFlowId = dailyChoice ? DAILY_FLOW[dailyChoice] : undefined;
  const dailyFlow = dailyFlowId ? promptFlowById(dailyFlowId) : undefined;

  function selectSetup(choice: SetupChoice): void {
    setSetupChoice(choice);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("scenario", SETUP_FLOW[choice]);
      window.history.replaceState({}, "", url);
    }
  }

  function restartSetup(): void {
    setSetupChoice(undefined);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("scenario");
      window.history.replaceState({}, "", url);
    }
  }

  function selectDaily(choice: DailyChoice): void {
    setDailyChoice(choice);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("scenario", DAILY_FLOW[choice]);
      window.history.replaceState({}, "", url);
    }
  }

  function restartDaily(): void {
    setDailyChoice(undefined);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("scenario");
      window.history.replaceState({}, "", url);
    }
  }

  const pageCopy = mode === "start" ? copy.start : mode === "daily" ? copy.daily : copy.hub;

  return (
    <div className="cliPage">
      <header className="cliPageHead">
        <p className="cliPageEyebrow">{copy.eyebrow}</p>
        <h1 className="cliPageTitle">{pageCopy.title}</h1>
        <p className="cliPageLead">{pageCopy.lead}</p>
        {mode === "start" ? <p className="cliPageSafety">{copy.start.safety}</p> : null}
        <p className="cliPageEntry">
          <code>npx ai-guidelines</code>
        </p>
      </header>

      {mode === "hub" ? (
        <>
          <section className="cliChoiceStage" aria-label={copy.hub.aria}>
            <div className="cliChoiceGrid">
              <SiteLink route="cliStart" className="cliChoiceCard cliChoiceLink">
                <strong>{copy.hub.startLabel}</strong>
                <span>{copy.hub.startDescription}</span>
              </SiteLink>
              <SiteLink route="cliDaily" className="cliChoiceCard cliChoiceLink">
                <strong>{copy.hub.dailyLabel}</strong>
                <span>{copy.hub.dailyDescription}</span>
              </SiteLink>
            </div>
          </section>
          <EmptyTerminal message={copy.hub.placeholder} />
        </>
      ) : null}

      {mode === "start" ? (
        <section className="cliSetupStage" aria-label={copy.setupAria}>
          <div className="cliStageHeader">
            <div>
              <p className="cliStageLabel">{copy.setupLabel}</p>
            </div>
            {setupChoice ? (
              <button type="button" className="cliResetButton" onClick={restartSetup}>
                {copy.reset}
              </button>
            ) : null}
          </div>
          <div className="cliChoiceGrid cliChoiceGridTwo">
            {copy.setupChoices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                className={`cliChoiceCard ${setupChoice === choice.id ? "isSelected" : ""}`}
                aria-pressed={setupChoice === choice.id}
                disabled={Boolean(setupChoice)}
                onClick={() => selectSetup(choice.id as SetupChoice)}
              >
                <strong>{choice.label}</strong>
                <span>{choice.description}</span>
                {setupChoice === choice.id ? <em>{copy.selected}</em> : null}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "start" && flow ? <CliTerminal key={flow.id} flow={flow} /> : null}
      {mode === "start" && !flow ? <EmptyTerminal message={copy.start.placeholder} /> : null}

      {mode === "daily" ? (
        <>
          <section className="cliSetupStage" aria-label={copy.daily.aria}>
            <div className="cliStageHeader">
              <div>
                <p className="cliStageLabel">{copy.daily.setupLabel}</p>
              </div>
              {dailyChoice ? (
                <button type="button" className="cliResetButton" onClick={restartDaily}>
                  {copy.reset}
                </button>
              ) : null}
            </div>
            <div className="cliChoiceGrid cliChoiceGridDaily">
              {copy.daily.choices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  className={`cliChoiceCard ${dailyChoice === choice.id ? "isSelected" : ""}`}
                  aria-pressed={dailyChoice === choice.id}
                  disabled={Boolean(dailyChoice)}
                  onClick={() => selectDaily(choice.id as DailyChoice)}
                >
                  <strong>{choice.label}</strong>
                  <span>{choice.description}</span>
                  {dailyChoice === choice.id ? <em>{copy.selected}</em> : null}
                </button>
              ))}
            </div>
          </section>
          {dailyFlow ? (
            <CliTerminal key={dailyFlow.id} flow={dailyFlow} />
          ) : (
            <EmptyTerminal message={copy.daily.placeholder} />
          )}
        </>
      ) : null}

      <footer className="cliPageFoot">
        <p>{copy.footNote}</p>
        <p>
          {copy.shortcutsLead} <SiteLink route="reference">{copy.shortcutsLink}</SiteLink>.
        </p>
      </footer>
    </div>
  );
}

function EmptyTerminal({ message }: { readonly message: string }): JSX.Element {
  return (
    <section className="cliPlaceholderTerminal" aria-label={copy.emptyTerminalAria}>
      <header className="cliPlaceholderBar">
        <span className="cliPlaceholderDots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <code>npx ai-guidelines</code>
        <span>{copy.waitingBadge}</span>
      </header>
      <div className="cliPlaceholderScreen">
        <p>{message}</p>
      </div>
    </section>
  );
}
