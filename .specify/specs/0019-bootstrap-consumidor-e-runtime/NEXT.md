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

### 2. ~~Ciclo de vida de atualização dos `.specify/templates` distribuídos~~ — **Absorvido pelo sub-bloco C da própria 0019**

- **Status**: resolvido dentro do escopo da spec após reabertura consensuada (2026-05-07).
- **O Contexto original**: a primeira implementação distribuía `.specify/templates/` sem contrato de update, e `providers --prune` propagava prune para o destino, com risco de regressão silenciosa de dados.
- **Resolução**: política unificada `managed-block` (trampolins/ignores) + `mirror` (templates SDD), com comando `update` dedicado lendo `config.json` existente. Ver decision-brief, bloco C e plan.md, sub-bloco C.

### 3. Notificação proativa de updates disponíveis no CLI

- **O Contexto**: a 0019 entrega a infraestrutura de update determinístico (managed-block + comando `update`), mas não o sensor que avisa quando atualizar — consumidor só descobre que tem update se rodar manualmente.
- **O Insight**: um sensor leve no startup do CLI (consulta GitHub releases ou hash do bundle distribuído via npm na 0006) pode imprimir "📦 ai-guidelines vX.Y disponível, rode `yarn cli update`". Decisões em aberto: (a) cache de TTL para evitar request a cada invocação; (b) opt-out via env var; (c) acoplamento com 0006 (publicação npm = fonte de verdade do "latest").
- **Ação Sugerida**: permanece como item oportunista no `roadmap/backlog.md` ("Check de Atualização interino no CLI"). Pré-requisito natural: 0006 mergeada para ter um endpoint estável de "latest version". Pode virar mini-spec ou ser absorvida pela 0006.

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
