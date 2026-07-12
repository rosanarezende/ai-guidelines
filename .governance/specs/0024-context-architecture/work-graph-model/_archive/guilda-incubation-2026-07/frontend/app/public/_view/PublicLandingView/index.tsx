"use client";

import { Alert, Box, Button, Chip, Paper, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import GitHubIcon from "@mui/icons-material/GitHub";
import ScienceIcon from "@mui/icons-material/Science";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { startAnonymousDemo } from "@/app/_domain/adoption/shellClient";
import { GuildaBrand, GuildaProductIcon } from "@/app/_ui/brand";
import type { GuildaProductIconName } from "@/app/_ui/brand";
import AppShell from "@/app/_ui/shell/AppShell";
import { guildaColors } from "@/app/_ui/theme";
import copy from "./_locales/pt-br.json";

const m = copy.messages;

const promiseKeys = ["decisions", "evidence", "responsibility"] as const;

const systemItems: Array<{ key: GuildaProductIconName }> = [
  { key: "governance" },
  { key: "flow" },
  { key: "graph" },
  { key: "host" },
  { key: "cup" },
];

export default function PublicLandingView() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openAnonymousDemo() {
    setBusy(true);
    setError(null);
    const result = await startAnonymousDemo();
    if (!result.ok) {
      setError(m["public.error.generic"].replace("{error}", result.error));
      setBusy(false);
      return;
    }
    router.push("/");
  }

  return (
    <AppShell navigationMode="public" maxWidth="xl" subtitle="">
      <Box sx={{ display: "grid", gap: 3 }}>
        <Paper
          elevation={0}
          sx={{
            minHeight: { xs: 650, md: 600 },
            p: 0,
            bgcolor: guildaColors.white,
            border: "1px solid",
            borderColor: "divider",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            component="img"
            src="/brand/heroes/public-workgraph-hero.png"
            alt=""
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: { xs: "68% center", md: "center" },
              display: "block",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: {
                xs: "linear-gradient(180deg, rgba(247,245,241,0.98) 0%, rgba(247,245,241,0.92) 42%, rgba(247,245,241,0.4) 100%)",
                md: "linear-gradient(90deg, rgba(247,245,241,0.99) 0%, rgba(247,245,241,0.94) 38%, rgba(247,245,241,0.54) 58%, rgba(247,245,241,0.04) 100%)",
              },
            }}
          />
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              minHeight: { xs: 650, md: 600 },
              p: { xs: 3, md: 5 },
              display: "grid",
              alignContent: "center",
              gap: 3,
              maxWidth: { xs: "100%", md: 690 },
            }}
          >
            <Box>
              <GuildaBrand markSize={50} />
            </Box>
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <Chip
                label={m["public.eyebrow"]}
                size="small"
                sx={{
                  justifySelf: "start",
                  bgcolor: guildaColors.sage100,
                  color: guildaColors.green900,
                  fontWeight: 700,
                }}
              />
              <Typography
                component="h1"
                sx={{
                  fontSize: { xs: 42, md: 68 },
                  lineHeight: 0.98,
                  fontWeight: 800,
                  letterSpacing: 0,
                  color: guildaColors.green900,
                  maxWidth: 640,
                }}
              >
                <Box component="span" sx={{ display: "block" }}>
                  {m["public.hero.title.people"]}
                </Box>
                <Box
                  component="span"
                  sx={{
                    display: "block",
                    color: guildaColors.sage500,
                  }}
                >
                  {m["public.hero.title.system"]}
                </Box>
              </Typography>
              <Typography sx={{ fontSize: 18, color: "text.secondary", maxWidth: 620 }}>
                {m["public.hero.lead"]}
              </Typography>
            </Box>
            {error ? <Alert severity="warning">{error}</Alert> : null}
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <Button
                href="/login"
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                data-testid="public-login-link"
              >
                {m["public.hero.primary"]}
              </Button>
              <Button
                variant="outlined"
                startIcon={<ScienceIcon />}
                disabled={busy}
                onClick={openAnonymousDemo}
                data-testid="public-demo-anonymous"
              >
                {busy ? m["public.demo.busy"] : m["public.hero.secondary"]}
              </Button>
            </Box>
          </Box>
        </Paper>

        <Box sx={{ display: "grid", gridTemplateColumns: { md: "repeat(3, 1fr)" }, gap: 2 }}>
          {promiseKeys.map((key) => (
            <Paper key={key} variant="outlined" sx={{ p: 2.5, display: "grid", gap: 0.75 }}>
              <Typography sx={{ fontWeight: 800, color: guildaColors.green900 }}>
                {m[`public.promise.${key}.title`]}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {m[`public.promise.${key}.body`]}
              </Typography>
            </Paper>
          ))}
        </Box>

        <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, display: "grid", gap: 2 }}>
          <Typography variant="h2">{m["public.system.title"]}</Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { sm: "repeat(2, 1fr)", lg: "repeat(5, 1fr)" },
              gap: 2,
            }}
          >
            {systemItems.map((item) => (
              <Box key={item.key} sx={{ display: "grid", gap: 1 }}>
                <GuildaProductIcon
                  name={item.key}
                  size={72}
                  sx={{ ml: -1.25, mb: -0.75, clipPath: "inset(4% round 10px)" }}
                />
                <Typography sx={{ fontWeight: 800, color: guildaColors.green900 }}>
                  {m[`public.system.${item.key}.title`]}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {m[`public.system.${item.key}.body`]}
                </Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              href="https://github.com/rosanarezende/ai-guidelines"
              startIcon={<GitHubIcon />}
            >
              GitHub
            </Button>
          </Box>
        </Paper>
      </Box>
    </AppShell>
  );
}
