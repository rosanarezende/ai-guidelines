<!-- ai-guidelines-template: next-boilerplate v=1 -->

# NEXT — Spec 0022 CLI Runtime Cutover (DDD + TDD + BDD)

> **Status:** Paused — Stage A (Discovery). Aguardando lifecycle metodológico novo (Spec 0023).
>
> **Arquivo de acompanhamento contínuo.** Instanciado **sempre** no setup da spec.
> Ao final de cada fase, registre aqui apenas itens que **extrapolem o escopo**
> desta spec e precisem sobreviver até o encerramento. Se a pendência será
> resolvida antes do merge desta própria spec, ela deve ir para o `tasks.md`.
> **DELETADO no encerramento pré-merge** (fase final do `tasks.md`); itens relevantes
> migram antes para `.specify/specs/roadmap/backlog.md` ou viram issues.
>
> Fonte: `.core/process/governance-foundation.md` — política de NEXT.md.

> 📌 **Nota editorial — sessão 2026-05-18**
>
> Os artefatos `plan.md` e `tasks.md` desta spec foram **arquivados** (`plan.archived.md`, `tasks.archived.md`) durante a sessão de recalibração metodológica que originou também a Spec 0023. O `spec.md` e o `decision-brief.md` permanecem **com avisos editoriais** indicando que carregam framing pré-discovery (ver cabeçalhos daqueles arquivos).
>
> A 0022 permanece **viva em Stage A (Discovery)** mas seu próximo passo só pode acontecer **depois** que a Spec 0023 (Governance Workflow & Discovery Model) entregar o novo lifecycle metodológico e o conceito de `research.md`. Sem isso, qualquer trabalho aqui reproduziria o mesmo problema (planning prematuro sob framing herdado AI-first/CLI-first).

---

## 🏛️ Débitos Adiados

### Débitos da Fase 0 (Setup)

_(Nenhum débito registrado ainda)_

### Débitos da Fase 1 (Stage 1 + Gate)

_(A preencher após o gate humano)_

### Débitos das Fases 2-6 (Sub-PRs do Harness Lock)

_(A preencher durante a execução de cada sub-PR)_

---

## 💡 Insights e Descobertas

### 1. Cutover arquitetural vs cutover de-arrumação — origem desta spec

- **O Contexto**: sessão 2026-05-18 com Rosana Rezende e Claude Code. A primeira tentativa de spec 0022 (PR #15, branch `feat/spec-0022-cli-runtime-relocation`) propôs cutover "de-arrumação" — `git mv cli src/cli` sem refatorar conteúdo, com escopo de 1-2 dias. A owner vetou o escopo invertido: a 0022 existe justamente para **eliminar a duplicação arquitetural**, não para mover paths preservando o mesmo runtime mjs duplicado.

- **O Insight**: a tentação de "atalho cirúrgico" durante sessões de design pode trair o objetivo da spec. O move-only resolve um problema visual ("duas pastas") mas não o problema real (`cli/` mjs e `src/` DDD coexistem como dois runtimes paralelos). Lição aplicada: a Spec 0022 v2 (esta) nasce com escopo arquitetural completo e Harness Lock multi-PR (5 sub-PRs estimados) — aceita prazo maior para entregar a coerência real.

- **Ação Sugerida**: registrar como exemplo prático no insight "Como lidar quando o NEXT.md infla demais" da Spec 0021 (já feito — referência cruzada no `NEXT.md` da 0021, sub-bloco 4.C.[SANITIZE-NEXT] + adendo em commit `1e1ae35`). Padrão a evitar em specs futuras: quando o owner pedir "spec rápida" para um débito grande, verificar se a restrição de prazo está dobrando o escopo abaixo do problema real — se sim, propor decompor em Harness Lock ou aumentar prazo.

### 2. Como lidar quando o NEXT.md infla demais e empurra itens "com a barriga" entre fases

- **Referência**: este insight nasceu na Spec 0021 (NEXT.md, sub-bloco 4.C.[SANITIZE-NEXT]) e originou a presente Spec 0022. Cross-ref completo no `NEXT.md` da 0021. Aqui registrado apenas como ponteiro porque a 0022 é precedente concreto.
- **Ação Sugerida**: candidato a meta-spec dedicada — slug provisório `next-md-hygiene-rituals`. Escopo na 0021 § Insights.

---

## ✂️ Itens descartados deliberadamente

_(Nenhum item registrado ainda)_
