"use client";

import { Box, Button, Card, CardContent, Chip, Typography } from "@mui/material";
import Link from "next/link";
import { Flex } from "@/app/_ui/shared";
import type { GovernanceMapNode } from "../../_model/view-models";
import copy from "./_locales/pt-br.json";

export function MapDetailPanel({ node }: { node: GovernanceMapNode | null }) {
  return (
    <Card data-testid="map-detail-panel" variant="outlined">
      <CardContent>
        <Typography variant="h2">{copy.selected}</Typography>
        {!node ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {copy.selectHint}
          </Typography>
        ) : (
          <Box sx={{ display: "grid", gap: 1, mt: 1 }}>
            <Flex gap={0.75} wrap>
              <Chip size="small" label="objetivo" />
              <Chip size="small" label="intent" />
              <Chip size="small" label="contrato" />
              <Chip size="small" label="outcome" />
              <Chip size="small" label={node.kind} />
              <Chip size="small" variant="outlined" label={node.confidence} />
              <Chip
                size="small"
                color={node.risk === "high" ? "error" : "warning"}
                label={node.risk}
              />
            </Flex>
            <Typography variant="h3">{node.title}</Typography>
            {node.subtitle ? (
              <Typography variant="body2" color="text.secondary">
                {node.subtitle}
              </Typography>
            ) : null}
            {node.owner ? <Typography variant="body2">Dono: {node.owner}</Typography> : null}
            {node.team ? <Typography variant="body2">Time: {node.team}</Typography> : null}
            {node.evidence ? (
              <Typography variant="body2">Evidência: {node.evidence}</Typography>
            ) : null}
            {node.nextStep ? (
              <Typography variant="body2">Próximo passo: {node.nextStep}</Typography>
            ) : null}
            {node.cta ? (
              <Button
                component={Link}
                href={node.cta.href}
                variant="outlined"
                sx={{ justifySelf: "start" }}
              >
                {node.cta.label}
              </Button>
            ) : null}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
