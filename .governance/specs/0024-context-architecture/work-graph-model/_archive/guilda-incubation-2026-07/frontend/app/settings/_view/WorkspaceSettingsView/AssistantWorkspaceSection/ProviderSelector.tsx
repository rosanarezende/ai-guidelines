import { Box, Button, Typography } from "@mui/material";
import type { AssistantProviderKindId } from "@demo/contracts";
import { m, PROVIDERS, providerTestId, type ProviderOption } from "./model";

export function ProviderSelector({
  selected,
  onSelect,
}: {
  selected: ProviderOption;
  onSelect: (kind: AssistantProviderKindId) => void;
}) {
  return (
    <Box data-testid="assistant-provider-list" sx={{ display: "grid", gap: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {m["providers.title"]}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 1,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
        }}
      >
        {PROVIDERS.map((provider) => {
          const selectedProvider = provider.kind === selected.kind;
          return (
            <Button
              key={provider.kind}
              data-testid={providerTestId(provider.kind)}
              variant={selectedProvider ? "contained" : "outlined"}
              color={selectedProvider ? "primary" : "inherit"}
              onClick={() => onSelect(provider.kind)}
              sx={{
                alignItems: "flex-start",
                justifyContent: "flex-start",
                p: 1.5,
                minHeight: 116,
                textAlign: "left",
                textTransform: "none",
              }}
            >
              <Box sx={{ display: "grid", gap: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  {provider.label}
                </Typography>
                <Typography variant="caption" sx={{ opacity: selectedProvider ? 0.86 : 0.72 }}>
                  {provider.desc}
                </Typography>
              </Box>
            </Button>
          );
        })}
      </Box>
    </Box>
  );
}
