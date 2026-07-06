"use client";

// GovernanceHostSection — escolher/criar/vincular o governance host (R1).
// Três distribuições físicas + sandbox explícito (QRD-08/09/21); o fit-check
// roda no backend real (mock-api devolve resultado simulado marcado como tal).
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import type { GovernanceHostKind, HostFitCheck } from "@demo/contracts";
import { Flex } from "@/app/_ui/shared";
import copy from "./_locales/pt-br.json";

const m = copy.messages as Record<string, string>;
const KINDS: GovernanceHostKind[] = ["dedicated-repo", "local-folder", "existing-repo-folder"];

type HostInfo = {
  governanceHost: { kind: GovernanceHostKind; pathOrUrl: string; fitCheck?: HostFitCheck } | null;
  sandboxDeclared: boolean;
  suggestions: Record<GovernanceHostKind, string>;
};

export default function GovernanceHostSection({ initial }: { initial: HostInfo }) {
  const [info, setInfo] = useState(initial);
  const [kind, setKind] = useState<GovernanceHostKind>("local-folder");
  const [path, setPath] = useState(initial.suggestions["local-folder"] || "");
  const [fitCheck, setFitCheck] = useState<HostFitCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/local/governance-host", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        fitCheck?: HostFitCheck;
        governanceHost?: HostInfo["governanceHost"];
        sandboxDeclared?: boolean;
      };
      if (!data.ok) {
        setError(data.error || "erro");
        return;
      }
      if (data.fitCheck) setFitCheck(data.fitCheck);
      if (data.governanceHost)
        setInfo((cur) => ({ ...cur, governanceHost: data.governanceHost ?? null }));
      if (data.sandboxDeclared) setInfo((cur) => ({ ...cur, sandboxDeclared: true }));
    } finally {
      setBusy(false);
    }
  }

  if (info.governanceHost) {
    const check = info.governanceHost.fitCheck;
    return (
      <Box sx={{ display: "grid", gap: 1 }}>
        <Flex wrap gap={1}>
          <Chip
            size="small"
            color="success"
            label={`${m["workspaceSettings.host.linked"]}: ${info.governanceHost.pathOrUrl}`}
          />
          {check?.sourceRevision ? (
            <Chip
              size="small"
              variant="outlined"
              label={`${m["workspaceSettings.host.revision"]}: ${check.sourceRevision}`}
            />
          ) : null}
        </Flex>
        {check?.warnings?.length ? (
          <Alert severity="warning">{check.warnings.join(" · ")}</Alert>
        ) : null}
      </Box>
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <Typography variant="body2" color="text.secondary">
        {m["workspaceSettings.host.lead"]}
      </Typography>
      {info.sandboxDeclared ? (
        <Alert severity="info">{m["workspaceSettings.host.sandbox.active"]}</Alert>
      ) : null}
      <RadioGroup
        value={kind}
        onChange={(event) => {
          const next = event.target.value as GovernanceHostKind;
          setKind(next);
          setPath(info.suggestions[next] || "");
          setFitCheck(null);
        }}
      >
        {KINDS.map((option) => (
          <FormControlLabel
            key={option}
            value={option}
            control={<Radio size="small" />}
            label={
              <Box>
                <Typography variant="body2">
                  {m[`workspaceSettings.host.kind.${option}`]}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {m[`workspaceSettings.host.kind.${option}.desc`]}
                </Typography>
              </Box>
            }
          />
        ))}
      </RadioGroup>
      <TextField
        size="small"
        label={m["workspaceSettings.host.path.label"]}
        value={path}
        onChange={(event) => setPath(event.target.value)}
      />
      <Flex wrap gap={1}>
        <Button
          size="small"
          variant="outlined"
          disabled={busy}
          onClick={() => void post({ action: "fit-check", kind, pathOrUrl: path })}
        >
          {m["workspaceSettings.host.fitCheck"]}
        </Button>
        <Button
          size="small"
          variant="contained"
          disabled={busy}
          onClick={() => void post({ action: "create", kind, pathOrUrl: path })}
        >
          {m["workspaceSettings.host.create"]}
        </Button>
        <Button
          size="small"
          variant="outlined"
          disabled={busy}
          onClick={() => void post({ action: "link", kind, pathOrUrl: path })}
        >
          {m["workspaceSettings.host.link"]}
        </Button>
        <Button
          size="small"
          color="warning"
          disabled={busy || info.sandboxDeclared}
          onClick={() => void post({ action: "sandbox" })}
        >
          {m["workspaceSettings.host.sandbox"]}
        </Button>
      </Flex>
      <Typography variant="caption" color="text.secondary">
        {m["workspaceSettings.host.sandbox.note"]}
      </Typography>
      {fitCheck ? (
        <Alert severity={fitCheck.ok ? "success" : "warning"}>
          {m["workspaceSettings.host.check.ok"]}{" "}
          {fitCheck.warnings.length
            ? `${m["workspaceSettings.host.check.warnings"]}: ${fitCheck.warnings.join(" · ")}`
            : ""}
        </Alert>
      ) : null}
      {error ? (
        <Alert severity="error">
          {m["workspaceSettings.host.error"].replace("{error}", error)}
        </Alert>
      ) : null}
    </Box>
  );
}
