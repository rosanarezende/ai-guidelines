export type ContextTarget =
  | { kind: "pr"; number: number }
  | { kind: "spec"; identifier: string }
  | { kind: "unknown" };
