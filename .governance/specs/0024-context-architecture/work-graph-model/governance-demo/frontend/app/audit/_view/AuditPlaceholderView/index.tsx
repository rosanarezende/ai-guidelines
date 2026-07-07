"use client";

import { useMemo, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, Typography } from "@mui/material";
import type { GovernanceSnapshot } from "@demo/contracts";
import AppShell from "@/app/_ui/shell/AppShell";
import { Flex } from "@/app/_ui/shared";

type AuditKind = "decision" | "outcome" | "break-glass" | "contract";

type AuditItem = {
  id: string;
  kind: AuditKind;
  title: string;
  actor: string;
  authority: string;
  revision: string;
  reason: string;
  ttl?: string;
  review?: string;
};

export default function AuditPlaceholderView({
  workspace,
  accountId,
  snapshot,
}: {
  workspace: { id: string; name: string; demo: boolean; hasGovernanceHost: boolean };
  accountId: string;
  snapshot: GovernanceSnapshot | null;
}) {
  const [filter, setFilter] = useState<"all" | "break-glass">("all");
  const items = useMemo(() => (snapshot ? buildAuditItems(snapshot) : []), [snapshot]);
  const visibleItems = filter === "break-glass" ? items.filter((item) => item.kind === "break-glass") : items;

  return (
    <AppShell
      chip={workspace.demo ? "demo" : "workspace"}
      subtitle="Governança · auditoria"
      headerAction={<Chip size="small" color="info" label={workspace.name} />}
      hasGovernanceHost={workspace.hasGovernanceHost}
      cacheScope={{ accountId, workspaceId: workspace.id, session: "local" }}
      maxWidth="xl"
    >
      <Box sx={{ display: "grid", gap: 2 }}>
        <Typography variant="h1">Auditoria</Typography>
        <Typography color="text.secondary">
          Trilha read-only de decisões, evidências, exceções e revisões derivadas do governance
          host. Esta tela não autoriza ações: ela mostra o que foi registrado.
        </Typography>
        <Alert severity="info">
          Toda linha precisa preservar actor, authority e revision. Quando faltar fonte forte, o
          estado fica visível como exceção/revisão pendente.
        </Alert>
        {!snapshot ? (
          <Alert severity="warning">
            Este workspace ainda não tem read-model governado disponível para auditoria.
          </Alert>
        ) : (
          <>
            <Flex gap={1} wrap>
              <Chip size="small" color="success" label={`sourceRevision ${snapshot.revision}`} />
              <Chip size="small" label={`${items.length} eventos derivados`} />
              <Button
                data-testid="audit-filter-break-glass"
                size="small"
                variant={filter === "break-glass" ? "contained" : "outlined"}
                onClick={() => setFilter(filter === "break-glass" ? "all" : "break-glass")}
              >
                Break-glass/exceções
              </Button>
            </Flex>
            <Box data-testid="audit-event-list" sx={{ display: "grid", gap: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                actor · authority · revision
              </Typography>
              {visibleItems.map((item, index) => (
                <Card
                  key={item.id}
                  data-testid={
                    item.kind === "break-glass" && index === 0 ? "break-glass-event" : undefined
                  }
                  variant="outlined"
                >
                  <CardContent>
                    <Flex gap={0.75} align="center" wrap>
                      <Chip size="small" label={item.kind} />
                      <Typography variant="subtitle2">{item.title}</Typography>
                    </Flex>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      actor: {item.actor} · authority: {item.authority} · revision: {item.revision}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      reason: {item.reason}
                    </Typography>
                    {item.ttl || item.review ? (
                      <Typography variant="caption" color="text.secondary">
                        ttl: {item.ttl ?? "n/a"} · review: {item.review ?? "n/a"}
                      </Typography>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </Box>
          </>
        )}
      </Box>
    </AppShell>
  );
}

function buildAuditItems(snapshot: GovernanceSnapshot): AuditItem[] {
  const verdicts = snapshot.operations.verdicts.map<AuditItem>((verdict) => ({
    id: verdict.id,
    kind: "decision",
    title: `${verdict.intent} → ${verdict.verdict}`,
    actor: verdict["decided-by"] ?? "decision-owner",
    authority: verdict["decided-by"] ?? "decision-owner",
    revision: snapshot.revision,
    reason: verdict["decision-rule"] ?? verdict.reason ?? "decision recorded",
  }));
  const outcomes = snapshot.outcomes.map<AuditItem>((outcome) => ({
    id: outcome.id,
    kind: "outcome",
    title: `${outcome.metric}: ${outcome.value}`,
    actor: outcome.envelope?.actor ?? outcome["attested-by"],
    authority: outcome.envelope?.authority ?? outcome["attested-by"],
    revision: outcome.revision,
    reason: `attested-by ${outcome["attested-by"]}; valid=${String(outcome.valid)}`,
  }));
  const contractDecisions = snapshot.contracts.flatMap((contract) =>
    (contract["revision-proposals"] ?? []).map<AuditItem>((proposal) => ({
      id: proposal.id,
      kind: "contract",
      title: `${contract.id} ${proposal.revision}`,
      actor: proposal["owner-approval"],
      authority: proposal["owner-approval"],
      revision: proposal.revision,
      reason: `decision ${proposal.decision}; intents ${proposal.intents.join(", ")}`,
      review: proposal["compatibility-window"] ?? "release-rollout",
    }))
  );
  const profile = snapshot.profileDeclaration as Record<string, string | undefined>;
  const profileBreakGlass: AuditItem = {
    id: "profile-break-glass-policy",
    kind: "break-glass",
    title: "Perfil full com exceção controlada",
    actor: "sponsor-acme",
    authority: profile["approved-by"] ?? "sponsor-acme",
    revision: snapshot.revision,
    reason: profile.badge ?? "mutação sensível exige par ou break-glass logado",
    ttl: profile.ttl ?? "n/a",
    review: profile["review-at"] ?? "n/a",
  };
  const attestationBreakGlass = snapshot.targets
    .filter((target) => target["attestation-collapse"])
    .map<AuditItem>((target) => ({
    id: `attestation-collapse-${target.id}`,
    kind: "break-glass",
    title: `Colapso de atestação: ${target.id}`,
    actor: target["attestation-collapse"]?.["approved-by"] ?? target.definer,
    authority: target["attestation-collapse"]?.["approved-by"] ?? target.definer,
    revision: snapshot.revision,
    reason: target["attestation-collapse"]?.reason ?? "colapso registrado",
    ttl: "n/a",
    review: target["attestation-collapse"]?.["review-at"] ?? "n/a",
  }));
  return [
    ...verdicts,
    ...outcomes,
    ...contractDecisions,
    profileBreakGlass,
    ...attestationBreakGlass,
  ];
}
