"use client";

// OnboardingView.tsx — configuração inicial guiada (boas-vindas + 6 passos).
// IMPORTANTE: nada aqui persiste. É projeção de UX sobre o snapshot; a declaração real
// vive em org.yml/authorities.yml e só muda por comando governado (fatia futura).
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BalanceIcon from "@mui/icons-material/Balance";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckIcon from "@mui/icons-material/Check";
import FolderIcon from "@mui/icons-material/Folder";
import LockIcon from "@mui/icons-material/Lock";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { GovernanceSnapshot } from "@/lib/types";
import { Flex, ResponsiveGrid } from "../components";
import { RoleContractList } from "../adoption/components";
import {
  DEFAULT_ASSIGNMENTS,
  NO_SOURCE_DOWNGRADE,
  PROFILE_OPTIONS,
  ROLE_ACCEPTANCE_NOTICE,
  SOURCE_KINDS,
  assistantCloudNote,
  assistantSystems,
  deriveAdoption,
  profileChipLabel,
  profileOption,
  roleWarnings,
  type AssistantChoice,
  type ProfileId,
  type RoleAssignments,
  type RoleKey,
  type SourceKindId,
} from "../adoption/model";
import AppShell from "../shell/AppShell";

const STEP_LABELS = [
  "Perfil da organização",
  "Papéis e responsáveis",
  "Fontes de trabalho",
  "Assistente",
  "Integrações",
  "Revisão",
];

function WelcomeCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, display: "flex", gap: 1.75, alignItems: "flex-start" }}>
      <Box sx={{ color: "primary.main", mt: 0.25 }}>{icon}</Box>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {text}
        </Typography>
      </Box>
    </Paper>
  );
}

function StepHeading({ step, title, lead }: { step: number; title: string; lead: string }) {
  return (
    <Box sx={{ display: "grid", gap: 0.75 }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
        PASSO {step} DE 6
      </Typography>
      <Typography sx={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.3px" }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640 }}>
        {lead}
      </Typography>
    </Box>
  );
}

function OptionCard({
  selected,
  onClick,
  children,
  disabled = false,
}: {
  selected: boolean;
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        opacity: disabled ? 0.6 : 1,
        borderColor: selected ? "primary.main" : "divider",
        borderWidth: selected ? 2 : 1,
        bgcolor: selected ? "#f4f9f5" : "background.paper",
      }}
    >
      <CardActionArea
        disabled={disabled || !onClick}
        onClick={onClick}
        sx={{ height: "100%", p: 2 }}
      >
        {children}
      </CardActionArea>
    </Card>
  );
}

