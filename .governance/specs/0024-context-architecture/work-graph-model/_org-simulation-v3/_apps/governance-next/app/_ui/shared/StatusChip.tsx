import { Chip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export function StatusChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Chip
      size="small"
      color={ok ? "success" : "warning"}
      icon={ok ? <CheckCircleIcon /> : <WarningAmberIcon />}
      label={label}
      variant={ok ? "filled" : "outlined"}
    />
  );
}
