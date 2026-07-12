import { Box, Typography } from "@mui/material";

export function ProfileDetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <Box sx={{ display: "grid", gap: 0.75 }}>
      <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary" }}>
        {title}
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.25, display: "grid", gap: 0.65 }}>
        {items.map((item) => (
          <Typography
            key={item}
            component="li"
            variant="body2"
            color="text.secondary"
            sx={{ pl: 0.25 }}
          >
            {item}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
