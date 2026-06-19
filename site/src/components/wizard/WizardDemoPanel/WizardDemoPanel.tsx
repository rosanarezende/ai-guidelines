import { useState } from "react";

import type { WizardDemo } from "../../../flowData";

import "./WizardDemoPanel.css";

export function WizardDemoPanel({ demo }: { readonly demo: WizardDemo }): JSX.Element {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStep = demo.steps[activeIndex] ?? demo.steps[0];

  return (
    <section className="wizardDemoSection" aria-labelledby="wizard-demo-title">
      <div className="wizardDemoIntro">
        <p className="eyebrow">{demo.eyebrow}</p>
        <h2 id="wizard-demo-title">{demo.title}</h2>
        <p>{demo.lead}</p>
        <code>{demo.command}</code>
      </div>
      <div className="wizardDemoShell">
        <div className="wizardScreen" aria-live="polite">
          <div className="wizardPrompt">
            <span className="wizardGlyph">◇</span>
            <strong>{activeStep.prompt}</strong>
          </div>
          <div className="wizardChoice">
            <span>◆</span>
            <strong>{activeStep.selected}</strong>
          </div>
          <p>{activeStep.help}</p>
          {activeStep.derivedFrom ? (
            <em>Derivado do catálogo real de {activeStep.derivedFrom}.</em>
          ) : null}
        </div>
        <ol className="wizardStepList" aria-label="Demonstração do guia interativo">
          {demo.steps.map((step, index) => (
            <li key={step.title}>
              <button
                aria-current={index === activeIndex ? "step" : undefined}
                className={index === activeIndex ? "wizardStep isActive" : "wizardStep"}
                onClick={() => setActiveIndex(index)}
                type="button"
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step.title}</strong>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
