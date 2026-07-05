"use client";

// GraphSectionControls — filtros do spike de grafo técnico (tipo, owner, time,
// ciclo, confiança, status, contrato, fonte) + modo de exploração. Os filtros
// operam no view-model; os candidatos apenas renderizam o resultado.
import {
  Checkbox,
  FormControlLabel,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Flex } from "@/app/_ui/shared";
import { uniqueValues } from "../../_model/graph-ops";
import type { GovernanceGraphViewModel, GraphFilterState } from "../../_model/view-models";
import { CONFIDENCE_STATES } from "../../_model/view-models";

export type GraphMode = "explore" | "neighborhood" | "path" | "contract-impact" | "intent-deps";

const MODE_LABEL: Record<GraphMode, string> = {
  explore: "explorar",
  neighborhood: "vizinhança",
  path: "menor caminho",
  "contract-impact": "impacto de contrato",
  "intent-deps": "deps de intent",
};

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <Flex align="center" gap={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Select
        size="small"
        displayEmpty
        value={value}
        onChange={(event) => onChange(event.target.value)}
        sx={{ minWidth: 120, fontSize: 13 }}
      >
        <MenuItem value="">todos</MenuItem>
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </Flex>
  );
}

export function GraphSectionControls({
  graph,
  filter,
  onFilter,
  mode,
  onMode,
}: {
  graph: GovernanceGraphViewModel;
  filter: GraphFilterState;
  onFilter: (filter: GraphFilterState) => void;
  mode: GraphMode;
  onMode: (mode: GraphMode) => void;
}) {
  const set = (patch: Partial<GraphFilterState>) => onFilter({ ...filter, ...patch });

  return (
    <Flex direction="column" gap={1}>
      <Flex align="center" gap={1.5} wrap>
        <Flex align="center" gap={0.5}>
          <Typography variant="caption" color="text.secondary">
            tipos
          </Typography>
          <Select
            size="small"
            multiple
            displayEmpty
            value={filter.types}
            onChange={(event) => {
              const value = event.target.value;
              set({ types: typeof value === "string" ? value.split(",") : value });
            }}
            renderValue={(selected) =>
              selected.length === 0 ? "todos" : `${selected.length} tipo(s)`
            }
            sx={{ minWidth: 130, fontSize: 13 }}
          >
            {graph.nodeTypes.map((type) => (
              <MenuItem key={type} value={type} dense>
                <Checkbox size="small" checked={filter.types.includes(type)} />
                {type}
              </MenuItem>
            ))}
          </Select>
        </Flex>
        <FilterSelect
          label="responsável"
          value={filter.owner}
          options={uniqueValues(graph.nodes, "owner")}
          onChange={(owner) => set({ owner })}
        />
        <FilterSelect
          label="time"
          value={filter.team}
          options={uniqueValues(graph.nodes, "team")}
          onChange={(team) => set({ team })}
        />
        <FilterSelect
          label="ciclo"
          value={filter.cycle}
          options={uniqueValues(graph.nodes, "cycle")}
          onChange={(cycle) => set({ cycle })}
        />
        <FilterSelect
          label="confiança"
          value={filter.confidence}
          options={[...CONFIDENCE_STATES]}
          onChange={(confidence) => set({ confidence })}
        />
        <FilterSelect
          label="status"
          value={filter.status}
          options={uniqueValues(graph.nodes, "status")}
          onChange={(status) => set({ status })}
        />
        <FilterSelect
          label="fonte"
          value={filter.source}
          options={uniqueValues(graph.nodes, "source")}
          onChange={(source) => set({ source })}
        />
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
      <ToggleButtonGroup
        size="small"
        exclusive
        value={mode}
        onChange={(_event, value: GraphMode | null) => value && onMode(value)}
      >
        {(Object.keys(MODE_LABEL) as GraphMode[]).map((key) => (
          <ToggleButton key={key} value={key} sx={{ fontSize: 12 }}>
            {MODE_LABEL[key]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Flex>
  );
}
