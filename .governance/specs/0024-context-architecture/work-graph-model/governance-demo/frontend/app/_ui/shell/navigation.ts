import AccountTreeIcon from "@mui/icons-material/AccountTree";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import AuditIcon from "@mui/icons-material/FactCheckOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import IntegrationInstructionsOutlinedIcon from "@mui/icons-material/IntegrationInstructionsOutlined";
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import PlaylistAddCheckOutlinedIcon from "@mui/icons-material/PlaylistAddCheckOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import TerminalIcon from "@mui/icons-material/Terminal";
import ViewListIcon from "@mui/icons-material/ViewList";
import type { SvgIconComponent } from "@mui/icons-material";

export type NavigationItemState =
  | "active"
  | "pending"
  | "no-host"
  | "no-authority"
  | "soon"
  | "degraded"
  | "hidden";

export type NavigationItem = {
  id: string;
  labelKey: string;
  href?: string;
  icon: SvgIconComponent;
  state?: NavigationItemState;
};

export type NavigationGroup = {
  id: string;
  labelKey: string;
  items: NavigationItem[];
};

export const primaryNavigationGroups: NavigationGroup[] = [
  {
    id: "start",
    labelKey: "app.nav.group.start",
    items: [{ id: "home", labelKey: "app.nav.home", href: "/", icon: HomeOutlinedIcon }],
  },
  {
    id: "configure",
    labelKey: "app.nav.group.configure",
    items: [
      {
        id: "onboarding",
        labelKey: "app.nav.onboarding",
        href: "/onboarding",
        icon: PlaylistAddCheckOutlinedIcon,
      },
      {
        id: "settings",
        labelKey: "app.nav.settings",
        href: "/settings",
        icon: SettingsOutlinedIcon,
      },
      { id: "sources", labelKey: "app.nav.sources", href: "/sources", icon: FolderOutlinedIcon },
      {
        id: "integrations",
        labelKey: "app.nav.integrations",
        icon: IntegrationInstructionsOutlinedIcon,
        state: "soon",
      },
    ],
  },
  {
    id: "plan",
    labelKey: "app.nav.group.plan",
    items: [
      { id: "planning", labelKey: "app.nav.planning", icon: DashboardOutlinedIcon, state: "soon" },
      {
        id: "intake",
        labelKey: "app.nav.intake",
        icon: PlaylistAddCheckOutlinedIcon,
        state: "soon",
      },
      { id: "triage", labelKey: "app.nav.triage", icon: HubOutlinedIcon, state: "soon" },
      {
        id: "gates",
        labelKey: "app.nav.gates",
        icon: AssignmentTurnedInOutlinedIcon,
        state: "soon",
      },
    ],
  },
  {
    id: "execute",
    labelKey: "app.nav.group.execute",
    items: [
      { id: "work", labelKey: "app.nav.work", href: "/work", icon: ViewListIcon, state: "no-host" },
      { id: "contracts", labelKey: "app.nav.contracts", icon: HubOutlinedIcon, state: "no-host" },
    ],
  },
  {
    id: "follow",
    labelKey: "app.nav.group.follow",
    items: [
      {
        id: "results",
        labelKey: "app.nav.results",
        href: "/results",
        icon: InsertChartOutlinedIcon,
        state: "no-host",
      },
      { id: "map", labelKey: "app.nav.map", href: "/map", icon: AccountTreeIcon, state: "no-host" },
      { id: "operations", labelKey: "app.nav.operations", icon: AuditIcon, state: "soon" },
    ],
  },
  {
    id: "audit",
    labelKey: "app.nav.group.audit",
    items: [{ id: "audit", labelKey: "app.nav.audit", icon: AuditIcon, state: "soon" }],
  },
];

export const technicalNavigationItems: NavigationItem[] = [
  {
    id: "console",
    labelKey: "app.nav.console",
    href: "/console",
    icon: TerminalIcon,
    state: "degraded",
  },
];
