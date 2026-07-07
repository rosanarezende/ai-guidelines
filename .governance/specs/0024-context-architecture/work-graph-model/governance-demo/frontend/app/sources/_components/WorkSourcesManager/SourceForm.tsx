"use client";

import { Alert, Box, Button, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Flex, ResponsiveGrid } from "@/app/_ui/shared";
import { BrowserSnapshotPanel } from "./BrowserSnapshotPanel";
import { ChoiceCard } from "./ChoiceCard";
import { ManualPathPanel } from "./ManualPathPanel";
import { createBrowserSnapshot, type BrowserSnapshot } from "./browserSnapshot";
import {
  defaultScenario,
  scenariosFor,
  sourceScenario,
  type SourceLocation,
  type SourceScenario,
  type SourceScenarioId,
} from "./sourceFlow";
import type { AddSourceInput, SourcesCopy } from "./types";

export function SourceForm({
  copy,
  busy,
  onSubmit,
}: {
  copy: SourcesCopy;
  busy: boolean;
  onSubmit: (input: AddSourceInput) => void;
}) {
  const [location, setLocation] = useState<SourceLocation | null>(null);
  const [scenarioId, setScenarioId] = useState<SourceScenarioId | null>(null);
  const [label, setLabel] = useState("");
  const [pathOrUrl, setPathOrUrl] = useState("");
  const [manualPathOpen, setManualPathOpen] = useState(false);
  const [browserSnapshot, setBrowserSnapshot] = useState<BrowserSnapshot | null>(null);
  const [browserError, setBrowserError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scenario = scenarioId ? sourceScenario(scenarioId) : null;
  const scenarioCopy = scenario ? copy.scenarios[scenario.id] : null;
  const mode = scenario?.mode;
  const canUseBrowserSnapshot = mode === "browser-or-path";
  const showManualPath = mode === "url" || (mode === "browser-or-path" && manualPathOpen);
  const canSubmitDeclared = mode === "declared" && label.trim().length >= 2;
  const canSubmitManual =
    showManualPath && label.trim().length >= 2 && pathOrUrl.trim().length >= 2;

  const locationCards = useMemo(
    () => [
      { id: "local" as const, title: copy.flow.localTitle, body: copy.flow.localBody },
      { id: "cloud" as const, title: copy.flow.cloudTitle, body: copy.flow.cloudBody },
    ],
    [copy.flow]
  );

  function chooseLocation(next: SourceLocation) {
    setLocation(next);
    setScenarioId(defaultScenario(next).id);
    resetInput();
  }

  function chooseScenario(next: SourceScenario) {
    setScenarioId(next.id);
    resetInput();
  }

  function resetInput() {
    setLabel("");
    setPathOrUrl("");
    setManualPathOpen(false);
    setBrowserSnapshot(null);
    setBrowserError(null);
  }

  function submitDeclared() {
    if (!scenario || !canSubmitDeclared) return;
    submit({
      kind: scenario.kind,
      label: label.trim(),
      scanAfterCreate: false,
    });
  }

  function submitManualPath() {
    if (!scenario || !canSubmitManual) return;
    submit({
      kind: scenario.kind,
      label: label.trim(),
      pathOrUrl: pathOrUrl.trim(),
      scanAfterCreate: mode === "browser-or-path",
    });
  }

  function submitBrowserSnapshot() {
    if (!scenario || !browserSnapshot) return;
    submit({
      kind: scenario.kind,
      label: label.trim() || browserSnapshot.label,
      browserScan: {
        fileCount: browserSnapshot.fileCount,
        contentHash: browserSnapshot.contentHash,
      },
      scanAfterCreate: false,
    });
  }

  function submit(input: AddSourceInput) {
    onSubmit(input);
    resetInput();
  }

  async function pickBrowserFolder(files: FileList | null) {
    setBrowserError(null);
    if (!files || files.length === 0) return;
    try {
      const snapshot = await createBrowserSnapshot(files);
      setBrowserSnapshot(snapshot);
      if (!label.trim()) setLabel(snapshot.label);
    } catch {
      setBrowserError(copy.browserPickUnsupported);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>
          {copy.addTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {copy.addLead}
        </Typography>
      </Box>

      <ResponsiveGrid min={240} gap={1}>
        {locationCards.map((item) => (
          <ChoiceCard
            key={item.id}
            title={item.title}
            body={item.body}
            selected={location === item.id}
            onClick={() => chooseLocation(item.id)}
            testId={item.id === "local" ? "source-kind-local" : "source-kind-cloud"}
          />
        ))}
      </ResponsiveGrid>

      {location ? (
        <Box
          data-testid={
            location === "local" ? "local-source-project-state" : "cloud-source-provider-state"
          }
          sx={{ display: "grid", gap: 1 }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>
            {location === "local" ? copy.flow.localQuestion : copy.flow.cloudQuestion}
          </Typography>
          <ResponsiveGrid min={220} gap={1}>
            {scenariosFor(location).map((item) => {
              const itemCopy = copy.scenarios[item.id];
              return (
                <ChoiceCard
                  key={item.id}
                  title={itemCopy.title}
                  body={itemCopy.body}
                  selected={scenarioId === item.id}
                  onClick={() => chooseScenario(item)}
                  testId={
                    item.id === "local-git"
                      ? "local-source-git-state"
                      : item.id === "local-empty"
                        ? "local-source-empty-state"
                        : item.id === "github"
                          ? "cloud-provider-github"
                          : undefined
                  }
                />
              );
            })}
          </ResponsiveGrid>
        </Box>
      ) : null}

      {scenario && scenarioCopy ? (
        <Box sx={{ display: "grid", gap: 1.5 }}>
          <Alert severity="info">
            <Typography variant="subtitle2">{scenarioCopy.title}</Typography>
            <Typography variant="body2">{scenarioCopy.guidance}</Typography>
            <Typography variant="body2">{scenarioCopy.proof}</Typography>
          </Alert>

          <TextField
            size="small"
            label={copy.labelLabel}
            value={label}
            helperText={copy.labelHelp}
            onChange={(event) => setLabel(event.target.value)}
          />

          {mode === "integration" ? (
            <Alert
              severity="warning"
              action={
                <Button component={Link} href="/settings#integracoes" size="small" color="inherit">
                  <span data-testid="source-cloud-connect-github">{copy.githubCta}</span>
                </Button>
              }
            >
              <Typography variant="subtitle2">{copy.githubTitle}</Typography>
              <Typography variant="body2">{copy.githubBody}</Typography>
            </Alert>
          ) : null}

          {canUseBrowserSnapshot ? (
            <BrowserSnapshotPanel
              copy={copy}
              busy={busy}
              fileInputRef={fileInputRef}
              snapshot={browserSnapshot}
              error={browserError}
              onPick={(files) => void pickBrowserFolder(files)}
              onSubmit={submitBrowserSnapshot}
            />
          ) : null}

          {mode === "browser-or-path" ? (
            <Button
              data-testid="source-local-browse"
              variant="text"
              size="small"
              sx={{ justifySelf: "start" }}
              onClick={() => setManualPathOpen((current) => !current)}
            >
              {manualPathOpen ? copy.manualPathClose : copy.manualPathOpen}
            </Button>
          ) : null}

          {showManualPath ? (
            <ManualPathPanel
              copy={copy}
              mode={mode}
              value={pathOrUrl}
              busy={busy}
              canSubmit={canSubmitManual}
              onChange={setPathOrUrl}
              onSubmit={submitManualPath}
            />
          ) : null}

          {mode === "declared" ? (
            <Flex gap={1} align="center" wrap>
              <Button
                data-testid="source-declared-add"
                variant="contained"
                disabled={busy || !canSubmitDeclared}
                onClick={submitDeclared}
              >
                {copy.addCta}
              </Button>
              <Typography variant="caption" color="text.secondary">
                {scenarioCopy.declaredHelp}
              </Typography>
            </Flex>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}
