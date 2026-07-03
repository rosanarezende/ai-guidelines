"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Step,
  StepButton,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import AssistantIcon from "@mui/icons-material/Assistant";
import BusinessIcon from "@mui/icons-material/Business";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import LinkIcon from "@mui/icons-material/Link";
import SecurityIcon from "@mui/icons-material/Security";
import TuneIcon from "@mui/icons-material/Tune";
import { useMemo, useState } from "react";
import type { GovernanceSnapshot, IntegrationItem } from "@/lib/types";
import { DataPill, EntityCard, Flex, ResponsiveGrid, SectionCard } from "../components";

type SetupStepId = "profile" | "roles" | "assistant" | "integrations" | "review";
type OrgProfileId = "full" | "compact" | "trio" | "solo";

const setupSteps: Array<{ id: SetupStepId; label: string }> = [
  { id: "profile", label: "Perfil da org" },
  { id: "roles", label: "Papeis e conta" },
  { id: "assistant", label: "Assistente" },
  { id: "integrations", label: "Ferramentas" },
  { id: "review", label: "Revisao" },
];

const profileOptions: Array<{
  id: OrgProfileId;
  label: string;
  mapsTo: "full" | "compact" | "solo";
  bestWhen: string;
  tradeoff: string;
  cascade: string[];
}> = [
  {
    id: "full",
    label: "Full-team",
    mapsTo: "full",
    bestWhen: "PM, lideranca tecnica, dados, SRE e sponsor existem como papeis separados.",
    tradeoff: "Maior integridade de SoD; mais etapas e revisoes.",
    cascade: [
      "ruler-authority exige par ou break-glass logado",
      "target-definer e actual-attester devem ser independentes",
      "review externo deriva de repo, modulo e contrato",
    ],
  },
  {
    id: "compact",
    label: "Compact",
    mapsTo: "compact",
    bestWhen: "Empresa media com poucos approvers e algum colapso de papel.",
    tradeoff: "Detecta risco e revisa em cadencia; bloqueia menos que full.",
    cascade: [
      "dangerous vira warning visivel",
      "revisao retroativa substitui parte do bloqueio",
      "colapso precisa aparecer no dashboard",
    ],
  },
  {
    id: "trio",
    label: "Trio",
    mapsTo: "compact",
    bestWhen: "Negocio, design/produto e engenharia operam juntos.",
    tradeoff: "Independencia de negocio existe; independencia tecnica tende a colapsar.",
    cascade: [
      "gate de negocio fica separado da execucao tecnica",
      "owner-attester tecnico pode exigir colapso logado",
      "o app deve mostrar onde a mesma pessoa acumula papel",
    ],
  },
  {
    id: "solo",
    label: "Solo",
    mapsTo: "solo",
    bestWhen: "Uma pessoa ou micro-time sem separacao real de deveres.",
    tradeoff: "Menos cerimonia; honestidade vem de self-log e badges.",
    cascade: [
      "SoD impossivel vira self-governed",
      "break-glass e colapso ficam explicitos",
      "menos bloqueio para evitar bypass invisivel",
    ],
  },
];

const frameworkNative = [
  "SSOT file-first e read-model derivado",
  "command runtime com base-revision, idempotency e authority",
  "resolver fail-closed para outcomes, contratos, repo-work e refs",
  "red-team corpus e warnings visiveis quando ha colapso",
];

const roleLabels: Record<string, string> = {
  installer: "Admin de instalacao",
  sponsor: "Sponsor de governanca",
  payer: "Responsavel financeiro",
  security: "Aprovador de politica/egress",
  technical: "Owner tecnico",
  metric: "Actual attester",
};

type RoleAssignments = Record<keyof typeof roleLabels, string>;

function integrationStatus(item: IntegrationItem): {
  label: string;
  color: "default" | "info" | "success" | "warning";
} {
  if (item.id === "assistant-runtime-local-cloud")
    return { label: "configurar primeiro", color: "success" };
  if (item.id === "graph-export") return { label: "parcial hoje", color: "info" };
  if (item.priority === "deferred") return { label: "adiado", color: "warning" };
  return { label: "em breve", color: "default" };
}

