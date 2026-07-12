"use client";

import { Alert, Box, Button, Divider, Paper, TextField, Typography } from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import GitHubIcon from "@mui/icons-material/GitHub";
import ScienceIcon from "@mui/icons-material/Science";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { startAnonymousDemo } from "@/app/_domain/adoption/shellClient";
import { authClient } from "@/app/_domain/auth/auth-client";
import { GuildaBrand, GuildaMark } from "@/app/_ui/brand";
import { Flex } from "@/app/_ui/shared";
import AppShell from "@/app/_ui/shell/AppShell";
import { guildaColors } from "@/app/_ui/theme";
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
    <AppShell chip="portal" navigationMode="public" maxWidth="lg" subtitle="">
      <Box sx={{ maxWidth: 1120, mx: "auto", display: "grid", gap: 2.5 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { md: "1fr 0.86fr" }, gap: 2.5 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              minHeight: 520,
              bgcolor: guildaColors.green900,
              color: guildaColors.white,
              display: "grid",
              alignContent: "space-between",
              gap: 4,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                opacity: 0.18,
                background:
                  "radial-gradient(circle at 74% 32%, rgba(201,163,90,0.45), transparent 18rem), linear-gradient(130deg, rgba(255,255,255,0.14) 0 1px, transparent 1px 100%)",
                backgroundSize: "auto, 34px 34px",
              }}
            />
            <Box sx={{ position: "relative", display: "grid", gap: 3 }}>
              <GuildaBrand onDark markSize={54} />
              <Box sx={{ display: "grid", gap: 1.5 }}>
                <Typography
                  component="h1"
                  sx={{
                    fontSize: { xs: 38, md: 54 },
                    lineHeight: 1,
                    fontWeight: 800,
                    letterSpacing: 0,
                    maxWidth: 520,
                  }}
                >
                  {m["login.hero.title"]}
                </Typography>
                <Typography sx={{ color: guildaColors.sage100, maxWidth: 500, fontSize: 17 }}>
                  {m["login.hero.lead"]}
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: { sm: "repeat(3, 1fr)" },
                gap: 1.25,
              }}
            >
              {(
                [
                  "login.hero.decisions",
                  "login.hero.evidence",
                  "login.hero.responsibility",
                ] as const
              ).map((key) => (
                <Box
                  key={key}
                  sx={{
                    p: 1.5,
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    borderRadius: 2,
                    bgcolor: "rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <Typography variant="body2" sx={{ color: guildaColors.white, fontWeight: 700 }}>
                    {m[key]}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          <Box sx={{ display: "grid", gap: 2, alignContent: "start" }}>
            {error ? <Alert severity="warning">{error}</Alert> : null}
            {notice ? <Alert severity="success">{notice}</Alert> : null}
            {options.magicLink.delivery === "not-configured" ? (
              <Alert severity="warning">{m["login.magic.notConfigured"]}</Alert>
            ) : null}

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

            <Paper variant="outlined" sx={{ p: 3, display: "grid", gap: 2 }}>
              <Flex align="center" gap={1}>
                <GuildaMark size={34} />
                <Box>
                  <Typography variant="h6">{m["login.demo.title"]}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {m["login.demo.body"]}
                  </Typography>
                </Box>
              </Flex>
              <Button
                variant="outlined"
                startIcon={<ScienceIcon fontSize="small" />}
                disabled={busy !== null}
                onClick={openAnonymousDemo}
                data-testid="login-demo-anonymous"
              >
                {busy === "demo" ? m["login.demo.busy"] : m["login.demo.cta"]}
              </Button>
            </Paper>
          </Box>
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
