# NEXT — Spec 0019 Bootstrap Consumidor e Runtime

> **Arquivo de acompanhamento contínuo.** Instanciado **sempre** no setup da spec.
> Ao final de cada fase, registre aqui apenas itens que **extrapolem o escopo**
> desta spec e precisem sobreviver até o encerramento. Se a pendência será
> resolvida antes do merge desta própria spec, ela deve ir para o `tasks.md`.
> **DELETADO no encerramento pré-merge** (fase final do `tasks.md`); itens relevantes
> migram antes para `.specify/specs/roadmap/backlog.md` ou viram issues.
>
> Fonte: `.core/process/spec-foundation.md` — política de NEXT.md.

---

## 🏛️ Débitos Adiados

> Débitos conscientes (refactors postergados, edge cases não cobertos, riscos não mitigados). Subdivididos pela fase em que foram gerados.

### Débitos da Fase 0

_(Nenhum débito registrado ainda)_

### Débitos da Fase 1

_(Nenhum débito registrado ainda)_

### Débitos da Fase 2

_(Nenhum débito registrado ainda)_

### Débitos da Fase 3

_(Nenhum débito registrado ainda)_

---

## 💡 Insights e Descobertas

> Insights técnicos, discussões ricas ou ideias de features que apareceram durante a execução, mas estão claramente fora do escopo atual.

### 1. Providers nativos e adapters do monólito não são a mesma abstração

- **O Contexto**: a decisão `[DEC-0019-B01]` amplia o bootstrap para arquivos nativos de ferramentas como Cursor, Copilot e Windsurf, enquanto o catálogo atual de regras do runtime só possui adapters `claude`, `codex` e `gemini`.
- **O Insight**: separar `providers` de `adapters` reduz acoplamento e permite ampliar hard-redirects sem inflar o catálogo semântico do `AGENTS.md`.
- **Ação Sugerida**: manter essa distinção como base para futuras expansões de providers e eventual catálogo dedicado de adapters se o framework passar a ter regras específicas para Cursor/Windsurf/Aider.

<!-- Template de Insight:
### 1. [Título do Insight]

- **O Contexto**: descrição rápida de onde/como surgiu.
- **O Insight**: a ideia, nova abordagem ou arquitetura possível.
- **Ação Sugerida**: para onde vai (ex: Spec XYZ, `roadmap/backlog.md`, ou Issue).
-->

---

## ✂️ Itens descartados deliberadamente

> _Subseção opcional._ Incluir apenas se algo foi **avaliado e explicitamente
> rejeitado** durante a spec, com rationale que evita re-discussão futura. A
> maioria das specs não precisa desta subseção — a justificativa de não-fazer
> já vive em `spec.md` § "Fora do escopo".

_(Nenhum item descartado ainda)_
