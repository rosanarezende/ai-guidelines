import type { GovernanceIssue, GovernanceSnapshot } from "@demo/contracts";
import { ResponsiveGrid, StatCard } from "@/app/_ui/shared";

export function ConsoleStats({
  snapshot,
  blockingErrors,
  warnings,
}: {
  snapshot: GovernanceSnapshot;
  blockingErrors: GovernanceIssue[];
  warnings: GovernanceIssue[];
}) {
  return (
    <ResponsiveGrid min={220}>
      <StatCard label="Revision" value={snapshot.revision} />
      <StatCard
        label="Graph"
        value={`${snapshot.counts.graphNodes}/${snapshot.counts.graphEdges}`}
        detail="nos / arestas"
      />
      <StatCard label="Intents" value={snapshot.counts.intents} />
      <StatCard
        label="Resolver"
        value={`${blockingErrors.length}/${warnings.length}`}
        detail="erros / avisos"
        tone={blockingErrors.length ? "error" : warnings.length ? "warning" : "success"}
      />
    </ResponsiveGrid>
  );
}
