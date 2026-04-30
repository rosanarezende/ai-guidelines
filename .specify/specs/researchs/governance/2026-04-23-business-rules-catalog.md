# Research: Catálogo de Regras de Negócio (BR-CLI)

Este documento consolida todas as Regras de Negócio (`[BR-`) identificadas no ecossistema `ai-guidelines`, servindo como matriz de rastreabilidade para a suite de testes BDD da CLI.

## 🏛️ 1. Governança e Sincronização (SYNC)

_Foco: Como os arquivos do framework são injetados e mantidos._

- **[BR-CLI-SYNC-01] Delta Sync**: Copia apenas arquivos alterados (otimização de I/O).
- **[BR-CLI-SYNC-02] SSOT Radical (AGENTS.md)**: Injeção do bloco `ai-guidelines-core` preservando conteúdo local.
- **[BR-CLI-SYNC-03] Integrity Check**: Erro se pastas `rules/` ou `docs/` estiverem ausentes no core.
- **[BR-CLI-SYNC-04] Gitattributes Merge**: Fusão atômica de regras de controle de versão.
- **[BR-CLI-SYNC-05] Smart Prettierignore**: Só injeta se Prettier for detectado e não houver rivais.
- **[BR-CLI-SYNC-06] Methodology Sync**: Sincronização mandatória de `docs/process/`.
- **[BR-CLI-SYNC-07] Rival Guidance**: Orientação clara quando formatadores (Biome/ESLint) são detectados.
- **[BR-CLI-SYNC-08] Monorepo Awareness**: Alerta sobre aplicação apenas na raiz em projetos com workspaces.

## 📦 2. Gestão de Dependências (PKG)

_Foco: Alterações no package.json._

- **[BR-CLI-PKG-01] Rival Abort**: Pula injeção de Prettier se rival detectado (evita conflitos).
- **[BR-CLI-PKG-02] Pure Repo Support**: Cria `package.json` minimalista se inexistente no modo `init`.
- **[BR-CLI-PKG-03] Version Sovereignty**: Não sobrescreve versões de scripts/deps se as do destino forem mais recentes.

## 🪝 3. Automação de Git Hooks (HOOKS)

_Foco: Instalação e gestão do Husky._

- **[BR-CLI-HOOKS-01] Script Dependency**: Só instala hooks se `format`/`check` existirem.
- **[BR-CLI-HOOKS-02] Hook Concatenation**: Adição idempotente de comandos em hooks existentes.
- **[BR-GIT-01..04] Gitattributes Feature**: Implementação técnica de atributos Git (Baseline, Merge, Skip, Idempotência).

## 🚀 4. Integração Contínua (CI)

_Foco: Workflows de GitHub Actions._

- **[BR-CLI-CI-01] Workflow Protection**: Não sobrescreve `.github/workflows/ai-guidelines-ci.yml` customizado.
- **[BR-CLI-CI-02] Environment Auto-detection**: Ajusta YAML para `npm`, `yarn` ou `pnpm` automaticamente.
- **[BR-CLI-CI-03] Pipeline Validity Fallback**: Injeta `echo` se o script de `check` estiver ausente para manter o YAML válido.

## 🛡️ 5. Proteção e Segurança (FS)

- **[BR-CLI-FS-01] Root Block**: Impede inicialização em `/`, `C:\` ou `~`.

## ⌨️ 6. Entrada e UX (INPUT/WIZARD/GUI)

- **[BR-CLI-INPUT-01] Argument Parsing**: Suporte a flags booleanas e valores (`=` ou espaço).
- **[BR-CLI-INPUT-02] Command Validation**: Apenas `init` ou `adopt` são permitidos.
- **[BR-CLI-WIZARD-01] Auto-Wizard**: Inicia prompt se faltarem argumentos em ambiente TTY.
- **[BR-CLI-WIZARD-02] Default Resolution**: Assume `WIZARD_DEFAULTS` no `Enter` vazio.
- **[BR-CLI-WIZARD-03] Retry Loop**: Repete perguntas inválidas indefinidamente no Wizard.
- **[BR-GUI-01..04] Guidance Helpers**: Mapeamento de rivais e monorepos para mensagens de orientação.

## ⚙️ 7. Orquestração (ENG)

- **[BR-CLI-ENG-01] Init Conflict Guard**: Aborta `init` se já houver baseline (evita corrupção).
- **[BR-CLI-ENG-02] Post-Adopt Install**: Oferece `yarn install` automático após mudanças no `package.json`.

---

**Total de Regras Mapeadas:** 36
**Status de Cobertura:**

- Testes Unitários: ~60%
- Testes BDD (BDD Engine): ~15% (Em andamento)
