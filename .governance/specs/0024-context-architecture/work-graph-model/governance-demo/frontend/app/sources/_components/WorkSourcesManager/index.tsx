"use client";

import { Alert, Box, Divider, Typography } from "@mui/material";
import type { WorkSource } from "@demo/contracts";
import { useEffect, useState } from "react";
import {
  addWorkspaceWorkSource,
  getWorkSources,
  recordBrowserWorkSourceScan,
  scanWorkspaceWorkSource,
} from "@/app/_domain/adoption/shellClient";
import { SectionCard } from "@/app/_ui/shared";
import copy from "./_locales/pt-br.json";
import { SourceForm } from "./SourceForm";
import { SourceList } from "./SourceList";
import type { AddSourceInput, SourcesCopy } from "./types";

const m = copy as SourcesCopy;

export default function WorkSourcesManager({ embedded = false }: { embedded?: boolean }) {
  const [sources, setSources] = useState<WorkSource[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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

  async function addSource(input: AddSourceInput) {
    setBusy("add");
    setError(null);
    setMessage(null);
    const result = await addWorkspaceWorkSource({
      kind: input.kind,
      label: input.label,
      ...(input.pathOrUrl ? { pathOrUrl: input.pathOrUrl } : {}),
    });
    if (!result.ok) {
      setError(result.error);
      setBusy(null);
      return;
    }
    if (input.browserScan) {
      const browserScanResult = await recordBrowserWorkSourceScan({
        sourceId: result.source.id,
        scan: input.browserScan,
      });
      if (!browserScanResult.ok) {
        setError(browserScanResult.error);
      } else {
        setMessage(m.successScanned.replace("{label}", result.source.label));
      }
    } else if (input.scanAfterCreate) {
      const scanResult = await scanWorkspaceWorkSource(result.source.id);
      if (!scanResult.ok) {
        setError(scanResult.error);
      } else {
        setMessage(m.successScanned.replace("{label}", result.source.label));
      }
    } else {
      setMessage(m.successAdded.replace("{label}", result.source.label));
    }
    await refresh();
    setBusy(null);
  }

  async function scan(source: WorkSource) {
    setBusy(source.id);
    setError(null);
    setMessage(null);
    const result = await scanWorkspaceWorkSource(source.id);
    if (!result.ok) {
      setError(result.error);
    } else {
      setMessage(m.successScanned.replace("{label}", source.label));
    }
    await refresh();
    setBusy(null);
  }

  const content = (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {m.lead}
      </Typography>
      <Alert severity="info">
        <Typography variant="subtitle2">{m.scopeTitle}</Typography>
        <Typography variant="body2">{m.scopeBody}</Typography>
        <Box component="ul" sx={{ m: 0.75, pl: 2.5 }}>
          {m.scopeItems.map((item) => (
            <li key={item}>
              <Typography variant="body2">{item}</Typography>
            </li>
          ))}
        </Box>
      </Alert>
      {error ? <Alert severity="error">{m.error.replace("{error}", error)}</Alert> : null}
      {message ? <Alert severity="success">{message}</Alert> : null}

      <Box sx={{ display: "grid", gap: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>
          {m.listTitle}
        </Typography>
        <SourceList copy={m} sources={sources} busy={busy} onScan={(source) => void scan(source)} />
      </Box>

      <Divider />
      <SourceForm copy={m} busy={Boolean(busy)} onSubmit={(input) => void addSource(input)} />
    </Box>
  );

  if (embedded) return content;
  return <SectionCard title={m.title}>{content}</SectionCard>;
}
