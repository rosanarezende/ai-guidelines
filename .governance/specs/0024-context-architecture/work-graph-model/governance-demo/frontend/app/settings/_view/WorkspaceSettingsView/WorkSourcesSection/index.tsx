"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, Divider, MenuItem, TextField, Typography } from "@mui/material";
import type { WorkSource, WorkSourceKind } from "@demo/backend/domain";
import { Flex, ResponsiveGrid } from "@/app/_ui/shared";
import {
  addWorkspaceWorkSource,
  getWorkSources,
  scanWorkspaceWorkSource,
} from "@/app/_domain/adoption/shellClient";
import copy from "./_locales/pt-br.json";

const m = copy as {
  [key: string]: unknown;
  kinds: Record<string, string>;
};

const ADDABLE_KINDS: WorkSourceKind[] = [
  "git-repo",
  "local-folder",
  "cloud-synced-folder",
  "manual-upload",
  "external-link",
  "github",
  "monorepo-module",
];

function trustColor(source: WorkSource): "default" | "success" | "warning" | "error" {
  if (source.sourceTrust === "provider-versioned" || source.sourceTrust === "provider-audited") {
    return "success";
  }
  if (source.sourceTrust === "untrusted") return "error";
  if (source.sourceTrust === "declared" || source.sourceTrust === "cloud-sync-unverified") {
    return "warning";
  }
  return "default";
}

export default function WorkSourcesSection() {
  const [sources, setSources] = useState<WorkSource[]>([]);
  const [kind, setKind] = useState<WorkSourceKind>("git-repo");
  const [label, setLabel] = useState("");
  const [pathOrUrl, setPathOrUrl] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    const result = await getWorkSources();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSources(result.workSources);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function addSource() {
    setBusy("add");
    setError(null);
    const result = await addWorkspaceWorkSource({
      kind,
      label,
      ...(pathOrUrl.trim() ? { pathOrUrl } : {}),
    });
    if (!result.ok) {
      setError(result.error);
    } else {
      setLabel("");
      setPathOrUrl("");
      await refresh();
    }
    setBusy(null);
  }

  async function scan(source: WorkSource) {
    setBusy(source.id);
    setError(null);
    const result = await scanWorkspaceWorkSource(source.id);
    if (!result.ok) setError(result.error);
    await refresh();
    setBusy(null);
  }

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {String(m.lead)}
      </Typography>
      {error ? <Alert severity="error">{String(m.error).replace("{error}", error)}</Alert> : null}

      <Box sx={{ display: "grid", gap: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          {String(m.listTitle)}
        </Typography>
        {sources.length ? (
          sources.map((source) => (
            <Box
              key={source.id}
              sx={{
                py: 1,
                display: "grid",
                gap: 0.75,
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Flex align="center" justify="space-between" gap={1} wrap>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    {source.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {m.kinds[source.kind] ?? source.kind}
                    {source.pathOrUrl ? ` · ${source.pathOrUrl}` : ""}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={Boolean(busy)}
                  onClick={() => void scan(source)}
                >
                  {String(m.scan)}
                </Button>
              </Flex>
              <Flex gap={0.75} wrap>
                <Chip size="small" label={`${String(m.status)}: ${source.status}`} />
                <Chip
                  size="small"
                  color={trustColor(source)}
                  label={`${String(m.trust)}: ${source.sourceTrust ?? "declared"}`}
                />
                {source.lastScan?.contentHash ? (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`${String(m.scanHash)}: ${source.lastScan.contentHash}`}
                  />
                ) : null}
                {typeof source.lastScan?.fileCount === "number" ? (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`${String(m.scanFiles)}: ${source.lastScan.fileCount}`}
                  />
                ) : null}
              </Flex>
              {source.limitations?.length ? (
                <Alert severity="info">{source.limitations.join(" · ")}</Alert>
              ) : null}
            </Box>
          ))
        ) : (
          <Typography variant="caption" color="text.secondary">
            {String(m.empty)}
          </Typography>
        )}
      </Box>

      <Divider />

      <Box sx={{ display: "grid", gap: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          {String(m.addTitle)}
        </Typography>
        <ResponsiveGrid min={220} gap={1}>
          <TextField
            select
            size="small"
            label={String(m.kindLabel)}
            value={kind}
            onChange={(event) => setKind(event.target.value as WorkSourceKind)}
          >
            {ADDABLE_KINDS.map((item) => (
              <MenuItem key={item} value={item}>
                {m.kinds[item] ?? item}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label={String(m.labelLabel)}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
          <TextField
            size="small"
            label={String(m.pathLabel)}
            value={pathOrUrl}
            onChange={(event) => setPathOrUrl(event.target.value)}
          />
        </ResponsiveGrid>
        <Box>
          <Button
            variant="contained"
            disabled={Boolean(busy) || label.trim().length < 2}
            onClick={() => void addSource()}
          >
            {String(m.addCta)}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
