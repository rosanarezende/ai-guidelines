"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SaveIcon from "@mui/icons-material/Save";
import { useMemo, useState } from "react";
import type { SelectChangeEvent } from "@mui/material/Select";
import type { CommandResult, CommandType, GovernedCommand, GovernanceSnapshot } from "@/lib/types";
import { Flex, SectionCard } from "@/app/ui/shared/components";
import { JsonBlock } from "@/app/ui/shared/JsonBlock";
import {
  commandFromPayload,
  commandTypes,
  defaultAuthorityFor,
  defaultPayloadFor,
} from "./commandPayloads";

function formatPayload(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

type CommandResponse = CommandResult & { status: number };

export default function CommandWorkspace({
  snapshot,
  onReload,
}: {
  snapshot: GovernanceSnapshot;
  onReload: () => Promise<void>;
}) {
  const [type, setType] = useState<CommandType>("proposal.create");
  const [authority, setAuthority] = useState(() =>
    defaultAuthorityFor("proposal.create", snapshot)
  );
  const [payloadText, setPayloadText] = useState(() =>
    formatPayload(defaultPayloadFor("proposal.create", snapshot))
  );
  const [lastCommand, setLastCommand] = useState<GovernedCommand | null>(null);
  const [result, setResult] = useState<CommandResponse | null>(null);
  const [busy, setBusy] = useState(false);

  const commandState = useMemo(() => {
    try {
      return {
        command: commandFromPayload({ type, payloadText, snapshot, authority }),
        error: null,
      };
    } catch (error) {
      return {
        command: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [authority, payloadText, snapshot, type]);

  function clearDryRun() {
    setLastCommand(null);
    setResult(null);
  }

  function resetPayload(nextType = type) {
    setType(nextType);
    setAuthority(defaultAuthorityFor(nextType, snapshot));
    setPayloadText(formatPayload(defaultPayloadFor(nextType, snapshot)));
    clearDryRun();
  }

  function updateType(event: SelectChangeEvent<CommandType>) {
    resetPayload(event.target.value as CommandType);
  }

  async function submit(kind: "dry-run" | "execute") {
    const commandToSend = kind === "execute" && lastCommand ? lastCommand : commandState.command;
    if (!commandToSend) return;
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch(`/api/commands/${kind === "execute" ? "execute" : "dry-run"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commandToSend),
      });
      const json = (await response.json()) as CommandResult;
      setLastCommand(commandToSend);
      setResult({ status: response.status, ...json });
      if (kind === "execute" && json.ok) await onReload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "minmax(360px, 0.8fr) minmax(0, 1.2fr)" },
        gap: 2,
      }}
    >
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: "grid", gap: 2 }}>
            <Box>
              <Typography variant="h2">Command Console</Typography>
              <Typography variant="body2" color="text.secondary">
                Area de auditor/admin. A experiencia principal do app nao depende deste console.
              </Typography>
            </Box>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select label="Tipo" value={type} onChange={updateType}>
                {commandTypes.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Authority</InputLabel>
              <Select
                label="Authority"
                value={authority}
                onChange={(event) => {
                  setAuthority(event.target.value);
                  clearDryRun();
                }}
              >
                {snapshot.authorities.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Alert severity="info">base-revision atual: {snapshot.revision}</Alert>
            <TextField
              label="Payload do comando"
              value={payloadText}
              onChange={(event) => {
                setPayloadText(event.target.value);
                clearDryRun();
              }}
              multiline
              minRows={18}
              spellCheck={false}
              sx={{
                "& textarea": {
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
                  fontSize: 12,
                },
              }}
            />
            {commandState.error ? (
              <Alert severity="error">JSON invalido: {commandState.error}</Alert>
            ) : null}
            <Flex wrap gap={1}>
              <Button variant="text" startIcon={<RestartAltIcon />} onClick={() => resetPayload()}>
                Exemplo
              </Button>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                disabled={busy || !commandState.command}
                onClick={() => submit("dry-run")}
              >
                Dry-run
              </Button>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                disabled={busy || !lastCommand || result?.ok !== true}
                onClick={() => submit("execute")}
              >
                Execute
              </Button>
            </Flex>
            {busy ? <LinearProgress /> : null}
          </Box>
        </CardContent>
      </Card>
      <Box sx={{ display: "grid", gap: 2 }}>
        <SectionCard title="Comando montado">
          {commandState.command ? (
            <JsonBlock value={lastCommand || commandState.command} />
          ) : (
            <Alert severity="warning">Corrija o JSON para montar o comando.</Alert>
          )}
        </SectionCard>
        <SectionCard title="Resultado">
          {result ? (
            <JsonBlock value={result} />
          ) : (
            <Alert severity="info">Nenhum dry-run ainda.</Alert>
          )}
        </SectionCard>
      </Box>
    </Box>
  );
}
