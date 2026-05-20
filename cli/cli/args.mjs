  "force-prettier",
  "dry-run",
  "install",
  "prune",
  "yes",
  "y",
]);

export function isSupportedMode(mode) {
  return SUPPORTED_MODES.includes(mode);
}

export function printHelp() {
  console.log(`ai-guidelines CLI

Uso:
  yarn guidelines <init|adopt|providers|update|check-budget|workflow|continue> [opcoes]

Comandos:
  init           Cria baseline AI-first em projeto novo
  adopt          Aplica baseline AI-first em repositório existente
  providers      Adiciona ou atualiza arquivos nativos de provider (CLAUDE.md, GEMINI.md,
                 .openai/instructions.md, .cursor/rules/ai-guidelines.mdc, etc.)
  update         Re-aplica provider entrypoints, templates SDD e recompila AGENTS.md a partir
                 do .ai-guidelines/config.json existente (idempotente, headless, não modifica
                 config). Use após atualizar a versão do framework para receber updates
                 de hard-redirect, adapter rules e templates sem reabrir o wizard.
  check-budget   Imprime o relatório de orçamento de tokens (universal, opt-in, AGENTS.md
                 compilado e cada provider entrypoint) com base no rules.json do framework.
  workflow       Wizard contextual da spec ativa: briefing operacional + menu de ações +
                 context bundle copy-paste para sessão IA. Lente operacional governance-first
                 (cf. Spec 0023). Não embute LLM; AI-as-Channel preservado (ADR 0018).
  continue       Atalho de workflow: imprime briefing + próxima ação registrada em state.yml.
