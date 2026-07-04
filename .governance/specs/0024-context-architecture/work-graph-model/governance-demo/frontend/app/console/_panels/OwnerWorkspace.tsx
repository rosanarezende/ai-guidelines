import { Box, Chip, Typography } from "@mui/material";
import type { GovernanceSnapshot } from "@/lib/types";
import { DataPill, EntityCard, Flex, ResponsiveGrid, SectionCard } from "@/app/_ui/shared";

export default function OwnerWorkspace({ snapshot }: { snapshot: GovernanceSnapshot }) {
  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <SectionCard
        title="Owner Workspace"
        subtitle="Acompanha intents, outcomes e decisoes de valor sem expor a owner ao console tecnico."
      >
        <ResponsiveGrid min={220}>
          <EntityCard title="Intents ativas" subtitle={String(snapshot.counts.intents)} />
          <EntityCard title="Outcomes publicados" subtitle={String(snapshot.counts.outcomes)} />
          <EntityCard title="Verdicts aceitos" subtitle={String(snapshot.counts.verdicts)} />
          <EntityCard title="Proposals no intake" subtitle={String(snapshot.counts.proposals)} />
        </ResponsiveGrid>
      </SectionCard>

      <ResponsiveGrid min={430}>
        {snapshot.portfolio.intents.map((intent) => {
          const outcomes = snapshot.outcomes.filter(
            (outcome) => outcome["emitted-by"] === intent.id
          );
          return (
            <SectionCard
              key={intent.id}
              title={intent.title}
              subtitle={`${intent.id} · ${intent.team} · target ${intent["primary-target"]}`}
              action={<Chip size="small" label={intent.approach} />}
            >
              <Box sx={{ display: "grid", gap: 1 }}>
                <Flex wrap gap={1}>
                  <DataPill label={`signal ${intent.signal}`} />
                  <DataPill label={`${intent.workCount} pecas`} />
                  <DataPill label={`${intent.repos.length} repos`} />
                </Flex>
                {intent["decision-rule"] ? (
                  <Typography variant="body2" color="text.secondary">
                    decision-rule: {intent["decision-rule"]}
                  </Typography>
                ) : null}
                {outcomes.length ? (
                  outcomes.map((outcome) => (
                    <EntityCard
                      key={outcome.id}
                      title={outcome.id}
                      subtitle={`${outcome.metric} · ${outcome.value} · ${outcome.valid ? "soma" : "bloqueado"}`}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Sem outcome publicado.
                  </Typography>
                )}
              </Box>
            </SectionCard>
          );
        })}
      </ResponsiveGrid>
    </Box>
  );
}
