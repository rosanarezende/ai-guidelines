"use client";

// TableMuiDataGrid — candidato MUI X Data Grid (Community, MIT): sorting,
// filtro, paginação, visibilidade de coluna, densidade e seleção nativos,
// com pills de status/confiança/risco por renderCell.
import { Box, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useMemo, useState } from "react";
import type { GovernanceTableViewModel, GovernanceTableRow } from "../../_model/view-models";
import { TABLE_COLUMNS, TablePill, cellText } from "../shared/table-shared";

export function TableMuiDataGrid({ table }: { table: GovernanceTableViewModel }) {
  const [selectedCount, setSelectedCount] = useState(0);

  const columns = useMemo<GridColDef<GovernanceTableRow>[]>(
    () =>
      TABLE_COLUMNS.map((column) => ({
        field: column.field,
        headerName: column.label,
        width: column.width,
        valueGetter: (_value, row) => cellText(row, column.field),
        ...(column.pill
          ? {
              renderCell: (params) => <TablePill kind={column.pill!} row={params.row} />,
            }
          : {}),
      })),
    []
  );

  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <Box sx={{ height: 480 }}>
        <DataGrid
          rows={table.rows}
          columns={columns}
          showToolbar
          checkboxSelection
          disableRowSelectionOnClick
          pagination
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            density: "compact",
          }}
          pageSizeOptions={[25, 50, 100]}
          onRowSelectionModelChange={(model) => {
            setSelectedCount(model.ids?.size ?? 0);
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
