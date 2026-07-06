"use client";

// WorkspaceHome — home de organização NÃO-demo. Sem snapshot acme: o contexto
// desta organização é dela; estados vazios são mostrados com honestidade.
import { Alert, Box, Button, Chip, Paper, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import Link from "next/link";
import { Flex, SectionCard } from "@/app/_ui/shared";
import AppShell from "@/app/_ui/shell/AppShell";
import {
  workspaceHasEvidenceSource,
  workspaceHasGovernanceHost,
  type Workspace,
} from "@demo/domain";
import { profileOption } from "@/app/_domain/adoption/model";
import copy from "./_locales/pt-br.json";

const m = copy.messages;

function ChecklistRow({ label, done, missing }: { label: string; done: boolean; missing: string }) {
  return (
    <Flex
      align="flex-start"
      gap={1.25}
      sx={{ py: 1, borderTop: "1px solid", borderColor: "divider" }}
    >
      {done ? (
        <CheckCircleIcon fontSize="small" color="success" sx={{ mt: 0.25 }} />
      ) : (
        <RadioButtonUncheckedIcon fontSize="small" sx={{ mt: 0.25, color: "#c2c9c2" }} />
      )}
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {done ? m["workspaceHome.checklist.done"] : missing}
        </Typography>
      </Box>
    </Flex>
  );
}

export default function WorkspaceHome({ workspace }: { workspace: Workspace }) {
  const hasProfile = Boolean(workspace.profileDeclaration);
  const hasHost = workspaceHasGovernanceHost(workspace);
  const hasSources = workspaceHasEvidenceSource(workspace);
  const partial = workspace.onboardingStatus === "partial";
  const profile = workspace.profileDeclaration
    ? profileOption(workspace.profileDeclaration.profile)
    : null;

  return (
    <AppShell chip={workspace.name} hasGovernanceHost={Boolean(workspace.governanceHost)}>
      <Box sx={{ maxWidth: 720, mx: "auto", display: "grid", gap: 2.5 }}>
        <Box sx={{ display: "grid", gap: 0.75 }}>
          <Flex align="center" gap={1} wrap>
            <Typography sx={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" }}>
              {m["workspaceHome.title"].replace("{name}", workspace.name)}
            </Typography>
            <Chip size="small" variant="outlined" label={workspace.kind} />
            {!partial ? (
              <Chip
                data-testid="home-onboarding-complete"
                size="small"
                color="success"
                label={m["workspaceHome.complete"]}
              />
            ) : null}
          </Flex>
          <Typography variant="body2" color="text.secondary">
            {m["workspaceHome.lead"]}
          </Typography>
        </Box>

        {partial ? (
          <Alert
            data-testid="home-continue-onboarding"
            severity="info"
            action={
              <Button component={Link} href="/onboarding" size="small">
                {m["workspaceHome.partial.cta"]}
              </Button>
            }
          >
            <strong>{m["workspaceHome.partial.title"]}</strong> — {m["workspaceHome.partial.body"]}
          </Alert>
        ) : null}

        <SectionCard title={m["workspaceHome.checklist.title"]}>
          <Box sx={{ display: "grid" }}>
            <ChecklistRow
              label={m["workspaceHome.checklist.profile"]}
              done={hasProfile}
              missing={m["workspaceHome.checklist.profile.missing"]}
            />
            <ChecklistRow
              label={m["workspaceHome.checklist.host"]}
              done={hasHost}
              missing={m["workspaceHome.checklist.host.missing"]}
            />
            <ChecklistRow
              label={m["workspaceHome.checklist.sources"]}
              done={hasSources}
              missing={m["workspaceHome.checklist.sources.missing"]}
            />
          </Box>
        </SectionCard>

        <SectionCard title={m["workspaceHome.profile.title"]}>
          <Box data-testid="home-governance-profile" sx={{ display: "grid", gap: 0.75 }}>
            {profile ? (
              <>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {profile.label} · {profile.shortLabel}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {m["workspaceHome.profile.policy"]}:{" "}
                  {workspace.profileDeclaration?.sensitiveAccumulationPolicy}
                </Typography>
              </>
            ) : (
              <Alert severity="warning">{m["workspaceHome.profile.missing"]}</Alert>
            )}
          </Box>
        </SectionCard>

        <SectionCard title={m["workspaceHome.sources.title"]}>
          <Box data-testid="home-source-summary" sx={{ display: "grid", gap: 1 }}>
            {workspace.workSources.length ? (
              workspace.workSources.map((source) => (
                <Flex
                  key={source.id}
                  align="center"
                  justify="space-between"
                  gap={1}
                  wrap
                  sx={{ py: 1, borderTop: "1px solid", borderColor: "divider" }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {source.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {source.kind}
                      {source.pathOrUrl ? ` · ${source.pathOrUrl}` : ""}
                    </Typography>
                  </Box>
                  <Flex gap={0.75} wrap>
                    <Chip size="small" variant="outlined" label={source.status} />
                    <Chip
                      size="small"
                      variant="outlined"
                      label={source.sourceTrust ?? "declared"}
                    />
                  </Flex>
                </Flex>
              ))
            ) : (
              <Alert severity="warning">{m["workspaceHome.sources.empty"]}</Alert>
            )}
          </Box>
        </SectionCard>

        <Paper
          data-testid="home-next-safe-step"
          variant="outlined"
          sx={{
            p: 2.5,
            display: "grid",
            gap: 1,
            bgcolor: "primary.main",
            color: "primary.contrastText",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {m["workspaceHome.next.title"]}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
            {m["workspaceHome.next.onboarding"]}
          </Typography>
          <Box>
            <Button
              component={Link}
              href="/onboarding"
              size="small"
              sx={{ bgcolor: "#fff", color: "primary.main", "&:hover": { bgcolor: "#eaf1ec" } }}
            >
              {m["workspaceHome.next.cta"]}
            </Button>
          </Box>
        </Paper>

        <Alert data-testid="home-technical-console-card" severity="info">
          {m["workspaceHome.console.note"]}
        </Alert>
        <Typography variant="caption" color="text.secondary">
          {m["workspaceHome.demo.hint"]}
        </Typography>
      </Box>
    </AppShell>
  );
}
