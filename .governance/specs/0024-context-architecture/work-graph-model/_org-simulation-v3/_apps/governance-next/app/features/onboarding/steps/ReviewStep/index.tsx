import { Alert, Box, Button, Paper, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Link from "next/link";
import { Flex } from "@/app/ui/shared";
import { StepHeading } from "../../components";
import copy from "./locales/pt-br.json";

export function ReviewStep({
  works,
  pending,
  risks,
  onFinish,
}: {
  works: string[];
  pending: string[];
  risks: string[];
  onFinish: () => void;
}) {
  return (
    <>
      <StepHeading step={6} title={copy.heading.title} lead={copy.heading.lead} />
      <Alert severity="info">{copy.projectionNotice}</Alert>
      <Paper variant="outlined" sx={{ p: 2, bgcolor: "#f4f9f5", borderColor: "#d9e8dd" }}>
        <Flex align="center" gap={1} sx={{ color: "#1a5632", mb: 1 }}>
          <CheckCircleIcon fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {copy.sections.works}
          </Typography>
        </Flex>
        <Box sx={{ display: "grid", gap: 0.5 }}>
          {works.map((item) => (
            <Typography key={item} variant="body2" sx={{ color: "#2c4434" }}>
              · {item}
            </Typography>
          ))}
        </Box>
      </Paper>
      <Paper variant="outlined" sx={{ p: 2, bgcolor: "#fdf8ec", borderColor: "#f0e4c8" }}>
        <Flex align="center" gap={1} sx={{ color: "#7a4a00", mb: 1 }}>
          <VisibilityIcon fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {copy.sections.pending}
          </Typography>
        </Flex>
        <Box sx={{ display: "grid", gap: 0.5 }}>
          {pending.map((item) => (
            <Typography key={item} variant="body2" sx={{ color: "#5c4310" }}>
              · {item}
            </Typography>
          ))}
        </Box>
      </Paper>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Flex align="center" gap={1} sx={{ color: "text.secondary", mb: 1 }}>
          <VisibilityIcon fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {copy.sections.risks}
          </Typography>
        </Flex>
        <Box sx={{ display: "grid", gap: 0.5 }}>
          {risks.map((item) => (
            <Typography key={item} variant="body2" color="text.secondary">
              · {item}
            </Typography>
          ))}
        </Box>
      </Paper>
      <Flex align="center" gap={2}>
        <Button variant="contained" onClick={onFinish}>
          {copy.actions.finish}
        </Button>
        <Button component={Link} href="/console" size="small" color="inherit">
          {copy.actions.console}
        </Button>
      </Flex>
    </>
  );
}
