"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Divider } from "@mui/material";
import type { WorkspaceRoleId } from "@demo/contracts";
import {
  assignWorkspaceRole,
  getMembersOverview,
  getRolesOverview,
  inviteWorkspacePerson,
  type MembersOverview,
  type RolesOverview,
} from "@/app/_domain/adoption/shellClient";
import type { ProfileId } from "@/app/_domain/adoption/model";
import { AdvancedAuthorityPanel } from "./AdvancedAuthorityPanel";
import { CreatorModeSelector } from "./CreatorModeSelector";
import { ResponsibilityFollowup } from "./ResponsibilityFollowup";
import { SelfRoleChecklist } from "./SelfRoleChecklist";
import {
  creatorModes,
  effectiveRoleIds,
  initialMode,
  personName,
  roleLabels,
  type CreatorMode,
} from "./authorityGuideModel";
import copy from "./_locales/pt-br.json";

export function GuidedAuthoritySetup({ profile }: { profile: ProfileId }) {
  const [members, setMembers] = useState<MembersOverview | null>(null);
  const [roles, setRoles] = useState<RolesOverview | null>(null);
  const [mode, setMode] = useState<CreatorMode>(() => initialMode(profile));
  const [selectedRoles, setSelectedRoles] = useState<WorkspaceRoleId[]>(
    () => creatorModes.find((item) => item.id === initialMode(profile))?.roles ?? []
  );
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceRoleId>("source-owner");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  async function refresh() {
    setError(null);
    const [memberResult, roleResult] = await Promise.all([
      getMembersOverview(),
      getRolesOverview(),
    ]);
    if (!memberResult.ok) {
      setError(memberResult.error);
      return;
    }
    if (!roleResult.ok) {
      setError(roleResult.error);
      return;
    }
    setMembers(memberResult);
    setRoles(roleResult);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const modeConfig = creatorModes.find((item) => item.id === mode) ?? creatorModes[0];
  const effective = useMemo(() => effectiveRoleIds(roles), [roles]);
  const openRoles =
    roles?.roleCatalog.filter((roleId) => !effective.has(roleId)) ?? selectedRoles.filter(Boolean);
  const currentPersonId = members?.currentPersonId ?? members?.people[0]?.id;
  const currentPersonName = personName(members);
  const inviteRoleOptions = openRoles.length ? openRoles : (roles?.roleCatalog ?? []);

  useEffect(() => {
    const firstRole = inviteRoleOptions[0];
    if (firstRole && !inviteRoleOptions.includes(inviteRole)) setInviteRole(firstRole);
  }, [inviteRole, inviteRoleOptions]);

  function chooseMode(nextMode: CreatorMode) {
    const config = creatorModes.find((item) => item.id === nextMode);
    setMode(nextMode);
    setSelectedRoles(config?.roles ?? []);
    setNotice(null);
  }

  function toggleRole(roleId: WorkspaceRoleId) {
    setSelectedRoles((current) =>
      current.includes(roleId) ? current.filter((item) => item !== roleId) : [...current, roleId]
    );
  }

  async function assumeSelectedRoles() {
    if (!currentPersonId || selectedRoles.length === 0) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    for (const roleId of selectedRoles) {
      if (effective.has(roleId)) continue;
      const result = await assignWorkspaceRole({
        subject: { kind: "person", id: currentPersonId },
        roleId,
        reason: copy.selfAssignReason,
      });
      if (!result.ok) {
        setError(result.error);
        setBusy(false);
        return;
      }
    }
    await refresh();
    setNotice(copy.selfAssignNotice);
    setBusy(false);
  }

  async function inviteResponsible() {
    if (inviteName.trim().length < 2) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await inviteWorkspacePerson({
      personName: inviteName,
      ...(inviteEmail.trim() ? { email: inviteEmail } : {}),
    });
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }
    setInviteName("");
    setInviteEmail("");
    await refresh();
    setNotice(copy.inviteNotice.replace("{role}", roleLabels[inviteRole]));
    setBusy(false);
  }

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Alert severity="info">{copy.guidedIntro}</Alert>

      {error ? <Alert severity="error">{copy.error.replace("{error}", error)}</Alert> : null}
      {notice ? <Alert severity="success">{notice}</Alert> : null}

      <CreatorModeSelector
        currentPersonName={currentPersonName}
        mode={mode}
        onChoose={chooseMode}
      />

      <SelfRoleChecklist
        busy={busy}
        currentPersonId={currentPersonId}
        effective={effective}
        modeSuggestedCount={modeConfig.roles.length}
        roleCatalog={roles?.roleCatalog ?? []}
        selectedRoles={selectedRoles}
        onAssume={() => void assumeSelectedRoles()}
        onToggleRole={toggleRole}
      />

      <Divider />

      <ResponsibilityFollowup
        busy={busy}
        inviteEmail={inviteEmail}
        inviteName={inviteName}
        inviteRole={inviteRole}
        openRoles={openRoles}
        roleCatalog={roles?.roleCatalog ?? []}
        onInvite={() => void inviteResponsible()}
        setInviteEmail={setInviteEmail}
        setInviteName={setInviteName}
        setInviteRole={setInviteRole}
      />

      <Divider />

      <AdvancedAuthorityPanel
        open={advancedOpen}
        onToggle={() => setAdvancedOpen((current) => !current)}
      />
    </Box>
  );
}
