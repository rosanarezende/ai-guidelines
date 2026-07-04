"use client";

import {
  Alert,
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import LockIcon from "@mui/icons-material/Lock";
import MemoryIcon from "@mui/icons-material/Memory";
import { Flex, ResponsiveGrid, SectionCard } from "@/app/ui/shared";
import { StatusPill } from "@/app/features/adoption/components";
import { assistantCloudNote, providerIsLocal, type ProfileId } from "@/app/features/adoption/model";
import copy from "./locales/pt-br.json";

export function AssistantSection({
  provider,
  assistantUrl,
  assistantModel,
  classificationPolicy,
  systems,
  profile,
  onProviderChange,
  onUrlChange,
  onModelChange,
  onClassificationPolicyChange,
}: {
  provider: string;
  assistantUrl: string;
  assistantModel: string;
  classificationPolicy: string;
  systems: string[];
  profile: ProfileId;
  onProviderChange: (event: SelectChangeEvent) => void;
  onUrlChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onClassificationPolicyChange: (value: string) => void;
}) {
  const localProvider = providerIsLocal(provider);
  return (
    <Box id="assistente">
      <SectionCard title={copy.title} subtitle={copy.subtitle}>
        <Box sx={{ display: "grid", gap: 1.5 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Flex align="center" gap={1.5} wrap>
              <MemoryIcon color="primary" />
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {copy.providerSummary
                    .replace("{mode}", localProvider ? copy.localMode : copy.cloudMode)
                    .replace("{provider}", provider)
                    .replace("{model}", assistantModel)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {copy.sessionPreference.replace("{url}", assistantUrl)}
                </Typography>
              </Box>
              {localProvider ? (
                <Chip
                  size="small"
                  icon={<LockIcon sx={{ fontSize: 13 }} />}
                  label={copy.localBadge}
                  sx={{ bgcolor: "#e7f2ea", color: "#1a5632" }}
                />
              ) : (
                <StatusPill state="pending" label={copy.cloudBadge} />
              )}
            </Flex>
          </Paper>
          <ResponsiveGrid min={220} gap={1.5}>
            <FormControl size="small" fullWidth>
              <InputLabel>{copy.providerLabel}</InputLabel>
              <Select label={copy.providerLabel} value={provider} onChange={onProviderChange}>
                {systems.map((system) => (
                  <MenuItem key={system} value={system}>
                    {system}
                    {system === "ollama" ? copy.recommendedSuffix : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              label={copy.endpointLabel}
              value={assistantUrl}
              onChange={(event) => onUrlChange(event.target.value)}
            />
            <TextField
              size="small"
              label={copy.modelLabel}
              value={assistantModel}
              onChange={(event) => onModelChange(event.target.value)}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>{copy.classificationLabel}</InputLabel>
              <Select
                label={copy.classificationLabel}
                value={classificationPolicy}
                onChange={(event) => onClassificationPolicyChange(event.target.value)}
              >
                <MenuItem value="local-only">{copy.classificationOptions.localOnly}</MenuItem>
                <MenuItem value="policy-gated">{copy.classificationOptions.policyGated}</MenuItem>
                <MenuItem value="public-only">{copy.classificationOptions.publicOnly}</MenuItem>
              </Select>
            </FormControl>
          </ResponsiveGrid>
          <Alert severity={localProvider ? "success" : "warning"}>
            {localProvider ? copy.localSuccess : assistantCloudNote(profile)}
          </Alert>
          <Typography variant="caption" color="text.secondary">
            {copy.governanceNote}
          </Typography>
        </Box>
      </SectionCard>
    </Box>
  );
}
