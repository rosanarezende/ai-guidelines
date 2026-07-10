import { Alert, Box, Button, Typography } from "@mui/material";
import type {
  AssistantFunction,
  AssistantProviderConfig,
  WorkspaceAssistantConfig,
} from "@demo/contracts";
import { Flex } from "@/app/_ui/shared";
import { DEFAULT_FUNCTIONS, functionLabel, m } from "./model";

export function DefaultsList({
  busy,
  config,
  savedProvider,
  onSetDefault,
}: {
  busy: boolean;
  config: WorkspaceAssistantConfig | null;
  savedProvider: AssistantProviderConfig | null;
  onSetDefault: (fn: AssistantFunction) => void;
}) {
  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {m["defaults.title"]}
      </Typography>
      {!savedProvider ? <Alert severity="info">{m["defaults.empty"]}</Alert> : null}
      {DEFAULT_FUNCTIONS.map((fn) => {
        const providerId = config?.defaults?.[fn];
        const provider = (config?.providers || []).find((item) => item.id === providerId);
        return (
          <Flex
            key={fn}
            data-testid={
              fn === "explain-policy"
                ? "assistant-default-explain-policy"
                : fn === "suggest-triage-questions"
                  ? "assistant-default-triage"
                  : undefined
            }
            justify="space-between"
            align="center"
            gap={1}
            wrap
            sx={{ py: 1, borderTop: "1px solid", borderColor: "divider" }}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 650 }}>
                {functionLabel(fn)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {provider ? provider.label : "sem default"}
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              disabled={!savedProvider || busy}
              onClick={() => onSetDefault(fn)}
            >
              {m["defaults.set"]}
            </Button>
          </Flex>
        );
      })}
    </Box>
  );
}
