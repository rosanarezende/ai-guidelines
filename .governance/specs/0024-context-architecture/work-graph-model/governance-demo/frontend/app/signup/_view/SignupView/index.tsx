"use client";

// SignupView — identidade local mínima (local-principal). Honesto: não é auth.
import { Alert, Box, Button, Paper, TextField, Typography } from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signupLocal } from "@/app/_domain/adoption/shellClient";
import { Flex } from "@/app/_ui/shared";
import AppShell from "@/app/_ui/shell/AppShell";
import copy from "./_locales/pt-br.json";

const m = copy.messages;

export default function SignupView() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    const result = await signupLocal({
      displayName,
      ...(email.trim() ? { email: email.trim() } : {}),
    });
    if (!result.ok) {
      setError(
        result.error === "invalid-display-name"
          ? m["signup.error.invalid-display-name"]
          : m["signup.error.generic"].replace("{error}", result.error)
      );
      setBusy(false);
      return;
    }
    router.push("/organizations");
  }

  return (
    <AppShell chip="local-principal" navigationMode="public">
      <Box sx={{ maxWidth: 560, mx: "auto", display: "grid", gap: 2 }}>
        <Flex align="center" gap={1.5}>
          <PersonOutlineIcon color="primary" fontSize="large" />
          <Typography sx={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" }}>
            {m["signup.title"]}
          </Typography>
        </Flex>
        <Typography variant="body1" color="text.secondary">
          {m["signup.lead"]}
        </Typography>
        <Paper variant="outlined" sx={{ p: 3, display: "grid", gap: 2 }}>
          <TextField
            label={m["signup.name.label"]}
            helperText={m["signup.name.help"]}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            autoFocus
          />
          <TextField
            label={m["signup.email.label"]}
            helperText={m["signup.email.help"]}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {error ? <Alert severity="warning">{error}</Alert> : null}
          <Flex align="center" gap={2}>
            <Button
              variant="contained"
              disabled={busy || displayName.trim().length < 2}
              onClick={submit}
            >
              {busy ? m["signup.submitting"] : m["signup.submit"]}
            </Button>
            <Typography variant="caption" color="text.secondary">
              {m["signup.next"]}
            </Typography>
          </Flex>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2.5, borderStyle: "dashed", display: "grid", gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {m["signup.honesty.title"]}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            · {m["signup.honesty.local"]}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            · {m["signup.honesty.future"]}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            · {m["signup.honesty.privacy"]}
          </Typography>
        </Paper>
      </Box>
    </AppShell>
  );
}
