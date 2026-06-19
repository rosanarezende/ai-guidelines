import type { FlowScenario, TerminalLine } from "@content/flowData";
import { TerminalFrame } from "@features/terminal/TerminalFrame/TerminalFrame";

function scenarioLineTone(line: string): TerminalLine["tone"] {
  if (/^\$ /.test(line)) return "active";
  if (/^# /.test(line)) return "muted";
  if (/atenção|conflito|warn|skip/i.test(line)) return "warn";
  if (/\[dry-run\]|sync|ok\b/i.test(line)) return "success";
  return "normal";
}

export function ScenarioTerminal({ scenario }: { readonly scenario: FlowScenario }): JSX.Element {
  return (
    <TerminalFrame title={scenario.command} kind={scenario.kind} exitCode={scenario.exitCode}>
      {scenario.lines.map((line, index) => (
        <span className={`terminalLine ${scenarioLineTone(line)}`} key={`${line}-${index}`}>
          {line === "" ? " " : line}
        </span>
      ))}
    </TerminalFrame>
  );
}
