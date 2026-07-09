"use client";

import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { guildaColors } from "../theme";

const symbolByVariant = {
  color: "/brand/icons/governance.png",
  monochrome: "/brand/icons/governance-inverse.png",
  line: "/brand/guilda-symbol-line.png",
} as const;

export type GuildaSymbolVariant = keyof typeof symbolByVariant;

const productIconByName = {
  governance: {
    light: "/brand/icons/governance.png",
    dark: "/brand/icons/governance-inverse.png",
  },
  graph: {
    light: "/brand/icons/graph.png",
    dark: "/brand/icons/graph-inverse.png",
  },
  host: {
    light: "/brand/icons/host.png",
    dark: "/brand/icons/host-inverse.png",
  },
  flow: {
    light: "/brand/icons/flow.png",
    dark: "/brand/icons/flow-inverse.png",
  },
  cup: {
    light: "/brand/icons/cup.png",
    dark: "/brand/icons/cup-inverse.png",
  },
} as const;

export type GuildaProductIconName = keyof typeof productIconByName;

export function GuildaMark({
  size = 36,
  variant = "color",
  onDark = false,
  framed = false,
  sx,
}: {
  size?: number;
  variant?: GuildaSymbolVariant;
  onDark?: boolean;
  framed?: boolean;
  sx?: SxProps<Theme>;
}) {
  const resolvedVariant = onDark && variant === "color" ? "monochrome" : variant;

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: framed ? 2 : 0,
        bgcolor: framed ? guildaColors.green900 : "transparent",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
        ...sx,
      }}
    >
      <Box
        component="img"
        src={symbolByVariant[resolvedVariant]}
        alt="Guilda Governance"
        sx={{
          width: framed ? "78%" : "100%",
          height: framed ? "78%" : "100%",
          objectFit: "contain",
          display: "block",
        }}
      />
    </Box>
  );
}

export function GuildaProductIcon({
  name,
  size = 44,
  onDark = false,
  sx,
}: {
  name: GuildaProductIconName;
  size?: number;
  onDark?: boolean;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      component="img"
      src={productIconByName[name][onDark ? "dark" : "light"]}
      alt=""
      aria-hidden
      sx={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "block",
        flexShrink: 0,
        ...sx,
      }}
    />
  );
}

export function GuildaWordmark({
  compact = false,
  onDark = false,
  sx,
}: {
  compact?: boolean;
  onDark?: boolean;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box sx={{ display: "grid", lineHeight: 1, ...sx }}>
      <Typography
        component="span"
        sx={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: compact ? 20 : 30,
          fontWeight: 700,
          lineHeight: 0.95,
          color: onDark ? guildaColors.white : guildaColors.green900,
          letterSpacing: 0,
        }}
      >
        Guilda
      </Typography>
      <Typography
        component="span"
        sx={{
          fontSize: compact ? 13 : 20,
          fontWeight: 600,
          lineHeight: 1.05,
          color: onDark ? guildaColors.sage100 : guildaColors.sage500,
          letterSpacing: 0,
        }}
      >
        Governance
      </Typography>
    </Box>
  );
}

export function GuildaBrand({
  compact = false,
  onDark = false,
  markSize,
  sx,
}: {
  compact?: boolean;
  onDark?: boolean;
  markSize?: number;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: compact ? 0.9 : 1.3, ...sx }}>
      <GuildaMark size={markSize ?? (compact ? 28 : 44)} onDark={onDark} />
      <GuildaWordmark compact={compact} onDark={onDark} />
    </Box>
  );
}
