import type { FlowStep } from "@content/flowData";
import { TerminalFrame } from "@features/terminal/TerminalFrame/TerminalFrame";
import copy from "./locales/pt-BR.json";

export function StepTerminal({ step }: { readonly step: FlowStep }): JSX.Element {
  return (
    <TerminalFrame title={step.command ?? copy.fallbackTitle} kind="illustrative">
      {step.lines.map((line, index) => (
        <span className={`terminalLine ${line.tone ?? "normal"}`} key={`${line.text}-${index}`}>
          {line.text}
        </span>
      ))}
    </TerminalFrame>
  );
}
