import { Box } from "@mui/material";
import type { ReactNode } from "react";

export function ResponsiveGrid({
  children,
  min = 320,
  gap = 2,
}: {
  children: ReactNode;
  min?: number;
  gap?: number;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))`,
        gap,
      }}
    >
      {children}
    </Box>
  );
}
