import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#f6f7f9",
      paper: "#ffffff",
    },
    primary: {
      main: "#14532d",
    },
    secondary: {
      main: "#1f4b99",
    },
    warning: {
      main: "#9a5b00",
    },
    error: {
      main: "#9f1239",
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontSize: 24, fontWeight: 700, letterSpacing: 0 },
    h2: { fontSize: 18, fontWeight: 700, letterSpacing: 0 },
    h3: { fontSize: 15, fontWeight: 700, letterSpacing: 0 },
    button: { textTransform: "none", fontWeight: 700 },
  },
});
