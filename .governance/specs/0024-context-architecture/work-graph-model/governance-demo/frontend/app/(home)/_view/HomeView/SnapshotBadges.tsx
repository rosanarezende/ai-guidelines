import { Chip } from "@mui/material";
import type { GovernanceSnapshot } from "@/lib/types";
import { Flex } from "@/app/_ui/shared";
import { format } from "./format";
import copy from "./_locales/pt-br.json";

export function SnapshotBadges({ snapshot }: { snapshot: GovernanceSnapshot }) {
  return (
    <Flex wrap gap={1}>
      <Chip
        size="small"
        variant="outlined"
        label={format(copy.snapshot.revision, { revision: snapshot.revision })}
      />
      <Chip
        size="small"
        variant="outlined"
        label={format(copy.snapshot.issues, {
          errors: String(snapshot.counts.errors),
          warnings: String(snapshot.counts.warnings),
        })}
      />
    </Flex>
  );
}
