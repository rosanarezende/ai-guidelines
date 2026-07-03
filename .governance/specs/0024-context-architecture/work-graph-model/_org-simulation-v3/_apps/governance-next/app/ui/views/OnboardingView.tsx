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
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  type ProfileOption,
  type RoleAssignments,
  type RoleKey,
  type SourceKindId,
} from "../adoption/model";
import {
  markOnboardingPartialIfNeeded,
  writeOnboardingStatus,
} from "../adoption/onboardingStorage";
import AppShell from "../shell/AppShell";

const STEP_LABELS = [
  "Diagnóstico da organização",
  "Papéis e responsáveis",
  "Fontes de trabalho",
  "Assistente",
  "Integrações",
  "Revisão",
];

type OrgSizeChoice = "one" | "small" | "medium" | "large";
type ResponsibilityChoice = "collapsed" | "tracks" | "separated";
type ConflictChoice = "record" | "warn" | "block";

type DiagnosisAnswers = {
  size?: OrgSizeChoice;
  responsibility?: ResponsibilityChoice;
  conflict?: ConflictChoice;
};

type DiagnosisChoice = {
  id: string;
  label: string;
  description: string;
};

const SIZE_CHOICES: DiagnosisChoice[] = [
  {
    id: "one",
    label: "Só eu",
    description: "Uma pessoa decide, executa e confirma a maior parte do trabalho.",
  },
  {
    id: "small",
    label: "Até 5 pessoas",
    description: "Time pequeno, com decisões próximas e papéis frequentemente acumulados.",
  },
  {
    id: "medium",
    label: "6 a 20 pessoas",
    description: "Já existem responsáveis distintos, mas nem toda decisão tem par independente.",
  },
  {
    id: "large",
    label: "Mais de 20 pessoas",
    description: "Há espaço para separar aprovação, execução, segurança, dados e sponsorship.",
  },
];

const RESPONSIBILITY_CHOICES: DiagnosisChoice[] = [
  {
    id: "collapsed",
    label: "Quase tudo fica nas mesmas pessoas",
    description: "Quem decide também costuma executar, configurar e confirmar o resultado.",
  },
  {
    id: "tracks",
    label: "Há frentes de negócio, produto/design e engenharia",
    description:
      "As responsabilidades existem por frente, mesmo que uma pessoa acumule mais de uma.",
  },
  {
    id: "separated",
    label: "Papéis críticos costumam ser separados",
    description: "Objetivo, aprovação, execução, segurança e atestação podem ter donos diferentes.",
  },
];

const CONFLICT_CHOICES: DiagnosisChoice[] = [
  {
    id: "record",
    label: "Registrar com transparência",
    description: "Quando faltar separação de papéis, deixar claro no histórico e seguir.",
  },
  {
    id: "warn",
    label: "Avisar e revisar depois",
    description: "Deixar o trabalho andar, mas abrir revisão para decisões sensíveis.",
  },
  {
    id: "block",
    label: "Bloquear até outra pessoa aprovar",
    description: "Impedir decisões sensíveis quando a independência mínima não existir.",
  },
];

const CONFLICT_POLICIES: Record<
  ConflictChoice,
  {
    label: string;
    summary: string;
    effect: string;
    review: string;
    appWill: string[];
    appWillNot: string[];
    visibleRisks: string[];
    ceremony: string[];
    enforcement: ProfileOption["enforcement"];
    severity: "info" | "warning" | "error";
  }
