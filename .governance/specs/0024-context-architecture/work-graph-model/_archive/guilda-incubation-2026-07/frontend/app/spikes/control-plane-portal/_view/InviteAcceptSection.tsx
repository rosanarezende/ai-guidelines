"use client";

import { Alert, Box } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import NoEncryptionGmailerrorredIcon from "@mui/icons-material/NoEncryptionGmailerrorred";
import StorageIcon from "@mui/icons-material/Storage";
import { SectionCard } from "@/app/_ui/shared";
import { BoundaryCard } from "./SpikeCards";

export type InviteAcceptReport = {
  ok: boolean;
  http: {
    creatorSignUpStatus: number;
    createOrganizationStatus: number;
    inviteMemberStatus: number;
    inviteeSignUpStatus: number;
    acceptInvitationStatus: number;
    creatorListOrganizationsStatus: number;
    inviteeListOrganizationsStatus: number;
    creatorCookieIssued: boolean;
    inviteeCookieIssued: boolean;
  };
  persisted: {
    userCount: number;
    sessionCount: number;
    organizationCount: number;
    memberCount: number;
    invitationCount: number;
    acceptedInvitationCount: number;
    ownerMemberCount: number;
    invitedMemberCount: number;
    organizationSlug: string | null;
  };
  sharedAccess: {
    creatorOrganizationCount: number;
    inviteeOrganizationCount: number;
    creatorSeesWorkspace: boolean;
    inviteeSeesWorkspace: boolean;
    sameWorkspaceVisibleToBoth: boolean;
  };
  boundary: {
    invitedUserOperatedGitHub: false;
    governanceAuthorityGrantedByPortal: false;
    contentPlaneRead: false;
  };
};

export type PostgresLiveReport = {
  status: "skipped-without-database-url" | "skipped-without-explicit-apply" | "passed" | "failed";
  ok: boolean;
  env: {
    databaseUrlProvided: boolean;
    explicitApply: boolean;
  };
  sharedAccess?: InviteAcceptReport["sharedAccess"];
};

export function InviteAcceptSection({
  inviteAccept,
  postgres,
  messages,
}: {
  inviteAccept: InviteAcceptReport;
  postgres: PostgresLiveReport;
  messages: Record<string, string>;
}) {
  return (
    <SectionCard title={messages.inviteAcceptTitle} subtitle={messages.inviteAcceptSubtitle}>
      <Box sx={{ display: "grid", gridTemplateColumns: { md: "1fr 1fr 1fr" }, gap: 2 }}>
        <BoundaryCard
          icon={inviteAccept.ok ? <CheckCircleIcon color="success" /> : <LockIcon color="error" />}
          title={messages.inviteAcceptFlow}
          items={[
            `creator signup: ${inviteAccept.http.creatorSignUpStatus}`,
            `invite-member: ${inviteAccept.http.inviteMemberStatus}`,
            `guest signup: ${inviteAccept.http.inviteeSignUpStatus}`,
            `accept-invitation: ${inviteAccept.http.acceptInvitationStatus}`,
            inviteAccept.sharedAccess.sameWorkspaceVisibleToBoth
              ? "mesmo workspace visivel para ambas"
              : "workspace compartilhado nao provado",
          ]}
        />
        <BoundaryCard
          icon={<NoEncryptionGmailerrorredIcon color="primary" />}
          title={messages.inviteAcceptBoundary}
          items={[
            inviteAccept.boundary.invitedUserOperatedGitHub
              ? "convidado operou GitHub"
              : "convidado sem GitHub",
            inviteAccept.boundary.governanceAuthorityGrantedByPortal
              ? "authority vazou"
              : "zero authority governada",
            inviteAccept.boundary.contentPlaneRead ? "conteudo lido" : "sem content plane",
          ]}
        />
        <BoundaryCard
          icon={<StorageIcon color={postgres.ok ? "success" : "primary"} />}
          title={messages.postgresLiveTitle}
          items={[
            postgresStatusLabel(postgres.status, messages),
            postgres.env.databaseUrlProvided ? "URL configurada" : "sem URL",
            postgres.env.explicitApply ? "apply explicito" : "sem apply explicito",
            postgres.sharedAccess?.sameWorkspaceVisibleToBoth
              ? "workspace compartilhado provado"
              : "workspace compartilhado pendente",
          ]}
        />
      </Box>
      <Alert severity={inviteAccept.ok ? "success" : "error"} variant="outlined" sx={{ mt: 2 }}>
        {inviteAccept.ok ? messages.inviteAcceptProofOk : messages.inviteAcceptProofRisk}
      </Alert>
    </SectionCard>
  );
}

function postgresStatusLabel(
  status: PostgresLiveReport["status"],
  messages: Record<string, string>
) {
  if (status === "passed") return messages.postgresLivePassed;
  if (status === "failed") return messages.postgresLiveFailed;
  if (status === "skipped-without-explicit-apply") return messages.postgresLiveNeedsApply;
  return messages.postgresLiveNoUrl;
}
