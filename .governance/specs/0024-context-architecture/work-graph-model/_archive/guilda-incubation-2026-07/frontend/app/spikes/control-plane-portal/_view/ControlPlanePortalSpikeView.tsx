"use client";

import { Alert, Box, Chip, Typography } from "@mui/material";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import NoEncryptionGmailerrorredIcon from "@mui/icons-material/NoEncryptionGmailerrorred";
import ScienceIcon from "@mui/icons-material/Science";
import { Flex, SectionCard } from "@/app/_ui/shared";
import AppShell from "@/app/_ui/shell/AppShell";
import {
  InviteAcceptSection,
  type InviteAcceptReport,
  type PostgresLiveReport,
} from "./InviteAcceptSection";
import { BoundaryCard, ProofRow } from "./SpikeCards";
import { SQLiteHttpSection, type SQLiteHttpReport } from "./SQLiteHttpSection";
import type {
  GitHubBridgeDryRunResult,
  PortalPersistedSnapshot,
  PortalStoreCandidate,
  ProposalResult,
  PublicControlPlaneProjection,
} from "@demo/domain";
import copy from "./_locales/pt-br.json";

type AuthSummary = {
  library: "better-auth";
  organizationPluginLoaded: boolean;
  requiredEndpoints: Array<{ id: string; available: boolean }>;
  boundary: string[];
};

type StoreProfileStatus = {
  id: PortalStoreCandidate["id"];
  betterAuthSupported: boolean;
  readyForSpike: boolean;
  liveCheck: {
    status: "not-required" | "skipped-without-database-url" | "not-portal-store";
  };
};

type StoreReport = {
  summary: {
    sqliteReady: boolean;
    postgresReady: boolean;
    neo4jRejectedAsPortalStore: boolean;
    postgresLiveConnectionRequiredForThisSpike: false;
  };
  profiles: StoreProfileStatus[];
};

const m = copy.messages;

export default function ControlPlanePortalSpikeView({
  auth,
  projection,
  proposal,
  bridgeDryRun,
  persistedSnapshot,
  staleProposal,
  secretLeakCount,
  storeCandidates,
  storeReport,
  sqliteHttpReport,
  inviteAcceptReport,
  postgresLiveReport,
}: {
  auth: AuthSummary;
  projection: PublicControlPlaneProjection;
  proposal: ProposalResult;
  bridgeDryRun: GitHubBridgeDryRunResult;
  persistedSnapshot: PortalPersistedSnapshot;
  staleProposal: ProposalResult;
  secretLeakCount: number;
  storeCandidates: PortalStoreCandidate[];
  storeReport: StoreReport;
  sqliteHttpReport: SQLiteHttpReport;
  inviteAcceptReport: InviteAcceptReport;
  postgresLiveReport: PostgresLiveReport;
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
              bridgeDryRun.ok ? "GitHub bridge em dry-run" : "bridge bloqueado",
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

        <SectionCard title={m.storeTitle} subtitle={m.storeSubtitle}>
          <Box sx={{ display: "grid", gridTemplateColumns: { md: "1fr 1fr 1fr" }, gap: 2 }}>
            {storeCandidates.map((candidate) => {
              const profile = storeReport.profiles.find((item) => item.id === candidate.id);
              return (
                <BoundaryCard
                  key={candidate.id}
                  icon={
                    profile?.readyForSpike ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <LockIcon color="primary" />
                    )
                  }
                  title={candidate.label}
                  items={[
                    storeDecisionLabel(candidate.decision),
                    profile?.readyForSpike
                      ? m.storeReady
                      : candidate.betterAuthSupported
                        ? m.storeNeedsLiveDb
                        : m.storeNotPortal,
                    candidate.summary,
                    ...candidate.constraints.slice(0, 2),
                  ]}
                />
              );
            })}
          </Box>
          <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
            {storeReport.summary.sqliteReady &&
            storeReport.summary.postgresReady &&
            storeReport.summary.neo4jRejectedAsPortalStore
              ? m.storeProofOk
              : m.storeProofRisk}
          </Alert>
        </SectionCard>

        <SQLiteHttpSection report={sqliteHttpReport} messages={m} />

        <InviteAcceptSection
          inviteAccept={inviteAcceptReport}
          postgres={postgresLiveReport}
          messages={m}
        />

        <SectionCard title={m.persistenceTitle} subtitle={m.persistenceSubtitle}>
          <Box sx={{ display: "grid", gridTemplateColumns: { md: "1fr 1fr 1fr" }, gap: 2 }}>
            <BoundaryCard
              icon={<CheckCircleIcon color="success" />}
              title={m.snapshotTitle}
              items={[
                `schemaVersion ${persistedSnapshot.schemaVersion}`,
                `${persistedSnapshot.memberships.length} memberships persistiveis`,
                `${persistedSnapshot.proposals.length} propostas persistiveis`,
              ]}
            />
            <BoundaryCard
              icon={<AccountTreeIcon color="primary" />}
              title={m.bridgeTitle}
              items={[
                bridgeDryRun.ok ? bridgeDryRun.repo : "sem PR candidate",
                bridgeDryRun.ok ? bridgeDryRun.branchCandidate : "proposal requerida",
                bridgeDryRun.ok && !bridgeDryRun.writesToRemote ? "zero escrita remota" : "risco",
              ]}
            />
            <BoundaryCard
              icon={<LockIcon color="primary" />}
              title={m.secretTitle}
              items={[
                `${secretLeakCount} vazamentos detectados`,
                persistedSnapshot.providerLinks[0]?.installationIdRedacted ?? "sem provider",
                "provider secret fora do snapshot",
              ]}
            />
          </Box>
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
            <ProofRow label="S1b" ok={bridgeDryRun.ok && persistedSnapshot.proposals.length === 1}>
              {m.proofS1b}
            </ProofRow>
            <ProofRow
              label="S1c"
              ok={
                storeReport.summary.sqliteReady &&
                storeReport.summary.postgresReady &&
                storeReport.summary.neo4jRejectedAsPortalStore
              }
            >
              {m.proofS1c}
            </ProofRow>
            <ProofRow label="S1d" ok={sqliteHttpReport.ok}>
              {m.proofS1d}
            </ProofRow>
            <ProofRow label="S1e" ok={inviteAcceptReport.ok}>
              {m.proofS1e}
            </ProofRow>
          </Box>
        </SectionCard>
      </Box>
    </AppShell>
  );
}

function storeDecisionLabel(decision: PortalStoreCandidate["decision"]): string {
  if (decision === "local-default") return m.storeLocalDefault;
  if (decision === "shared-default") return m.storeSharedDefault;
  return m.storeGraphOnly;
}
