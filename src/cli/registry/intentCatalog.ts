import { Intent } from "./Intent.js";

/**
 * Catálogo CURADO de Intents — SSOT da navegação humana (Spec 0024).
 *
 * Editorial: títulos, ordem e a escolha das invocações são juízo de produto/UX,
 * NÃO derivação. Referencia comandos do Registry por nome (FK); o `intent:check`
 * garante integridade referencial. Cresce com a curadoria; não é gerado.
 */
export const INTENT_CATALOG: readonly Intent[] = [
  {
    id: "retomar-trabalho",
    title: "Retomar trabalho",
    actions: [
      { command: "continue", label: "Retomar de onde parei (briefing + próximo passo)" },
      { command: "handoff", label: "Gerar handoff situado para nova sessão IA" },
      { command: "insight", args: ["list"], label: "Ver percepções recentes" },
    ],
  },
  {
    id: "resolver-feedback-de-pr",
    title: "Resolver feedback de um PR",
    actions: [{ command: "triage", label: "Triar comentários de review do PR" }],
  },
  {
    id: "registrar-percepcao",
    title: "Registrar uma percepção em trânsito",
    actions: [
      { command: "insight", args: ["add"], label: "Adicionar uma percepção" },
      { command: "insight", args: ["list"], label: "Listar percepções abertas" },
    ],
  },
  {
    id: "preparar-release",
    title: "Preparar um release",
    actions: [{ command: "release-prep", label: "Preparar release (bump de versão + tag)" }],
  },
  {
    id: "inspecionar-specs-ativas",
    title: "Inspecionar specs ativas",
    actions: [
      { command: "specs", label: "Ver specs ativas (índice público)" },
      { command: "drift", label: "Diagnosticar drift do índice" },
    ],
  },
  {
    id: "gerar-prompt-visual",
    title: "Gerar um prompt visual",
    actions: [
      {
        command: "visual-prompt",
        label: "Gerar prompt visual (para gerador de imagem externo)",
      },
    ],
  },
];

/**
 * Comandos deliberadamente FORA da navegação humana — não geram warning de
 * cobertura no `intent:check`. Esta lista é decisão da camada de NAVEGAÇÃO (não
 * do Command, que segue puro). Default: tudo é esperado navegável; aqui ficam as
 * exceções explícitas (shell/diagnóstico/internos).
 */
export const NON_NAVIGABLE_COMMANDS: readonly string[] = [
  "adopt", // bootstrap/distribuição; fica no help operacional, não na navegação de trabalho
  "check-budget", // diagnóstico técnico de orçamento
  "init", // bootstrap/distribuição
  "providers", // bootstrap/distribuição
  "update", // bootstrap/distribuição headless
  "workflow", // é o próprio shell humano (entrada), não um destino de Intent
];
