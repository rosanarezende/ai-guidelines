import { Alert, Box, Button, TextField, Typography } from "@mui/material";
import type { SourcesCopy } from "./types";

export function ManualPathPanel({
  copy,
  mode,
  value,
  busy,
  canSubmit,
  onChange,
  onSubmit,
}: {
  copy: SourcesCopy;
  mode: "browser-or-path" | "url";
  value: string;
  busy: boolean;
  canSubmit: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const isUrl = mode === "url";
  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <Alert severity={isUrl ? "info" : "warning"}>
        <Typography variant="subtitle2">
          {isUrl ? copy.urlTitle : copy.manualPathTitle}
        </Typography>
        <Typography variant="body2">{isUrl ? copy.urlBody : copy.manualPathBody}</Typography>
      </Alert>
      <TextField
        size="small"
        required
        label={isUrl ? copy.urlLabel : copy.pathLabel}
        value={value}
        helperText={isUrl ? copy.urlHelp : copy.pathRequired}
        onChange={(event) => onChange(event.target.value)}
      />
      {!isUrl ? <Alert severity="warning">{copy.pathScopeWarning}</Alert> : null}
      <Button variant="contained" disabled={busy || !canSubmit} onClick={onSubmit}>
        {isUrl ? copy.addCta : copy.addAndScanCta}
      </Button>
    </Box>
  );
}
