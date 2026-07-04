"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Chip, Divider, MenuItem, TextField, Typography } from "@mui/material";
import { Flex, ResponsiveGrid } from "@/app/_ui/shared";
import {
  createWorkspaceGroup,
  getMembersOverview,
  inviteWorkspacePerson,
  type MembersOverview,
} from "@/app/_domain/adoption/shellClient";
import copy from "./_locales/pt-br.json";

type LoadState = "idle" | "loading" | "loaded" | "error";

const m = copy as Record<string, string>;

export default function MembersSection() {
  const [state, setState] = useState<LoadState>("idle");
  const [overview, setOverview] = useState<MembersOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [groupKind, setGroupKind] = useState<"team" | "group">("team");
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setState("loading");
    setError(null);
    const result = await getMembersOverview();
    if (!result.ok) {
      setState("error");
      setError(result.error);
      return;
    }
    setOverview(result);
    setState("loaded");
  }

  useEffect(() => {
    void refresh();
  }, []);

  const personIds = useMemo(() => overview?.people.map((person) => person.id) ?? [], [overview]);

  async function invite() {
    setBusy(true);
    setError(null);
    setInviteToken(null);
    const result = await inviteWorkspacePerson({
      personName: inviteName,
      ...(inviteEmail.trim() ? { email: inviteEmail } : {}),
    });
    if (!result.ok) {
      setError(result.error);
    } else {
      setInviteToken(result.invite.token);
      setInviteName("");
      setInviteEmail("");
      await refresh();
    }
    setBusy(false);
  }

  async function createGroup() {
    setBusy(true);
    setError(null);
    const memberPersonIds = groupMembers
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const result = await createWorkspaceGroup({
      kind: groupKind,
      name: groupName,
      memberPersonIds,
    });
    if (!result.ok) {
      setError(result.error);
    } else {
      setGroupName("");
      setGroupMembers("");
      await refresh();
    }
    setBusy(false);
  }

  if (state === "loading" || state === "idle") {
    return <Typography variant="body2">{m.lead}</Typography>;
  }

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {m.lead}
      </Typography>
      {error ? <Alert severity="error">{m.error.replace("{error}", error)}</Alert> : null}
      {inviteToken ? (
        <Alert severity="success">
          <strong>{m.inviteToken.replace("{token}", inviteToken)}</strong>
          <br />
          {m.inviteTokenHelp}
        </Alert>
      ) : null}

      <ResponsiveGrid min={240} gap={1.5}>
        <Box sx={{ display: "grid", gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            {m.people}
          </Typography>
          {overview?.people.length ? (
            overview.people.map((person) => (
              <Flex key={person.id} gap={1} align="center" wrap>
                <Chip size="small" label={person.displayName} />
                <Typography variant="caption" color="text.secondary">
                  {person.id}
                </Typography>
              </Flex>
            ))
          ) : (
            <Typography variant="caption" color="text.secondary">
              {m.noPeople}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: "grid", gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            {m.groups}
          </Typography>
          {overview?.groups.length ? (
            overview.groups.map((group) => (
              <Box key={group.id} sx={{ display: "grid", gap: 0.5 }}>
                <Flex gap={1} align="center" wrap>
                  <Chip size="small" variant="outlined" label={group.kind} />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {group.name}
                  </Typography>
                </Flex>
                <Typography variant="caption" color="text.secondary">
                  {group.memberPersonIds.join(", ") || m.noGroupMembers} · {m.managedBy}:{" "}
                  {group.managedBy ?? "local"}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography variant="caption" color="text.secondary">
              {m.noGroups}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: "grid", gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            {m.invites}
          </Typography>
          {overview?.invites.length ? (
            overview.invites.map((invite) => (
              <Box key={invite.id} sx={{ display: "grid", gap: 0.5 }}>
                <Flex gap={1} align="center" wrap>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {invite.personName}
                  </Typography>
                  <Chip size="small" label={`${m.status}: ${invite.status}`} />
                </Flex>
                <Typography variant="caption" color="text.secondary">
                  {invite.email ? `${invite.email} · ` : ""}
                  {m.expires}: {invite.expiresAt.slice(0, 10)}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography variant="caption" color="text.secondary">
              {m.noInvites}
            </Typography>
          )}
        </Box>
      </ResponsiveGrid>

      <Divider />

      <ResponsiveGrid min={280} gap={1.5}>
        <Box sx={{ display: "grid", gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            {m.inviteTitle}
          </Typography>
          <TextField
            size="small"
            label={m.nameLabel}
            value={inviteName}
            onChange={(event) => setInviteName(event.target.value)}
          />
          <TextField
            size="small"
            label={m.emailLabel}
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
          />
          <Button
            variant="contained"
            disabled={busy || inviteName.trim().length < 2}
            onClick={() => void invite()}
          >
            {m.inviteCta}
          </Button>
        </Box>

        <Box sx={{ display: "grid", gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            {m.groupTitle}
          </Typography>
          <TextField
            select
            size="small"
            label={m.groupKindLabel}
            value={groupKind}
            onChange={(event) => setGroupKind(event.target.value as "team" | "group")}
          >
            <MenuItem value="team">{m.groupKindTeam}</MenuItem>
            <MenuItem value="group">{m.groupKindGroup}</MenuItem>
          </TextField>
          <TextField
            size="small"
            label={m.groupNameLabel}
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
          />
          <TextField
            size="small"
            label={m.memberHint}
            value={groupMembers}
            helperText={personIds.join(", ") || undefined}
            onChange={(event) => setGroupMembers(event.target.value)}
          />
          <Button
            variant="outlined"
            disabled={busy || groupName.trim().length < 2}
            onClick={() => void createGroup()}
          >
            {m.groupCta}
          </Button>
        </Box>
      </ResponsiveGrid>
    </Box>
  );
}
