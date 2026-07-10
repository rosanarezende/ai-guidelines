"use client";

// TableTanStack — candidato TanStack Table (headless): a UI é 100% MUI nossa.
// Sorting/filtro/paginação/visibilidade/seleção existem, mas cada pedaço de
// UI é responsabilidade nossa — o custo/controle disso é o achado do spike.
import {
  Box,
  Button,
  Checkbox,
  Menu,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type Updater,
  type VisibilityState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Flex } from "@/app/_ui/shared";
import type { GovernanceTableRow, GovernanceTableViewModel } from "../../_model/view-models";
import { TABLE_COLUMNS, TablePill, cellText } from "../shared/table-shared";

// colunas com filtro próprio de valor (select) — filtros REAIS por coluna
const FILTERABLE = ["kind", "status", "confidence", "risk"] as const;

export function TableTanStack({
  table: vm,
  onSelectionChange,
}: {
  table: GovernanceTableViewModel;
  onSelectionChange?: (ids: string[]) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [dense, setDense] = useState(true);
  const [columnsAnchor, setColumnsAnchor] = useState<HTMLElement | null>(null);

  const filterOptions = useMemo(() => {
    const options = new Map<string, string[]>();
    for (const field of FILTERABLE) {
      options.set(field, [...new Set(vm.rows.map((row) => String(row[field])))].sort());
    }
    return options;
  }, [vm.rows]);

  function handleSelection(updater: Updater<Record<string, boolean>>) {
    setRowSelection((previous) => {
      const next = typeof updater === "function" ? updater(previous) : updater;
      onSelectionChange?.(Object.keys(next));
      return next;
    });
  }

  const columns = useMemo<ColumnDef<GovernanceTableRow>[]>(() => {
    const select: ColumnDef<GovernanceTableRow> = {
      id: "select",
      size: 48,
      header: ({ table }) => (
        <Checkbox
          size="small"
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          size="small"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    };
    const dataColumns = TABLE_COLUMNS.map<ColumnDef<GovernanceTableRow>>((column) => ({
      id: column.field,
      accessorFn: (row) => cellText(row, column.field),
      header: column.label,
      size: column.width,
      cell: (info) =>
        column.pill ? (
          <TablePill kind={column.pill} row={info.row.original} />
        ) : (
          info.getValue<string>()
        ),
    }));
    return [select, ...dataColumns];
  }, []);

  const table = useReactTable({
    data: vm.rows,
    columns,
    state: { sorting, globalFilter, columnFilters, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: handleSelection,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  const pagination = table.getState().pagination;
  const selectedCount = Object.keys(rowSelection).length;

  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <Flex align="center" gap={1} wrap>
        <TextField
          size="small"
          placeholder="filtro global…"
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
        />
        {FILTERABLE.map((field) => {
          const column = table.getColumn(field);
          if (!column) return null;
          return (
            <Select
              key={field}
              size="small"
              displayEmpty
              value={(column.getFilterValue() as string) ?? ""}
              onChange={(event) => column.setFilterValue(event.target.value || undefined)}
              renderValue={(value) => (value ? `${field}: ${value}` : `${field}: todos`)}
              sx={{ minWidth: 130, fontSize: 12 }}
            >
              <MenuItem value="">todos</MenuItem>
              {(filterOptions.get(field) ?? []).map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          );
        })}
        <Button size="small" onClick={(event) => setColumnsAnchor(event.currentTarget)}>
          colunas
        </Button>
        <Button size="small" onClick={() => setDense((value) => !value)}>
          densidade: {dense ? "compacta" : "confortável"}
        </Button>
        <Menu
          anchorEl={columnsAnchor}
          open={Boolean(columnsAnchor)}
          onClose={() => setColumnsAnchor(null)}
        >
          {table
            .getAllLeafColumns()
            .filter((column) => column.id !== "select")
            .map((column) => (
              <MenuItem key={column.id} dense onClick={column.getToggleVisibilityHandler()}>
                <Checkbox size="small" checked={column.getIsVisible()} />
                {column.id}
              </MenuItem>
            ))}
        </Menu>
      </Flex>
      <TableContainer sx={{ maxHeight: 430, border: "1px solid", borderColor: "divider" }}>
        <Table stickyHeader size={dense ? "small" : "medium"}>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell key={header.id} sx={{ width: header.getSize(), fontWeight: 700 }}>
                    {header.id === "select" ? (
                      flexRender(header.column.columnDef.header, header.getContext())
                    ) : (
                      <TableSortLabel
                        active={Boolean(header.column.getIsSorted())}
                        direction={header.column.getIsSorted() === "desc" ? "desc" : "asc"}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableSortLabel>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} hover selected={row.getIsSelected()}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} sx={{ whiteSpace: "nowrap" }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Flex align="center" justify="space-between" wrap>
        <Typography variant="caption" color="text.secondary">
          {vm.rows.length} linhas ({vm.name}) · {selectedCount} selecionada(s) · revisão{" "}
          {vm.sourceRevision}
        </Typography>
        <TablePagination
          component="div"
          count={table.getFilteredRowModel().rows.length}
          page={pagination.pageIndex}
          rowsPerPage={pagination.pageSize}
          rowsPerPageOptions={[25, 100, 500]}
          onPageChange={(_event, page) => table.setPageIndex(page)}
          onRowsPerPageChange={(event) => table.setPageSize(Number(event.target.value))}
        />
      </Flex>
    </Box>
  );
}
