import { Alert, Box, Typography } from "@mui/material";
import type { AdoptionSummary } from "@/app/_domain/adoption/model";
import type { GovernanceSnapshot } from "@/lib/types";
import { format } from "./format";
import copy from "./_locales/pt-br.json";

export function HomeHeader({
  adoption,
  profile,
}: {
  adoption: AdoptionSummary;
  profile: GovernanceSnapshot["profileDeclaration"]["profile"];
}) {
  const roleNotice = copy.roleNotices[profile as keyof typeof copy.roleNotices] ?? null;
  const cycle = adoption.periods[0] || "sem periodo";
  const pendingCount = adoption.attention.length;

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Box sx={{ display: "grid", gap: 1 }}>
        <Typography sx={{ fontSize: 29, fontWeight: 800, letterSpacing: "-0.5px" }}>
          {copy.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
          {format(copy.cycleSummary, {
            cycle,
            done: String(adoption.doneCount),
            total: String(adoption.totalCount),
            pending: String(pendingCount),
          })}
        </Typography>
      </Box>
      {roleNotice ? <Alert severity="info">{roleNotice}</Alert> : null}
    </Box>
  );
}
