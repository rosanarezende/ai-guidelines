"use client";

import { Box, Button, Tooltip, Typography } from "@mui/material";
import Link from "next/link";
import { Flex } from "@/app/_ui/shared";
import type { WorkSource } from "@/app/_domain/adoption/model";
import { StatusPill } from "./status";
import copy from "./source-list/_locales/pt-br.json";

export function SourceList({ sources }: { sources: WorkSource[] }) {
  if (!sources.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        {copy.empty}
      </Typography>
    );
  }
  return (
    <Box sx={{ display: "grid" }}>
      {sources.map((source) => (
        <Box
          key={source.id}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr auto auto" },
            gap: 1.5,
            alignItems: "center",
            py: 1.25,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {source.id}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {source.kind} · {source.detail}
            </Typography>
          </Box>
          <StatusPill state={source.state} />
          <Tooltip title={copy.technicalDetailTooltip}>
            <Button component={Link} href="/console?view=execution" size="small">
              {copy.detailsCta}
            </Button>
          </Tooltip>
        </Box>
      ))}
    </Box>
  );
}
