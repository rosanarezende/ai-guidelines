import { Button, Paper, Typography } from "@mui/material";
import ForumIcon from "@mui/icons-material/Forum";
import Link from "next/link";
import { Flex } from "@/app/_ui/shared";
import copy from "./_locales/pt-br.json";

export function AssistantPrompt({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderStyle: "dashed", display: "grid", gap: 1 }}>
      <Flex align="center" gap={1}>
        <ForumIcon fontSize="small" color="action" />
        <Typography variant="h3">
          {copy.assistant.title}{" "}
          <Typography component="span" variant="body2" color="text.secondary">
            {copy.assistant.optional}
          </Typography>
        </Typography>
      </Flex>
      <Typography variant="body2" color="text.secondary">
        {copy.assistant.body}
      </Typography>
      <Flex gap={1}>
        <Button component={Link} href="/settings#assistente" size="small" variant="outlined">
          {copy.assistant.configure}
        </Button>
        <Button size="small" color="inherit" onClick={onDismiss}>
          {copy.assistant.dismiss}
        </Button>
      </Flex>
    </Paper>
  );
}
