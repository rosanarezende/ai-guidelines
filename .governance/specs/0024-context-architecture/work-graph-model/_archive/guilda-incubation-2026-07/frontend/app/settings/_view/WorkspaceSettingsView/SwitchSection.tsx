"use client";

// SwitchSection — troca de organização (contextos não se misturam).
import { Box, Button, Typography } from "@mui/material";
import Link from "next/link";
import { SectionCard } from "@/app/_ui/shared";
import copy from "./_locales/pt-br.json";

const m = copy.messages as Record<string, string>;

export default function SwitchSection() {
  return (
    <SectionCard title={m["workspaceSettings.switch.title"]}>
      <Box sx={{ display: "grid", gap: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          {m["workspaceSettings.switch.desc"]}
        </Typography>
        <Box>
          <Button component={Link} href="/organizations" size="small" variant="outlined">
            {m["workspaceSettings.switch.cta"]}
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {m["workspaceSettings.demo.note"]}
        </Typography>
      </Box>
    </SectionCard>
  );
}
