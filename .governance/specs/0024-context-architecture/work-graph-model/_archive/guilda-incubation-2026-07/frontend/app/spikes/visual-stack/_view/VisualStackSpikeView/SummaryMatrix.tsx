"use client";

// SummaryMatrix — matriz candidato × superfície com a recomendação provisória
// de cada spike. Espelha o relatório versionado em _reviews/.
import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { FINDINGS, type CandidateFinding } from "./findings";

const SURFACE_LABEL: Record<CandidateFinding["surface"], string> = {
  map: "Mapa de governança",
  dashboard: "Dashboards",
  table: "Tabelas / data grid",
  graph: "Grafo técnico / console",
  "server-state": "Server state",
};

const VERDICT_COLOR: Record<
  CandidateFinding["verdict"],
  "success" | "info" | "warning" | "default"
> = {
  recomendado: "success",
  "provável primário — pendente de confirmação": "info",
  alternativa: "warning",
  "pendente de decisão": "default",
  "não recomendado para a superfície": "default",
};

export function SummaryMatrix() {
  return (
    <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Superfície</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Candidato</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Pacotes</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Licença</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Recomendação provisória</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {FINDINGS.map((finding) => (
            <TableRow key={finding.id} hover>
              <TableCell>
                <Typography variant="caption">{SURFACE_LABEL[finding.surface]}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {finding.name}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="caption">{finding.packages}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="caption">{finding.license}</Typography>
              </TableCell>
              <TableCell>
                <Chip size="small" color={VERDICT_COLOR[finding.verdict]} label={finding.verdict} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
