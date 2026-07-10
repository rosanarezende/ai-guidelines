"use client";

import { Card, CardContent, Typography } from "@mui/material";
import type { WorkItemRow } from "../../_model/view-models";
import copy from "./_locales/pt-br.json";

export function WorkEvidencePanel({ row }: { row: WorkItemRow }) {
  const evidence =
    row.evidence ||
    "test: pendente · commit: pendente · verification: pendente até uma fonte independente anexar prova";

  return (
    <Card data-testid="work-evidence-panel" variant="outlined" sx={{ mt: 2, bgcolor: "grey.50" }}>
      <CardContent>
        <Typography variant="subtitle2">{copy.evidenceTitle}</Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {row.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {evidence}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          test · commit · verification · sourceRevision são conferidos antes de virar prova forte.
        </Typography>
      </CardContent>
    </Card>
  );
}
