import { Box } from "@mui/material";
import type { GovernanceSnapshot } from "@/lib/types";
import { IssueList, ResponsiveGrid, SectionCard, StatCard } from "../components";
import { JsonBlock } from "../shared/JsonBlock";

export default function AuditConsole({ snapshot }: { snapshot: GovernanceSnapshot }) {
  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <ResponsiveGrid min={220}>
        <StatCard
          label="Issues"
          value={`${snapshot.counts.errors}/${snapshot.counts.warnings}`}
          detail="erros / avisos"
        />
        <StatCard label="Graph nodes" value={snapshot.counts.graphNodes} />
        <StatCard label="Graph edges" value={snapshot.counts.graphEdges} />
        <StatCard label="Revision" value={snapshot.revision} />
      </ResponsiveGrid>
      <SectionCard
        title="Resolver issues"
        subtitle="Erros bloqueiam; avisos precisam ser visiveis."
      >
        <IssueList issues={snapshot.issues} limit={12} />
      </SectionCard>
      <SectionCard title="Snapshot bruto" subtitle="Apenas para auditoria tecnica.">
        <JsonBlock
          value={{
            revision: snapshot.revision,
            counts: snapshot.counts,
            profile: snapshot.profileDeclaration,
            issues: snapshot.issues,
          }}
        />
      </SectionCard>
    </Box>
  );
}
