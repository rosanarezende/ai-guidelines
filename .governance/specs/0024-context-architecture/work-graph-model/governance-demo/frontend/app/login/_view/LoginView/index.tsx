"use client";

import { Alert, Box, Button, Divider, Paper, TextField, Typography } from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import GitHubIcon from "@mui/icons-material/GitHub";
import ScienceIcon from "@mui/icons-material/Science";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { startAnonymousDemo } from "@/app/_domain/adoption/shellClient";
import { authClient } from "@/app/_domain/auth/auth-client";
import { Flex } from "@/app/_ui/shared";
import AppShell from "@/app/_ui/shell/AppShell";
import copy from "./_locales/pt-br.json";

const m = copy.messages;

type LoginAuthOptions = {
  magicLink: { delivery: "dev-outbox" | "webhook" | "not-configured" };
  socialProviders: { github: boolean; google: boolean };
};

export default function LoginView({ options }: { options: LoginAuthOptions }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"magic" | "github" | "google" | "demo" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function requestMagicLink() {
    setBusy("magic");
    setError(null);
    setNotice(null);
    const result = await authClient.signIn.magicLink({
      email: email.trim(),
      name: displayName.trim() || undefined,
      callbackURL: "/auth/complete",
      newUserCallbackURL: "/auth/complete",
      errorCallbackURL: "/login",
    });
    setBusy(null);
    if (result.error) {
      const detail = String(result.error.message || result.error.code || "auth-error");
      setError(m["login.error.generic"].replace("{error}", detail));
      return;
    }
    setNotice(m["login.magic.sent"]);
  }

  async function signInWithProvider(provider: "github" | "google") {
    setBusy(provider);
    setError(null);
    await authClient.signIn.social({
      provider,
      callbackURL: "/auth/complete",
      errorCallbackURL: "/login",
    });
    setBusy(null);
  }

  async function openAnonymousDemo() {
    setBusy("demo");
    setError(null);
    const result = await startAnonymousDemo();
    if (!result.ok) {
      setError(m["login.error.generic"].replace("{error}", result.error));
      setBusy(null);
      return;
    }
    router.push("/");
  }

  const magicDisabled =
    busy !== null || !email.includes("@") || options.magicLink.delivery === "not-configured";

  return (
    <AppShell chip="portal" navigationMode="public" maxWidth="md">
      <Box sx={{ maxWidth: 860, mx: "auto", display: "grid", gap: 2.5 }}>
        <Flex align="center" gap={1.5}>
          <VpnKeyOutlinedIcon color="primary" fontSize="large" />
          <Typography sx={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.5px" }}>
            {m["login.title"]}
          </Typography>
        </Flex>
        <Typography color="text.secondary">{m["login.lead"]}</Typography>

        {error ? <Alert severity="warning">{error}</Alert> : null}
        {notice ? <Alert severity="success">{notice}</Alert> : null}
        {options.magicLink.delivery === "not-configured" ? (
          <Alert severity="warning">{m["login.magic.notConfigured"]}</Alert>
        ) : null}

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { md: "1fr 0.9fr" } }}>
          <Paper variant="outlined" sx={{ p: 3, display: "grid", gap: 2 }}>
            <Flex align="center" gap={1}>
              <EmailOutlinedIcon color="primary" />
              <Typography variant="h6">{m["login.identity.title"]}</Typography>
            </Flex>
            <TextField
              label={m["login.email.label"]}
              helperText={m["login.email.help"]}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoFocus
              slotProps={{ htmlInput: { "data-testid": "login-email" } }}
            />
            <TextField
              label={m["login.name.label"]}
              helperText={m["login.name.help"]}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              slotProps={{ htmlInput: { "data-testid": "login-display-name" } }}
            />
            <Button
              variant="contained"
              disabled={magicDisabled}
              onClick={requestMagicLink}
              data-testid="login-magic-link-submit"
            >
              {busy === "magic" ? m["login.magic.busy"] : m["login.magic.cta"]}
            </Button>
            <Divider />
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 1.5,
              }}
            >
              <Button
                variant="outlined"
                startIcon={<GitHubIcon />}
                disabled={busy !== null || !options.socialProviders.github}
                onClick={() => signInWithProvider("github")}
                data-testid="login-github"
              >
                {m["login.github"]}
              </Button>
              <Button
                variant="outlined"
                disabled={busy !== null || !options.socialProviders.google}
                onClick={() => signInWithProvider("google")}
                data-testid="login-google"
              >
                {m["login.google"]}
              </Button>
            </Box>
            {!options.socialProviders.github || !options.socialProviders.google ? (
              <Typography variant="caption" color="text.secondary">
                {m["login.provider.unavailable"]}
              </Typography>
            ) : null}
          </Paper>

          <Paper variant="outlined" sx={{ p: 3, display: "grid", gap: 2, alignContent: "start" }}>
            <Flex align="center" gap={1}>
              <ScienceIcon color="primary" />
              <Typography variant="h6">{m["login.demo.title"]}</Typography>
            </Flex>
            <Typography color="text.secondary">{m["login.demo.body"]}</Typography>
            <Button
              variant="outlined"
              disabled={busy !== null}
              onClick={openAnonymousDemo}
              data-testid="login-demo-anonymous"
            >
              {busy === "demo" ? m["login.demo.busy"] : m["login.demo.cta"]}
            </Button>
          </Paper>
        </Box>

        <Paper variant="outlined" sx={{ p: 2.5, borderStyle: "dashed", display: "grid", gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {m["login.honesty.title"]}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            · {m["login.honesty.identity"]}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            · {m["login.honesty.governance"]}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            · {m["login.honesty.password"]}
          </Typography>
        </Paper>
      </Box>
    </AppShell>
  );
}