function priorityWeight(priority: string): number {
  if (priority === "P0") return 0;
  if (priority === "P1") return 1;
  if (priority === "P2") return 2;
  return 3;
}

function providerIsLocal(provider: string): boolean {
  return ["ollama", "lm-studio", "localai", "llama-cpp-server", "vllm"].includes(provider);
}

function roleWarnings(
  assignments: RoleAssignments,
  profile: OrgProfileId,
  authorityIds: Set<string>
): string[] {
  const warnings: string[] = [];
  if (assignments.installer === assignments.sponsor) {
    warnings.push(
      "Admin de instalacao e sponsor de governanca colapsaram: em full isso precisa de par ou break-glass."
    );
  }
  if (assignments.installer === assignments.payer) {
    warnings.push(
      "Admin tecnico tambem paga a conta: se ele puder habilitar e pagar integracao, o risco financeiro nao fica independente."
    );
  }
  if (assignments.sponsor === assignments.metric) {
    warnings.push(
      "Quem aprova a regra tambem atesta actual: dashboard pode inflar resultado se nao houver atestador independente."
    );
  }
  if (assignments.technical === assignments.metric) {
    warnings.push(
      "Owner tecnico e actual-attester colapsaram: outcome deve carregar badge self-attested quando medir o proprio time."
    );
  }
  if (!authorityIds.has(assignments.payer)) {
    warnings.push(
      "Responsavel financeiro ainda nao resolve no authority registry; precisa de identity-provider ou authority local antes de cobrar."
    );
  }
  if (profile === "solo") {
    warnings.push(
      "Perfil solo aceita colapso, mas nao pode esconder: o self-log precisa aparecer no audit/dashboard."
    );
  }
  if (!warnings.length) warnings.push("Separacao minima parece coerente para a escolha atual.");
  return warnings;
}

