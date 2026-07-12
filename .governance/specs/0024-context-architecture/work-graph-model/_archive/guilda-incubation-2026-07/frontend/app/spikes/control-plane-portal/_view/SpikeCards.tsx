"use client";

import { Box, Chip, Divider, Paper, Typography } from "@mui/material";
import { Flex } from "@/app/_ui/shared";
import type { ReactNode } from "react";

export function BoundaryCard({
  icon,
  title,
  items,
}: {
  icon: ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Flex align="center" gap={1}>
        {icon}
        <Typography sx={{ fontWeight: 800 }}>{title}</Typography>
      </Flex>
      <Divider sx={{ my: 1.5 }} />
      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
        {items.map((item) => (
          <Typography key={item} component="li" variant="body2" sx={{ mb: 0.5 }}>
            {item}
          </Typography>
        ))}
      </Box>
    </Paper>
  );
}

export function ProofRow({
  label,
  ok,
  children,
}: {
  label: string;
  ok: boolean;
  children: ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
      <Flex align="center" gap={1.5}>
        <Chip color={ok ? "success" : "error"} label={ok ? "passou" : "falhou"} size="small" />
        <Typography sx={{ minWidth: 72, fontWeight: 800 }}>{label}</Typography>
        <Typography variant="body2" color="text.secondary">
          {children}
        </Typography>
      </Flex>
    </Paper>
  );
}
