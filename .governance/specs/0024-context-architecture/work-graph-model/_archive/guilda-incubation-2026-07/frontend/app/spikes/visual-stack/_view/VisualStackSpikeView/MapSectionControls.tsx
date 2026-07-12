"use client";

// MapSectionControls — busca, filtros e legenda do mapa de governança.
// Filtros operam no view-model (map-ops); o renderer só recebe o resultado.
import {
  Autocomplete,
  Checkbox,
  Chip,
  FormControlLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { Flex } from "@/app/_ui/shared";
import { KIND_COLORS } from "../../_candidates/map-react-flow/MapNodeCard";
import { mapTeams, searchMapNodes } from "../../_model/map-ops";
import type {
  GovernanceMapNode,
  GovernanceMapViewModel,
  MapFilterState,
  MapNodeKind,
} from "../../_model/view-models";
import { CONFIDENCE_STATES } from "../../_model/view-models";

const ALL_KINDS = Object.keys(KIND_COLORS) as MapNodeKind[];

export function MapLegend() {
  return (
    <Flex align="center" gap={0.75} wrap>
      {ALL_KINDS.map((kind) => (
        <Chip
          key={kind}
          size="small"
          variant="outlined"
          label={kind}
          sx={{ borderColor: KIND_COLORS[kind], color: KIND_COLORS[kind], fontSize: 11 }}
        />
      ))}
      <Typography variant="caption" color="text.secondary">
        · confiança no chip de cada nó: verified / pending / no-evidence / self-declared /
        break-glass / stale
      </Typography>
    </Flex>
  );
}

export function MapSectionControls({
  map,
  filter,
  onFilter,
  onPick,
}: {
  map: GovernanceMapViewModel;
  filter: MapFilterState;
  onFilter: (filter: MapFilterState) => void;
  onPick: (node: GovernanceMapNode | null) => void;
}) {
  const set = (patch: Partial<MapFilterState>) => onFilter({ ...filter, ...patch });

  return (
    <Flex align="center" gap={1.5} wrap>
      <Autocomplete<GovernanceMapNode>
        size="small"
        sx={{ minWidth: 260 }}
        options={searchMapNodes(map, filter.text || " ", 50)}
        filterOptions={(options, state) => searchMapNodes(map, state.inputValue || "", 8)}
        getOptionLabel={(option) => option.title}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <Typography variant="caption">
              [{option.kind}] {option.title}
            </Typography>
          </li>
        )}
        onChange={(_event, value) => onPick(value)}
        renderInput={(params) => (
          <TextField {...params} placeholder="buscar nó (título, id, time, responsável)…" />
        )}
        noOptionsText="nenhum nó encontrado"
        clearOnBlur={false}
      />
      <Flex align="center" gap={0.5}>
        <Typography variant="caption" color="text.secondary">
          tipos
        </Typography>
        <Select
          size="small"
          multiple
          displayEmpty
          value={filter.kinds}
          onChange={(event) => {
            const value = event.target.value;
            set({
              kinds: (typeof value === "string" ? value.split(",") : value) as MapNodeKind[],
            });
          }}
          renderValue={(selected) =>
            selected.length === 0 ? "todos" : `${selected.length} tipo(s)`
          }
          sx={{ minWidth: 120, fontSize: 13 }}
        >
          {ALL_KINDS.map((kind) => (
            <MenuItem key={kind} value={kind} dense>
              <Checkbox size="small" checked={filter.kinds.includes(kind)} />
              {kind}
            </MenuItem>
          ))}
        </Select>
      </Flex>
      <Flex align="center" gap={0.5}>
        <Typography variant="caption" color="text.secondary">
          confiança
        </Typography>
        <Select
          size="small"
          displayEmpty
          value={filter.confidence}
          onChange={(event) => set({ confidence: event.target.value })}
          sx={{ minWidth: 120, fontSize: 13 }}
        >
          <MenuItem value="">todas</MenuItem>
          {CONFIDENCE_STATES.map((state) => (
            <MenuItem key={state} value={state}>
              {state}
            </MenuItem>
          ))}
        </Select>
      </Flex>
      <Flex align="center" gap={0.5}>
        <Typography variant="caption" color="text.secondary">
          risco
        </Typography>
        <Select
          size="small"
          displayEmpty
          value={filter.risk}
          onChange={(event) => set({ risk: event.target.value })}
          sx={{ minWidth: 110, fontSize: 13 }}
        >
          <MenuItem value="">todos</MenuItem>
          <MenuItem value="low">low</MenuItem>
          <MenuItem value="attention">attention</MenuItem>
          <MenuItem value="high">high</MenuItem>
        </Select>
      </Flex>
      <Flex align="center" gap={0.5}>
        <Typography variant="caption" color="text.secondary">
          time
        </Typography>
        <Select
          size="small"
          displayEmpty
          value={filter.team}
          onChange={(event) => set({ team: event.target.value })}
          sx={{ minWidth: 140, fontSize: 13 }}
        >
          <MenuItem value="">todos</MenuItem>
          {mapTeams(map).map((team) => (
            <MenuItem key={team} value={team}>
              {team}
            </MenuItem>
          ))}
        </Select>
      </Flex>
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={filter.onlyContract}
            onChange={(event) => set({ onlyContract: event.target.checked })}
          />
        }
        label={<Typography variant="caption">só quem toca contrato</Typography>}
      />
    </Flex>
  );
}
