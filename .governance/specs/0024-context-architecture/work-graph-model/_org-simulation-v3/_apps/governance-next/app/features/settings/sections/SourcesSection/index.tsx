"use client";

import { Alert, Box, Button, Tooltip } from "@mui/material";
import { SectionCard } from "@/app/ui/shared";
import { SourceList } from "@/app/features/adoption/components";
import { NO_SOURCE_DOWNGRADE, type AdoptionSummary } from "@/app/features/adoption/model";
import copy from "./locales/pt-br.json";

export function SourcesSection({ adoption }: { adoption: AdoptionSummary }) {
  const allSourcesPublishContext = adoption.sourcesConnected === adoption.sources.length;
  return (
    <Box id="fontes">
      <SectionCard
        title={copy.title}
        subtitle={copy.subtitle}
        action={
          <Tooltip title={copy.addTooltip}>
            <span>
              <Button size="small" variant="contained" disabled>
                {copy.addCta}
              </Button>
            </span>
          </Tooltip>
        }
      >
        <Box sx={{ display: "grid", gap: 1.5 }}>
          <SourceList sources={adoption.sources} />
          <Alert severity={allSourcesPublishContext ? "success" : "warning"}>
            {allSourcesPublishContext
              ? copy.allConnected
                  .replace("{connected}", String(adoption.sourcesConnected))
                  .replace("{total}", String(adoption.sources.length))
              : copy.partiallyConnected
                  .replace("{connected}", String(adoption.sourcesConnected))
                  .replace("{total}", String(adoption.sources.length))
                  .replace("{downgrade}", NO_SOURCE_DOWNGRADE)}
          </Alert>
        </Box>
      </SectionCard>
    </Box>
  );
}
