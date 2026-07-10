import { Box, Typography } from "@mui/material";
import copy from "./_locales/pt-br.json";

export function StepHeading({ step, title, lead }: { step: number; title: string; lead: string }) {
  return (
    <Box sx={{ display: "grid", gap: 0.75 }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
        {copy.stepHeading.prefix} {step} {copy.stepHeading.of} 6
      </Typography>
      <Typography sx={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.3px" }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640 }}>
        {lead}
      </Typography>
    </Box>
  );
}
