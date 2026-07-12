import { createTheme } from "@mui/material/styles";

export const guildaColors = {
  green900: "#0F3A34",
  green800: "#10463E",
  green700: "#14554C",
  sage500: "#8FA99A",
  sage100: "#DDE6DF",
  brass500: "#C9A35A",
  brass600: "#A9781D",
  graphite900: "#2B2F33",
  graphite700: "#42474D",
  offwhite50: "#F7F5F1",
  white: "#FFFFFF",
} as const;

export const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: guildaColors.offwhite50,
      paper: guildaColors.white,
    },
    primary: {
      main: guildaColors.green900,
      light: guildaColors.green700,
    },
    secondary: {
      main: guildaColors.brass500,
      dark: guildaColors.brass600,
    },
    warning: {
      main: guildaColors.brass600,
    },
    error: {
      main: "#9f1239",
    },
    text: {
      primary: guildaColors.graphite900,
      secondary: guildaColors.graphite700,
    },
    divider: "rgba(15, 58, 52, 0.12)",
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
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(247, 245, 241, 0.94)",
          backdropFilter: "blur(10px)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        contained: {
          boxShadow: "0 10px 24px rgba(15, 58, 52, 0.18)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});
