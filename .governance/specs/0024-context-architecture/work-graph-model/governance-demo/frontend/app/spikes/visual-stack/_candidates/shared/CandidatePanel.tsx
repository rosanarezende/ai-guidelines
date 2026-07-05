"use client";

// CandidatePanel — moldura comum de cada candidato: pacote/licença, status de
// render/hydration observado no cliente e notas do spike. Todos os candidatos
// recebem o MESMO view-model; a moldura garante comparação honesta.
import { Box, Chip, Divider, Paper, Typography } from "@mui/material";
import { useEffect, useState, type ReactNode } from "react";
import { Flex } from "@/app/_ui/shared";
import { SpikeErrorBoundary } from "./SpikeErrorBoundary";

export type CandidateMeta = {
  id: string;
  name: string;
  packages: string;
  license: string;
};

export function CandidatePanel({
  meta,
  children,
  footer,
}: {
  meta: CandidateMeta;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const status = renderError ? "erro de render" : hydrated ? "hidratado sem erro" : "renderizando…";

  return (
    <Paper variant="outlined" sx={{ p: 2, display: "grid", gap: 1.5 }}>
      <Flex align="center" gap={1} wrap>
        <Typography variant="h3">{meta.name}</Typography>
        <Chip size="small" variant="outlined" label={meta.packages} />
        <Chip size="small" variant="outlined" label={meta.license} />
        <Chip
          size="small"
          color={renderError ? "error" : hydrated ? "success" : "default"}
          label={status}
        />
      </Flex>
      <SpikeErrorBoundary candidate={meta.name} onError={setRenderError}>
        <Box sx={{ minWidth: 0 }}>{children}</Box>
      </SpikeErrorBoundary>
      {footer ? (
        <>
          <Divider />
          {footer}
        </>
      ) : null}
    </Paper>
  );
}
