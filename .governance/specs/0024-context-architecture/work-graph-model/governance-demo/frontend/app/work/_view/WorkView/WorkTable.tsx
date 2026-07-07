"use client";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useMemo, useRef, useState } from "react";
import { Flex } from "@/app/_ui/shared";
import type {
  WorkConfidenceState,
  WorkItemKind,
  WorkItemRow,
  WorkRiskLevel,
} from "../../_model/view-models";
import copy from "./_locales/pt-br.json";

const GRID =
  "112px minmax(280px, 1.6fr) 150px 150px 132px 100px minmax(220px, 1fr) 132px";

export function WorkTable({ rows }: { rows: WorkItemRow[] }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [kind, setKind] = useState<WorkItemKind | "all">("all");
  const [confidence, setConfidence] = useState<WorkConfidenceState | "all">("all");
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<WorkItemRow | null>(null);
  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (kind !== "all" && row.kind !== kind) return false;
        if (confidence !== "all" && row.confidence !== confidence) return false;
        if (blockedOnly && row.risk === "low") return false;
        return true;
      }),
    [rows, kind, confidence, blockedOnly]
  );
  const columns = useMemo<ColumnDef<WorkItemRow>[]>(
    () => workColumns((row) => setSelectedEvidence(row)),
    []
  );
  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  const tableRows = table.getRowModel().rows;
  const parentRef = useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 8,
  });

  return (
    <Card variant="outlined">
      <CardContent>
        <Toolbar
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          kind={kind}
          setKind={setKind}
          confidence={confidence}
          setConfidence={setConfidence}
          blockedOnly={blockedOnly}
          setBlockedOnly={setBlockedOnly}
          count={tableRows.length}
        />
        <Box data-testid="repo-work-list" sx={{ mt: 2, overflowX: "auto" }}>
          <Box sx={{ minWidth: 1040 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: GRID,
                gap: 1,
                px: 1.25,
                py: 1,
                borderBottom: "1px solid",
                borderColor: "divider",
                color: "text.secondary",
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
              }}
            >
              {table.getFlatHeaders().map((header) => (
                <Box
                  key={header.id}
                  role="button"
                  tabIndex={0}
                  onClick={header.column.getToggleSortingHandler()}
                  sx={{ cursor: header.column.getCanSort() ? "pointer" : "default" }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === "asc" ? " ↑" : ""}
                  {header.column.getIsSorted() === "desc" ? " ↓" : ""}
                </Box>
              ))}
            </Box>
            <Box ref={parentRef} sx={{ height: 520, overflow: "auto", position: "relative" }}>
              <Box sx={{ height: virtualizer.getTotalSize(), position: "relative" }}>
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const row = tableRows[virtualRow.index];
                  return (
                    <Box
                      key={row.id}
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <Box
                        data-testid="repo-work-card"
                        sx={{
                          display: "grid",
                          gridTemplateColumns: GRID,
                          gap: 1,
                          alignItems: "center",
                          px: 1.25,
                          py: 1,
                          minHeight: 60,
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <Box key={cell.id} sx={{ minWidth: 0 }}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        </Box>
        {selectedEvidence ? <EvidencePanel row={selectedEvidence} /> : null}
      </CardContent>
    </Card>
  );
}

function Toolbar({
  globalFilter,
  setGlobalFilter,
  kind,
  setKind,
  confidence,
  setConfidence,
  blockedOnly,
  setBlockedOnly,
  count,
}: {
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  kind: WorkItemKind | "all";
  setKind: (value: WorkItemKind | "all") => void;
  confidence: WorkConfidenceState | "all";
  setConfidence: (value: WorkConfidenceState | "all") => void;
  blockedOnly: boolean;
  setBlockedOnly: (value: boolean) => void;
  count: number;
}) {
  return (
    <Flex gap={1.5} align="center" wrap>
      <TextField
        size="small"
        value={globalFilter}
        onChange={(event) => setGlobalFilter(event.target.value)}
        label={copy.search}
        sx={{ minWidth: { xs: "100%", md: 360 } }}
      />
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>{copy.columns.kind}</InputLabel>
        <Select
          value={kind}
          label={copy.columns.kind}
          onChange={(event: SelectChangeEvent) =>
            setKind(event.target.value as WorkItemKind | "all")
          }
        >
          <MenuItem value="all">{copy.allKinds}</MenuItem>
          {(["intent", "proposal", "standalone", "target"] as const).map((value) => (
            <MenuItem key={value} value={value}>
              {copy.kind[value]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>{copy.columns.confidence}</InputLabel>
        <Select
          value={confidence}
          label={copy.columns.confidence}
          onChange={(event: SelectChangeEvent) =>
            setConfidence(event.target.value as WorkConfidenceState | "all")
          }
        >
          <MenuItem value="all">{copy.allConfidence}</MenuItem>
          {(
            ["verified", "pending", "no-evidence", "self-declared", "break-glass", "stale"] as const
          ).map((value) => (
            <MenuItem key={value} value={value}>
              {copy.confidence[value]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button
        data-testid="repo-work-filter-blocked"
        size="small"
        variant={blockedOnly ? "contained" : "outlined"}
        onClick={() => setBlockedOnly(!blockedOnly)}
      >
        {copy.blockedFilter}
      </Button>
      <Chip size="small" variant="outlined" label={`${count} ${copy.rows}`} />
    </Flex>
  );
}

function workColumns(onOpenEvidence: (row: WorkItemRow) => void): ColumnDef<WorkItemRow>[] {
  return [
    {
      accessorKey: "kind",
      header: copy.columns.kind,
      cell: ({ row }) => <Chip size="small" label={copy.kind[row.original.kind]} />,
    },
    {
      accessorKey: "title",
      header: copy.columns.title,
      cell: ({ row }) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 750 }} noWrap>
            {row.original.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {row.original.id} · {row.original.source}
          </Typography>
        </Box>
      ),
    },
    {
      accessorKey: "owner",
      header: copy.columns.owner,
      cell: ({ row }) => (
        <Typography variant="body2" noWrap>
          owner: {row.original.owner}
        </Typography>
      ),
    },
    {
      accessorKey: "status",
      header: copy.columns.status,
      cell: ({ row }) => (
        <Typography variant="body2" noWrap>
          status: {row.original.status}
        </Typography>
      ),
    },
    {
      accessorKey: "confidence",
      header: copy.columns.confidence,
      cell: ({ row }) => <ConfidencePill state={row.original.confidence} />,
    },
    {
      accessorKey: "risk",
      header: copy.columns.risk,
      cell: ({ row }) => <RiskPill risk={row.original.risk} />,
    },
    { accessorKey: "nextStep", header: copy.columns.nextStep },
    {
      id: "evidence",
      header: copy.columns.evidence,
      cell: ({ row }) => (
        <Button
          data-testid="repo-work-open-evidence"
          size="small"
          variant="outlined"
          onClick={() => onOpenEvidence(row.original)}
        >
          {copy.openEvidence}
        </Button>
      ),
    },
  ];
}

function EvidencePanel({ row }: { row: WorkItemRow }) {
  const evidence =
    row.evidence ||
    "test: pendente · commit: pendente · verification: pendente até uma fonte independente anexar prova";
  return (
    <Card data-testid="work-evidence-panel" variant="outlined" sx={{ mt: 2, bgcolor: "grey.50" }}>
      <CardContent>
        <Typography variant="subtitle2">{copy.evidenceTitle}</Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {row.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {evidence}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          test · commit · verification · sourceRevision são conferidos antes de virar prova forte.
        </Typography>
      </CardContent>
    </Card>
  );
}

function ConfidencePill({ state }: { state: WorkConfidenceState }) {
  const color = state === "verified" ? "success" : state === "pending" ? "warning" : "default";
  return <Chip size="small" color={color} variant="outlined" label={copy.confidence[state]} />;
}

function RiskPill({ risk }: { risk: WorkRiskLevel }) {
  const color = risk === "high" ? "error" : risk === "attention" ? "warning" : "success";
  return <Chip size="small" color={color} label={copy.risk[risk]} />;
}
