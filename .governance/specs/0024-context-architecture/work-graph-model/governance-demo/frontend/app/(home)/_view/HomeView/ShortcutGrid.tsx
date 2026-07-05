import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import FlagIcon from "@mui/icons-material/Flag";
import HistoryIcon from "@mui/icons-material/History";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import LinkIcon from "@mui/icons-material/Link";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import { ResponsiveGrid } from "@/app/_ui/shared";
import { ShortcutCard } from "@/app/_ui/adoption";
import { profileOption } from "@/app/_domain/adoption/model";
import type { GovernanceSnapshot } from "@/lib/types";
import { format } from "./format";
import copy from "./_locales/pt-br.json";

export function ShortcutGrid({
  profile,
  pendingCount,
}: {
  profile: GovernanceSnapshot["profileDeclaration"]["profile"];
  pendingCount: number;
}) {
  return (
    <ResponsiveGrid min={232} gap={1.75}>
      <ShortcutCard
        href="/settings"
        icon={<CorporateFareIcon fontSize="small" />}
        title={copy.shortcuts.configureOrg.title}
        sub={format(copy.shortcuts.configureOrg.sub, { profile: profileOption(profile).label })}
      />
      <ShortcutCard
        href="/onboarding"
        icon={<LinkIcon fontSize="small" />}
        title={copy.shortcuts.connectSources.title}
        sub={copy.shortcuts.connectSources.sub}
      />
      <ShortcutCard
        href="/console?view=company"
        icon={<FlagIcon fontSize="small" />}
        title={copy.shortcuts.planCycle.title}
        sub={copy.shortcuts.planCycle.sub}
      />
      <ShortcutCard
        href="/console?view=commands"
        icon={<LightbulbIcon fontSize="small" />}
        title={copy.shortcuts.registerIntent.title}
        sub={copy.shortcuts.registerIntent.sub}
      />
      <ShortcutCard
        href="/results"
        icon={<MonitorHeartIcon fontSize="small" />}
        title={copy.shortcuts.results.title}
        sub={copy.shortcuts.results.sub}
      />
      <ShortcutCard
        href="#pendencias"
        icon={<PendingActionsIcon fontSize="small" />}
        title={copy.shortcuts.pending.title}
        sub={copy.shortcuts.pending.sub}
        badge={pendingCount || undefined}
      />
      <ShortcutCard
        href="/console?view=audit"
        icon={<HistoryIcon fontSize="small" />}
        title={copy.shortcuts.audit.title}
        sub={copy.shortcuts.audit.sub}
      />
    </ResponsiveGrid>
  );
}
