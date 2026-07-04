import confidencePtBr from "./locales/pt-br.json";

export type ConfidenceState =
  | "valid"
  | "pending"
  | "no-evidence"
  | "self-attested"
  | "break-glass"
  | "stale";

export const CONFIDENCE_STATES: Record<
  ConfidenceState,
  { label: string; bg: string; fg: string; dot: string }
> = {
  valid: { label: confidencePtBr.states.valid, bg: "#e7f2ea", fg: "#1a5632", dot: "#2e7d32" },
  pending: { label: confidencePtBr.states.pending, bg: "#fdf3e3", fg: "#7a4a00", dot: "#b97800" },
  "no-evidence": {
    label: confidencePtBr.states["no-evidence"],
    bg: "#eef0ef",
    fg: "#4a544d",
    dot: "#8a938d",
  },
  "self-attested": {
    label: confidencePtBr.states["self-attested"],
    bg: "#e9eef8",
    fg: "#274d8f",
    dot: "#1f4b99",
  },
  "break-glass": {
    label: confidencePtBr.states["break-glass"],
    bg: "#fbeaee",
    fg: "#8c1236",
    dot: "#9f1239",
  },
  stale: { label: confidencePtBr.states.stale, bg: "#f5f0e3", fg: "#6b5a26", dot: "#a08a3c" },
};

export const TRUST_LEGEND = confidencePtBr.legend as Array<{
  state: ConfidenceState;
  label: string;
}>;
