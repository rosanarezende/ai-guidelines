"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Chip, Divider, MenuItem, TextField, Typography } from "@mui/material";
import type {
  RoleAssignment,
  SubjectKind,
  SubjectRef,
  WorkspaceRoleId,
} from "@demo/contracts";
import { Flex, ResponsiveGrid } from "@/app/_ui/shared";
import {
  assignWorkspaceRole,
  decideWorkspaceRole,
  getMembersOverview,
  getRolesOverview,
  type MembersOverview,
  type RolesOverview,
} from "@/app/_domain/adoption/shellClient";
import copy from "./_locales/pt-br.json";

const m = copy as {
  [key: string]: unknown;
  roles: Record<WorkspaceRoleId, string>;
  subjectKinds: Record<SubjectKind, string>;
};

type SubjectOption = {
  value: string;
  ref: SubjectRef;
  label: string;
};

function subjectKey(subject: SubjectRef): string {
  return `${subject.kind}:${subject.id}`;
}

function parseSubject(value: string): SubjectRef {
  const [kind, id] = value.split(":");
  return { kind: kind as SubjectKind, id: id || "" };
}

function statusColor(status: RoleAssignment["status"]): "default" | "success" | "warning" {
  if (status === "accepted" || status === "self-assigned") return "success";
  if (status === "proposed") return "warning";
  return "default";
}

