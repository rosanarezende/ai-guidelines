import type { ReactNode } from "react";

import "./TerminalFrame.css";

export type TerminalKind = "real" | "guided" | "illustrative";

const TERMINAL_BADGE: Record<TerminalKind, string> = {
  real: "Exemplo gerado",
  guided: "Exemplo guiado",
  illustrative: "Exemplo ilustrativo",
};

export function TerminalFrame({
  title,
  kind,
  children,
  exitCode,
}: {
  readonly title: string;
  readonly kind: TerminalKind;
  readonly children: ReactNode;
  readonly exitCode?: number | null;
}): JSX.Element {
  return (
    <figure
      className={`terminalDemo terminal-${kind}`}
      aria-label={`${TERMINAL_BADGE[kind]}: ${title}`}
    >
      <figcaption>
        <span></span>
        <span></span>
        <span></span>
        <strong>{title}</strong>
        <em className="terminalBadge">{TERMINAL_BADGE[kind]}</em>
      </figcaption>
      <pre>{children}</pre>
      {exitCode !== undefined && exitCode !== null ? (
        <p className="scenarioExit">exit code: {exitCode}</p>
      ) : null}
    </figure>
  );
}
