"use client";

// OrganizationsView — seleção/criação de organização. Multi-organização real:
// trocar de organização troca sessão e contexto; a demo acme-* é fixture.
import { Alert, Box, Button, Typography } from "@mui/material";
import ScienceIcon from "@mui/icons-material/Science";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  attachDemoOrganization,
  createOrganization,
  routeAfterSelect,
  selectOrganization,
} from "@/app/_domain/adoption/shellClient";
import { SectionCard } from "@/app/_ui/shared";
import AppShell from "@/app/_ui/shell/AppShell";
import type { WorkspaceKind } from "@demo/contracts";
import { CreateOrganizationForm } from "./CreateOrganizationForm";
import { OrganizationList, type OrganizationListItem } from "./OrganizationList";
import copy from "./_locales/pt-br.json";

const m = copy.messages;

export default function OrganizationsView({
  principalName,
  organizations,
  demoAttached,
}: {
  principalName: string;
  organizations: OrganizationListItem[];
  demoAttached: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function open(workspaceId: string) {
    setBusyId(workspaceId);
    setError(null);
    const result = await selectOrganization(workspaceId);
    if (!result.ok) {
      setError(m["organizations.error.generic"].replace("{error}", result.error));
      setBusyId(null);
      return;
    }
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
    router.push(routeAfterSelect(result.workspace));
  }

  return (
    <AppShell chip="local-principal" navigationMode="public">
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

        <SectionCard title={m["organizations.list.title"]}>
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
