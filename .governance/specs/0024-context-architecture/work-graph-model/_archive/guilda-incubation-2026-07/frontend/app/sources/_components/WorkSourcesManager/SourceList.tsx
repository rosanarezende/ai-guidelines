"use client";

import { Alert, Box, Button, Chip, CircularProgress, Typography } from "@mui/material";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import SourceOutlinedIcon from "@mui/icons-material/SourceOutlined";
import type { WorkSource } from "@demo/contracts";
import { Flex } from "@/app/_ui/shared";
import { canScanSource, shortHash, statusColor, trustColor } from "./helpers";
import type { SourcesCopy } from "./types";

export function SourceList({
  copy,
  sources,
  busy,
  onScan,
}: {
  copy: SourcesCopy;
  sources: WorkSource[];
  busy: string | null;
  onScan: (source: WorkSource) => void;
}) {
  if (!sources.length) {
    return (
      <Alert severity="info">
        <Typography variant="subtitle2">{copy.empty}</Typography>
        <Typography variant="body2">{copy.addLead}</Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      {sources.map((source) => (
        <SourceCard
          key={source.id}
          copy={copy}
          source={source}
          busy={busy}
          primary={source.id === sources[0]?.id}
          onScan={onScan}
        />
      ))}
    </Box>
  );
}

function SourceCard({
  copy,
  source,
  busy,
  primary,
  onScan,
}: {
  copy: SourcesCopy;
  source: WorkSource;
  busy: string | null;
  primary: boolean;
  onScan: (source: WorkSource) => void;
}) {
  const scanEnabled = canScanSource(source);
  const isBusy = busy === source.id;
  const sourceHelp = copy.kindHelp[source.kind];

  return (
    <Box
      data-testid={primary ? "source-card-primary" : undefined}
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.paper",
        display: "grid",
        gap: 1.25,
      }}
    >
      <Flex align="flex-start" justify="space-between" gap={1.5} wrap>
        <Flex align="flex-start" gap={1.25}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: "rgba(27, 94, 51, 0.08)",
              color: "primary.main",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            {scanEnabled ? (
              <FolderOutlinedIcon fontSize="small" />
            ) : (
              <SourceOutlinedIcon fontSize="small" />
            )}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              data-testid={primary ? "source-card-primary-name" : undefined}
              variant="subtitle2"
              sx={{ fontWeight: 850 }}
            >
              {source.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {copy.kinds[source.kind] ?? source.kind}
              {source.pathOrUrl ? ` · ${source.pathOrUrl}` : ""}
            </Typography>
            {sourceHelp ? (
              <Typography variant="caption" color="text.secondary">
                {sourceHelp.proof}
              </Typography>
            ) : null}
          </Box>
        </Flex>
        <Button
          size="small"
          variant="outlined"
          disabled={!scanEnabled || Boolean(busy)}
          onClick={() => onScan(source)}
        >
          {isBusy ? (
            <Flex gap={0.75} align="center">
              <CircularProgress size={14} />
              {copy.scanning}
            </Flex>
          ) : (
            copy.scan
          )}
        </Button>
      </Flex>

      <Flex gap={0.75} wrap>
        <Chip
          size="small"
          color={statusColor(source)}
          label={`${copy.status}: ${copy.statusLabels[source.status] ?? source.status}`}
        />
        <Chip
          size="small"
          color={trustColor(source)}
          label={`${copy.trust}: ${copy.trustLabels[source.sourceTrust ?? "declared"] ?? source.sourceTrust ?? "declared"}`}
        />
        {source.lastScan?.contentHash ? (
          <Chip
            size="small"
            variant="outlined"
            label={`${copy.scanHash}: ${shortHash(source.lastScan.contentHash)}`}
          />
        ) : null}
        {typeof source.lastScan?.fileCount === "number" ? (
          <Chip
            size="small"
            variant="outlined"
            label={`${copy.scanFiles}: ${source.lastScan.fileCount}`}
          />
        ) : null}
        {source.lastScan?.gitHead ? (
          <Chip
            size="small"
            variant="outlined"
            label={`${copy.gitHead}: ${shortHash(source.lastScan.gitHead)}`}
          />
        ) : null}
        {typeof source.lastScan?.gitDirtyFiles === "number" ? (
          <Chip
            size="small"
            variant="outlined"
            label={`${copy.gitDirtyFiles}: ${source.lastScan.gitDirtyFiles}`}
          />
        ) : null}
        {source.lastScan?.cloudSyncProvider ? (
          <Chip
            size="small"
            variant="outlined"
            label={`${copy.cloudSync}: ${source.lastScan.cloudSyncProvider}`}
          />
        ) : null}
      </Flex>

      {source.lastScan?.scannedAt ? (
        <Typography variant="caption" color="text.secondary">
          {copy.lastScan}: {source.lastScan.scannedAt}
        </Typography>
      ) : null}

      {source.limitations?.length ? (
        <Alert severity="warning">
          <Typography variant="subtitle2">{copy.limitationsTitle}</Typography>
          <Box component="ul" sx={{ pl: 2.5, my: 0.5 }}>
            {source.limitations.map((item) => (
              <li key={item}>
                <Typography variant="body2">{item}</Typography>
              </li>
            ))}
          </Box>
        </Alert>
      ) : null}

      {source.lastScan?.errors?.length ? (
        <Alert severity="error">
          <Typography variant="subtitle2">{copy.errorsTitle}</Typography>
          <Box component="ul" sx={{ pl: 2.5, my: 0.5 }}>
            {source.lastScan.errors.map((item) => (
              <li key={item}>
                <Typography variant="body2">{item}</Typography>
              </li>
            ))}
          </Box>
        </Alert>
      ) : null}
    </Box>
  );
}
