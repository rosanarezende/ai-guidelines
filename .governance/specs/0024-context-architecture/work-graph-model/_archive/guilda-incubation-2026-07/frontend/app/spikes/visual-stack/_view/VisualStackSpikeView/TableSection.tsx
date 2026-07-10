"use client";

// TableSection — spike 3 (rodada 2): tabelas/data grids. Mesmo view-model nos
// três candidatos; dataset alterna entre read-model real e fixture grande.
// Seleção alimenta uma ação governada simulada (sempre dry-run; fixture deve
// falhar fechado por command-stale).
import { Box, Tab, Tabs, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { Flex, SectionCard } from "@/app/_ui/shared";
import { CandidatePanel } from "../../_candidates/shared/CandidatePanel";
import { GovernedActionBar } from "../../_candidates/shared/GovernedActionBar";
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const table = useMemo(() => {
    if (dataset === "syn2k") return buildSyntheticTable(2000);
    if (dataset === "syn10k") return buildSyntheticTable(10000);
    return realTable;
  }, [dataset, realTable]);

  const candidateProps = { table, onSelectionChange: setSelectedIds };

  return (
    <SectionCard title={m["spikes.table.title"]} subtitle={m["spikes.table.subtitle"]}>
      <Flex align="center" gap={2} wrap sx={{ mb: 1.5 }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={dataset}
          onChange={(_e, value: DatasetKey | null) => {
            if (!value) return;
            setDataset(value);
            setSelectedIds([]);
          }}
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
        onChange={(_e, value: number) => {
          setCandidate(value);
          setSelectedIds([]);
        }}
        sx={{ mb: 1.5 }}
      >
        <Tab label="MUI X Data Grid" />
        <Tab label="TanStack Table + MUI" />
        <Tab label="AG Grid Community" />
      </Tabs>

      {candidate === 0 ? (
        <CandidatePanel
          meta={findingById("table-mui-x")}
          footer={<FindingsFooter finding={findingById("table-mui-x")} />}
        >
          <TableMuiDataGrid {...candidateProps} />
        </CandidatePanel>
      ) : candidate === 1 ? (
        <CandidatePanel
          meta={findingById("table-tanstack")}
          footer={<FindingsFooter finding={findingById("table-tanstack")} />}
        >
          <TableTanStack {...candidateProps} />
        </CandidatePanel>
      ) : (
        <CandidatePanel
          meta={findingById("table-ag-grid")}
          footer={<FindingsFooter finding={findingById("table-ag-grid")} />}
        >
          <TableAgGrid {...candidateProps} />
        </CandidatePanel>
      )}

      <Box sx={{ mt: 1.5 }}>
        {/* key por revisão: trocar dataset zera o resultado anterior do dry-run */}
        <GovernedActionBar
          key={table.sourceRevision}
          selectedIds={selectedIds}
          sourceRevision={table.sourceRevision}
        />
      </Box>
    </SectionCard>
  );
}
