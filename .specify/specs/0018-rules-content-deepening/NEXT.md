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

### ~~Débito B.4 — Nova regra `[CORE-14]` para gate de commit~~

**[RESOLVIDO]** — Implementado em commit: `feat(spec-0018): adiciona [CORE-14] gate de commit message protocol`

**Origem:** `[CORE-08]` § "Débito B.4 (cravado em B.2 — 2026-05-03)"  
**Constatado:** 2026-05-03 durante implementação de `rules-parser.mjs` (B.3.2 Green Phase)  
**Prioridade:** Alta  
**Tipo:** Nova regra no `agents-core.md` (categoria: `process`, scope: `universal`)

**Descrição:**

Regra nova consolidando o padrão que emergiu durante B.3.2: **ao concluir um sub-bloco, IA fornece APENAS a mensagem sugerida do commit; humano executa a cadeia `yarn format ; yarn check ; git add . ; git commit`**.

**Justificativa:**

- Economiza ~200–300 tokens por commit (IA não roda validações, não executa git)
- Bloqueia IA de operar git autonomamente (força gate humano explícito em `[CORE-07]`)
- Delega responsabilidade de CI/formating ao mantenedor
- Alinha com postura de `[CORE-07]` (push explícito) e `[CORE-08]` (HARNESS LOCK)

**Proposta de `[CORE-14]`:**

```yaml
id: CORE-14
scope: universal
category: process
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [core, agents, always_injected, git, commit, safety]
```

**Instruction (en):**
At the end of each sub-block, provide only the commit message suggestion. The human executes the full validation chain (`yarn format ; yarn check ; ...`) and `git commit`.

**Documentação (pt-br):**
Ao concluir um sub-bloco, IA fornece **apenas** a mensagem sugerida do commit (`feat(spec-XXXX): ...`). O humano executa a cadeia completa de validação (`yarn format ; yarn check ; git add . ; git commit -m "..."`).

**Why this matters:** economiza tokens e impede IA de operar git autonomamente. Honra `[CORE-07]` (push) e `[CORE-08]` (HARNESS LOCK).

**Onde vive:**

---

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
