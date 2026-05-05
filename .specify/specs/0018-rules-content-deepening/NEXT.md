# NEXT — Débitos e Insights Spec 0018

> **Política:** este arquivo registra débitos conscientes, bugs identificados, insights sem prioridade imediata ou **tasks que vazaram do escopo da spec e serão resolvidos em specs futuras**. Será **deletado ao final da Spec 0018** (Fase 7 — Encerramento Pré-Merge), com itens migrados para `roadmap/backlog.md` conforme prioridade.
>
> **Diferença crítica:**
>
> - **Débitos a resolver NESTA spec (mesmo se não planejados):** ficam em `tasks.md` como sub-tasks de algum bloco existente, marcadas `[/]` (em progresso) com nota "_Pendente de commit_".
> - **Débitos a resolver em OUTRA spec futura:** ficam aqui em `NEXT.md` até o encerramento.
>
> Esta diferença não está documentada em `.core/process/spec-foundation.md` — vide **Débito A.7** abaixo.
>
> Criado: 2026-05-03 (durante Bloco B — sub-bloco B.3.2).

---

## 📝 Débitos Abertos

### Débito A.7 — Documentação: diferença entre débitos NEXT.md vs tasks.md em spec-foundation.md

**Origem:** identificado durante B.3.2 Green Phase (2026-05-03)  
**Constatado:** NEXT.md e tasks.md têm papéis que não estão explícitos em `spec-foundation.md`  
**Prioridade:** Média  
**Tipo:** Documentação de clarificação em `.core/process/spec-foundation.md`

**Descrição:**

A política _implícita_ desta spec é:

- Débitos/insights a resolver **nesta spec**, mesmo que não previstos originalmente → `tasks.md` (com subtasks vinculadas a um bloco existente)
- Débitos/insights a resolver **em specs futuras** ou que vazaram do escopo → `NEXT.md` (para migração em Fase 7)

Esta diferença não está explícita em `spec-foundation.md`, seção "Artefatos de Spec". Causa fricção ao tentar decidir "onde anoto este débito?".

**Proposta:**

Adicionar à seção "Política de NEXT.md" em `spec-foundation.md`:

> **Débitos desta spec vs Débitos de specs futuras:**
>
> - Se surge durante implementação um item que **será resolvido antes de Fase 7** (Encerramento Pré-Merge), anote em `tasks.md` como sub-task do bloco apropriado, com status `[/]` (_Pendente de commit_) e nota inline.
> - Se é um **débito consciente fora do escopo**, anotar em `NEXT.md` para decisão futura (Fase 7 migra para `roadmap/backlog.md`).
> - Checklist: "Se este item vai ser resolvido ANTES do merge desta spec? Sim → `tasks.md`. Não → `NEXT.md`."

**Onde vive:**

- Adicionar a `agents-core.md` como `[CORE-14]` após `[CORE-13]`
- Será injetado em B.3.5 (compiler refactor)
- Hoje não está injetado (catálogo paralelo)

**Task associada:**

- [x] Criar `[CORE-14]` em `agents-core.md`
- [ ] Validar schema YAML
- [ ] Cravar `_TODO in CORE-13` referenciando B.4 (ligação bidirecional)
- [ ] Testar injeção em B.3.5
