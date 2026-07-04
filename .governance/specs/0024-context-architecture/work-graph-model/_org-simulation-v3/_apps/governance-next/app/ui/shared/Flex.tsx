import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

export function Flex({
  children,
  gap = 1,
  align = "stretch",
  justify = "flex-start",
  wrap = false,
  direction = "row",
  sx,
}: {
  children: ReactNode;
  gap?: number;
  align?: string;
  justify?: string;
  wrap?: boolean;
  direction?: "row" | "column";
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      sx={[
        {
          display: "flex",
          flexDirection: direction,
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? "wrap" : "nowrap",
          gap,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  );
}
