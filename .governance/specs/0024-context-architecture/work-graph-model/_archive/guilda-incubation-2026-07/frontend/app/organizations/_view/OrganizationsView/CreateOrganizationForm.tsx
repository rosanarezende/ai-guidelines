"use client";

import { Box, Button, Card, CardActionArea, TextField, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { useState } from "react";
import { Flex, ResponsiveGrid } from "@/app/_ui/shared";
import type { WorkspaceKind } from "@demo/contracts";
import copy from "./_locales/pt-br.json";

const m = copy.messages;

const KIND_OPTIONS: Array<{ kind: WorkspaceKind; title: string; desc: string }> = [
  {
    kind: "company",
    title: m["organizations.create.kind.company.title"],
    desc: m["organizations.create.kind.company.desc"],
  },
  {
    kind: "personal",
    title: m["organizations.create.kind.personal.title"],
    desc: m["organizations.create.kind.personal.desc"],
  },
  {
    kind: "client",
    title: m["organizations.create.kind.client.title"],
    desc: m["organizations.create.kind.client.desc"],
  },
];

export function CreateOrganizationForm({
  busy,
  onCreate,
}: {
  busy: boolean;
  onCreate: (input: { name: string; kind: WorkspaceKind }) => void;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<WorkspaceKind>("company");

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <TextField
        label={m["organizations.create.name.label"]}
        value={name}
        onChange={(event) => setName(event.target.value)}
        size="small"
        slotProps={{ htmlInput: { "data-testid": "workspace-create-name" } }}
      />
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {m["organizations.create.kind.question"]}
      </Typography>
      <ResponsiveGrid min={200} gap={1.25}>
        {KIND_OPTIONS.map((option) => {
          const selected = option.kind === kind;
          return (
            <Card
              key={option.kind}
              variant="outlined"
              sx={{
                borderColor: selected ? "primary.main" : "divider",
                borderWidth: selected ? 2 : 1,
                bgcolor: selected ? "#f4f9f5" : "background.paper",
              }}
            >
              <CardActionArea
                data-testid={`workspace-kind-${option.kind}`}
                onClick={() => setKind(option.kind)}
                sx={{ p: 1.75, height: "100%" }}
              >
                <Flex align="center" gap={1}>
                  {selected ? (
                    <CheckCircleIcon color="primary" fontSize="small" />
                  ) : (
                    <RadioButtonUncheckedIcon fontSize="small" sx={{ color: "#c2c9c2" }} />
                  )}
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {option.title}
                  </Typography>
                </Flex>
                <Typography variant="caption" color="text.secondary">
                  {option.desc}
                </Typography>
              </CardActionArea>
            </Card>
          );
        })}
      </ResponsiveGrid>
      <Flex align="center" gap={2} wrap>
        <Button
          variant="contained"
          disabled={busy || name.trim().length < 2}
          onClick={() => onCreate({ name: name.trim(), kind })}
          data-testid="workspace-create-submit"
        >
          {busy ? m["organizations.create.submitting"] : m["organizations.create.submit"]}
        </Button>
        <Typography variant="caption" color="text.secondary">
          {m["organizations.create.note"]}
        </Typography>
      </Flex>
    </Box>
  );
}
