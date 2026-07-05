"use client";

// table-shared.tsx — colunas canônicas e pills de status/confiança/risco do
// spike de tabelas. Os três candidatos exibem as MESMAS colunas do
// GovernanceTableViewModel para a comparação ser honesta.
import { Chip } from "@mui/material";
import type { ConfidenceState, GovernanceTableRow, RiskLevel } from "../../_model/view-models";

export const TABLE_COLUMNS: Array<{
  field: keyof GovernanceTableRow;
  label: string;
  width: number;
  pill?: "status" | "confidence" | "risk";
}> = [
  { field: "id", label: "id", width: 170 },
  { field: "kind", label: "tipo", width: 110 },
  { field: "title", label: "título", width: 320 },
  { field: "owner", label: "responsável", width: 140 },
  { field: "team", label: "time", width: 140 },
  { field: "repos", label: "repos", width: 160 },
  { field: "cycle", label: "ciclo", width: 100 },
  { field: "status", label: "status", width: 130, pill: "status" },
  { field: "confidence", label: "confiança", width: 140, pill: "confidence" },
  { field: "risk", label: "risco", width: 110, pill: "risk" },
  { field: "evidence", label: "evidência", width: 230 },
  { field: "nextStep", label: "próximo passo", width: 220 },
  { field: "contract", label: "contrato", width: 170 },
  { field: "source", label: "fonte", width: 190 },
];

export function cellText(row: GovernanceTableRow, field: keyof GovernanceTableRow): string {
  const value = row[field];
  return Array.isArray(value) ? value.join(", ") : String(value ?? "");
}

const CONFIDENCE_CHIP: Record<ConfidenceState, "success" | "warning" | "error" | "default"> = {
  verified: "success",
  pending: "warning",
  "no-evidence": "default",
  "self-declared": "warning",
  "break-glass": "error",
  stale: "error",
};

const RISK_CHIP: Record<RiskLevel, "success" | "warning" | "error"> = {
  low: "success",
  attention: "warning",
  high: "error",
};

export function StatusPill({ value }: { value: string }) {
  return <Chip size="small" variant="outlined" label={value || "—"} />;
}

export function ConfidencePill({ value }: { value: ConfidenceState }) {
  return <Chip size="small" color={CONFIDENCE_CHIP[value]} variant="outlined" label={value} />;
}

export function RiskPill({ value }: { value: RiskLevel }) {
  return (
    <Chip
      size="small"
      color={RISK_CHIP[value]}
      variant={value === "low" ? "outlined" : "filled"}
      label={value}
    />
  );
}

export function TablePill({
  kind,
  row,
}: {
  kind: "status" | "confidence" | "risk";
  row: GovernanceTableRow;
}) {
  if (kind === "confidence") return <ConfidencePill value={row.confidence} />;
  if (kind === "risk") return <RiskPill value={row.risk} />;
  return <StatusPill value={row.status} />;
}