export default function RolesSection() {
  const [roles, setRoles] = useState<RolesOverview | null>(null);
  const [members, setMembers] = useState<MembersOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [subjectValue, setSubjectValue] = useState("");
  const [roleId, setRoleId] = useState<WorkspaceRoleId | "">("");
  const [reason, setReason] = useState("");

  async function refresh() {
    setError(null);
    const [rolesResult, membersResult] = await Promise.all([
      getRolesOverview(),
      getMembersOverview(),
    ]);
    if (!rolesResult.ok) {
      setError(rolesResult.error);
      return;
    }
    if (!membersResult.ok) {
      setError(membersResult.error);
      return;
    }
    setRoles(rolesResult);
    setMembers(membersResult);
    if (!roleId && rolesResult.roleCatalog[0]) setRoleId(rolesResult.roleCatalog[0]);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const subjects = useMemo<SubjectOption[]>(() => {
    const people =
      members?.people.map((person) => ({
        value: subjectKey({ kind: "person", id: person.id }),
        ref: { kind: "person" as const, id: person.id },
        label: `${person.displayName} · ${m.subjectKinds.person}`,
      })) ?? [];
    const groups =
      members?.groups.map((group) => ({
        value: subjectKey({ kind: group.kind, id: group.id }),
        ref: { kind: group.kind, id: group.id },
        label: `${group.name} · ${m.subjectKinds[group.kind]}`,
      })) ?? [];
    return [...people, ...groups];
  }, [members]);

  useEffect(() => {
    if (!subjectValue && subjects[0]) setSubjectValue(subjects[0].value);
  }, [subjectValue, subjects]);

  async function assign() {
    if (!subjectValue || !roleId) return;
    setBusy(true);
    setError(null);
    const result = await assignWorkspaceRole({
      subject: parseSubject(subjectValue),
      roleId,
      ...(reason.trim() ? { reason } : {}),
    });
    if (!result.ok) {
      setError(result.error);
    } else {
      setReason("");
      await refresh();
    }
    setBusy(false);
  }

  async function decide(assignmentId: string, action: "accept" | "reject" | "revoke") {
    setBusy(true);
    setError(null);
    const result = await decideWorkspaceRole(assignmentId, { action });
    if (!result.ok) setError(result.error);
    await refresh();
    setBusy(false);
  }

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {String(m.lead)}
      </Typography>
      {error ? <Alert severity="error">{String(m.error).replace("{error}", error)}</Alert> : null}

      <ResponsiveGrid min={240} gap={1.5}>
        <Box sx={{ display: "grid", gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            {String(m.assignTitle)}
          </Typography>
          <TextField
            select
            size="small"
            label={String(m.subjectLabel)}
            value={subjectValue}
            disabled={!subjects.length}
            onChange={(event) => setSubjectValue(event.target.value)}
          >
            {subjects.length ? (
              subjects.map((subject) => (
                <MenuItem key={subject.value} value={subject.value}>
                  {subject.label}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="" disabled>
                -
              </MenuItem>
            )}
          </TextField>
          <TextField
            select
            size="small"
            label={String(m.roleLabel)}
            value={roleId}
            disabled={!roles?.roleCatalog.length}
            onChange={(event) => setRoleId(event.target.value as WorkspaceRoleId)}
          >
            {roles?.roleCatalog.length ? (
              roles.roleCatalog.map((role) => (
                <MenuItem key={role} value={role}>
                  {m.roles[role]}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="" disabled>
                -
              </MenuItem>
            )}
          </TextField>
          <TextField
            size="small"
            label={String(m.reasonLabel)}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          <Button variant="contained" disabled={busy || !subjectValue || !roleId} onClick={assign}>
            {subjectValue.startsWith("person:") ? String(m.assignSelfCta) : String(m.assignCta)}
          </Button>
        </Box>

        <Box sx={{ display: "grid", gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            {String(m.authority)}
          </Typography>
          {roles?.authority.length ? (
            roles.authority.map((grant) => (
              <Flex key={`${grant.assignmentId}-${grant.personId}-${grant.roleId}`} gap={1} wrap>
                <Chip size="small" color="success" label={m.roles[grant.roleId]} />
                <Typography variant="caption" color="text.secondary">
                  {grant.personId} · {String(m.origin)}: {grant.origin}
                </Typography>
              </Flex>
            ))
          ) : (
            <Typography variant="caption" color="text.secondary">
              {String(m.noAuthority)}
            </Typography>
          )}
        </Box>
      </ResponsiveGrid>

      <Divider />

      <Box sx={{ display: "grid", gap: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          {String(m.assignments)}
        </Typography>
        {roles?.roleAssignments.length ? (
          roles.roleAssignments.map((assignment) => (
            <Flex
              key={assignment.id}
              gap={1}
              align="center"
              justify="space-between"
              wrap
              sx={{ py: 0.75, borderTop: "1px solid", borderColor: "divider" }}
            >
              <Box>
                <Flex gap={1} align="center" wrap>
                  <Chip size="small" label={m.roles[assignment.roleId]} />
                  <Chip
                    size="small"
                    color={statusColor(assignment.status)}
                    label={`${String(m.status)}: ${assignment.status}`}
                  />
                </Flex>
                <Typography variant="caption" color="text.secondary">
                  {m.subjectKinds[assignment.subject.kind]} {assignment.subject.id}
                  {assignment.reason ? ` · ${assignment.reason}` : ""}
                </Typography>
              </Box>
              <Flex gap={0.5} wrap>
                {assignment.status === "proposed" ? (
                  <>
                    <Button
                      size="small"
                      disabled={busy}
                      onClick={() => void decide(assignment.id, "accept")}
                    >
                      {String(m.accept)}
                    </Button>
                    <Button
                      size="small"
                      color="warning"
                      disabled={busy}
                      onClick={() => void decide(assignment.id, "reject")}
                    >
                      {String(m.reject)}
                    </Button>
                  </>
                ) : null}
                {assignment.status !== "revoked" ? (
                  <Button
                    size="small"
                    color="inherit"
                    disabled={busy}
                    onClick={() => void decide(assignment.id, "revoke")}
                  >
                    {String(m.revoke)}
                  </Button>
                ) : null}
              </Flex>
            </Flex>
          ))
        ) : (
          <Typography variant="caption" color="text.secondary">
            {String(m.noAssignments)}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: "grid", gap: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          {String(m.accumulations)}
        </Typography>
        {roles?.sensitiveAccumulations.length ? (
          roles.sensitiveAccumulations.map((item) => (
            <Alert key={item.personId} severity="warning">
              {item.personId}: {item.roles.map((role) => m.roles[role]).join(", ")}
            </Alert>
          ))
        ) : (
          <Typography variant="caption" color="text.secondary">
            {String(m.noAccumulations)}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
