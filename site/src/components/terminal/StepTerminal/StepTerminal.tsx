import type { FlowStep } from "../../../flowData";
import { TerminalFrame } from "../TerminalFrame/TerminalFrame";

export function StepTerminal({ step }: { readonly step: FlowStep }): JSX.Element {
  return (
    <TerminalFrame title={step.command ?? "npx ai-guidelines"} kind="illustrative">
      {step.lines.map((line, index) => (
        <span className={`terminalLine ${line.tone ?? "normal"}`} key={`${line.text}-${index}`}>
          {line.text}
        </span>
      ))}
    </TerminalFrame>
  );
}
