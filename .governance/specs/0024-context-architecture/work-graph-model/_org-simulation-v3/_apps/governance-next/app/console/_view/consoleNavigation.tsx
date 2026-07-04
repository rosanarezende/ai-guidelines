import type { ReactElement } from "react";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AssessmentIcon from "@mui/icons-material/Assessment";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import HubIcon from "@mui/icons-material/Hub";
import TroubleshootIcon from "@mui/icons-material/Troubleshoot";

export type ViewId = "company" | "owner" | "execution" | "ops" | "audit" | "commands";

export type ConsoleView = {
  id: ViewId;
  label: string;
  audience: string;
  icon: ReactElement;
};

export const consoleViews: ConsoleView[] = [
  {
    id: "company",
    label: "Planejamento",
    audience: "stakeholder",
    icon: <AssessmentIcon fontSize="small" />,
  },
  {
    id: "owner",
    label: "Intents",
    audience: "owner",
    icon: <FactCheckIcon fontSize="small" />,
  },
  {
    id: "execution",
    label: "Execucao",
    audience: "tech lead",
    icon: <HubIcon fontSize="small" />,
  },
  {
    id: "ops",
    label: "Operacao",
    audience: "SRE/operacao",
    icon: <TroubleshootIcon fontSize="small" />,
  },
  {
    id: "audit",
    label: "Auditoria",
    audience: "auditor",
    icon: <AccountTreeIcon fontSize="small" />,
  },
  {
    id: "commands",
    label: "Comandos",
    audience: "admin",
    icon: <AdminPanelSettingsIcon fontSize="small" />,
  },
];

export function activeView(viewId: ViewId) {
  return consoleViews.find((view) => view.id === viewId) || consoleViews[0];
}
