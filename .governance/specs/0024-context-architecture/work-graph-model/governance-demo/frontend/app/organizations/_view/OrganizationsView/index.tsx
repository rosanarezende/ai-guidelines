"use client";

// OrganizationsView — seleção/criação de organização. Multi-organização real:
// trocar de organização troca sessão e contexto; a demo acme-* é fixture.
import { Alert, Box, Button, Chip, Typography } from "@mui/material";
import ScienceIcon from "@mui/icons-material/Science";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  attachDemoOrganization,
  createOrganization,
  routeAfterSelect,
  selectOrganization,
} from "@/app/_domain/adoption/shellClient";
import { applySensitiveQueryCacheEvent } from "@/app/_domain/cache/sensitive-query-cache";
import { SectionCard } from "@/app/_ui/shared";
import AppShell from "@/app/_ui/shell/AppShell";
import type { WorkspaceKind } from "@demo/contracts";
import { CreateOrganizationForm } from "./CreateOrganizationForm";
import { OrganizationList, type OrganizationListItem } from "./OrganizationList";
import copy from "./_locales/pt-br.json";

const m = copy.messages;

export default function OrganizationsView({
  principalId,
  principalName,
  organizations,
  demoAttached,
}: {
  principalId: string;
  principalName: string;
  organizations: OrganizationListItem[];
  demoAttached: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [portalMembershipStatus, setPortalMembershipStatus] = useState<"pending" | "accepted">(
    "pending"
  );

  async function open(workspaceId: string) {
    setBusyId(workspaceId);
    setError(null);
    const result = await selectOrganization(workspaceId);
    if (!result.ok) {
      setError(m["organizations.error.generic"].replace("{error}", result.error));
      setBusyId(null);
      return;
    }
    await applySensitiveQueryCacheEvent(queryClient, {
      type: "workspace-switch",
      accountId: principalId,
      toWorkspaceId: result.workspace.id,
    });
    router.push(routeAfterSelect(result.workspace));
  }

  async function create(input: { name: string; kind: WorkspaceKind }) {
    setBusyId("create");
    setError(null);
    const result = await createOrganization(input);
    if (!result.ok) {
      setError(m["organizations.error.generic"].replace("{error}", result.error));
      setBusyId(null);
      return;
    }
    await applySensitiveQueryCacheEvent(queryClient, {
      type: "workspace-switch",
      accountId: principalId,
      toWorkspaceId: result.workspace.id,
    });
    router.push("/onboarding");
  }

  async function startDemo() {
    setBusyId("demo");
    setError(null);
    const result = await attachDemoOrganization();
    if (!result.ok) {
      setError(m["organizations.error.generic"].replace("{error}", result.error));
      setBusyId(null);
      return;
    }
    await applySensitiveQueryCacheEvent(queryClient, {
      type: "workspace-switch",
      accountId: principalId,
      toWorkspaceId: result.workspace.id,
    });
    router.push(routeAfterSelect(result.workspace));
  }

  return (
    <AppShell
      chip="local-principal"
      navigationMode="public"
      cacheScope={{ accountId: principalId, session: "portal" }}
    >
      <Box sx={{ maxWidth: 720, mx: "auto", display: "grid", gap: 2.5 }}>
        <Box sx={{ display: "grid", gap: 0.75 }}>
          <Typography sx={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" }}>
            {m["organizations.title"]}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {m["organizations.greeting"].replace("{name}", principalName)} {m["organizations.lead"]}
          </Typography>
        </Box>

        {error ? <Alert severity="warning">{error}</Alert> : null}

        <SectionCard title="Identidade e cache">
          <Box sx={{ display: "grid", gap: 1 }}>
            <Alert data-testid="auth-provider-better-auth" severity="info">
              Better Auth roda dentro do app Next.js como portal de identidade. Outro runtime
              TanStack não é requisito desta arquitetura.
            </Alert>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
              <Button
                data-testid="accept-invite-as-member"
                size="small"
                variant="outlined"
                onClick={() => setPortalMembershipStatus("accepted")}
              >
                Simular aceite de convite do portal
              </Button>
              <Chip
                data-testid="portal-membership-status"
                size="small"
                color={portalMembershipStatus === "accepted" ? "success" : "warning"}
                label={`portal membership: ${portalMembershipStatus}`}
              />
            </Box>
            <Alert data-testid="governance-authority-status" severity="warning">
              Sem authority governada: login/convite identifica a pessoa, mas papéis efetivos
              continuam derivados do governance host.
            </Alert>
          </Box>
        </SectionCard>

        <SectionCard title={m["organizations.list.title"]}>
          <Box sx={{ mb: 1.5 }}>
            <Button data-testid="workspace-switcher" size="small" href="#workspace-real-list">
              {m["organizations.list.switcher"]}
            </Button>
          </Box>
          <OrganizationList organizations={organizations} busyId={busyId} onOpen={open} />
        </SectionCard>

        <SectionCard title={m["organizations.create.title"]}>
          <CreateOrganizationForm busy={busyId === "create"} onCreate={create} />
        </SectionCard>

        {!demoAttached ? (
          <SectionCard title={m["organizations.demo.title"]}>
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <Typography variant="body2" color="text.secondary">
                {m["organizations.demo.desc"]}
              </Typography>
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<ScienceIcon fontSize="small" />}
                  disabled={busyId !== null}
                  onClick={startDemo}
                >
                  {m["organizations.demo.cta"]}
                </Button>
              </Box>
            </Box>
          </SectionCard>
        ) : null}
      </Box>
    </AppShell>
  );
}
