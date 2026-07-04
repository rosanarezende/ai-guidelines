import { Box, Chip, Typography } from "@mui/material";
import type { GovernanceSnapshot } from "@/lib/types";
import {
  DataPill,
  EntityCard,
  Flex,
  ResponsiveGrid,
  SectionCard,
} from "@/app/ui/shared/components";

export default function OpsWorkspace({ snapshot }: { snapshot: GovernanceSnapshot }) {
  const operationalOutcomes = snapshot.outcomes.filter((outcome) =>
    snapshot.operations.standalone.some((work) => work.id === outcome["emitted-by"])
  );

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <SectionCard
        title="Ops Workspace"
        subtitle="Caminho reativo/operacional: incidente, standalone repo-local, outcome operacional e badges de confianca."
      >
        <ResponsiveGrid min={240}>
          <EntityCard title="Incidents" subtitle={String(snapshot.operations.incidents.length)} />
          <EntityCard title="Standalone" subtitle={String(snapshot.operations.standalone.length)} />
          <EntityCard title="Outcomes operacionais" subtitle={String(operationalOutcomes.length)} />
        </ResponsiveGrid>
      </SectionCard>

      <ResponsiveGrid min={390}>
        <SectionCard title="Incidents" subtitle="Instrumentos centrais de resposta">
          <Box sx={{ display: "grid", gap: 1 }}>
            {snapshot.operations.incidents.map((incident) => (
              <EntityCard
                key={incident.id}
                title={incident.id}
                subtitle={`${incident.severity} · ${incident.repo} · ${incident.status || "legado resolvido"}`}
              >
                <Typography variant="body2" color="text.secondary">
                  {incident.origin}
                </Typography>
                <Flex wrap gap={1}>
                  {(incident["follow-ups"] || []).map((followUp) => (
                    <DataPill key={followUp.ref} label={followUp.ref} />
                  ))}
                </Flex>
              </EntityCard>
            ))}
          </Box>
        </SectionCard>

        <SectionCard
          title="Standalone repo-local"
          subtitle="Trabalho operacional fora de intent planejada"
        >
          <Box sx={{ display: "grid", gap: 1 }}>
            {snapshot.operations.standalone.map((work) => (
              <EntityCard
                key={work.id}
                title={work.id}
                subtitle={`${work.kind} · ${work.repo} · ${work.status || "sem lifecycle fechado"}`}
              >
                <Flex wrap gap={1}>
                  <DataPill label={work.placar} />
                  {work.evidence ? <DataPill label="evidence" /> : null}
                  {work.verification ? <DataPill label="verification" /> : null}
                </Flex>
              </EntityCard>
            ))}
          </Box>
        </SectionCard>
      </ResponsiveGrid>

      <SectionCard title="Outcomes operacionais" subtitle="Actual sem intent emissora">
        <ResponsiveGrid min={340}>
          {operationalOutcomes.map((outcome) => (
            <EntityCard
              key={outcome.id}
              title={outcome.id}
              subtitle={`${outcome["emitted-by"]} · ${outcome.metric} · ${outcome.value}`}
            >
              <Flex wrap gap={1}>
                <Chip
                  size="small"
                  color={outcome.valid ? "success" : "warning"}
                  label={outcome.valid ? "soma" : "bloqueado"}
                />
                <DataPill label={`target ${outcome["contributes-to"]}`} />
              </Flex>
            </EntityCard>
          ))}
        </ResponsiveGrid>
      </SectionCard>
    </Box>
  );
}
