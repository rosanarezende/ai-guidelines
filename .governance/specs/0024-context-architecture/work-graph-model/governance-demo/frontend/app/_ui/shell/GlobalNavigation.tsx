"use client";

import {
  Box,
  Chip,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/lib/i18n";
import {
  primaryNavigationGroups,
  technicalNavigationItems,
  type NavigationItem,
  type NavigationItemState,
} from "./navigation";

const stateLabelKeys: Record<Exclude<NavigationItemState, "active" | "hidden">, string> = {
  pending: "app.nav.state.pending",
  "no-host": "app.nav.state.noHost",
  "no-authority": "app.nav.state.noAuthority",
  soon: "app.nav.state.soon",
  degraded: "app.nav.state.degraded",
};

function itemState(item: NavigationItem, hasGovernanceHost: boolean): NavigationItemState {
  if (item.state === "no-host" && hasGovernanceHost) return "active";
  return item.state || "active";
}

function itemStateLabel(state: NavigationItemState): string | null {
  if (state === "active" || state === "hidden") return null;
  return t(stateLabelKeys[state]);
}

function NavigationRow({
  item,
  hasGovernanceHost,
}: {
  item: NavigationItem;
  hasGovernanceHost: boolean;
}) {
  const pathname = usePathname();
  const state = itemState(item, hasGovernanceHost);
  if (state === "hidden") return null;

  const Icon = item.icon;
  const selected = Boolean(
    item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`))
  );
  const label = t(item.labelKey);
  const status = itemStateLabel(state);
  const disabled = state === "soon" || !item.href;
  const row = (
    <ListItemButton
      {...(item.href && !disabled ? { component: Link, href: item.href } : {})}
      selected={selected}
      disabled={disabled}
      sx={{ borderRadius: 1.5, px: 1.25, py: 0.75 }}
    >
      <ListItemIcon sx={{ minWidth: 34 }}>
        <Icon fontSize="small" />
      </ListItemIcon>
      <ListItemText
        primary={
          <Typography component="span" sx={{ fontSize: 14, fontWeight: selected ? 700 : 600 }}>
            {label}
          </Typography>
        }
      />
      {status ? <Chip size="small" variant="outlined" label={status} /> : null}
    </ListItemButton>
  );

  return disabled && status ? <Tooltip title={status}>{row}</Tooltip> : row;
}

export default function GlobalNavigation({ hasGovernanceHost }: { hasGovernanceHost: boolean }) {
  return (
    <Box data-testid="global-navigation" sx={{ width: 280, p: 2 }}>
      <Box sx={{ display: "grid", gap: 2 }}>
        <Box data-testid="global-navigation-primary">
          {primaryNavigationGroups.map((group) => (
            <Box key={group.id} sx={{ mb: 1.5 }}>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ display: "block", px: 1, lineHeight: 1.8 }}
              >
                {t(group.labelKey)}
              </Typography>
              <List dense disablePadding>
                {group.items.map((item) => (
                  <NavigationRow key={item.id} item={item} hasGovernanceHost={hasGovernanceHost} />
                ))}
              </List>
            </Box>
          ))}
        </Box>
        <Divider />
        <Box data-testid="global-navigation-technical">
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ display: "block", px: 1, lineHeight: 1.8 }}
          >
            {t("app.nav.group.advanced")}
          </Typography>
          <List dense disablePadding>
            {technicalNavigationItems.map((item) => (
              <NavigationRow key={item.id} item={item} hasGovernanceHost={hasGovernanceHost} />
            ))}
          </List>
        </Box>
      </Box>
    </Box>
  );
}
