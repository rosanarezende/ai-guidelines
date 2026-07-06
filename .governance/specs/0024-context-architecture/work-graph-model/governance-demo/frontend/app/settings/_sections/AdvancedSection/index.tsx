"use client";

import { Box, Button, Chip } from "@mui/material";
import TerminalIcon from "@mui/icons-material/Terminal";
import Link from "next/link";
import type { GovernanceSnapshot } from "@demo/contracts";
import { Flex, SectionCard } from "@/app/_ui/shared";
import copy from "./_locales/pt-br.json";

export function AdvancedSection({ snapshot }: { snapshot: GovernanceSnapshot }) {
  return (
    <Box id="avancado">
      <SectionCard
        title={copy.title}
        subtitle={copy.subtitle}
        action={
          <Button
            component={Link}
            href="/console"
            variant="outlined"
            size="small"
            startIcon={<TerminalIcon fontSize="small" />}
          >
            {copy.openConsole}
          </Button>
        }
      >
        <Flex wrap gap={1}>
          <Chip
            size="small"
            variant="outlined"
            label={copy.graphStats
              .replace("{nodes}", String(snapshot.counts.graphNodes))
              .replace("{edges}", String(snapshot.counts.graphEdges))}
          />
          <Chip
            size="small"
            variant="outlined"
            label={copy.revision.replace("{revision}", snapshot.revision)}
          />
          <Chip
            size="small"
            variant="outlined"
            label={copy.issues
              .replace("{errors}", String(snapshot.counts.errors))
              .replace("{warnings}", String(snapshot.counts.warnings))}
          />
        </Flex>
      </SectionCard>
    </Box>
  );
}