> = {
  record: {
    label: "Registrar com transparência",
    summary:
      "O perfil recomendado não muda, mas a configuração fica mais leve: acúmulo sensível não bloqueia e não abre revisão automática.",
    effect:
      "Cada acúmulo entra no histórico como auto-declarado. O dashboard mostra a limitação, e a responsabilidade fica explícita.",
    review: "Sem revisão automática; a revisão futura é manual ou por auditoria.",
    appWill: [
      "registrar o acúmulo sensível como auto-declarado",
      "mostrar no dashboard que a confirmação não é independente",
      "deixar o trabalho seguir quando não houver par disponível",
    ],
    appWillNot: [
      "abrir revisão automática para cada acúmulo",
      "tratar auto-declaração como evidência forte",
    ],
    visibleRisks: [
      "o risco fica documentado, mas pode ficar sem segunda leitura",
      "auditoria futura vê a limitação; o app não corrige sozinho",
    ],
    ceremony: ["Auto-declarado visível", "Sem revisão automática", "Segue com registro"],
    enforcement: {
      verb: "Registra",
      text: "acúmulos sensíveis passam como declaração explícita. O app não bloqueia e não agenda revisão sozinho; ele preserva a evidência de que faltou independência.",
      severity: "info",
    },
    severity: "info",
  },
  warn: {
    label: "Avisar e revisar depois",
    summary:
      "O perfil recomendado não muda, mas a configuração fica mais ativa: acúmulo sensível gera aviso e revisão em cadência.",
    effect:
      "O trabalho pode seguir, mas o app cria uma pendência de revisão para a dupla confirmar ou corrigir depois.",
    review: "Revisão conjunta em cadência para decisões sensíveis.",
    appWill: [
      "registrar o acúmulo sensível e abrir pendência de revisão",
      "permitir que o trabalho siga antes da segunda leitura",
      "destacar revisões pendentes na Home e na auditoria",
    ],
    appWillNot: [
      "bloquear por padrão quando faltar par",
      "tratar a confirmação como evidência forte antes da revisão",
    ],
    visibleRisks: [
      "decisões seguem com pendência aberta até a revisão",
      "se a cadência de revisão não acontecer, o risco fica acumulado",
    ],
    ceremony: ["Aviso visível", "Revisão em cadência", "Segue com pendência"],
    enforcement: {
      verb: "Avisa",
      text: "acúmulos sensíveis viram aviso e pendência de revisão. O trabalho pode seguir, mas a limitação continua visível até alguém revisar.",
      severity: "warning",
    },
    severity: "warning",
  },
  block: {
    label: "Bloquear até outra pessoa aprovar",
    summary:
      "Aqui a recomendação muda para responsabilidade separada, porque você pediu bloqueio quando faltar independência.",
    effect:
      "A mutação sensível só passa com outra autoridade resolvida ou com break-glass registrado e revisável.",
    review: "Bloqueio forte, com exceção apenas por break-glass.",
    appWill: [
      "exigir outra autoridade para aprovar decisões sensíveis",
      "bloquear autoaprovação quando a independência mínima faltar",
      "permitir exceção apenas com break-glass registrado e revisável",
    ],
    appWillNot: [
      "deixar mutação sensível passar como aviso simples",
      "esconder bloqueio ou exceção do histórico",
    ],
    visibleRisks: [
      "mais fricção operacional quando papéis ainda não estão configurados",
      "pode exigir convite ou autoridade resolvida antes de seguir",
    ],
    ceremony: ["Bloqueio forte", "Par independente", "Break-glass revisável"],
    enforcement: {
      verb: "Bloqueia",
      text: "mutações sensíveis não passam com a mesma pessoa nos dois papéis. Para seguir sem par, só com break-glass registrado e prazo de revisão.",
      severity: "error",
    },
    severity: "error",
  },
};

function recommendProfile(answers: DiagnosisAnswers): ProfileId {
  if (answers.size === "one") return "solo";
  if (answers.responsibility === "separated" || answers.conflict === "block") {
    return "full";
  }
  if (answers.responsibility === "tracks") return "trio";
  return "compact";
}

function recommendationIsReady(answers: DiagnosisAnswers): boolean {
  if (answers.size === "one") return true;
  if (!answers.size || !answers.responsibility) return false;
  if (answers.responsibility === "separated") return true;
  return Boolean(answers.conflict);
}

function effectiveRecommendation(
  profile: ProfileOption,
  conflictPolicy: (typeof CONFLICT_POLICIES)[ConflictChoice] | null,
  appliesPolicy: boolean
): ProfileOption {
  if (!conflictPolicy || !appliesPolicy) return profile;
  return {
    ...profile,
    description:
      profile.id === "full"
        ? "Você escolheu uma regra forte para acúmulos sensíveis. O app recomenda responsabilidades separadas: decisões sensíveis precisam de par independente ou break-glass rastreável."
        : `Você está escolhendo ${profile.label.toLowerCase()} com uma regra específica para acúmulos sensíveis: ${conflictPolicy.label.toLowerCase()}.`,
    appWill: conflictPolicy.appWill,
    appWillNot: conflictPolicy.appWillNot,
    visibleRisks: conflictPolicy.visibleRisks,
    ceremony: conflictPolicy.ceremony,
    enforcement: conflictPolicy.enforcement,
  };
}

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

