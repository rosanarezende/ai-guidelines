import { Chip } from "@mui/material";

export function DataPill({ label }: { label: string }) {
  return <Chip size="small" label={label} variant="outlined" />;
}
