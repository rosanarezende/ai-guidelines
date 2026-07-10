import { Box, Button, Chip, Typography } from "@mui/material";
import type { RoleAssignment, SubjectKind, WorkspaceRoleId } from "@demo/contracts";
import { Flex } from "@/app/_ui/shared";
import type { RolesOverview } from "@/app/_domain/adoption/shellClient";
import copy from "./_locales/pt-br.json";

const m = copy as {
  [key: string]: unknown;
  roles: Record<WorkspaceRoleId, string>;
  subjectKinds: Record<SubjectKind, string>;
};

function statusColor(status: RoleAssignment["status"]): "default" | "success" | "warning" {
  if (status === "accepted" || status === "self-assigned") return "success";
  if (status === "proposed") return "warning";
  return "default";
}

export function RoleAssignmentsList({
  busy,
  roles,
  onDecide,
}: {
  busy: boolean;
  roles: RolesOverview | null;
  onDecide: (assignmentId: string, action: "accept" | "reject" | "revoke") => void;
}) {
  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 800 }}>
        {String(m.assignments)}
      </Typography>
      {roles?.roleAssignments.length ? (
        <Box data-testid="role-assignment-status" sx={{ display: "grid", gap: 0.75 }}>
          {roles.roleAssignments.map((assignment) => (
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
                      onClick={() => onDecide(assignment.id, "accept")}
                    >
                      {String(m.accept)}
                    </Button>
                    <Button
                      size="small"
                      color="warning"
                      disabled={busy}
                      onClick={() => onDecide(assignment.id, "reject")}
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
                    onClick={() => onDecide(assignment.id, "revoke")}
                  >
                    {String(m.revoke)}
                  </Button>
                ) : null}
              </Flex>
            </Flex>
          ))}
        </Box>
      ) : (
        <Typography data-testid="role-assignment-status" variant="caption" color="text.secondary">
          {String(m.noAssignments)}
        </Typography>
      )}
    </Box>
  );
}
