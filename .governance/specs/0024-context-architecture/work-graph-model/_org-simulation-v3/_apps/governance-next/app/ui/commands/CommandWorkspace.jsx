"use client";

import {
  Alert,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SaveIcon from "@mui/icons-material/Save";
import { useMemo, useState } from "react";
import { JsonBlock } from "../shared/JsonBlock.jsx";
import { commandFromPayload, commandTypes, defaultPayloadFor } from "./commandPayloads.js";

function formatPayload(value) {
  return JSON.stringify(value, null, 2);
}

export default function CommandWorkspace({ snapshot, onReload }) {
  const defaultAuthority =
    snapshot.authorities.find((authority) => authority.id === "pm-growth")?.id ||
    snapshot.authorities[0]?.id ||
    "";
  const [type, setType] = useState("proposal.create");
  const [authority, setAuthority] = useState(defaultAuthority);
  const [payloadText, setPayloadText] = useState(() =>
    formatPayload(defaultPayloadFor("proposal.create", snapshot))
  );
  const [lastCommand, setLastCommand] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const commandState = useMemo(() => {
    try {
      return {
        command: commandFromPayload({ type, payloadText, snapshot, authority }),
        error: null,
      };
    } catch (error) {
      return { command: null, error: error.message };
    }
  }, [authority, payloadText, snapshot, type]);
  const command = commandState.command;

  function clearDryRun() {
    setLastCommand(null);
    setResult(null);
  }

  function resetPayload(nextType = type) {
    setType(nextType);
    setPayloadText(formatPayload(defaultPayloadFor(nextType, snapshot)));
    clearDryRun();
  }

  function updateAuthority(nextAuthority) {
    setAuthority(nextAuthority);
    clearDryRun();
  }

  function updatePayload(nextPayloadText) {
    setPayloadText(nextPayloadText);
    clearDryRun();
  }

  async function submit(kind) {
    const commandToSend = kind === "execute" && lastCommand ? lastCommand : command;
    if (!commandToSend) return;
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch(`/api/commands/${kind === "execute" ? "execute" : "dry-run"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commandToSend),
      });
      const json = await response.json();
      setLastCommand(commandToSend);
      setResult({ status: response.status, ...json });
      if (kind === "execute" && json.ok) await onReload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={5}>
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h2">Command pipeline</Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  label="Tipo"
                  value={type}
                  onChange={(event) => resetPayload(event.target.value)}
                >
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
                  onChange={(event) => updateAuthority(event.target.value)}
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
                onChange={(event) => updatePayload(event.target.value)}
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
                <Alert severity="error">JSON inválido: {commandState.error}</Alert>
              ) : null}
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button
                  variant="text"
                  startIcon={<RestartAltIcon />}
                  onClick={() => resetPayload()}
                >
                  Exemplo
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  disabled={busy || !command}
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
              </Stack>
              {busy ? <LinearProgress /> : null}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={7}>
        <Stack spacing={2}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h2" gutterBottom>
                Comando
              </Typography>
              {command ? (
                <JsonBlock value={lastCommand || command} />
              ) : (
                <Alert severity="warning">Corrija o JSON para montar o comando.</Alert>
              )}
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h2" gutterBottom>
                Resultado
              </Typography>
              {result ? (
                <JsonBlock value={result} />
              ) : (
                <Alert severity="info">Nenhum dry-run ainda.</Alert>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Grid>
    </Grid>
  );
}
