"use client";

import { Box, Button, Typography } from "@mui/material";
import Link from "next/link";
import { Flex } from "@/app/ui/shared";
import type { AttentionItem } from "@/app/features/adoption/model";
import { StatusPill } from "./status";
import copy from "./attention-list/locales/pt-br.json";

export function AttentionList({
  items,
  footer,
  limit = 6,
}: {
  items: AttentionItem[];
  footer?: string;
  limit?: number;
}) {
  const visible = items.slice(0, limit);
  if (!items.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        {copy.empty}
      </Typography>
    );
  }
  return (
    <Box sx={{ display: "grid" }}>
      {visible.map((item) => (
        <Flex
          key={item.id}
          gap={1.5}
          align="flex-start"
          sx={{ py: 1.5, borderTop: "1px solid", borderColor: "divider" }}
        >
          <Box sx={{ mt: 0.25 }}>
            <StatusPill state={item.state} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {item.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {item.hint}
            </Typography>
          </Box>
          <Button
            component={Link}
            href={item.actionHref}
            size="small"
            sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
          >
            {item.actionLabel}
          </Button>
        </Flex>
      ))}
      {items.length > visible.length ? (
        <Typography variant="caption" color="text.secondary" sx={{ py: 1 }}>
          {copy.overflow.replace("{count}", String(items.length - visible.length))}
        </Typography>
      ) : null}
      {footer ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}
        >
          {footer}
        </Typography>
      ) : null}
    </Box>
  );
}
