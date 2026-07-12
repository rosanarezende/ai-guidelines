"use client";

import {
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import Link from "next/link";
import type { ReactNode } from "react";
import { Flex } from "@/app/_ui/shared";
import type { ChecklistItem, NextStep } from "@/app/_domain/adoption/model";
import copy from "./cards/_locales/pt-br.json";

export function ShortcutCard({
  href,
  icon,
  title,
  sub,
  badge,
  tag,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  sub: string;
  badge?: number;
  tag?: string;
}) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardActionArea component={Link} href={href} sx={{ height: "100%", p: 2 }}>
        <Box sx={{ display: "grid", gap: 1.25, alignContent: "start" }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: "#eaf1ec",
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
          <Box sx={{ display: "grid", gap: 0.25 }}>
            <Flex align="center" gap={1} wrap>
              <Typography variant="h3">{title}</Typography>
              {badge ? <Chip size="small" color="warning" label={badge} /> : null}
              {tag ? <Chip size="small" variant="outlined" label={tag} /> : null}
            </Flex>
            <Typography variant="body2" color="text.secondary">
              {sub}
            </Typography>
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
}

export function NextStepCard({ nextStep }: { nextStep: NextStep }) {
  return (
    <Paper
      sx={{
        p: 2.5,
        bgcolor: "primary.main",
        color: "primary.contrastText",
        display: "grid",
        gap: 1.25,
      }}
    >
      <Box>
        <Chip
          size="small"
          icon={<VerifiedUserIcon sx={{ fontSize: 14 }} />}
          label={copy.nextStepBadge}
          sx={{
            bgcolor: "rgba(255,255,255,0.14)",
            color: "inherit",
            fontWeight: 700,
            letterSpacing: 0.3,
            "& .MuiChip-icon": { color: "inherit" },
          }}
        />
      </Box>
      <Typography sx={{ fontSize: 17, fontWeight: 700, lineHeight: 1.35 }}>
        {nextStep.title}
      </Typography>
      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
        {nextStep.body}
      </Typography>
      <Flex align="center" gap={1.5}>
        <Button
          component={Link}
          href={nextStep.ctaHref}
          size="small"
          sx={{
            bgcolor: "#fff",
            color: "primary.main",
            px: 2,
            "&:hover": { bgcolor: "#eaf1ec" },
          }}
        >
          {nextStep.ctaLabel}
        </Button>
        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
          {nextStep.meta}
        </Typography>
      </Flex>
    </Paper>
  );
}

export function SetupChecklist({
  checklist,
  doneCount,
  totalCount,
  setupPct,
}: {
  checklist: ChecklistItem[];
  doneCount: number;
  totalCount: number;
  setupPct: number;
}) {
  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <Flex justify="space-between" align="baseline" gap={1}>
        <Typography variant="h2">{copy.setupTitle}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
          {copy.setupProgress
            .replace("{done}", String(doneCount))
            .replace("{total}", String(totalCount))}
        </Typography>
      </Flex>
      <LinearProgress
        variant="determinate"
        value={setupPct}
        sx={{ height: 6, borderRadius: 999 }}
      />
      <Box sx={{ display: "grid" }}>
        {checklist.map((item) => (
          <Flex
            key={item.id}
            gap={1.25}
            align="flex-start"
            sx={{ py: 1.25, borderTop: "1px solid", borderColor: "divider" }}
          >
            {item.done ? (
              <CheckCircleIcon fontSize="small" color="success" sx={{ mt: 0.25 }} />
            ) : (
              <RadioButtonUncheckedIcon fontSize="small" sx={{ mt: 0.25, color: "#c2c9c2" }} />
            )}
            <Box sx={{ minWidth: 0 }}>
              <Flex align="center" gap={1} wrap>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: item.done ? "text.primary" : "text.secondary" }}
                >
                  {item.label}
                </Typography>
                {item.tag ? <Chip size="small" variant="outlined" label={item.tag} /> : null}
              </Flex>
              <Typography variant="caption" color="text.secondary">
                {item.detail}
              </Typography>
            </Box>
          </Flex>
        ))}
      </Box>
    </Box>
  );
}

export function ConsoleFooter() {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Flex justify="space-between" align="center" gap={2} wrap>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {copy.console.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {copy.console.subtitle}
          </Typography>
        </Box>
        <Button component={Link} href="/console" variant="outlined" size="small">
          {copy.console.cta}
        </Button>
      </Flex>
    </Paper>
  );
}
