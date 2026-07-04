import { Box, Card, CardActionArea } from "@mui/material";
import type { ReactNode } from "react";

// OptionCard — cartão selecionável. `children` vira o alvo clicável; conteúdo
// INTERATIVO (inputs/botões) deve ir em `detail`, renderizado fora do
// CardActionArea — <button> não pode conter <button>/<input> (HTML inválido
// quebra hydration).
export function OptionCard({
  selected,
  onClick,
  children,
  detail,
  disabled = false,
}: {
  selected: boolean;
  onClick?: () => void;
  children: ReactNode;
  detail?: ReactNode;
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
      {detail ? <Box sx={{ px: 2, pb: 2 }}>{detail}</Box> : null}
    </Card>
  );
}
