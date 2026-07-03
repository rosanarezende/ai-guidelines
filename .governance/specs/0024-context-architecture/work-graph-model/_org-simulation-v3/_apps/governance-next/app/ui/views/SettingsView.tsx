"use client";

// SettingsView.tsx — Configurações em seções (Organização · Papéis · Fontes · Assistente ·
// Integrações · Avançado). Estado editável aqui é preferência de sessão: a declaração real
// vive nos arquivos e só muda por comando governado (fatia futura).
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import LockIcon from "@mui/icons-material/Lock";
import MemoryIcon from "@mui/icons-material/Memory";
import TerminalIcon from "@mui/icons-material/Terminal";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { GovernanceSnapshot, IntegrationItem } from "@/lib/types";
import { DataPill, EntityCard, Flex, ResponsiveGrid, SectionCard } from "../components";
import { RoleContractList, SourceList, StatusPill } from "../adoption/components";
import {
  DEFAULT_ASSIGNMENTS,
  NO_SOURCE_DOWNGRADE,
  ROLE_ACCEPTANCE_NOTICE,
  assistantCloudNote,
  assistantSystems,
  deriveAdoption,
  profileChipLabel,
  profileOption,
  providerIsLocal,
  roleWarnings,
  type ProfileId,
  type RoleAssignments,
  type RoleKey,
} from "../adoption/model";
import AppShell from "../shell/AppShell";

const SECTIONS = [
  { id: "org", label: "Organização" },
  { id: "papeis", label: "Papéis" },
  { id: "fontes", label: "Fontes de trabalho" },
  { id: "assistente", label: "Assistente" },
  { id: "integracoes", label: "Integrações" },
  { id: "avancado", label: "Avançado" },
];

function integrationStatus(item: IntegrationItem): {
  label: string;
  color: "default" | "info" | "success" | "warning";
} {
  if (item.id === "assistant-runtime-local-cloud")
    return { label: "configurável (local)", color: "success" };
  if (item.id === "graph-export") return { label: "parcial hoje", color: "info" };
  if (item.priority === "deferred") return { label: "adiado", color: "warning" };
  return { label: "catalogado · adapter futuro", color: "default" };
}

function priorityWeight(priority: string): number {
  if (priority === "P0") return 0;
  if (priority === "P1") return 1;
  if (priority === "P2") return 2;
  return 3;
}

