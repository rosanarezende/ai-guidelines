"use client";

// TableSection — spike 3: tabelas/data grids. Mesmo GovernanceTableViewModel
// nos três candidatos; dataset alterna entre read-model real e fixture grande.
import { Tab, Tabs, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { Flex, SectionCard } from "@/app/_ui/shared";
import { CandidatePanel } from "../../_candidates/shared/CandidatePanel";
import { TableAgGrid } from "../../_candidates/table-ag-grid/TableAgGrid";
import { TableMuiDataGrid } from "../../_candidates/table-mui-x/TableMuiDataGrid";
import { TableTanStack } from "../../_candidates/table-tanstack/TableTanStack";
import type { GovernanceTableViewModel } from "../../_model/view-models";
import { buildSyntheticTable } from "../../_model/synthetic-fixture";
import { FindingsFooter } from "./FindingsFooter";
import { findingById } from "./findings";
import copy from "./_locales/pt-br.json";

const m = copy.messages;

type DatasetKey = "real" | "syn2k" | "syn10k";

export function TableSection({ realTable }: { realTable: GovernanceTableViewModel }) {
  const [candidate, setCandidate] = useState(0);
  const [dataset, setDataset] = useState<DatasetKey>("real");

  const table = useMemo(() => {
    if (dataset === "syn2k") return buildSyntheticTable(2000);
    if (dataset === "syn10k") return buildSyntheticTable(10000);
    return realTable;
  }, [dataset, realTable]);

  return (
    <SectionCard title={m["spikes.table.title"]} subtitle={m["spikes.table.subtitle"]}>
      <Flex align="center" gap={2} wrap sx={{ mb: 1.5 }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={dataset}
          onChange={(_e, value: DatasetKey | null) => value && setDataset(value)}
        >
          <ToggleButton value="real">{m["spikes.dataset.real"]}</ToggleButton>
          <ToggleButton value="syn2k">{m["spikes.dataset.syn2k"]}</ToggleButton>
          <ToggleButton value="syn10k">{m["spikes.dataset.syn10k"]}</ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="caption" color="text.secondary">
          {table.rows.length} linhas · {table.name}
        </Typography>
      </Flex>

      <Tabs
        value={candidate}
        onChange={(_e, value: number) => setCandidate(value)}
        sx={{ mb: 1.5 }}
      >
        <Tab label="MUI X Data Grid" />
        <Tab label="TanStack Table" />
        <Tab label="AG Grid Community" />
      </Tabs>

      {candidate === 0 ? (
        <CandidatePanel
          meta={findingById("table-mui-x")}
          footer={<FindingsFooter finding={findingById("table-mui-x")} />}
        >
          <TableMuiDataGrid table={table} />
        </CandidatePanel>
      ) : candidate === 1 ? (
        <CandidatePanel
          meta={findingById("table-tanstack")}
          footer={<FindingsFooter finding={findingById("table-tanstack")} />}
        >
          <TableTanStack table={table} />
        </CandidatePanel>
      ) : (
        <CandidatePanel
          meta={findingById("table-ag-grid")}
          footer={<FindingsFooter finding={findingById("table-ag-grid")} />}
        >
          <TableAgGrid table={table} />
        </CandidatePanel>
      )}
    </SectionCard>
  );
}
