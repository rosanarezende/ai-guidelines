import { Card, CardActionArea, Typography } from "@mui/material";

export function ChoiceCard({
  title,
  body,
  selected,
  onClick,
}: {
  title: string;
  body: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: selected ? "rgba(27, 94, 51, 0.08)" : "background.paper",
      }}
    >
      <CardActionArea onClick={onClick} sx={{ height: "100%", p: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {body}
        </Typography>
      </CardActionArea>
    </Card>
  );
}
