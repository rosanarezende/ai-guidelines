import { Box, Paper, Typography } from "@mui/material";
import type { ReactNode } from "react";

export function WelcomeCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, display: "flex", gap: 1.75, alignItems: "flex-start" }}>
      <Box sx={{ color: "primary.main", mt: 0.25 }}>{icon}</Box>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {text}
        </Typography>
      </Box>
    </Paper>
  );
}
