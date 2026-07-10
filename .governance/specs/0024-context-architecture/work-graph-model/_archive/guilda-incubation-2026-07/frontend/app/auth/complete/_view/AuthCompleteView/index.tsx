"use client";

import { Alert, Box, Button, CircularProgress, Paper, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { bridgePortalSession } from "@/app/_domain/adoption/shellClient";
import AppShell from "@/app/_ui/shell/AppShell";
import copy from "./_locales/pt-br.json";

const m = copy.messages;

export default function AuthCompleteView() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function complete() {
      const result = await bridgePortalSession();
      if (cancelled) return;
      if (!result.ok) {
        setError(m["auth.complete.error"].replace("{error}", result.error));
        return;
      }
      router.replace("/organizations");
    }
    void complete();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <AppShell chip="portal" navigationMode="public" maxWidth="md">
      <Box sx={{ maxWidth: 560, mx: "auto" }}>
        <Paper variant="outlined" sx={{ p: 3, display: "grid", gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {m["auth.complete.title"]}
          </Typography>
          <Typography color="text.secondary">{m["auth.complete.body"]}</Typography>
          {error ? (
            <>
              <Alert severity="warning">{error}</Alert>
              <Button component={Link} href="/login" variant="outlined">
                {m["auth.complete.back"]}
              </Button>
            </>
          ) : (
            <CircularProgress size={28} />
          )}
        </Paper>
      </Box>
    </AppShell>
  );
}
