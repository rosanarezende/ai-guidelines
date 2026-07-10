import { Box, Paper, Typography } from "@mui/material";
import type { ReactNode } from "react";

export function EntityCard({
  title,
  subtitle,
  children,
  "data-testid": dataTestId,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  "data-testid"?: string;
}) {
  return (
    <Paper data-testid={dataTestId} variant="outlined" sx={{ p: 1.5, height: "100%" }}>
      <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      ) : null}
      {children ? <Box sx={{ mt: 1 }}>{children}</Box> : null}
    </Paper>
  );
}
