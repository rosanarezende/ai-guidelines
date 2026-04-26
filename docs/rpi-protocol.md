# Protocolo RPI: Framework Universal para Agentes de IA

O framework **RPI (Research, Plan, Implement)** é o padrão de engenharia obrigatório para todos os agentes de IA (assistentes virtuais, extensões de IDE ou sistemas autônomos) operando neste ecossistema.

---

## 1. O Ciclo de Desenvolvimento

### 🔍 Research (Pesquisa)

O agente deve mapear o estado atual antes de qualquer ação destrutiva.

- **Ferramentas Agentes / IDE (Antigravity, Claude Code)**: use o comando de inspeção de contexto da ferramenta (ex: `/memory show`) e ferramentas de busca nativas.
- **Cursor/VS Code**: Use `@workspace` e indexação de arquivos.
- **Copilot**: Use `#file` para restringir o contexto ao problema real.

### 📋 Plan (Planejamento)

Transformar a pesquisa em uma estratégia técnica aprovada.

- **Ação**:
  - Para iniciativas relevantes: criar fundação documental em `.specify/specs/<slug>/` (`spec.md`, `plan.md`, `tasks.md`, `NEXT.md` quando aplicável).
  - Para tarefas pequenas: manter um plano leve fora do versionamento do repositório (na própria ferramenta/agente).
- **Prime Directive**: Aplica-se aqui o Phase 0 do `AGENTS.md` — o repositório é sua memória. Consulte `AGENTS.md` para detalhes de persistência em `.specify/specs/`.

### 🏗️ Implement (Implementação)

Execução técnica e atômica do plano acordado.

- **Ação**: Edição de código, criação de arquivos e execução de testes.
- **Foco**: O agente deve seguir estritamente o escopo do plano para evitar alucinações ("Scope Creep").
- **Exceção de Automação (VLAEG)**: Quando o foco da implementação for a criação de um backend ou automação robusta (usando ferramentas como CLI agents, n8n ou MCPs complexos), o agente **DEVE** seguir a subdivisão **VLAEG**:
  1. **Visão**: Entender o problema macro e qual dado será trafegado.
  2. **Link**: Estabelecer a autenticação e conexões entre nós.
  3. **Arquitetura**: Montar a fundação estrutural do fluxo.
  4. **Estilo**: Refinar formatações de saída.
  5. **Gatilho**: Definir eventos, webhooks ou agendamentos cron.

### Quando usar spec-foundation vs plano leve

Critério objetivo de escolha no passo **Plan**:

- Use **spec-foundation** (`.specify/specs/<slug>/`, versionado) quando **qualquer uma** for verdade:
  - A iniciativa estima **mais de uma sessão** de trabalho.
  - **Toca mais de um arquivo** fora de uma feature isolada.
  - O resultado precisa **sobreviver a troca de IA, sessão ou colaborador**.

- Use **plano leve** (scratchpad na ferramenta, fora do versionamento) quando **todas** forem verdade:
  - Ajuste pontual cabe em **uma única sessão**.
  - Escopo **local a um arquivo** ou unidade lógica isolada.
  - Nenhum handoff futuro depende do plano escrito.

Implementação canônica de spec-foundation (lifecycle, templates, checklists de abertura/fechamento): ver `docs/process/spec-foundation.md`.

---

## 2. Padrão de Resiliência (Context & State Hydration)

Para garantir que o progresso seja persistente mesmo entre diferentes sessões ou trocas de ferramentas (ex: começar no Antigravity ou Claude Code e terminar no Cursor):

1.  **Memória persistente no repositório**: Quando a iniciativa merecer continuidade, o estado ativo deve viver em `.specify/specs/<slug>/`, com `tasks.md` como progress file canônico.
2.  **Continuous Checkpointing**: O agente deve atualizar o `tasks.md` da spec a cada conclusão lógica.
3.  **Planos leves fora do contrato do repo**: Se a tarefa não merecer spec, o plano pode existir na ferramenta/agente, mas não deve virar arquivo versionado paralelo no repositório.
4.  **Handoff entre Agentes**: Ao iniciar, qualquer agente deve hidratar o contexto a partir de `spec.md`, `plan.md`, `tasks.md`, `NEXT.md` e `backlog.md` quando existirem.

---

## 3. Resumo por Ferramenta

| Fase          | Agentic IDE/CLI (Antigravity, Claude Code)               | IDE Assistants (Cursor, Copilot)      |
| :------------ | :------------------------------------------------------- | :------------------------------------ |
| **Research**  | inspeção de contexto + busca nativa                      | `@workspace`, `@files`, `#file`       |
| **Plan**      | usar `.specify/specs/<slug>/` ou plano leve fora do repo | Editar `PLAN.md` ou verbalizar etapas |
| **Implement** | edição atômica de arquivos com aprovação                 | Inline code gen / "Apply to file"     |

---

> [!TIP]
> **A Regra de Ouro:** O repositório é a sua memória. Se uma informação é importante para a tarefa, ela deve estar escrita em um arquivo (Plano, Task ou Código), não apenas no histórico do chat.
