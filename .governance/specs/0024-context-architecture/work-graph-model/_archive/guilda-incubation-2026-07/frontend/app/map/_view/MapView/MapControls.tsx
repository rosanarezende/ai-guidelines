"use client";

import {
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { Flex } from "@/app/_ui/shared";
import {
  MAP_CONFIDENCE_STATES,
  MAP_NODE_KINDS,
  MAP_RISK_LEVELS,
  type GovernanceMapViewModel,
  type MapConfidenceState,
  type MapFilterState,
  type MapNodeKind,
  type MapRiskLevel,
} from "../../_model/view-models";
import copy from "./_locales/pt-br.json";

export function ScopeSelect({
  maps,
  scopeId,
  setScopeId,
}: {
  maps: GovernanceMapViewModel[];
  scopeId: string;
  setScopeId: (value: string) => void;
}) {
  return (
    <FormControl size="small" sx={{ minWidth: 280 }}>
      <InputLabel>{copy.scope}</InputLabel>
      <Select
        value={scopeId}
        label={copy.scope}
        onChange={(event: SelectChangeEvent) => setScopeId(event.target.value)}
      >
        {maps.map((map) => (
          <MenuItem key={map.scopeId} value={map.scopeId}>
            {map.scopeTitle}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export function MapControls({
  filter,
  setFilter,
}: {
  filter: MapFilterState;
  setFilter: (value: MapFilterState) => void;
}) {
  return (
    <Flex gap={1.25} align="center" wrap>
      <TextField
        slotProps={{ htmlInput: { "data-testid": "map-search" } }}
        size="small"
        value={filter.text}
        label={copy.search}
        onChange={(event) => setFilter({ ...filter, text: event.target.value })}
        sx={{ minWidth: { xs: "100%", md: 320 } }}
      />
      <FilterSelect
        label={copy.kind}
        value={filter.kind}
        values={MAP_NODE_KINDS}
        onChange={(value) => setFilter({ ...filter, kind: value as MapNodeKind | "" })}
      />
      <FilterSelect
        label={copy.confidence}
        value={filter.confidence}
        values={MAP_CONFIDENCE_STATES}
        onChange={(value) => setFilter({ ...filter, confidence: value as MapConfidenceState | "" })}
      />
      <FilterSelect
        label={copy.risk}
        value={filter.risk}
        values={MAP_RISK_LEVELS}
        onChange={(value) => setFilter({ ...filter, risk: value as MapRiskLevel | "" })}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={filter.onlyContract}
            onChange={(event) => setFilter({ ...filter, onlyContract: event.target.checked })}
          />
        }
        label={copy.onlyContract}
      />
    </Flex>
  );
}

function FilterSelect({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: string;
  values: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <FormControl size="small" sx={{ minWidth: 156 }}>
      <InputLabel>{label}</InputLabel>
      <Select value={value} label={label} onChange={(event) => onChange(event.target.value)}>
        <MenuItem value="">{copy.all}</MenuItem>
        {values.map((item) => (
          <MenuItem key={item} value={item}>
            {item}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
