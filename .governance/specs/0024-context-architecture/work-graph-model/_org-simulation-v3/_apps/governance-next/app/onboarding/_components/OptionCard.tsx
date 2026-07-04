import { Card, CardActionArea } from "@mui/material";
import type { ReactNode } from "react";

export function OptionCard({
  selected,
  onClick,
  children,
  disabled = false,
}: {
  selected: boolean;
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        opacity: disabled ? 0.6 : 1,
        borderColor: selected ? "primary.main" : "divider",
        borderWidth: selected ? 2 : 1,
        bgcolor: selected ? "#f4f9f5" : "background.paper",
      }}
    >
      <CardActionArea
        disabled={disabled || !onClick}
        onClick={onClick}
        sx={{ height: "100%", p: 2 }}
      >
        {children}
      </CardActionArea>
    </Card>
  );
}
