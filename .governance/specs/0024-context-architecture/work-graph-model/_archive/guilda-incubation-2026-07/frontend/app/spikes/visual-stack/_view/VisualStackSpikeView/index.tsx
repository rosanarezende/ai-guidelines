"use client";

// VisualStackSpikeView — bancada comparativa da stack visual (QRD-27).
// Fora da navegação de produto: acesso direto por /spikes/visual-stack.
import { Alert, Box, Typography } from "@mui/material";
import ScienceIcon from "@mui/icons-material/Science";
import { Flex, SectionCard } from "@/app/_ui/shared";
import AppShell from "@/app/_ui/shell/AppShell";
import type {
  GovernanceDashboardViewModel,
  GovernanceGraphViewModel,
  GovernanceMapViewModel,
  GovernanceTableViewModel,
} from "../../_model/view-models";
import { DashboardSection } from "./DashboardSection";
import { GraphSection } from "./GraphSection";
import { MapSection } from "./MapSection";
import { ServerStateSection } from "./ServerStateSection";
import { SummaryMatrix } from "./SummaryMatrix";
import { TableSection } from "./TableSection";
import copy from "./_locales/pt-br.json";

const m = copy.messages;

export default function VisualStackSpikeView({
  maps,
  dashboard,
  table,
  realGraph,
}: {
  maps: GovernanceMapViewModel[];
  dashboard: GovernanceDashboardViewModel;
  table: GovernanceTableViewModel;
  realGraph: GovernanceGraphViewModel;
}) {
  return (
    <AppShell chip="spike interno" maxWidth="xl">
      <Box sx={{ display: "grid", gap: 3 }}>
        <Box>
          <Flex align="center" gap={1.5}>
            <ScienceIcon color="primary" fontSize="large" />
            <Typography sx={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px" }}>
              {m["spikes.title"]}
            </Typography>
          </Flex>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {m["spikes.lead"]}
          </Typography>
        </Box>

        <Alert severity="warning" variant="outlined">
          {m["spikes.honesty"]}
        </Alert>

        <SectionCard title={m["spikes.matrix.title"]} subtitle={m["spikes.matrix.subtitle"]}>
          <SummaryMatrix />
        </SectionCard>

        <MapSection maps={maps} />
        <DashboardSection dashboard={dashboard} />
        <TableSection realTable={table} />
        <GraphSection realGraph={realGraph} />
        <ServerStateSection initialRevision={dashboard.sourceRevision} />
      </Box>
    </AppShell>
  );
}
