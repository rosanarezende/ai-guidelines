"use client";

import { Box, Button, Chip, Tooltip, Typography } from "@mui/material";
import type { GovernanceSnapshot } from "@/lib/types";
import { Flex, SectionCard } from "@/app/_ui/shared";
import type { ProfileOption } from "@/app/_domain/adoption/model";
import copy from "./_locales/pt-br.json";

export function OrganizationSection({
  snapshot,
  option,
}: {
  snapshot: GovernanceSnapshot;
  option: ProfileOption;
}) {
  return (
    <Box id="org">
      <SectionCard
        title={copy.title}
        subtitle={copy.subtitle
          .replace("{profile}", option.label)
          .replace("{tradeoff}", option.tradeoff)}
        action={
          <Tooltip title={copy.changeTooltip}>
            <span>
              <Button size="small" variant="outlined" disabled>
                {copy.changeCta}
              </Button>
            </span>
          </Tooltip>
        }
      >
        <Box sx={{ display: "grid", gap: 1.5 }}>
          <Flex wrap gap={0.75}>
            {option.ceremony.map((item) => (
              <Chip
                key={item}
                size="small"
                label={item}
                sx={{ bgcolor: "#eaf1ec", color: "#1a5632" }}
              />
            ))}
          </Flex>
          <Flex wrap gap={1}>
            <Chip
              size="small"
              variant="outlined"
              label={copy.scopeLabel.replace("{scope}", snapshot.profileDeclaration.scope)}
            />
            <Chip
              size="small"
              variant="outlined"
              label={copy.approvedByLabel.replace(
                "{approver}",
                snapshot.profileDeclaration["approved-by"] || copy.unresolved
              )}
            />
            <Chip
              size="small"
              variant="outlined"
              label={copy.reviewLabel.replace(
                "{date}",
                snapshot.profileDeclaration["review-at"] || copy.noDate
              )}
            />
          </Flex>
          <Typography variant="caption" color="text.secondary">
            {copy.profileChangeNote}
          </Typography>
        </Box>
      </SectionCard>
    </Box>
  );
}
