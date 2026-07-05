import { Alert, Box, Button, Typography } from "@mui/material";
import type { RefObject } from "react";
import type { BrowserSnapshot } from "./browserSnapshot";
import type { SourcesCopy } from "./types";

export function BrowserSnapshotPanel({
  copy,
  busy,
  fileInputRef,
  snapshot,
  error,
  onPick,
  onSubmit,
}: {
  copy: SourcesCopy;
  busy: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  snapshot: BrowserSnapshot | null;
  error: string | null;
  onPick: (files: FileList | null) => void;
  onSubmit: () => void;
}) {
  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={(event) => onPick(event.target.files)}
        {...{ webkitdirectory: "", directory: "" }}
      />
      <Alert
        severity="success"
        action={
          <Button
            variant="contained"
            color="success"
            size="small"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
          >
            {copy.browserPickCta}
          </Button>
        }
      >
        <Typography variant="subtitle2">{copy.browserPickTitle}</Typography>
        <Typography variant="body2">{copy.browserPickHelp}</Typography>
      </Alert>
      {snapshot ? (
        <Alert
          severity="success"
          action={
            <Button color="inherit" size="small" disabled={busy} onClick={onSubmit}>
              {copy.browserSnapshotCta}
            </Button>
          }
        >
          {copy.browserSnapshotReady
            .replace("{files}", String(snapshot.fileCount))
            .replace("{hash}", snapshot.contentHash)}
        </Alert>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
    </Box>
  );
}
