"use client";

// FindingsFooter — notas de UX/performance/licença/SSR/lock-in observadas no
// spike, exibidas junto do candidato para a comparação ficar auditável.
import { Box, Chip, Typography } from "@mui/material";
import { Flex } from "@/app/_ui/shared";
import type { CandidateFinding } from "./findings";

const VERDICT_COLOR: Record<CandidateFinding["verdict"], "success" | "warning" | "default"> = {
  recomendado: "success",
  alternativa: "warning",
  "não recomendado para a superfície": "default",
};

export function FindingsFooter({ finding }: { finding: CandidateFinding }) {
  const rows: Array<[string, string]> = [
    ["UX", finding.ux],
    ["Performance", finding.performance],
    ["Licença/custo", finding.licensing],
    ["SSR/hydration", finding.ssr],
    ["Lock-in", finding.lockIn],
    ["Limitações", finding.limitations],
  ];
  return (
    <Box sx={{ display: "grid", gap: 0.75 }}>
      <Flex align="center" gap={1}>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          Recomendação provisória:
        </Typography>
        <Chip size="small" color={VERDICT_COLOR[finding.verdict]} label={finding.verdict} />
      </Flex>
      {rows.map(([label, text]) => (
        <Typography key={label} variant="caption" color="text.secondary">
          <strong>{label}:</strong> {text}
        </Typography>
      ))}
    </Box>
  );
}
