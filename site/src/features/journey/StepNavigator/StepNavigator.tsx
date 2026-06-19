import { useState } from "react";

import type { FlowStep } from "@content/flowData";
import { StepTerminal } from "@features/terminal/StepTerminal/StepTerminal";
import copy from "./locales/pt-BR.json";

import "./StepNavigator.css";

export function StepNavigator({ steps }: { readonly steps: readonly FlowStep[] }): JSX.Element {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStep = steps[activeIndex] ?? steps[0];

  return (
    <div className="stepNavigator">
      <ol className="stepList" aria-label={copy.stepsAria}>
        {steps.map((step, index) => (
          <li key={step.title}>
            <button
              aria-current={index === activeIndex ? "step" : undefined}
              className={index === activeIndex ? "stepButton isActive" : "stepButton"}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <span className="stepNum">{String(index + 1).padStart(2, "0")}</span>
              <span className="stepText">
                <strong>{step.title}</strong>
                <small>{step.text}</small>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <article className="stepDetail">
        <div className="stepCopy">
          <h3>{activeStep.title}</h3>
          <p>{activeStep.text}</p>
          {activeStep.command ? <code>{activeStep.command}</code> : null}
        </div>
        <StepTerminal step={activeStep} />
      </article>
    </div>
  );
}
