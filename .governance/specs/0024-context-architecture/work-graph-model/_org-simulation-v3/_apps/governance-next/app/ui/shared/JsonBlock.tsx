import { Box } from "@mui/material";

export function JsonBlock({ value }: { value: unknown }) {
  return (
    <Box
      component="pre"
      sx={{
        bgcolor: "#111827",
        color: "#e5e7eb",
        p: 2,
        borderRadius: 1,
        overflow: "auto",
        fontSize: 12,
        maxHeight: 360,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {JSON.stringify(value, null, 2)}
    </Box>
  );
}
