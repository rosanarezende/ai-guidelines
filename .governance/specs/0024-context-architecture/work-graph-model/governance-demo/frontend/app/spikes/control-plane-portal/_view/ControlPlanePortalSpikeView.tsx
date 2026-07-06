"use client";

import { Alert, Box, Chip, Divider, Paper, Typography } from "@mui/material";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import NoEncryptionGmailerrorredIcon from "@mui/icons-material/NoEncryptionGmailerrorred";
import ScienceIcon from "@mui/icons-material/Science";
import { Flex, SectionCard } from "@/app/_ui/shared";
import AppShell from "@/app/_ui/shell/AppShell";
import type { ProposalResult, PublicControlPlaneProjection } from "@demo/domain";
import type { ReactNode } from "react";
import copy from "./_locales/pt-br.json";

type AuthSummary = {
  library: "better-auth";
  organizationPluginLoaded: boolean;
  requiredEndpoints: Array<{ id: string; available: boolean }>;
  boundary: string[];
};

const m = copy.messages;

export default function ControlPlanePortalSpikeView({
  auth,
  projection,
  proposal,
  staleProposal,
  secretLeakCount,
}: {
  auth: AuthSummary;
  projection: PublicControlPlaneProjection;
  proposal: ProposalResult;
  staleProposal: ProposalResult;
  secretLeakCount: number;
}) {
  const workspace = projection.workspaces[0];
  const provider = projection.providerLinks[0];

  return (
    <AppShell chip="spike interno" maxWidth="lg">
      <Box sx={{ display: "grid", gap: 3 }}>
        <Box>
          <Flex align="center" gap={1.5}>
            <ScienceIcon color="primary" fontSize="large" />
            <Typography sx={{ fontSize: 26, fontWeight: 800 }}>{m.title}</Typography>
          </Flex>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {m.lead}
          </Typography>
        </Box>

        <Alert severity="warning" variant="outlined">
          {m.honesty}
        </Alert>

        <Box sx={{ display: "grid", gridTemplateColumns: { md: "1fr 1fr 1fr" }, gap: 2 }}>
          <BoundaryCard
            icon={<LockIcon color="primary" />}
            title={m.controlPlane}
            items={[
              `${projection.accounts.length} contas`,
              `${projection.memberships.length} memberships`,
              `${projection.invites.length} convites`,
            ]}
          />
          <BoundaryCard
            icon={<AccountTreeIcon color="primary" />}
            title={m.governancePlane}
            items={[
              workspace ? `${workspace.name} (${workspace.topology})` : "sem workspace",
              provider ? `${provider.owner}/${provider.repo}` : "sem host",
              `${projection.governanceAuthorityGrantCount} authorities vindas do portal`,
            ]}
          />
          <BoundaryCard
            icon={<NoEncryptionGmailerrorredIcon color="primary" />}
            title={m.security}
            items={[
              `${secretLeakCount} vazamentos de segredo`,
              staleProposal.ok ? "stale aceito" : "stale bloqueado",
              proposal.ok ? "proposta criada como proposal-only" : "proposta falhou",
            ]}
          />
        </Box>

        <SectionCard title={m.betterAuthTitle} subtitle={m.betterAuthSubtitle}>
          <Flex align="center" gap={1} wrap>
            <Chip
              color={auth.organizationPluginLoaded ? "success" : "error"}
              icon={<CheckCircleIcon />}
              label={`${auth.library}: organization plugin`}
            />
            {auth.requiredEndpoints.map((endpoint) => (
              <Chip
                key={endpoint.id}
                variant="outlined"
                color={endpoint.available ? "success" : "error"}
                label={endpoint.id}
              />
            ))}
          </Flex>
        </SectionCard>

        <SectionCard title={m.flowTitle} subtitle={m.flowSubtitle}>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {[m.flowCreator, m.flowInvite, m.flowAccept, m.flowProposal, m.flowNoAuthority].map(
              (item, index) => (
                <Flex key={item} align="center" gap={1.5}>
                  <Chip label={index + 1} color="primary" size="small" />
                  <Typography variant="body2">{item}</Typography>
                </Flex>
              )
            )}
          </Box>
        </SectionCard>

        <SectionCard title={m.proofTitle} subtitle={m.proofSubtitle}>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <ProofRow label="APP-40" ok={projection.governanceAuthorityGrantCount === 0}>
              {m.proofApp40}
            </ProofRow>
            <ProofRow label="APP-41" ok={projection.memberships.length > 1}>
              {m.proofApp41}
            </ProofRow>
            <ProofRow label="SEC-13" ok={secretLeakCount === 0}>
              {m.proofSec13}
            </ProofRow>
            <ProofRow label="ARCH-CP" ok={!staleProposal.ok && proposal.ok}>
              {m.proofArch}
            </ProofRow>
          </Box>
        </SectionCard>
      </Box>
    </AppShell>
  );
}

function BoundaryCard({ icon, title, items }: { icon: ReactNode; title: string; items: string[] }) {
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

function ProofRow({ label, ok, children }: { label: string; ok: boolean; children: ReactNode }) {
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