export default function IntegrationSettings({ snapshot }: { snapshot: GovernanceSnapshot }) {
  const [step, setStep] = useState<SetupStepId>("profile");
  const [profile, setProfile] = useState<OrgProfileId>(
    snapshot.profileDeclaration.profile === "full" ? "full" : "compact"
  );
  const [provider, setProvider] = useState("ollama");
  const [assistantUrl, setAssistantUrl] = useState("http://127.0.0.1:11434");
  const [assistantModel, setAssistantModel] = useState("modelo-local");
  const [classificationPolicy, setClassificationPolicy] = useState("local-only");
  const [category, setCategory] = useState("ai-assistance");
  const [assignments, setAssignments] = useState<RoleAssignments>({
    installer: "head-platform",
    sponsor: "sponsor-acme",
    payer: "finance-owner",
    security: "lead-sre",
    technical: "head-platform",
    metric: "lead-data",
  });

  const selectedProfile = profileOptions.find((item) => item.id === profile) || profileOptions[0];
  const authorityIds = useMemo(
    () => new Set(snapshot.authorities.map((authority) => authority.id)),
    [snapshot.authorities]
  );
  const warnings = roleWarnings(assignments, profile, authorityIds);
  const assistantRuntime = snapshot.integrationCatalog.integrations.find(
    (item) => item.id === "assistant-runtime-local-cloud"
  );
  const systems = assistantRuntime?.systems || ["ollama"];
  const categories = [
    ...new Set(snapshot.integrationCatalog.integrations.map((item) => item.category)),
  ].sort();
  const integrations = snapshot.integrationCatalog.integrations
    .filter((item) => item.category === category)
    .sort(
      (a, b) => priorityWeight(a.priority) - priorityWeight(b.priority) || a.id.localeCompare(b.id)
    );

  function updateRole(role: keyof typeof roleLabels, event: SelectChangeEvent) {
    setAssignments((current) => ({ ...current, [role]: event.target.value }));
  }

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
    <Box sx={{ display: "grid", gap: 2 }}>
      <SectionCard
        title="Configuracoes de adocao"
        subtitle="Onboarding fluido: primeiro escolhe a regua de governanca, depois separa autoridade, conta e integracoes."
        action={<Chip size="small" color="info" label="experiencia configuravel" />}
      >
        <Alert severity="info" sx={{ mb: 2 }}>
          O framework ja funciona sem ferramentas externas. Integracoes entram para acelerar
          descoberta, evidencia e assistencia; nenhuma delas fecha gate, aceita verdict ou vira
          SSOT.
        </Alert>
        <Stepper nonLinear activeStep={setupSteps.findIndex((item) => item.id === step)}>
          {setupSteps.map((item) => (
            <Step key={item.id}>
              <StepButton onClick={() => setStep(item.id)}>{item.label}</StepButton>
            </Step>
          ))}
        </Stepper>
      </SectionCard>

      {step === "profile" ? (
        <ResponsiveGrid min={300}>
          {profileOptions.map((item) => (
            <Button
              key={item.id}
              variant={profile === item.id ? "contained" : "outlined"}
              onClick={() => setProfile(item.id)}
              sx={{ justifyContent: "flex-start", p: 2, textAlign: "left", minHeight: 180 }}
            >
              <Box sx={{ display: "grid", gap: 0.75 }}>
                <Flex align="center" gap={1}>
                  <BusinessIcon fontSize="small" />
                  <Typography variant="h3">{item.label}</Typography>
                  <Chip size="small" label={`mapeia ${item.mapsTo}`} />
                </Flex>
                <Typography variant="body2">{item.bestWhen}</Typography>
                <Typography variant="caption">{item.tradeoff}</Typography>
              </Box>
            </Button>
          ))}
        </ResponsiveGrid>
      ) : null}

      {step === "roles" ? (
        <Box sx={{ display: "grid", gap: 2 }}>
          <SectionCard
            title="Contrato de papeis"
            subtitle="Admin, payer, sponsor e attester sao papeis diferentes. Se colapsarem, o app deve mostrar o risco."
            action={<Chip size="small" label={`perfil ${selectedProfile.mapsTo}`} />}
          >
            <ResponsiveGrid min={260}>
              {(Object.keys(roleLabels) as Array<keyof typeof roleLabels>).map((role) => (
                <FormControl key={role} size="small" fullWidth>
                  <InputLabel>{roleLabels[role]}</InputLabel>
                  <Select
                    label={roleLabels[role]}
                    value={assignments[role]}
                    onChange={(event) => updateRole(role, event)}
                  >
                    {snapshot.authorities.map((authority) => (
                      <MenuItem key={authority.id} value={authority.id}>
                        {authority.id}
                      </MenuItem>
                    ))}
                    {role === "payer" ? (
                      <MenuItem value="finance-owner">finance-owner (precisa resolver)</MenuItem>
                    ) : null}
                  </Select>
                </FormControl>
              ))}
            </ResponsiveGrid>
          </SectionCard>
          <SectionCard
            title="Analise de independencia"
            subtitle="O objetivo e evitar que conveniencia vire brecha."
          >
            <Box sx={{ display: "grid", gap: 1 }}>
              {warnings.map((warning) => (
                <Alert
                  key={warning}
                  severity={warning.startsWith("Separacao") ? "success" : "warning"}
                >
                  {warning}
                </Alert>
              ))}
            </Box>
          </SectionCard>
        </Box>
      ) : null}

      {step === "assistant" ? (
        <ResponsiveGrid min={420}>
          <SectionCard
            title="Assistente inicial"
            subtitle="O assistente apoia matcher, capability extraction, resumo e triagem. A decisao continua governada."
            action={<Chip size="small" color="success" label="primeira integracao" />}
          >
            <Box sx={{ display: "grid", gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Provider</InputLabel>
                <Select label="Provider" value={provider} onChange={updateProvider}>
                  {systems.map((system) => (
                    <MenuItem key={system} value={system}>
                      {system}
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
              <FormControl fullWidth size="small">
                <InputLabel>Politica de classificacao</InputLabel>
                <Select
                  label="Politica de classificacao"
                  value={classificationPolicy}
                  onChange={(event) => setClassificationPolicy(event.target.value)}
                >
                  <MenuItem value="local-only">local-only: restricted nao sai da maquina</MenuItem>
                  <MenuItem value="policy-gated">
                    policy-gated: egress precisa de allowlist
                  </MenuItem>
                  <MenuItem value="public-only">public-only: apenas contexto publico</MenuItem>
                </Select>
              </FormControl>
              <Alert severity={providerIsLocal(provider) ? "success" : "warning"}>
                {providerIsLocal(provider)
                  ? "Provider local reduz risco de egress e e uma boa primeira configuracao."
                  : "Provider cloud exige politica de egress, classificacao e fallback local antes de uso em restricted."}
              </Alert>
            </Box>
          </SectionCard>
          <SectionCard
            title="Contrato do assistente"
            subtitle="O que a integracao pode e nao pode fazer."
          >
            <Box sx={{ display: "grid", gap: 1.25 }}>
              <Flex wrap gap={1}>
                {(assistantRuntime?.feeds || []).map((feed) => (
                  <DataPill key={feed} label={feed} />
                ))}
              </Flex>
              <Divider />
              <Typography variant="body2" color="text.secondary">
                Sugestoes precisam carregar score, unknown, evidence e policy. Humano confirma;
                resolver valida refs. O assistente nao altera manifest, target, gate, actual ou
                verdict.
              </Typography>
              <Button variant="outlined" disabled startIcon={<AssistantIcon />}>
                Teste real de conexao em breve
              </Button>
            </Box>
          </SectionCard>
        </ResponsiveGrid>
      ) : null}

      {step === "integrations" ? (
        <Box sx={{ display: "grid", gap: 2 }}>
          <SectionCard
            title="Catalogo de integracoes"
            subtitle="Use ferramentas existentes como evidencia, importacao ou projecao. O framework continua sendo o resolver."
            action={
              <FormControl size="small" sx={{ minWidth: 220 }}>
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
            <ResponsiveGrid min={360}>
              {integrations.map((item) => {
                const status = integrationStatus(item);
                return (
                  <EntityCard
                    key={item.id}
                    title={item.id}
                    subtitle={`${item["adapter-kind"]} · ${item.priority}`}
                  >
                    <Box sx={{ display: "grid", gap: 1 }}>
                      <Flex wrap gap={1}>
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
      ) : null}

      {step === "review" ? (
        <ResponsiveGrid min={360}>
          <SectionCard title="O framework ja entrega" subtitle="Base antes de qualquer integracao.">
            <Box sx={{ display: "grid", gap: 1 }}>
              {frameworkNative.map((item) => (
                <Flex key={item} gap={1} align="center">
                  <FactCheckIcon color="success" fontSize="small" />
                  <Typography variant="body2">{item}</Typography>
                </Flex>
              ))}
            </Box>
          </SectionCard>
          <SectionCard title="Resumo da cascata" subtitle="Escolhas iniciais que mudam o restante.">
            <Box sx={{ display: "grid", gap: 1 }}>
              <Flex wrap gap={1}>
                <Chip
                  size="small"
                  icon={<TuneIcon />}
                  label={`perfil ${profile} -> ${selectedProfile.mapsTo}`}
                />
                <Chip size="small" icon={<AssistantIcon />} label={`assistant ${provider}`} />
                <Chip size="small" icon={<SecurityIcon />} label={classificationPolicy} />
                <Chip
                  size="small"
                  icon={<LinkIcon />}
                  label={`${snapshot.integrationCatalog.integrations.length} adapters catalogados`}
                />
              </Flex>
              {selectedProfile.cascade.map((item) => (
                <Alert key={item} severity="info">
                  {item}
                </Alert>
              ))}
              {warnings
                .filter((warning) => !warning.startsWith("Separacao"))
                .map((warning) => (
                  <Alert key={warning} severity="warning">
                    {warning}
                  </Alert>
                ))}
            </Box>
          </SectionCard>
        </ResponsiveGrid>
      ) : null}
    </Box>
  );
}
