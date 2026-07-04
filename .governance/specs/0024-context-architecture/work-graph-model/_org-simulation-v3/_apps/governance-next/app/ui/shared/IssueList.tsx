import { Alert, Box, Typography } from "@mui/material";
import type { GovernanceIssue } from "@/lib/types";
import copy from "./locales/pt-br.json";

export function IssueList({ issues, limit = 8 }: { issues: GovernanceIssue[]; limit?: number }) {
  const visible = issues.slice(0, limit);
  if (!visible.length) return <Alert severity="success">{copy.issueList.empty}</Alert>;
  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      {visible.map((issue, index) => (
        <Alert
          key={`${issue.rule}-${issue.node}-${index}`}
          severity={issue.level === "error" ? "error" : "warning"}
        >
          <strong>{issue.rule}</strong> · {issue.node} · {issue.msg}
        </Alert>
      ))}
      {issues.length > visible.length ? (
        <Typography variant="caption" color="text.secondary">
          {copy.issueList.more.replace("{count}", String(issues.length - visible.length))}
        </Typography>
      ) : null}
    </Box>
  );
}