function DiagnosisQuestion({
  title,
  helper,
  value,
  options,
  onChange,
}: {
  title: string;
  helper: string;
  value?: string;
  options: DiagnosisChoice[];
  onChange: (value: string) => void;
}) {
  return (
    <Box sx={{ display: "grid", gap: 1.25 }}>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {helper}
        </Typography>
      </Box>
      <ResponsiveGrid min={190} gap={1}>
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <OptionCard key={option.id} selected={selected} onClick={() => onChange(option.id)}>
              <Box sx={{ display: "grid", gap: 0.75 }}>
                <Flex align="center" justify="space-between" gap={1}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {option.label}
                  </Typography>
                  {selected ? (
                    <RadioButtonCheckedIcon color="primary" fontSize="small" />
                  ) : (
                    <RadioButtonUncheckedIcon fontSize="small" sx={{ color: "#c2c9c2" }} />
                  )}
                </Flex>
                <Typography variant="caption" color="text.secondary">
                  {option.description}
                </Typography>
              </Box>
            </OptionCard>
          );
        })}
      </ResponsiveGrid>
    </Box>
  );
}

function ProfileDetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <Box sx={{ display: "grid", gap: 0.75 }}>
      <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary" }}>
        {title}
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.25, display: "grid", gap: 0.65 }}>
        {items.map((item) => (
          <Typography
            key={item}
            component="li"
            variant="body2"
            color="text.secondary"
            sx={{ pl: 0.25 }}
          >
            {item}
          </Typography>
        ))}
      </Box>
    </Box>
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
  const router = useRouter();
  const adoption = useMemo(() => deriveAdoption(snapshot), [snapshot]);
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileId>(
    snapshot.profileDeclaration.profile === "full" ? "full" : "compact"
  );
  const [diagnosis, setDiagnosis] = useState<DiagnosisAnswers>({});
  const [manualProfileOpen, setManualProfileOpen] = useState(false);
  const [manualProfileSelected, setManualProfileSelected] = useState(false);
  const [assignments, setAssignments] = useState<RoleAssignments>(DEFAULT_ASSIGNMENTS);
  const [sourceKinds, setSourceKinds] = useState<Record<SourceKindId, boolean>>({
    git: true,
    local: false,
    mono: false,
    svc: false,
    ext: false,
  });
  const [assistant, setAssistant] = useState<AssistantChoice>("local");

  const recommendedProfileId = recommendProfile(diagnosis);
  const recommendedProfile = profileOption(recommendedProfileId);
  const selectedProfile = profileOption(profile);
  const shouldAskResponsibility = Boolean(diagnosis.size && diagnosis.size !== "one");
  const shouldAskConflict = Boolean(
    shouldAskResponsibility && diagnosis.responsibility && diagnosis.responsibility !== "separated"
  );
  const hasRecommendation = recommendationIsReady(diagnosis);
  const canContinueProfileStep = hasRecommendation || manualProfileSelected;
  const conflictPolicy = diagnosis.conflict ? CONFLICT_POLICIES[diagnosis.conflict] : null;
  const shouldShowConflictPolicy =
    Boolean(conflictPolicy) && hasRecommendation && profile === recommendedProfileId;
  const shouldShowManualOverrideNotice =
    Boolean(conflictPolicy) && manualProfileSelected && profile !== recommendedProfileId;
  const effectiveProfile = effectiveRecommendation(
    selectedProfile,
    conflictPolicy,
    shouldShowConflictPolicy
  );
  const authorityIds = useMemo(
    () => new Set(snapshot.authorities.map((authority) => authority.id)),
    [snapshot.authorities]
  );
  const warnings = roleWarnings(assignments, profile, authorityIds);
  const selectedSourceCount = Object.values(sourceKinds).filter(Boolean).length;
  const systems = assistantSystems(snapshot);

  useEffect(() => {
    if (step > 0) markOnboardingPartialIfNeeded();
  }, [step]);

  const updateDiagnosis = (patch: Partial<DiagnosisAnswers>) => {
    let next: DiagnosisAnswers = { ...diagnosis, ...patch };
    if (patch.size && patch.size !== diagnosis.size) {
      next = { size: patch.size };
    }
    if (patch.responsibility && patch.responsibility !== diagnosis.responsibility) {
      next = { ...next, conflict: undefined };
    }
    if (next.size === "one") {
      next = { size: "one" };
    }
    if (next.responsibility === "separated") {
      next = { ...next, conflict: undefined };
    }
    setDiagnosis(next);
    if (!manualProfileSelected && recommendationIsReady(next)) {
      setProfile(recommendProfile(next));
    }
  };

  const catalogHighlights = useMemo(() => {
    const weight = (priority: string) =>
      priority === "P0" ? 0 : priority === "P1" ? 1 : priority === "P2" ? 2 : 3;
    return [...snapshot.integrationCatalog.integrations]
      .sort((a, b) => weight(a.priority) - weight(b.priority) || a.id.localeCompare(b.id))
      .slice(0, 6);
  }, [snapshot.integrationCatalog.integrations]);

  const works: string[] = [
    `Perfil: ${effectiveProfile.label} — cerimônia ajustada à sua realidade`,
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
  if (conflictPolicy) {
    works.push(`Acúmulo de papéis sensíveis: ${conflictPolicy.label} — ${conflictPolicy.review}`);
  }

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

  const finishOnboarding = () => {
    writeOnboardingStatus("finished");
    router.push("/");
  };

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
            Seis passos curtos. Começamos com algumas perguntas para recomendar a cerimônia certa
            para sua realidade — você revisa antes de continuar.
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
              text="Assistente e integrações são opcionais. O framework funciona sem serviços externos; para provar execução e resultados, conecte uma fonte de trabalho local ou versionada."
            />
            <WelcomeCard
              icon={<BalanceIcon />}
              title="Honesto com a sua realidade"
              text="Uma pessoa, time enxuto ou organização com responsabilidades separadas: o app ajusta a cerimônia em vez de fingir independência que não existe."
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
                  title="Como sua organização toma decisões hoje?"
                  lead="Vamos ajustar a cerimônia ao tamanho e à separação real de responsabilidades. Você pode revisar a recomendação antes de continuar."
                />
                <Box sx={{ display: "grid", gap: 2.5 }}>
                  <DiagnosisQuestion
                    title="Quantas pessoas participam das decisões e da execução?"
                    helper="Não precisa ser exato; queremos entender se há gente suficiente para separar papéis."
                    value={diagnosis.size}
                    options={SIZE_CHOICES}
                    onChange={(value) => updateDiagnosis({ size: value as OrgSizeChoice })}
                  />
                  {shouldAskResponsibility ? (
                    <DiagnosisQuestion
                      title="Como as responsabilidades se dividem hoje?"
                      helper="Pense em quem define objetivo, quem executa, quem aprova risco e quem confirma resultado."
                      value={diagnosis.responsibility}
                      options={RESPONSIBILITY_CHOICES}
                      onChange={(value) =>
                        updateDiagnosis({ responsibility: value as ResponsibilityChoice })
                      }
                    />
                  ) : null}
                  {shouldAskConflict ? (
                    <DiagnosisQuestion
                      title="Quando a mesma pessoa acumula papéis sensíveis, o app deve..."
                      helper="Essa resposta define se a governança bloqueia, avisa ou registra com transparência."
                      value={diagnosis.conflict}
                      options={CONFLICT_CHOICES}
                      onChange={(value) => updateDiagnosis({ conflict: value as ConflictChoice })}
                    />
                  ) : null}
                </Box>

                {hasRecommendation || manualProfileSelected ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.25,
                      display: "grid",
                      gap: 1.75,
                      bgcolor: "#f8fbf8",
                      borderColor: "#d9e8dd",
                    }}
                  >
                    <Flex align="center" justify="space-between" gap={1.5} wrap>
                      <Box>
                        <Flex align="center" gap={1} wrap>
                          <Chip
                            size="small"
                            color={
                              manualProfileSelected && !hasRecommendation ? "default" : "success"
                            }
                            label={
                              manualProfileSelected && !hasRecommendation
                                ? "Escolha manual"
                                : manualProfileSelected
                                  ? "Escolha manual"
                                  : "Recomendado"
                            }
                          />
                          <Typography sx={{ fontSize: 18, fontWeight: 800 }}>
                            {effectiveProfile.label}
                          </Typography>
                        </Flex>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {manualProfileSelected &&
                          hasRecommendation &&
                          profile !== recommendedProfileId
                            ? `Recomendação pelas respostas: ${recommendedProfile.label}. Você pode manter sua escolha manual.`
                            : manualProfileSelected && !hasRecommendation
                              ? "Você escolheu manualmente. Responda às perguntas se quiser uma recomendação automática."
                              : effectiveProfile.bestWhen}
                        </Typography>
                      </Box>
                      <Flex gap={1} wrap>
                        {manualProfileSelected &&
                        hasRecommendation &&
                        profile !== recommendedProfileId ? (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setProfile(recommendedProfileId);
                              setManualProfileOpen(false);
                              setManualProfileSelected(false);
                            }}
                          >
                            Usar recomendação
                          </Button>
                        ) : null}
                        <Button
                          size="small"
                          color="inherit"
                          onClick={() => setManualProfileOpen((current) => !current)}
                        >
                          {manualProfileOpen ? "Ocultar opções" : "Ver outras opções"}
                        </Button>
                      </Flex>
                    </Flex>

                    <Typography variant="body2" color="text.secondary">
                      {effectiveProfile.description}
                    </Typography>

                    {shouldShowConflictPolicy && conflictPolicy ? (
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.75,
                          display: "grid",
                          gap: 1,
                          bgcolor:
                            conflictPolicy.severity === "error"
                              ? "#fff5f5"
                              : conflictPolicy.severity === "warning"
                                ? "#fff9ed"
                                : "#eef8ff",
                          borderColor:
                            conflictPolicy.severity === "error"
                              ? "#f3c7c7"
                              : conflictPolicy.severity === "warning"
                                ? "#edd8a8"
                                : "#cce7f8",
                        }}
                      >
                        <Flex align="center" gap={1} wrap>
                          <Chip
                            size="small"
                            color={conflictPolicy.severity}
                            variant="outlined"
                            label="Regra escolhida"
                          />
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>
                            {conflictPolicy.label}
                          </Typography>
                        </Flex>
                        <Typography variant="body2" color="text.secondary">
                          {conflictPolicy.summary}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {conflictPolicy.effect}
                        </Typography>
                      </Paper>
                    ) : null}

                    {shouldShowManualOverrideNotice && conflictPolicy ? (
                      <Alert severity="warning">
                        <strong>Você escolheu um perfil diferente da recomendação.</strong> Pela sua
                        resposta sobre acúmulo sensível, a recomendação automática seria{" "}
                        {recommendedProfile.label}. O perfil manual aplica a regra abaixo:{" "}
                        {selectedProfile.enforcement.text}
                      </Alert>
                    ) : null}

                    <ResponsiveGrid min={210} gap={1.5}>
                      <ProfileDetailList title="O app vai" items={effectiveProfile.appWill} />
                      <ProfileDetailList
                        title="O app não vai"
                        items={effectiveProfile.appWillNot}
                      />
                      <ProfileDetailList
                        title="Riscos visíveis"
                        items={effectiveProfile.visibleRisks}
                      />
                    </ResponsiveGrid>

                    <Flex wrap gap={0.75} align="center">
                      <Typography variant="caption" color="text.secondary">
                        O que isso muda:
                      </Typography>
                      {effectiveProfile.ceremony.map((item) => (
                        <Chip
                          key={item}
                          size="small"
                          label={item}
                          sx={{ bgcolor: "#eaf1ec", color: "#1a5632" }}
                        />
                      ))}
                    </Flex>

                    <Alert severity={effectiveProfile.enforcement.severity}>
                      <strong>{effectiveProfile.enforcement.verb}:</strong>{" "}
                      {effectiveProfile.enforcement.text}
                    </Alert>
                  </Paper>
                ) : (
                  <Alert
                    severity="info"
                    action={
                      <Button
                        size="small"
                        color="inherit"
                        onClick={() => setManualProfileOpen(true)}
                      >
                        Escolher manualmente
                      </Button>
                    }
                  >
                    Comece pelo tamanho da organização. Depois mostramos apenas as perguntas
                    necessárias para chegar a uma recomendação explicada.
                  </Alert>
                )}

                {manualProfileOpen ? (
                  <Box sx={{ display: "grid", gap: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      Escolha manualmente se a recomendação não representar sua organização
                    </Typography>
                    <ResponsiveGrid min={220} gap={1.5}>
                      {PROFILE_OPTIONS.map((option) => {
                        const selected = option.id === profile;
                        return (
                          <OptionCard
                            key={option.id}
                            selected={selected}
                            onClick={() => {
                              setProfile(option.id);
                              setManualProfileOpen(true);
                              setManualProfileSelected(true);
                            }}
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
                  </Box>
                ) : null}
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
                  <Button variant="contained" onClick={finishOnboarding}>
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
                  disabled={step === 1 && !canContinueProfileStep}
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
