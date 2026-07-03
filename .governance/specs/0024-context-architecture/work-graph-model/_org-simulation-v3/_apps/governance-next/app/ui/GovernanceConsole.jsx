"use client";

import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  CssBaseline,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  createTheme,
} from "@mui/material";
import BugReportIcon from "@mui/icons-material/BugReport";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import HubIcon from "@mui/icons-material/Hub";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useMemo, useState } from "react";
import CommandWorkspace from "./commands/CommandWorkspace.jsx";

const theme = createTheme({
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
    h1: { fontSize: 24, fontWeight: 700 },
    h2: { fontSize: 18, fontWeight: 700 },
    h3: { fontSize: 15, fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 700 },
  },
});

const tabs = [
  "Planejamento",
  "Intake",
  "Execução",
  "Contratos",
  "Outcomes",
  "Repos",
  "Operação",
  "Comandos",
];

function countBy(items, field) {
  return items.reduce((acc, item) => {
    const key = item[field] || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function StatusChip({ ok, label }) {
  return (
    <Chip
      size="small"
      color={ok ? "success" : "warning"}
      icon={ok ? <CheckCircleIcon /> : <WarningAmberIcon />}
      label={label}
      variant={ok ? "filled" : "outlined"}
    />
  );
}

function MetricCard({ label, value, tone = "default", icon = null }) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {icon}
          <Box>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h1" component="div">
              {value}
            </Typography>
          </Box>
        </Stack>
        {tone !== "default" ? (
          <Box sx={{ mt: 1 }}>
            <Chip size="small" color={tone} label={tone} />
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
}

function IssueList({ issues, limit = 8 }) {
  const visible = issues.slice(0, limit);
  if (!visible.length) return <Alert severity="success">Sem issues no recorte atual.</Alert>;
  return (
    <Stack spacing={1}>
      {visible.map((issue, index) => (
        <Alert
          key={`${issue.rule}-${issue.node}-${index}`}
          severity={issue.level === "error" ? "error" : "warning"}
        >
          <strong>{issue.rule}</strong> · {issue.node} · {issue.msg}
        </Alert>
      ))}
      {issues.length > visible.length ? (
        <Typography variant="caption" color="text.secondary">
          +{issues.length - visible.length} issue(s)
        </Typography>
      ) : null}
    </Stack>
  );
}

function PlanningTab({ snapshot }) {
  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        {snapshot.portfolio.objectives.map((objective) => (
          <Grid key={objective.id} item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between" gap={1}>
                    <Typography variant="h2">{objective.title}</Typography>
                    <Chip size="small" label={objective.period} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {objective.id} · owner {objective.owner}
                  </Typography>
                  <Divider />
                  <Stack spacing={1}>
                    {objective.targets.map((target) => (
                      <Paper key={target.id} variant="outlined" sx={{ p: 1.25 }}>
                        <Typography variant="body2" fontWeight={700}>
                          {target.id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {target.expected}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

function IntakeTab({ snapshot }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={5}>
        <Stack spacing={2}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h2" gutterBottom>
                Proposals
              </Typography>
              <Stack spacing={1}>
                {snapshot.operations.proposals.map((proposal) => (
                  <Paper key={proposal.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography fontWeight={700}>{proposal.title}</Typography>
                      <Chip size="small" label={proposal.status} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {proposal.id} · {proposal["authorized-by"]}
                    </Typography>
                    <Typography variant="body2">{proposal.note}</Typography>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h2" gutterBottom>
                Triages
              </Typography>
              <Stack spacing={1}>
                {snapshot.operations.triages.length ? (
                  snapshot.operations.triages.map((triage) => (
                    <Paper key={triage.proposal} variant="outlined" sx={{ p: 1.5 }}>
                      <Typography fontWeight={700}>{triage.proposal}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {triage["recorded-by"]} · {(triage.items || []).length} item(s)
                      </Typography>
                      <Typography variant="body2">{triage.summary}</Typography>
                    </Paper>
                  ))
                ) : (
                  <Alert severity="info">Sem triage salva.</Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Grid>
      <Grid item xs={12} md={7}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h2" gutterBottom>
              Intents ativas
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Intent</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Repos</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {snapshot.portfolio.intents.map((intent) => (
                    <TableRow key={intent.id}>
                      <TableCell>
                        <Typography fontWeight={700}>{intent.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {intent.id}
                        </Typography>
                      </TableCell>
                      <TableCell>{intent.team}</TableCell>
                      <TableCell>{intent["primary-target"]}</TableCell>
                      <TableCell>{intent.repos.join(", ")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

function ExecutionTab({ snapshot }) {
  const byPurpose = countBy(
    snapshot.portfolio.intents.flatMap((intent) => intent.works || []),
    "purpose"
  );
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {Object.entries(byPurpose).map(([purpose, count]) => (
          <Chip key={purpose} label={`${purpose}: ${count}`} />
        ))}
      </Stack>
      {snapshot.portfolio.intents.map((intent) => (
        <Card key={intent.id} variant="outlined">
          <CardContent>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
              <Box>
                <Typography variant="h2">{intent.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {intent.id} · {intent.approach} · {intent.signal}
                </Typography>
              </Box>
              <Chip label={`${intent.workCount} peça(s)`} color="secondary" />
            </Stack>
            <TableContainer sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Peça</TableCell>
                    <TableCell>Repo</TableCell>
                    <TableCell>Purpose</TableCell>
                    <TableCell>Review</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(intent.works || []).map((work) => (
                    <TableRow key={work.id}>
                      <TableCell>{work.id}</TableCell>
                      <TableCell>{work.repo}</TableCell>
                      <TableCell>{work.purpose}</TableCell>
                      <TableCell>{work.review}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

function ContractsTab({ snapshot }) {
  return (
    <Grid container spacing={2}>
      {snapshot.contracts.map((contract) => (
        <Grid key={contract.id} item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h2">{contract.id}</Typography>
              <Typography variant="body2" color="text.secondary">
                {contract.revision} · owner repo {contract["owner-repo"]}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                {(contract.consumers || []).map((consumer) => (
                  <Chip key={consumer} size="small" label={consumer} />
                ))}
              </Stack>
              <Divider sx={{ my: 1.5 }} />
              {(contract["revision-proposals"] || []).map((proposal) => (
                <Paper key={proposal.id} variant="outlined" sx={{ p: 1.25, mb: 1 }}>
                  <Typography fontWeight={700}>{proposal.id}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {proposal.revision} · decision {proposal.decision}
                  </Typography>
                </Paper>
              ))}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

function OutcomesTab({ snapshot }) {
  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h2" gutterBottom>
            Targets e actual derivado
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Target</TableCell>
                  <TableCell>Métrica</TableCell>
                  <TableCell>Expected</TableCell>
                  <TableCell>Actual</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {snapshot.targets.map((target) => (
                  <TableRow key={target.id}>
                    <TableCell>{target.id}</TableCell>
                    <TableCell>{target.metric?.id || target.metric}</TableCell>
                    <TableCell>{target.expected}</TableCell>
                    <TableCell>{target.actual}</TableCell>
                    <TableCell>
                      <StatusChip
                        ok={target.invalidCount === 0}
                        label={
                          target.invalidCount
                            ? `${target.invalidCount} inválido(s)`
                            : `${target.actualCount} válido(s)`
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      <Grid container spacing={2}>
        {snapshot.outcomes.map((outcome) => (
          <Grid key={outcome.id} item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" gap={1}>
                  <Typography variant="h2">{outcome.id}</Typography>
                  <StatusChip ok={outcome.valid} label={outcome.valid ? "soma" : "bloqueado"} />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {outcome["emitted-by"]} · {outcome.metric} · {outcome.value}
                </Typography>
                {outcome.errors?.length ? <IssueList issues={outcome.errors} limit={3} /> : null}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

function ReposTab({ snapshot }) {
  return (
    <Grid container spacing={2}>
      {snapshot.repos.map((repo) => (
        <Grid key={repo.id} item xs={12} md={6} lg={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h2">{repo.id}</Typography>
              <Typography variant="body2" color="text.secondary">
                owner {repo.owner} · {repo.context ? "contexto publicado" : "sem contexto"}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                {(repo.caps || []).map((cap) => (
                  <Chip key={cap} size="small" label={cap} />
                ))}
              </Stack>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="caption" color="text.secondary">
                {repo.works.length} work ack · {repo.contracts.length} contrato(s) local(is)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

function OperationsTab({ snapshot }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h2" gutterBottom>
              Incidents
            </Typography>
            <Stack spacing={1}>
              {snapshot.operations.incidents.map((incident) => (
                <Paper key={incident.id} variant="outlined" sx={{ p: 1.25 }}>
                  <Typography fontWeight={700}>{incident.id}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {incident.severity} · {incident.repo} · MTTR {incident.mttr}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h2" gutterBottom>
              Standalone repo-local
            </Typography>
            <Stack spacing={1}>
              {snapshot.operations.standalone.map((work) => (
                <Paper key={work.id} variant="outlined" sx={{ p: 1.25 }}>
                  <Typography fontWeight={700}>{work.id}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {work.kind} · {work.repo} · {work.placar}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

function ActiveTab({ tab, snapshot, onReload }) {
  if (tab === 0) return <PlanningTab snapshot={snapshot} />;
  if (tab === 1) return <IntakeTab snapshot={snapshot} />;
  if (tab === 2) return <ExecutionTab snapshot={snapshot} />;
  if (tab === 3) return <ContractsTab snapshot={snapshot} />;
  if (tab === 4) return <OutcomesTab snapshot={snapshot} />;
  if (tab === 5) return <ReposTab snapshot={snapshot} />;
  if (tab === 6) return <OperationsTab snapshot={snapshot} />;
  return <CommandWorkspace snapshot={snapshot} onReload={onReload} />;
}

export default function GovernanceConsole({ initialSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const issueTone = snapshot.counts.errors
    ? "error"
    : snapshot.counts.warnings
      ? "warning"
      : "success";
  const issueLabel = snapshot.counts.errors
    ? `${snapshot.counts.errors} erro(s)`
    : `${snapshot.counts.warnings} aviso(s)`;
  const graphLabel = useMemo(
    () => `${snapshot.counts.graphNodes} nós · ${snapshot.counts.graphEdges} arestas`,
    [snapshot.counts.graphEdges, snapshot.counts.graphNodes]
  );

  async function reload() {
    setLoading(true);
    try {
      const response = await fetch("/api/snapshot", { cache: "no-store" });
      setSnapshot(await response.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: "1px solid #dde1e6" }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <HubIcon color="primary" />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h1">acme governance</Typography>
            <Typography variant="caption" color="text.secondary">
              revisão {snapshot.revision} · perfil {snapshot.profileDeclaration.profile}
            </Typography>
          </Box>
          <Tooltip title="Recarregar snapshot">
            <Button startIcon={<RefreshIcon />} onClick={reload} disabled={loading}>
              Recarregar
            </Button>
          </Tooltip>
        </Toolbar>
        {loading ? <LinearProgress /> : null}
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={3}>
            <MetricCard label="Grafo" value={graphLabel} icon={<HubIcon color="primary" />} />
          </Grid>
          <Grid item xs={12} md={3}>
            <MetricCard
              label="Intents"
              value={snapshot.counts.intents}
              icon={<FactCheckIcon color="secondary" />}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <MetricCard
              label="Repos"
              value={snapshot.counts.repos}
              icon={<CheckCircleIcon color="success" />}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <MetricCard
              label="Issues"
              value={issueLabel}
              tone={issueTone}
              icon={<BugReportIcon color={issueTone} />}
            />
          </Grid>
        </Grid>
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
              <Box>
                <Typography variant="h2">Fluxo ponta-a-ponta</Typography>
                <Typography variant="body2" color="text.secondary">
                  business-objective → target → intake → intent → repo-work → contract → outcome →
                  dashboard
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label={`${snapshot.counts.targets} targets`} />
                <Chip label={`${snapshot.counts.proposals} proposals`} />
                <Chip label={`${snapshot.counts.contracts} contratos`} />
                <Chip label={`${snapshot.counts.outcomes} outcomes`} />
              </Stack>
            </Stack>
          </CardContent>
        </Card>
        {snapshot.issues.length ? (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h2" gutterBottom>
                Issues do resolver
              </Typography>
              <IssueList issues={snapshot.issues} limit={5} />
            </CardContent>
          </Card>
        ) : null}
        <Paper variant="outlined" sx={{ mb: 2 }}>
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 1 }}
          >
            {tabs.map((label) => (
              <Tab key={label} label={label} />
            ))}
          </Tabs>
        </Paper>
        <ActiveTab tab={tab} snapshot={snapshot} onReload={reload} />
      </Container>
    </ThemeProvider>
  );
}
