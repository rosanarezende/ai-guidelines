"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import type {
  AssistantFunction,
  AssistantProviderKindId,
  WorkspaceAssistantConfig,
} from "@demo/contracts";
import { Flex } from "@/app/_ui/shared";
import {
  getAssistantConfig,
  saveAssistantProviderChoice,
  setAssistantDefaultChoice,
  testAssistantProviderChoice,
} from "@/app/_domain/adoption/shellClient";
import { DefaultsList } from "./DefaultsList";
import { ProviderSelector } from "./ProviderSelector";
import { healthLabel, latestProvider, m, PROVIDERS } from "./model";

export default function AssistantWorkspaceSection() {
  const [config, setConfig] = useState<WorkspaceAssistantConfig | null>(null);
  const [selectedKind, setSelectedKind] = useState<AssistantProviderKindId>("ollama");
  const selected = useMemo(
    () => PROVIDERS.find((provider) => provider.kind === selectedKind) || PROVIDERS[1],
    [selectedKind]
  );
  const [endpoint, setEndpoint] = useState(selected.endpoint || "");
  const [model, setModel] = useState(selected.model || "");
  const [health, setHealth] = useState<{
    status?: "ok" | "unreachable" | "egress-blocked";
    error?: string;
  } | null>(null);
  const [busy, setBusy] = useState<"load" | "save" | "test" | "default" | null>("load");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getAssistantConfig().then((response) => {
      if (!active) return;
      if (response.ok) setConfig(response.assistantConfig);
      setBusy(null);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setEndpoint(selected.endpoint || "");
    setModel(selected.model || "");
    setHealth(null);
    setNotice(null);
  }, [selected]);

  const savedProvider = latestProvider(config);
  const cloudBlocked = selected.kind === "cloud-approved" && !selected.egressApproved;
  const activeStatus = cloudBlocked
    ? m["status.cloudBlocked"]
    : savedProvider
      ? m["status.saved"].replace("{label}", savedProvider.label)
      : m["status.localPending"];

  async function reloadConfig() {
    const response = await getAssistantConfig();
    if (response.ok) setConfig(response.assistantConfig);
  }

  async function testProvider() {
    setBusy("test");
    setNotice(null);
    const response = await testAssistantProviderChoice({
      kind: selected.kind,
      ...(endpoint ? { endpoint } : {}),
    });
    setHealth({ status: response.status, error: response.ok ? undefined : response.error });
    setBusy(null);
  }

  async function saveProvider() {
    setBusy("save");
    setNotice(null);
    const response = await saveAssistantProviderChoice({
      kind: selected.kind,
      label: selected.label,
      ...(endpoint ? { endpoint } : {}),
      ...(model ? { model } : {}),
      maxClassification: selected.maxClassification,
      egressApproved: selected.egressApproved,
      runTest: selected.kind !== "cloud-approved",
    });
    if (response.ok) {
      await reloadConfig();
      setNotice(m["status.saved"].replace("{label}", selected.label));
    } else {
      setNotice(response.error);
    }
    setBusy(null);
  }

  async function setDefault(fn: AssistantFunction) {
    const provider = latestProvider(config);
    if (!provider) return;
    setBusy("default");
    const response = await setAssistantDefaultChoice({
      function: fn,
      providerId: provider.id,
    });
    if (response.ok) await reloadConfig();
    setBusy(null);
  }

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {m.lead}
      </Typography>

      <ProviderSelector selected={selected} onSelect={setSelectedKind} />

      {cloudBlocked ? (
        <Alert data-testid="egress-approval-required" severity="warning">
          <strong>{m["egress.title"]}</strong> — {m["egress.body"]}
        </Alert>
      ) : null}

      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "1fr 0.75fr" } }}>
        <TextField
          size="small"
          label={m["endpoint.label"]}
          value={endpoint}
          disabled={selected.kind === "lexical-deterministic"}
          onChange={(event) => setEndpoint(event.target.value)}
        />
        <TextField
          size="small"
          label={m["model.label"]}
          value={model}
          disabled={selected.kind === "lexical-deterministic"}
          onChange={(event) => setModel(event.target.value)}
        />
      </Box>

      <Flex gap={1} wrap align="center">
        <Button
          data-testid="assistant-health-check"
          variant="outlined"
          onClick={() => void testProvider()}
          disabled={busy === "test" || selected.kind === "lexical-deterministic"}
        >
          {busy === "test" ? m.testing : m.test}
        </Button>
        <Button
          data-testid="assistant-save-provider"
          variant="contained"
          onClick={() => void saveProvider()}
          disabled={busy === "save" || cloudBlocked}
        >
          {busy === "save" ? m.saving : m.save}
        </Button>
        <Chip
          data-testid="assistant-active-status"
          size="small"
          variant="outlined"
          label={activeStatus}
        />
        {busy === "load" ? <CircularProgress size={18} /> : null}
      </Flex>

      <Alert
        data-testid="assistant-health-result"
        severity={health?.status === "ok" ? "success" : "info"}
      >
        {healthLabel(health?.status, health?.error)}
      </Alert>

      {notice ? <Alert severity="info">{notice}</Alert> : null}

      <Divider />

      <DefaultsList
        busy={busy === "default"}
        config={config}
        savedProvider={savedProvider}
        onSetDefault={(fn) => void setDefault(fn)}
      />
    </Box>
  );
}
