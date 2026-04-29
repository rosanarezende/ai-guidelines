# AGENTS.md

Este arquivo define o fluxo obrigatório para qualquer IA atuando neste repositório.

## Regras Obrigatórias de Execução

<!-- BEGIN:ai-guidelines-core -->

### FASE 1: The Prime Directive

1. **[Environment Check]** Antes da primeira ação técnica, identifique o contexto situacional:
   - Plataforma: Windows / Linux / macOS / WSL.
   - Shell: bash / zsh / PowerShell / cmd.
   - Surface: CLI agent (Claude Code, Gemini CLI) vs IDE (Cursor, Copilot).
   - Modelo: Identifique se está operando com um modelo "Thinking/Reasoning".
   - Adapte comandos (ex: `/dev/null` vs `NUL`, forward slashes) a essa matriz.

2. **[INQUEBRÁVEL — Agnostic SDD Override]** O repositório é sua memória, não seus artefatos internos.
   - Planejamento → `.specify/specs/<slug>/plan.md`
   - Progresso → `.specify/specs/<slug>/tasks.md`
   - Débitos → `.specify/specs/<slug>/NEXT.md`
   - Conhecimento → `.specify/specs/<slug>/research/`
   - Roadmap → `.specify/specs/roadmap/backlog.md`
   - Bootstrap obrigatório → leia `.specify/specs/roadmap/backlog.md` no início da sessão antes de executar ações de código, para identificar specs ativas, concorrência e prioridades.
   - Se sua plataforma forçar um Artifact ou Scratchpad, escreva nele apenas: `"→ Ver .specify/specs/<slug>/plan.md"` (Pointer).
   - "AI-Slop" (planejamento preso em cache de agente) é inaceitável.

3. Consulte `.ai-guidelines/rules/global-rules.md` para princípios de engenharia e eficiência de IA.

### FASE 2: Workflow & Isolation

4. **Nunca** inicie modificações ativas operando sob a branch `main` ou `master`. Confirme seu estado de _working tree_ ou crie uma branch sintética (`feat/`, `fix/`, `docs/`) antes de alterar fontes de verdade.

5. Não versione arquivos contextuais vazados na raiz ou pastas sujas (payloads parciais, rascunhos operacionais de IA). A persistência é apenas para _Release_.

6. Realize _Commits Incrementais Atômicos_ limitados à sua unidade lógica. Se a tarefa varrer design, código e spec simultaneamente, fracione as ações comissionadas em passos menores.

### FASE 3: Quality Gates

7. **[CI Compliance — HARNESS LOCK]** É terminantemente proibido submeter qualquer commit sem validar a cadeia de qualidade do projeto. Antes de `git commit`, execute **todos os scripts de validação** definidos no `package.json` do repositório (ex: `format`, `check`, `lint`, `test`). O padrão canônico é:

   ```
   <format_cmd> ; <check_cmd> ; git add . ; git commit -m "..."
   ```

   Se o repositório define `yarn format` e `yarn check`, o comando concreto é: `yarn format ; yarn check ; git add . ; git commit -m "..."`. Adapte aos scripts do projeto — a regra é a **cadeia**, não o gerenciador.

8. A submissão de Pull Requests obrigatoriamente se inaugura no modo `Draft`, utilizando integralmente a matriz `.github/pull_request_template.md`.

9. Converta a operação de `Draft` para `Ready` apenas através da revalidação afirmativa Humana.

### FASE 4: Communication & Agility

10. **Aja apenas mediante Plano Formado.** Antes de executar qualquer código, escolha a granularidade:

    | Critério      | Use `spec-foundation`                 | Use `plano leve`                          |
    | ------------- | ------------------------------------- | ----------------------------------------- |
    | Duração       | > 1 sessão                            | 1 sessão                                  |
    | Escopo        | > 1 arquivo fora de feature isolada   | Ajuste pontual, local                     |
    | Sobrevivência | Precisa sobreviver troca de IA/sessão | Descartável                               |
    | Onde vive     | `.specify/specs/<slug>/` (versionado) | Scratchpad da ferramenta (não versionado) |

11. **Checkpoints antes de ação.** Após absorver contexto extenso (múltiplos arquivos, specs, pesquisas), retorne um Checkpoint resumido e peça aprovação humana **antes** de executar Code Actions.

12. **Artefatos vivos.** Mantenha atualizados os artefatos SDD durante o trabalho:
    - `tasks.md` → marque cada item como `[/]` (em progresso) ou `[x]` (concluído) a cada passo.
    - `NEXT.md` → registre débitos, bugs ou insights sem prioridade imediata.
    - **Nunca crie arquivos paralelos de roteirização.** Planos leves vivem na ferramenta, não no repositório.

<!-- END:ai-guidelines-core -->