export default function SettingsView({ snapshot }: { snapshot: GovernanceSnapshot }) {
  const adoption = useMemo(() => deriveAdoption(snapshot), [snapshot]);
  const declaredProfile = (
    ["full", "compact", "trio", "solo"].includes(snapshot.profileDeclaration.profile)
      ? snapshot.profileDeclaration.profile
      : "full"
  ) as ProfileId;
  const option = profileOption(declaredProfile);

  const [assignments, setAssignments] = useState<RoleAssignments>(DEFAULT_ASSIGNMENTS);
  const [provider, setProvider] = useState("ollama");
  const [assistantUrl, setAssistantUrl] = useState("http://127.0.0.1:11434");
  const [assistantModel, setAssistantModel] = useState("llama3.2");
  const [classificationPolicy, setClassificationPolicy] = useState("local-only");
  const [category, setCategory] = useState("ai-assistance");

  const authorityIds = useMemo(
    () => new Set(snapshot.authorities.map((authority) => authority.id)),
    [snapshot.authorities]
  );
  const warnings = roleWarnings(assignments, declaredProfile, authorityIds);
  const systems = assistantSystems(snapshot);
  const categories = [
    ...new Set(snapshot.integrationCatalog.integrations.map((item) => item.category)),
  ].sort();
  const integrations = snapshot.integrationCatalog.integrations
    .filter((item) => item.category === category)
    .sort(
      (a, b) => priorityWeight(a.priority) - priorityWeight(b.priority) || a.id.localeCompare(b.id)
    );

  function updateProvider(event: SelectChangeEvent) {
    const nextProvider = event.target.value;
    setProvider(nextProvider);
    if (providerIsLocal(nextProvider)) {
      setClassificationPolicy("local-only");
      if (nextProvider === "ollama") setAssistantUrl("http://127.0.0.1:11434");
    } else {
      setClassificationPolicy("policy-gated");
    }
  }

  return (
    <AppShell chip={profileChipLabel(declaredProfile)}>
      <Box
        sx={{
          display: "grid",
          gap: 4,
          alignItems: "start",
          gridTemplateColumns: { xs: "1fr", md: "220px 1fr" },
        }}
      >
        <Box
          component="nav"
          sx={{
            position: { md: "sticky" },
            top: 24,
            display: { xs: "none", md: "grid" },
            gap: 0.25,
          }}
        >
          {SECTIONS.map((section) => (
            <Button
              key={section.id}
              component="a"
              href={`#${section.id}`}
              size="small"
              color="inherit"
              sx={{ justifyContent: "flex-start", fontWeight: 600 }}
            >
              {section.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ display: "grid", gap: 2.5 }}>
          <Typography sx={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.4px" }}>
            Configurações
          </Typography>

          <Box id="org">
            <SectionCard
              title="Organização"
              subtitle={`Perfil atual: ${option.label} · ${option.tradeoff}`}
              action={
                <Tooltip title="Mudar perfil é a mutação governada profile-change — ainda não mecanizada no app">
                  <span>
                    <Button size="small" variant="outlined" disabled>
                      Mudar perfil
                    </Button>
                  </span>
                </Tooltip>
              }
            >
              <Box sx={{ display: "grid", gap: 1.5 }}>
                <Flex wrap gap={0.75}>
                  {option.ceremony.map((item) => (
                    <Chip
                      key={item}
                      size="small"
                      label={item}
                      sx={{ bgcolor: "#eaf1ec", color: "#1a5632" }}
                    />
                  ))}
                </Flex>
                <Flex wrap gap={1}>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`scope ${snapshot.profileDeclaration.scope}`}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`aprovado por ${snapshot.profileDeclaration["approved-by"] || "não resolvido"}`}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`revisão ${snapshot.profileDeclaration["review-at"] || "sem data"}`}
                  />
                </Flex>
                <Typography variant="caption" color="text.secondary">
                  Mudar o perfil muda a cerimônia dali em diante. A mudança fica registrada — com
                  quem aprovou e quando — e é corrigível por nova decisão.
                </Typography>
              </Box>
            </SectionCard>
          </Box>

          <Box id="papeis">
            <SectionCard
              title="Papéis e responsáveis"
              subtitle="Contrato de responsabilidade: quem administra não é automaticamente quem paga, aprova segurança ou confirma resultados."
            >
              <Box sx={{ display: "grid", gap: 1.5 }}>
                <RoleContractList
                  assignments={assignments}
                  authorities={snapshot.authorities}
                  profile={declaredProfile}
                  onChange={(role: RoleKey, value: string) =>
                    setAssignments((current) => ({ ...current, [role]: value }))
                  }
                />
                <Alert severity="info">{ROLE_ACCEPTANCE_NOTICE}</Alert>
                {warnings.map((warning) => (
                  <Alert
                    key={warning}
                    severity={warning.startsWith("Separação") ? "success" : "warning"}
                  >
                    {warning}
                  </Alert>
                ))}
              </Box>
            </SectionCard>
          </Box>

          <Box id="fontes">
            <SectionCard
              title="Fontes de trabalho"
              subtitle="De onde vem o trabalho que o app pode provar. Sem fonte, a evidência é só manual/declarada."
              action={
                <Tooltip title="Adoção de fonte nova roda pelos comandos de adoção (adopt-existing-repos) — fora da UI nesta fatia">
                  <span>
                    <Button size="small" variant="contained" disabled>
                      Adicionar fonte
                    </Button>
                  </span>
                </Tooltip>
              }
            >
              <Box sx={{ display: "grid", gap: 1.5 }}>
                <SourceList sources={adoption.sources} />
                <Alert
                  severity={
                    adoption.sourcesConnected === adoption.sources.length ? "success" : "warning"
                  }
                >
                  {adoption.sourcesConnected === adoption.sources.length
                    ? `${adoption.sourcesConnected} de ${adoption.sources.length} fontes publicam contexto — evidência automática habilitada.`
                    : `${adoption.sourcesConnected} de ${adoption.sources.length} fontes publicam contexto. ${NO_SOURCE_DOWNGRADE}`}
                </Alert>
              </Box>
            </SectionCard>
          </Box>

          <Box id="assistente">
            <SectionCard
              title="Assistente (opcional)"
              subtitle="Explica termos e sugere próximos passos. O app funciona sem ele; a decisão continua governada."
            >
              <Box sx={{ display: "grid", gap: 1.5 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Flex align="center" gap={1.5} wrap>
                    <MemoryIcon color="primary" />
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {providerIsLocal(provider) ? "Local" : "Nuvem"} · {provider} ·{" "}
                        {assistantModel}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {assistantUrl} · preferência desta sessão — ainda não persistida
                      </Typography>
                    </Box>
                    {providerIsLocal(provider) ? (
                      <Chip
                        size="small"
                        icon={<LockIcon sx={{ fontSize: 13 }} />}
                        label="Sem saída de dados"
                        sx={{ bgcolor: "#e7f2ea", color: "#1a5632" }}
                      />
                    ) : (
                      <StatusPill state="pending" label="egress requer aprovação" />
                    )}
                  </Flex>
                </Paper>
                <ResponsiveGrid min={220} gap={1.5}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Provider</InputLabel>
                    <Select label="Provider" value={provider} onChange={updateProvider}>
                      {systems.map((system) => (
                        <MenuItem key={system} value={system}>
                          {system}
                          {system === "ollama" ? " (recomendado)" : ""}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    label="Endpoint"
                    value={assistantUrl}
                    onChange={(event) => setAssistantUrl(event.target.value)}
                  />
                  <TextField
                    size="small"
                    label="Modelo"
                    value={assistantModel}
                    onChange={(event) => setAssistantModel(event.target.value)}
                  />
                  <FormControl size="small" fullWidth>
                    <InputLabel>Política de classificação</InputLabel>
                    <Select
                      label="Política de classificação"
                      value={classificationPolicy}
                      onChange={(event) => setClassificationPolicy(event.target.value)}
                    >
                      <MenuItem value="local-only">
                        local-only: restricted não sai da máquina
                      </MenuItem>
                      <MenuItem value="policy-gated">policy-gated: egress exige allowlist</MenuItem>
                      <MenuItem value="public-only">public-only: apenas contexto público</MenuItem>
                    </Select>
                  </FormControl>
                </ResponsiveGrid>
                <Alert severity={providerIsLocal(provider) ? "success" : "warning"}>
                  {providerIsLocal(provider)
                    ? "Provider local reduz risco de egress e é a primeira configuração recomendada."
                    : assistantCloudNote(declaredProfile)}
                </Alert>
                <Typography variant="caption" color="text.secondary">
                  Sugestões do assistente carregam score, unknown, evidence e policy. Humano
                  confirma; o resolver valida refs. O assistente não altera manifest, meta, gate,
                  actual ou veredito.
                </Typography>
              </Box>
            </SectionCard>
          </Box>

          <Box id="integracoes">
            <SectionCard
              title="Integrações (opcionais)"
              subtitle="Potencializam o framework, que já funciona file-first. Nenhuma escreve o estado autoritativo."
              action={
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    label="Categoria"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  >
                    {categories.map((item) => (
                      <MenuItem key={item} value={item}>
                        {item}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              }
            >
              <ResponsiveGrid min={320} gap={1.5}>
                {integrations.map((item) => {
                  const status = integrationStatus(item);
                  return (
                    <EntityCard
                      key={item.id}
                      title={item.id}
                      subtitle={`${item["adapter-kind"]} · ${item.priority}`}
                    >
                      <Box sx={{ display: "grid", gap: 1 }}>
                        <Flex wrap gap={0.75}>
                          <Chip size="small" color={status.color} label={status.label} />
                          {item.systems.slice(0, 4).map((system) => (
                            <DataPill key={system} label={system} />
                          ))}
                        </Flex>
                        <Typography variant="body2" color="text.secondary">
                          {item["value-add"]}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          autoridade: {item.authority}
                        </Typography>
                      </Box>
                    </EntityCard>
                  );
                })}
              </ResponsiveGrid>
            </SectionCard>
          </Box>

          <Box id="avancado">
            <SectionCard
              title="Avançado · Console técnico"
              subtitle="Grafo, event-log, comandos, resolver e exceções (break-glass). Para administradores e auditores."
              action={
                <Button
                  component={Link}
                  href="/console"
                  variant="outlined"
                  size="small"
                  startIcon={<TerminalIcon fontSize="small" />}
                >
                  Abrir console
                </Button>
              }
            >
              <Flex wrap gap={1}>
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${snapshot.counts.graphNodes} nós · ${snapshot.counts.graphEdges} arestas`}
                />
                <Chip size="small" variant="outlined" label={`revision ${snapshot.revision}`} />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${snapshot.counts.errors} erro(s) · ${snapshot.counts.warnings} aviso(s)`}
                />
              </Flex>
            </SectionCard>
          </Box>
        </Box>
      </Box>
    </AppShell>
  );
}
