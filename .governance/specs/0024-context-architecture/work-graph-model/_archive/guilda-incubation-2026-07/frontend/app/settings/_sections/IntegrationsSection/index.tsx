"use client";

import { Box, Chip, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import type { IntegrationItem } from "@demo/contracts";
import { DataPill, EntityCard, Flex, ResponsiveGrid, SectionCard } from "@/app/_ui/shared";
import { integrationStatus } from "../../_model";
import copy from "./_locales/pt-br.json";

export function IntegrationsSection({
  categories,
  category,
  integrations,
  onCategoryChange,
}: {
  categories: string[];
  category: string;
  integrations: IntegrationItem[];
  onCategoryChange: (category: string) => void;
}) {
  return (
    <Box id="integracoes">
      <SectionCard
        title={copy.title}
        subtitle={copy.subtitle}
        action={
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>{copy.categoryLabel}</InputLabel>
            <Select
              label={copy.categoryLabel}
              value={category}
              onChange={(event) => onCategoryChange(event.target.value)}
            >
              {categories.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        }
      >
        <ResponsiveGrid min={320} gap={1.5}>
          {integrations.map((item) => {
            const status = integrationStatus(item);
            return (
              <EntityCard
                key={item.id}
                title={item.id}
                subtitle={`${item["adapter-kind"]} · ${item.priority}`}
              >
                <Box sx={{ display: "grid", gap: 1 }}>
                  <Flex wrap gap={0.75}>
                    <Chip size="small" color={status.color} label={status.label} />
                    {item.systems.slice(0, 4).map((system) => (
                      <DataPill key={system} label={system} />
                    ))}
                  </Flex>
                  <Typography variant="body2" color="text.secondary">
                    {item["value-add"]}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {copy.authorityLabel.replace("{authority}", item.authority)}
                  </Typography>
                </Box>
              </EntityCard>
            );
          })}
        </ResponsiveGrid>
      </SectionCard>
    </Box>
  );
}
