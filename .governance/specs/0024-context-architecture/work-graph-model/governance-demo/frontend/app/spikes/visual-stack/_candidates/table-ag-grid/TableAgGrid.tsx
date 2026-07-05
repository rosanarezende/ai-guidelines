"use client";

// TableAgGrid — candidato AG Grid Community (MIT): sorting/filtro/paginação/
// seleção nativos e virtualização forte. Visibilidade de coluna via menu
// próprio (o "columns tool panel" pronto é feature Enterprise — achado do spike).
import { Box, Button, Checkbox, Menu, MenuItem, Typography } from "@mui/material";
import { AllCommunityModule, ModuleRegistry, themeQuartz, type ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo, useState } from "react";
import { Flex } from "@/app/_ui/shared";
import type { GovernanceTableRow, GovernanceTableViewModel } from "../../_model/view-models";
import { TABLE_COLUMNS, TablePill, cellText } from "../shared/table-shared";

ModuleRegistry.registerModules([AllCommunityModule]);

const spikeTheme = themeQuartz.withParams({
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  accentColor: "#14532d",
  borderRadius: 8,
});

export function TableAgGrid({
  table,
  onSelectionChange,
}: {
  table: GovernanceTableViewModel;
  onSelectionChange?: (ids: string[]) => void;
}) {
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [columnsAnchor, setColumnsAnchor] = useState<HTMLElement | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);

  const columnDefs = useMemo<ColDef<GovernanceTableRow>[]>(
    () =>
      TABLE_COLUMNS.map((column) => ({
        colId: column.field,
        headerName: column.label,
        width: column.width,
        hide: Boolean(hidden[column.field]),
        valueGetter: (params) => (params.data ? cellText(params.data, column.field) : ""),
        ...(column.pill
          ? {
              cellRenderer: (params: { data?: GovernanceTableRow }) =>
                params.data ? <TablePill kind={column.pill!} row={params.data} /> : null,
            }
          : {}),
      })),
    [hidden]
  );

  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <Flex align="center" gap={1}>
        <Button size="small" onClick={(event) => setColumnsAnchor(event.currentTarget)}>
          colunas
        </Button>
        <Menu
          anchorEl={columnsAnchor}
          open={Boolean(columnsAnchor)}
          onClose={() => setColumnsAnchor(null)}
        >
          {TABLE_COLUMNS.map((column) => (
            <MenuItem
              key={column.field}
              dense
              onClick={() =>
                setHidden((state) => ({ ...state, [column.field]: !state[column.field] }))
              }
            >
              <Checkbox size="small" checked={!hidden[column.field]} />
              {column.label}
            </MenuItem>
          ))}
        </Menu>
        <Typography variant="caption" color="text.secondary">
          visibilidade via menu próprio; tool panel pronto é Enterprise
        </Typography>
      </Flex>
      <Box sx={{ height: 480 }}>
        <AgGridReact<GovernanceTableRow>
          theme={spikeTheme}
          rowData={table.rows}
          columnDefs={columnDefs}
          defaultColDef={{ sortable: true, filter: true, resizable: true }}
          pagination
          paginationPageSize={25}
          paginationPageSizeSelector={[25, 100, 500]}
          rowSelection={{ mode: "multiRow" }}
          onSelectionChanged={(event) => {
            const picked = event.api.getSelectedRows().map((row) => row.id);
            setSelectedCount(picked.length);
            onSelectionChange?.(picked);
          }}
        />
      </Box>
      <Typography variant="caption" color="text.secondary">
        {table.rows.length} linhas ({table.name}) · {selectedCount} selecionada(s) · revisão{" "}
        {table.sourceRevision}
      </Typography>
    </Box>
  );
}
