# AGENTS.md

> **[MANDATÓRIO — HARNESS LOCK]** É proibido rodar `git commit` isoladamente. Toda submissão deve obrigatoriamente usar a cadeia: `yarn format ; yarn check ; git add . ; git commit -m "..."`.

Este arquivo define o fluxo obrigatório para qualquer IA atuando neste repositório.

> **Atuando para um humano contribuidor?** Leia também
> [`CONTRIBUTING.md`](CONTRIBUTING.md) para os 4 workflows por persona
> (ajuste rápido, feature/refactor, spec consolidada, agente IA com
> autonomia). Este `AGENTS.md` cobre a parte operacional do agente;
> `CONTRIBUTING.md` cobre o fluxo humano que o agente está apoiando.

## Regras Obrigatórias de Execução

<!-- BEGIN:ai-guidelines-core -->

### PHASE 0: The Prime Directive

0. **[Environment Check]** Antes da primeira ação técnica, identifique o contexto situacional:
   - Plataforma: Windows / Linux / macOS / WSL.
   - Shell: bash / zsh / PowerShell / cmd.
   - Surface: CLI agent (Claude Code, Gemini CLI) vs IDE (Cursor, Copilot).
   - Modelo: Identifique se está operando com um modelo "Thinking/Reasoning".
     Adapte comandos (ex: `/dev/null` vs `NUL`, forward slashes) a essa matriz.

1. **[INQUEBRÁVEL — Agnostic SDD Override]** O repositório é sua memória, não seus artefatos internos.
   - Planejamento → `.specify/specs/<slug>/plan.md`
   - Progresso → `.specify/specs/<slug>/tasks.md`
   - Débitos → `.specify/specs/<slug>/NEXT.md`
   - Conhecimento → `.specify/specs/<slug>/research/`
   - Roadmap → `.specify/specs/roadmap/backlog.md`
   - Se sua plataforma forçar um Artifact ou Scratchpad, escreva nele apenas: `"→ Ver .specify/specs/<slug>/plan.md"` (Pointer).
   - "AI-Slop" (planejamento preso em cache de agente) é inaceitável.
2. Consulte `.core/rules/global-rules.md` para princípios de engenharia e [Economia de Tokens](docs/ai-efficiency-guide.md).

### PHASE 1: Workflow & Isolation

2. **Nunca** inicie modificações ativas operando sob a branch `main` ou `master`. Confirme seu estado de _working tree_ ou crie uma branch sintética (`feat/`, `fix/`, `docs/`) antes de alterar fontes de verdade.
3. Não versionar arquivos contextuais vazados na raiz ou pastas sujas (payloads parciais, rascunhos operacionais de IA). A persistência é apenas para _Release_.
4. Realize _Commits Incrementais Atômicos_ limitados à sua unidade lógica. Se a tarefa varrer design, código e spec simultaneamente, fracione as ações comissionadas em passos menores.

### PHASE 2: Quality Gates & TDD

5. **[CI Compliance — HARNESS LOCK]** É terminantemente proibido submeter qualquer commit sem validar a cadeia de qualidade. Você DEVE encadear os comandos preventivamente: `yarn format ; yarn check ; git add . ; git commit -m "..."`. A falha nesta sequência é considerada quebra de governança crítica.
6. A submissão de Pull Requests obrigatoriamente se inaugura no modo `Draft`, utilizando integralmente a matriz `.github/pull_request_template.md`.
7. Converta a operação de `Draft` para `Ready` apenas através da revalidação afirmativa Humana.

### PHASE 3: Communication & Agility

8. Aja apenas mediante **Plano Formado**. Escolha a granularidade conforme a iniciativa:
   - **spec-foundation** (`.specify/specs/<slug>/`, versionado): use quando a iniciativa estima mais de uma sessão, toca mais de um arquivo fora de uma feature isolada, ou quando o resultado precisa sobreviver a troca de IA/sessão.
   - **plano leve** (scratchpad da ferramenta, não versionado): use para ajustes pontuais de escopo local, contidos em uma sessão.

   Retorne _Checkpoints_ após absorções extensas contextuais pedindo aprovação antes de executar _Code Actions_.

9. Utilize os artefatos vivos em `.specify/specs/<slug>/` nativamente, atualizando o `tasks.md` da spec corrente a cada degrau operado positivamente ou o `NEXT.md` quando surgirem débitos ou bugs sem prioridade imediata. **Nunca crie arquivos paralelos de roteirização**: planos leves vivem na ferramenta, não no repositório.
<!-- END:ai-guidelines-core -->