export default function OnboardingView({ snapshot }: { snapshot: GovernanceSnapshot }) {
  const adoption = useMemo(() => deriveAdoption(snapshot), [snapshot]);
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileId>(
    snapshot.profileDeclaration.profile === "full" ? "full" : "compact"
  );
  const [assignments, setAssignments] = useState<RoleAssignments>(DEFAULT_ASSIGNMENTS);
  const [sourceKinds, setSourceKinds] = useState<Record<SourceKindId, boolean>>({
    git: true,
    local: false,
    mono: false,
    svc: false,
    ext: false,
  });
  const [assistant, setAssistant] = useState<AssistantChoice>("local");

  const selectedProfile = profileOption(profile);
  const authorityIds = useMemo(
    () => new Set(snapshot.authorities.map((authority) => authority.id)),
    [snapshot.authorities]
  );
  const warnings = roleWarnings(assignments, profile, authorityIds);
  const selectedSourceCount = Object.values(sourceKinds).filter(Boolean).length;
  const systems = assistantSystems(snapshot);

  const catalogHighlights = useMemo(() => {
    const weight = (priority: string) =>
      priority === "P0" ? 0 : priority === "P1" ? 1 : priority === "P2" ? 2 : 3;
    return [...snapshot.integrationCatalog.integrations]
      .sort((a, b) => weight(a.priority) - weight(b.priority) || a.id.localeCompare(b.id))
      .slice(0, 6);
  }, [snapshot.integrationCatalog.integrations]);

  const works: string[] = [
    `Perfil: ${selectedProfile.label} — cerimônia ajustada à sua realidade`,
    profile === "solo"
      ? "Papéis: você em todos, registrado como self-governed"
      : "Papéis: contrato de responsabilidade declarado por autoridade resolvível",
    "Planejar ciclos, registrar iniciativas e acompanhar metas",
    "Trilha de auditoria completa, em arquivos seus",
  ];
  if (selectedSourceCount > 0)
    works.push(
      `Evidência automática a partir de ${selectedSourceCount} tipo(s) de fonte de trabalho`
    );
  if (assistant === "local") works.push("Assistente local (Ollama) — sem saída de dados");

  const pending: string[] = [];
  if (selectedSourceCount === 0)
    pending.push(
      "Nenhuma fonte de trabalho — execução, contratos e resultados só com evidência manual/declarada"
    );
  if (assistant === "cloud") pending.push(assistantCloudNote(profile));
  pending.push(
    "Nenhuma integração conectada — o framework funciona sem, mas a evidência fica manual"
  );
  pending.push("Aceite/convite dos papéis ainda não é mecanismo — fica como risco pendente");

  const risks: string[] =
    profile === "full"
      ? [
          "Nenhum acúmulo de papéis é aceito em silêncio. Exceções só entram via break-glass — ficam registradas, com prazo de revisão.",
        ]
      : profile === "solo"
        ? [
            "Todas as confirmações são auto-declaradas — visíveis para você e para qualquer auditoria futura.",
          ]
        : warnings.filter((warning) => !warning.startsWith("Separação"));

  const stepper = (
    <Box
      sx={{ position: { md: "sticky" }, top: 24, display: "grid", gap: 0.5, alignContent: "start" }}
    >
      {STEP_LABELS.map((label, index) => {
        const n = index + 1;
        const done = step > n;
        const current = step === n;
        return (
          <Flex
            key={label}
            align="center"
            gap={1.5}
            sx={{
              px: 1.5,
              py: 1,
              borderRadius: 2,
              cursor: "pointer",
              bgcolor: current ? "#eaf1ec" : "transparent",
            }}
          >
            <Box
              onClick={() => setStep(n)}
              sx={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12.5,
                fontWeight: 700,
                flexShrink: 0,
                bgcolor: done ? "primary.main" : current ? "background.paper" : "#eef0ef",
                color: done ? "primary.contrastText" : current ? "primary.main" : "text.secondary",
                border: current ? "2px solid" : "2px solid transparent",
                borderColor: current ? "primary.main" : "transparent",
              }}
            >
              {done ? <CheckIcon sx={{ fontSize: 15 }} /> : n}
            </Box>
            <Typography
              onClick={() => setStep(n)}
              variant="body2"
              sx={{
                fontWeight: 600,
                color: current ? "text.primary" : done ? "text.primary" : "text.secondary",
              }}
            >
              {label}
            </Typography>
          </Flex>
        );
      })}
      <Paper
        variant="outlined"
        sx={{ mt: 2, p: 1.5, borderStyle: "dashed", display: "flex", gap: 1.25 }}
      >
        <LockIcon sx={{ fontSize: 17, color: "text.secondary", mt: 0.25 }} />
        <Typography variant="caption" color="text.secondary">
          Cada passo vira um arquivo seu — por comando governado, em fatia futura. Nada é enviado
          para fora.
        </Typography>
      </Paper>
    </Box>
  );

  return (
    <AppShell
      subtitle="Configuração inicial"
      chip={profileChipLabel(snapshot.profileDeclaration.profile)}
      headerAction={
        <Button component={Link} href="/" size="small" color="inherit">
          Salvar e continuar depois
        </Button>
      }
    >
      {step === 0 ? (
        <Box sx={{ maxWidth: 660, mx: "auto", display: "grid", gap: 2 }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, letterSpacing: 0.6, color: "text.secondary" }}
          >
            CONFIGURAÇÃO INICIAL · ~10 MIN
          </Typography>
          <Typography
            sx={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.2 }}
          >
            Vamos montar a governança do seu jeito
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Seis passos curtos. Só o perfil da organização é obrigatório — todo o resto dá para
            fazer depois, em Configurações.
          </Typography>
          <Box sx={{ display: "grid", gap: 1.5, mt: 1 }}>
            <WelcomeCard
              icon={<FolderIcon />}
              title="Tudo vira arquivos seus"
              text="Versionados, auditáveis e portáveis. Nenhuma decisão fica escondida em banco de dados de terceiros."
            />
            <WelcomeCard
              icon={<LockIcon />}
              title="Nada sai da sua máquina sem você aprovar"
              text="Assistente e integrações são opcionais. O framework funciona completo sem nenhuma conexão externa."
            />
            <WelcomeCard
              icon={<BalanceIcon />}
              title="Honesto com a sua realidade"
              text="Time completo, trio ou solo: o app ajusta a cerimônia em vez de fingir independência que não existe."
            />
          </Box>
          <Flex align="center" gap={2} sx={{ mt: 1 }}>
            <Button variant="contained" onClick={() => setStep(1)}>
              Começar
            </Button>
            <Typography variant="body2" color="text.secondary">
              Já tem arquivos de governança? A sim v3 já vem adotada — este fluxo apenas projeta as
              escolhas.
            </Typography>
          </Flex>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 3.5,
            alignItems: "start",
            gridTemplateColumns: { xs: "1fr", md: "264px 1fr" },
          }}
        >
          {stepper}
          <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 }, display: "grid", gap: 2.5 }}>
            {step === 1 ? (
              <>
                <StepHeading
                  step={1}
                  title="Como a sua organização funciona hoje?"
                  lead="Isso define quanta cerimônia o app pede. Seja honesto — dá para mudar depois, e a mudança fica registrada."
                />
                <ResponsiveGrid min={220} gap={1.75}>
                  {PROFILE_OPTIONS.map((option) => {
                    const selected = option.id === profile;
                    return (
                      <OptionCard
                        key={option.id}
                        selected={selected}
                        onClick={() => setProfile(option.id)}
                      >
                        <Box sx={{ display: "grid", gap: 1, alignContent: "start" }}>
                          <Flex justify="space-between" align="center" gap={1}>
                            <Typography sx={{ fontWeight: 800 }}>{option.label}</Typography>
                            {selected ? (
                              <CheckCircleIcon color="primary" fontSize="small" />
                            ) : (
                              <RadioButtonUncheckedIcon
                                fontSize="small"
                                sx={{ color: "#c2c9c2" }}
                              />
                            )}
                          </Flex>
                          <Typography variant="caption" sx={{ color: "text.primary" }}>
                            {option.bestWhen}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ borderTop: "1px solid", borderColor: "divider", pt: 1 }}
                          >
                            {option.tradeoff}
                          </Typography>
                        </Box>
                      </OptionCard>
                    );
                  })}
                </ResponsiveGrid>
                <Flex wrap gap={0.75} align="center">
                  <Typography variant="caption" color="text.secondary">
                    O que isso muda:
                  </Typography>
                  {selectedProfile.ceremony.map((item) => (
                    <Chip
                      key={item}
                      size="small"
                      label={item}
                      sx={{ bgcolor: "#eaf1ec", color: "#1a5632" }}
                    />
                  ))}
                </Flex>
                <Alert severity={selectedProfile.enforcement.severity}>
                  <strong>{selectedProfile.enforcement.verb}:</strong>{" "}
                  {selectedProfile.enforcement.text}
                </Alert>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <StepHeading
                  step={2}
                  title="Quem responde pelo quê?"
                  lead="São seis papéis diferentes de verdade: quem administra não é automaticamente quem paga, aprova segurança ou confirma resultados."
                />
                <RoleContractList
                  assignments={assignments}
                  authorities={snapshot.authorities}
                  profile={profile}
                  onChange={(role: RoleKey, value: string) =>
                    setAssignments((current) => ({ ...current, [role]: value }))
                  }
                />
                <Alert severity="info">{ROLE_ACCEPTANCE_NOTICE}</Alert>
                <Box sx={{ display: "grid", gap: 1 }}>
                  {warnings.map((warning) => (
                    <Alert
                      key={warning}
                      severity={warning.startsWith("Separação") ? "success" : "warning"}
                    >
                      {warning}
                    </Alert>
                  ))}
                </Box>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <StepHeading
                  step={3}
                  title="Conectar fontes de trabalho"
                  lead="De onde vem o trabalho que você quer provar? Sem uma fonte, dá para planejar e registrar intenções — mas não provar execução, contratos ou resultados."
                />
                <ResponsiveGrid min={280} gap={1.5}>
                  {SOURCE_KINDS.map((kind) => {
                    const selected = !kind.disabled && sourceKinds[kind.id];
                    return (
                      <OptionCard
                        key={kind.id}
                        selected={selected}
                        disabled={kind.disabled}
                        onClick={
                          kind.disabled
                            ? undefined
                            : () =>
                                setSourceKinds((current) => ({
                                  ...current,
                                  [kind.id]: !current[kind.id],
                                }))
                        }
                      >
                        <Flex gap={1.5} align="flex-start">
                          {selected ? (
                            <CheckCircleIcon color="primary" fontSize="small" sx={{ mt: 0.25 }} />
                          ) : (
                            <RadioButtonUncheckedIcon
                              fontSize="small"
                              sx={{ mt: 0.25, color: "#c2c9c2" }}
                            />
                          )}
                          <Box>
                            <Flex align="center" gap={1} wrap>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {kind.name}
                              </Typography>
                              {kind.tag ? (
                                <Chip size="small" variant="outlined" label={kind.tag} />
                              ) : null}
                            </Flex>
                            <Typography variant="caption" color="text.secondary">
                              {kind.desc}
                            </Typography>
                          </Box>
                        </Flex>
                      </OptionCard>
                    );
                  })}
                </ResponsiveGrid>
                {selectedSourceCount > 0 ? (
                  <Alert severity="success">
                    Evidência automática habilitada para {selectedSourceCount} tipo(s) de fonte.
                    Execução, contratos e resultados poderão ser provados, não só declarados. Na
                    sim, {adoption.sourcesConnected} de {adoption.sources.length} fontes já publicam
                    contexto.
                  </Alert>
                ) : (
                  <Alert severity="warning">{NO_SOURCE_DOWNGRADE} Dá para conectar depois.</Alert>
                )}
              </>
            ) : null}

            {step === 4 ? (
              <>
                <StepHeading
                  step={4}
                  title="Quer um assistente? É opcional."
                  lead="Ele explica termos e sugere próximos passos em linguagem simples. O app inteiro funciona sem ele."
                />
                <Box sx={{ display: "grid", gap: 1.5 }}>
                  <OptionCard
                    selected={assistant === "local"}
                    onClick={() => setAssistant("local")}
                  >
                    <Box sx={{ display: "grid", gap: 1 }}>
                      <Flex align="center" gap={1.25} wrap>
                        {assistant === "local" ? (
                          <RadioButtonCheckedIcon color="primary" fontSize="small" />
                        ) : (
                          <RadioButtonUncheckedIcon fontSize="small" sx={{ color: "#c2c9c2" }} />
                        )}
                        <Typography sx={{ fontWeight: 700 }}>Local com Ollama</Typography>
                        <Chip
                          size="small"
                          icon={<LockIcon sx={{ fontSize: 13 }} />}
                          label="Recomendado · privado"
                          sx={{ bgcolor: "#e7f2ea", color: "#1a5632" }}
                        />
                      </Flex>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        Roda na sua máquina. Nem prompts, nem arquivos saem para a internet.
                      </Typography>
                      {assistant === "local" ? (
                        <Flex gap={1.25} wrap sx={{ ml: 4 }}>
                          <TextField
                            size="small"
                            label="Endereço local"
                            value="http://127.0.0.1:11434"
                            slotProps={{ input: { readOnly: true } }}
                          />
                          <TextField
                            size="small"
                            label="Modelo"
                            value="llama3.2"
                            slotProps={{ input: { readOnly: true } }}
                          />
                          <Button size="small" variant="outlined" disabled>
                            Testar conexão (mecanismo futuro)
                          </Button>
                        </Flex>
                      ) : null}
                    </Box>
                  </OptionCard>
                  <OptionCard
                    selected={assistant === "cloud"}
                    onClick={() => setAssistant("cloud")}
                  >
                    <Box sx={{ display: "grid", gap: 1 }}>
                      <Flex align="center" gap={1.25} wrap>
                        {assistant === "cloud" ? (
                          <RadioButtonCheckedIcon color="primary" fontSize="small" />
                        ) : (
                          <RadioButtonUncheckedIcon fontSize="small" sx={{ color: "#c2c9c2" }} />
                        )}
                        <Typography sx={{ fontWeight: 700 }}>Na nuvem</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {systems.filter((system) => system !== "ollama").join(", ") ||
                            "provedores externos"}
                        </Typography>
                      </Flex>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        Mais capaz, mas seus dados saem da máquina. Você vê e aprova o que é enviado
                        (egress).
                      </Typography>
                      {assistant === "cloud" ? (
                        <Alert severity="warning" sx={{ ml: 4 }}>
                          {assistantCloudNote(profile)}
                        </Alert>
                      ) : null}
                    </Box>
                  </OptionCard>
                  <OptionCard selected={assistant === "none"} onClick={() => setAssistant("none")}>
                    <Box sx={{ display: "grid", gap: 1 }}>
                      <Flex align="center" gap={1.25}>
                        {assistant === "none" ? (
                          <RadioButtonCheckedIcon color="primary" fontSize="small" />
                        ) : (
                          <RadioButtonUncheckedIcon fontSize="small" sx={{ color: "#c2c9c2" }} />
                        )}
                        <Typography sx={{ fontWeight: 700 }}>Sem assistente</Typography>
                      </Flex>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        Dá para ativar depois em Configurações.
                      </Typography>
                    </Box>
                  </OptionCard>
                </Box>
              </>
            ) : null}

            {step === 5 ? (
              <>
                <StepHeading
                  step={5}
                  title="Integrações potencializam — não são requisito."
                  lead="O framework já funciona completo com arquivos. Conectar ferramentas só automatiza evidência e avisos."
                />
                <ResponsiveGrid min={230} gap={1.5}>
                  {catalogHighlights.map((item) => (
                    <Paper
                      key={item.id}
                      variant="outlined"
                      sx={{ p: 2, display: "grid", gap: 1, alignContent: "start" }}
                    >
                      <Flex justify="space-between" align="center" gap={1}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {item.id}
                        </Typography>
                        <Chip
                          size="small"
                          label={
                            item.id === "assistant-runtime-local-cloud"
                              ? "configurável (local)"
                              : item.id === "graph-export"
                                ? "parcial hoje"
                                : "catalogado · adapter futuro"
                          }
                          color={
                            item.id === "assistant-runtime-local-cloud" ? "success" : "default"
                          }
                          variant="outlined"
                        />
                      </Flex>
                      <Typography variant="caption" color="text.secondary">
                        {item["value-add"]}
                      </Typography>
                      <Flex wrap gap={0.5}>
                        {item.systems.slice(0, 3).map((system) => (
                          <Chip key={system} size="small" variant="outlined" label={system} />
                        ))}
                      </Flex>
                    </Paper>
                  ))}
                </ResponsiveGrid>
                <Flex gap={1} align="flex-start">
                  <VerifiedUserIcon fontSize="small" sx={{ color: "text.secondary", mt: 0.25 }} />
                  <Typography variant="caption" color="text.secondary">
                    Nenhuma integração escreve o estado autoritativo. Os arquivos continuam sendo a
                    fonte da verdade.
                  </Typography>
                </Flex>
              </>
            ) : null}

            {step === 6 ? (
              <>
                <StepHeading
                  step={6}
                  title="Pronto. Eis o retrato honesto."
                  lead="Nada aqui trava o uso — pendências e riscos ficam visíveis na Home."
                />
                <Alert severity="info">
                  Esta configuração ainda não é persistida: é uma projeção de UX. A declaração real
                  vive nos arquivos de governança e mudará por comando governado em fatia futura.
                </Alert>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: "#f4f9f5", borderColor: "#d9e8dd" }}>
                  <Flex align="center" gap={1} sx={{ color: "#1a5632", mb: 1 }}>
                    <CheckCircleIcon fontSize="small" />
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Já funciona
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
                      Pendente — avisa, não trava
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
                      Riscos que ficam visíveis
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
                  <Button component={Link} href="/" variant="contained">
                    Concluir e abrir a Home
                  </Button>
                  <Button component={Link} href="/console" size="small" color="inherit">
                    Ver os arquivos no console técnico
                  </Button>
                </Flex>
              </>
            ) : null}

            {step >= 1 && step <= 5 ? (
              <Flex
                justify="space-between"
                align="center"
                sx={{ pt: 2, borderTop: "1px solid", borderColor: "divider" }}
              >
                <Button
                  color="inherit"
                  startIcon={<ArrowBackIcon />}
                  disabled={step === 1}
                  onClick={() => setStep(step - 1)}
                >
                  Voltar
                </Button>
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => setStep(step + 1)}
                >
                  Continuar
                </Button>
              </Flex>
            ) : null}
          </Paper>
        </Box>
      )}
    </AppShell>
  );
}
