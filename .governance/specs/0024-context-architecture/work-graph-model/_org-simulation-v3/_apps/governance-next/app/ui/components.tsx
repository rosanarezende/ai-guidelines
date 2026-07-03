import { Alert, Box, Card, CardContent, Chip, Divider, Paper, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import type { GovernanceIssue } from "@/lib/types";
import type { ReactNode } from "react";

export function Flex({
  children,
  gap = 1,
  align = "stretch",
  justify = "flex-start",
  wrap = false,
  direction = "row",
  sx,
}: {
  children: ReactNode;
  gap?: number;
  align?: string;
  justify?: string;
  wrap?: boolean;
  direction?: "row" | "column";
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      sx={[
        {
          display: "flex",
          flexDirection: direction,
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? "wrap" : "nowrap",
          gap,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  );
}

export function ResponsiveGrid({
  children,
  min = 320,
  gap = 2,
}: {
  children: ReactNode;
  min?: number;
  gap?: number;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))`,
        gap,
      }}
    >
      {children}
    </Box>
  );
}

export function SectionCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Flex justify="space-between" gap={2} align="flex-start">
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h2">{title}</Typography>
            {subtitle ? (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
        </Flex>
        <Divider sx={{ my: 1.5 }} />
        {children}
      </CardContent>
    </Card>
  );
}

export function StatCard({
  label,
  value,
  tone = "default",
  detail,
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "success" | "warning" | "error" | "info";
  detail?: string;
}) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h1" component="div">
          {value}
        </Typography>
        {detail ? (
          <Typography variant="caption" color="text.secondary">
            {detail}
          </Typography>
        ) : null}
        {tone !== "default" ? (
          <Box sx={{ mt: 1 }}>
            <Chip size="small" color={tone} label={tone} />
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function StatusChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Chip
      size="small"
      color={ok ? "success" : "warning"}
      icon={ok ? <CheckCircleIcon /> : <WarningAmberIcon />}
      label={label}
      variant={ok ? "filled" : "outlined"}
    />
  );
}

export function IssueList({ issues, limit = 8 }: { issues: GovernanceIssue[]; limit?: number }) {
  const visible = issues.slice(0, limit);
  if (!visible.length) return <Alert severity="success">Sem issues neste recorte.</Alert>;
  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      {visible.map((issue, index) => (
        <Alert
          key={`${issue.rule}-${issue.node}-${index}`}
          severity={issue.level === "error" ? "error" : "warning"}
        >
          <strong>{issue.rule}</strong> · {issue.node} · {issue.msg}
        </Alert>
      ))}
      {issues.length > visible.length ? (
        <Typography variant="caption" color="text.secondary">
          +{issues.length - visible.length} issue(s)
        </Typography>
      ) : null}
    </Box>
  );
}

export function DataPill({ label }: { label: string }) {
  return <Chip size="small" label={label} variant="outlined" />;
}

export function EntityCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, height: "100%" }}>
      <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      ) : null}
      {children ? <Box sx={{ mt: 1 }}>{children}</Box> : null}
    </Paper>
  );
}
