import { Chip, Paper } from "@mui/material";
import type { GovernanceSnapshot } from "@/lib/types";
import { Flex, IssueList } from "@/app/ui/shared";

export function ConsoleProfilePanel({ snapshot }: { snapshot: GovernanceSnapshot }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Flex direction="column" gap={1}>
        <Flex wrap gap={1}>
          <Chip size="small" label={`profile ${snapshot.profileDeclaration.profile}`} />
          <Chip size="small" label={`scope ${snapshot.profileDeclaration.scope}`} />
          <Chip
            size="small"
            label={`approved-by ${snapshot.profileDeclaration["approved-by"] || "nao resolvido"}`}
          />
        </Flex>
        <IssueList issues={snapshot.issues} limit={3} />
      </Flex>
    </Paper>
  );
}
