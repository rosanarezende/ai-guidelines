# Benchmark: Agentic Planning Modes & Artifact Management

**Data:** 2026-04-21
**Tema:** Como as principais ferramentas de IA para engenharia de software gerenciam o ciclo de planejamento e por que o "Hybrid Override" é a melhor prática para o `ai-guidelines`.

## 1. O Problema Sistêmico (Scratchpads Efêmeros)

Todas as plataformas modernas de IA (Agentic IDES e CLI Agents) dividem as tarefas complexas em uma camada de Raciocínio (Planning) e Execução. O efeito colateral nativo dessa arquitetura é o vazamento de planejamento:

- A IA deduz o plano em artefatos internos, "scratchpads" transitórios, ou `.plan.md` invisíveis.
- Isso marginaliza métodos ágeis legados (Jira, Trello) e fere o repositório como Single Source of Truth (Spec-Driven Development / SDD).

## 2. Abordagens por Plataforma

### A) Cursor (Composer & Plan Mode)

- **Comportamento:** O Cursor Composer utiliza um UI robusto para analisar múltiplas dependências. O planejamento acontece visualmente e, na maioria das vezes, evapora quando a sessão é fechada (se não exportado pelo humano).
- **Mitigação da Comunidade:** Usuários avançados forçam o Cursor via `.cursorrules` a depositar pensamentos prévios em pastas dedicadas ao repositório, atestando conformidade com a arquitetura do projeto.

### B) Aider (Architect Mode)

- **Comportamento:** Extremamente fiel ao terminal. No modo arquiteto, ele prefere descrever a modelagem do código no chat ou criar um histórico persistido em repositório secreto (`.aider.chat.history.md`) focado em log e rollback.
- **Mitigação da Comunidade:** Devido ao forte viés de Git, devs instruem o Aider pelo System Prompt a usar especificações locais (`spec.md`) como norte direcional.

### C) GitHub Copilot (Workspace, Chat e CLI)

- **Comportamento:** A família Copilot incentiva fortemente o "Planning Mode". O Copilot CLI possui o comando `/plan` embutido no ciclo `Shift+Tab`, enquanto o Workspace usa sessões interativas de _brainstorming_ em scratchpads nativos da IDE.
- **Ausência de Configuração Bruta:** Uma pesquisa profunda nas documentações da Microsoft/GitHub comprova que **não existem chaves de configuração (ex: no `.vscode/settings.json` ou `config.json`) para desativar permanentemente o modo de planejamento**. A arquitetura depende estritamente do engajamento do usuário.
- **Mitigação Universal:** A única forma de impedir fragmentação é utilizar as Custom Instructions da IDE (se disponíveis) ou o `AGENTS.md` canônico para exigir que o Copilot documente decisões críticas fora dos scratchpads efêmeros.

### D) Claude Code / CLI da Anthropic

- **Comportamento:** Autonomia agressiva de refatoração no terminal. Guarda seu chain-of-thought interno e context logs em `.claude/`.
- **Mitigação da Comunidade:** Regras canônicas (`CLAUDE.md`) definem estritas barreiras de onde ler as especificações do frontend versus onde salvar.

### E) Gemini CLI (Antigravity / Google)

- **Comportamento:** Possui nativamente um rigoroso esquema de validação dupla: um "Planning Mode" mandatório (`request_feedback = true`) que engatilha a obrigatoriedade da geração física de um "Artifact" temporário (ex: `implementation_plan.md`) na pasta da engine (`~/.gemini/antigravity/brain/...`).
- **Dissonância Configural:** Assim como no Copilot, não há flag mágica no `.geminirc` ou `mcp_config` que permita desativar a máquina de estados de planejamento. É inegociável contornar a regra rígida do agente.

## 3. Conclusão Aplicada: A Supremacia do "Agnostic SDD Override"

Em um ecossistema agnóstico (onde um dev usa Cursor, outro usa Copilot Workspace e outro usa o Gemini CLI), **toda tentativa de gerir estado via arquivos de configuração específicos da ferramenta falhará em escala**.

**Solução Híbrida (Recomendada pela Engenharia RPI):**
Usar "System Prompts Militares" (`AGENTS.md` com hierarquia Phase 0 a 3) para "hackear" a rotina da IA em tempo de execução. A **Prime Directive** deve ditar:
_"Toda inteligência e checklist de execução deve ser escrito fisicamente na estrutura canônica (`.specify/specs/`). Se sua plataforma não tiver configuração para desativar scratchpads ou o forçar a usar um Artifact sistêmico (como no Gemini CLI ou Copilot Workspace), você deve preencher este artefato nativo ESTritamente como um redirecionador, apontando para os arquivos do repositório físico."_
Isso garante auditabilidade total, portabilidade entre devs usando Cursor ou Anthropic, e respeito rigoroso (0% blind spot) ao repositório.
