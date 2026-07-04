import { Box, Chip, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import type { DashboardTarget, GovernanceSnapshot } from "@/lib/types";
import {
  DataPill,
  EntityCard,
  Flex,
  ResponsiveGrid,
  SectionCard,
  StatCard,
} from "@/app/ui/shared";

function periods(snapshot: GovernanceSnapshot): string[] {
  return [...new Set(snapshot.targets.map((target) => target.period))].sort();
}

function confidenceLabel(target: DashboardTarget): string {
  if (target.invalidCount > 0) return `${target.invalidCount} bloqueado(s)`;
  if (target.actualCount > 0) return `${target.actualCount} actual valido(s)`;
  return "sem actual";
}

export default function CompanyDashboard({
  snapshot,
  period,
  onPeriodChange,
}: {
  snapshot: GovernanceSnapshot;
  period: string;
  onPeriodChange: (period: string) => void;
}) {
  const availablePeriods = periods(snapshot);
  const filteredTargets = snapshot.targets.filter(
    (target) => period === "todos" || target.period === period
  );
  const objectiveIds = new Set(filteredTargets.map((target) => target["contributes-to"]));
  const filteredObjectives = snapshot.portfolio.objectives.filter((objective) =>
    objectiveIds.has(objective.id)
  );
  const actualTargets = filteredTargets.filter((target) => target.actualCount > 0);
  const weakTargets = filteredTargets.filter(
    (target) =>
      target.invalidCount > 0 || target.actualCount === 0 || target["attestation-collapse"]
  );

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <SectionCard
        title="Company Dashboard"
        subtitle="Visao de stakeholder: objetivos, targets, actual derivado e confianca por ciclo."
        action={
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Periodo</InputLabel>
            <Select
              label="Periodo"
              value={period}
              onChange={(event: SelectChangeEvent) => onPeriodChange(event.target.value)}
            >
              <MenuItem value="todos">todos</MenuItem>
              {availablePeriods.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        }
      >
        <ResponsiveGrid min={220}>
          <StatCard label="Objetivos no recorte" value={filteredObjectives.length} />
          <StatCard label="Targets" value={filteredTargets.length} />
          <StatCard label="Com actual" value={actualTargets.length} tone="success" />
          <StatCard
            label="Requerem atencao"
            value={weakTargets.length}
            tone={weakTargets.length ? "warning" : "success"}
          />
        </ResponsiveGrid>
      </SectionCard>

      <ResponsiveGrid min={420}>
        {filteredObjectives.map((objective) => {
          const targets = filteredTargets.filter(
            (target) => target["contributes-to"] === objective.id
          );
          return (
            <SectionCard
              key={objective.id}
              title={objective.title}
              subtitle={`${objective.id} · owner ${objective.owner} · ${objective.period}`}
              action={<Chip size="small" label={objective.status} />}
            >
              <Box sx={{ display: "grid", gap: 1 }}>
                {targets.map((target) => (
                  <EntityCard
                    key={target.id}
                    title={target.id}
                    subtitle={`${target.node} · ${target.metric?.id || "sem metric"} · ${target.period}`}
                  >
                    <Box sx={{ display: "grid", gap: 0.75 }}>
                      <Typography variant="body2">{target.expected}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        actual: {target.actual}
                      </Typography>
                      <Flex wrap gap={1}>
                        <DataPill label={confidenceLabel(target)} />
                        {target["attestation-collapse"] ? (
                          <DataPill label="attestation colapsada" />
                        ) : null}
                      </Flex>
                    </Box>
                  </EntityCard>
                ))}
              </Box>
            </SectionCard>
          );
        })}
      </ResponsiveGrid>
    </Box>
  );
}
