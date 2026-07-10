import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  tone = "default",
  detail,
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "success" | "warning" | "error" | "info";
  detail?: string;
}) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h1" component="div">
          {value}
        </Typography>
        {detail ? (
          <Typography variant="caption" color="text.secondary">
            {detail}
          </Typography>
        ) : null}
        {tone !== "default" ? (
          <Box sx={{ mt: 1 }}>
            <Chip size="small" color={tone} label={tone} />
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
}
