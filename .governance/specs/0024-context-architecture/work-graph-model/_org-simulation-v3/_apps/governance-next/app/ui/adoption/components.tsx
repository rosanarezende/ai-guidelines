"use client";

// components.tsx — blocos reutilizáveis da camada humana (Home/Onboarding/Configurações).
// Nenhum componente aqui grava estado: tudo é leitura de snapshot ou estado local de UI.
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Authority } from "@/lib/types";
import { Flex } from "../components";
import {
  CONFIDENCE_STATES,
  ROLE_CONTRACT,
  TRUST_LEGEND,
  type AttentionItem,
  type ChecklistItem,
  type ConfidenceState,
  type NextStep,
  type ProfileId,
  type RoleAssignments,
  type RoleKey,
  type WorkSource,
} from "./model";

export function StatusPill({ state, label }: { state: ConfidenceState; label?: string }) {
  const meta = CONFIDENCE_STATES[state];
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.25,
        py: 0.25,
        borderRadius: 999,
        bgcolor: meta.bg,
        color: meta.fg,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      <Box
        component="span"
        sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: meta.dot, flexShrink: 0 }}
      />
      {label || meta.label}
    </Box>
  );
}

export function TrustLegend() {
  return (
    <Flex wrap gap={0.75} align="center">
      <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
        Como lemos confiança:
      </Typography>
      {TRUST_LEGEND.map((item) => (
        <StatusPill key={item.state} state={item.state} label={item.label} />
      ))}
    </Flex>
  );
}

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
          label="PRÓXIMO PASSO SEGURO"
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
        <Typography variant="h2">O que já está configurado</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
          {doneCount} de {totalCount} passos
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
        Nenhuma pendência aberta neste snapshot — os placares derivam só de evidência validada.
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
          +{items.length - visible.length} pendência(s) — veja tudo no console técnico.
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

export function RoleContractList({
  assignments,
  authorities,
  profile,
  onChange,
}: {
  assignments: RoleAssignments;
  authorities: Authority[];
  profile: ProfileId;
  onChange?: (role: RoleKey, value: string) => void;
}) {
  const authorityIds = new Set(authorities.map((authority) => authority.id));
  const holders = new Map<string, RoleKey[]>();
  for (const item of ROLE_CONTRACT) {
    const person = assignments[item.key];
    holders.set(person, [...(holders.get(person) || []), item.key]);
  }
  return (
    <Box sx={{ display: "grid" }}>
      {ROLE_CONTRACT.map((item) => {
        const person = assignments[item.key];
        const collapsed = (holders.get(person) || []).length > 1;
        const unresolved = !authorityIds.has(person);
        return (
          <Box
            key={item.key}
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr auto" },
              gap: 1.5,
              alignItems: "center",
              py: 1.25,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Flex align="center" gap={1} wrap>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {item.role}
                </Typography>
                {item.sensitive ? (
                  <Chip size="small" variant="outlined" label="papel sensível" />
                ) : null}
                {collapsed && item.sensitive ? (
                  <StatusPill state="self-attested" label="acúmulo registrado" />
                ) : null}
                {unresolved ? <StatusPill state="pending" label="não resolve" /> : null}
                <StatusPill state="pending" label="aceite pendente" />
              </Flex>
              <Typography variant="caption" color="text.secondary">
                {item.desc}
              </Typography>
            </Box>
            {onChange ? (
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>{item.role}</InputLabel>
                <Select
                  label={item.role}
                  value={person}
                  onChange={(event: SelectChangeEvent) => onChange(item.key, event.target.value)}
                >
                  {authorities.map((authority) => (
                    <MenuItem key={authority.id} value={authority.id}>
                      {authority.id}
                    </MenuItem>
                  ))}
                  {!authorityIds.has(person) ? (
                    <MenuItem value={person}>{person} (precisa resolver)</MenuItem>
                  ) : null}
                </Select>
              </FormControl>
            ) : (
              <Chip size="small" label={person} />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

export function SourceList({ sources }: { sources: WorkSource[] }) {
  if (!sources.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        Nenhuma fonte de trabalho conectada ainda.
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
          <Tooltip title="Detalhe técnico no console">
            <Button component={Link} href="/console?view=execution" size="small">
              Detalhes
            </Button>
          </Tooltip>
        </Box>
      ))}
    </Box>
  );
}

export function ConsoleFooter() {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Flex justify="space-between" align="center" gap={2} wrap>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Console técnico
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Grafo, comandos, event-log e resolver — para quem precisa do detalhe.
          </Typography>
        </Box>
        <Button component={Link} href="/console" variant="outlined" size="small">
          Abrir console
        </Button>
      </Flex>
    </Paper>
  );
}
