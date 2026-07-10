"use client";

import { Button, Chip, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { Flex } from "@/app/_ui/shared";
import type { WorkConfidenceState, WorkItemKind } from "../../_model/view-models";
import copy from "./_locales/pt-br.json";

export function WorkTableToolbar({
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
