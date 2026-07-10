import { Box, Button, Typography } from "@mui/material";
import { ResponsiveGrid } from "@/app/_ui/shared";
import { creatorModes, type CreatorMode } from "./authorityGuideModel";
import copy from "./_locales/pt-br.json";

export function CreatorModeSelector({
  currentPersonName,
  mode,
  onChoose,
}: {
  currentPersonName: string;
  mode: CreatorMode;
  onChoose: (mode: CreatorMode) => void;
}) {
  return (
    <Box data-testid="onboarding-creator-authority" sx={{ display: "grid", gap: 1.5 }}>
      <Typography variant="body2" sx={{ fontWeight: 800 }}>
        {copy.creatorQuestion}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {copy.creatorLead.replace("{name}", currentPersonName)}
      </Typography>
      <ResponsiveGrid min={220} gap={1}>
        {creatorModes.map((item) => (
          <Button
            key={item.id}
            data-testid={`creator-role-${item.id}`}
            variant={mode === item.id ? "contained" : "outlined"}
            color={mode === item.id ? "success" : "inherit"}
            onClick={() => onChoose(item.id)}
            sx={{
              alignItems: "flex-start",
              justifyContent: "flex-start",
              minHeight: 116,
              p: 1.5,
              textAlign: "left",
              textTransform: "none",
            }}
          >
            <Box sx={{ display: "grid", gap: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 900 }}>
                {item.title}
              </Typography>
              <Typography variant="caption" color={mode === item.id ? "inherit" : "text.secondary"}>
                {item.description}
              </Typography>
            </Box>
          </Button>
        ))}
      </ResponsiveGrid>
    </Box>
  );
}
