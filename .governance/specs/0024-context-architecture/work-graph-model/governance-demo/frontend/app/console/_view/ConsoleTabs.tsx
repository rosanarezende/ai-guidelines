import { Paper, Tab, Tabs } from "@mui/material";
import { consoleViews, type ViewId } from "./consoleNavigation";

export function ConsoleTabs({
  view,
  onChange,
}: {
  view: ViewId;
  onChange: (view: ViewId) => void;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 1 }}>
      <Tabs
        value={view}
        onChange={(_, nextView: ViewId) => onChange(nextView)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="perfis de navegacao da governanca"
      >
        {consoleViews.map((item) => (
          <Tab
            key={item.id}
            value={item.id}
            icon={item.icon}
            iconPosition="start"
            label={item.label}
          />
        ))}
      </Tabs>
    </Paper>
  );
}
