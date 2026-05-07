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

### 2. Ciclo de vida de atualização dos `.specify/templates` distribuídos

- **O Contexto**: a partir da 0019, a CLI passa a copiar `.specify/templates/` para `.ai-guidelines/templates/` no consumidor durante `init`/`adopt`. Hoje não há contrato explícito de versionamento nem caminho oficial de update — se o framework atualizar um boilerplate (ex.: `tasks-mixed-boilerplate.md`), o consumidor só recebe a mudança rerodando `adopt`, o que sobrescreve customizações locais sem aviso.
- **O Insight**: distribuir templates sem estratégia de update cria drift do dia 1 — espelha o problema de "Context Rot" que a 0019 resolveu para providers, mas agora no eixo temporal. Decisões em aberto: (a) versionamento dos templates (semver no `config.json` por template ou hash global?); (b) política de update (overwrite vs. merge inteligente vs. diff interativo); (c) detecção de customização local do consumidor; (d) comando `update`/`sync` dedicado vs. flag em `adopt`; (e) notificação de updates disponíveis (cross-ref item oportunista "Check de Atualização interino no CLI").
- **Ação Sugerida**: nova spec `evidence-driven` candidata `template-lifecycle-e-update` no backlog (seção Next). Não cabe ampliar a 0019 — ela está `In Review` com gate fechado e princípio de imutabilidade ativo. Workaround temporário até a nova spec entregar: rerodar `yarn cli adopt` aceitando overwrite.

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
