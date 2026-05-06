# Spec [Número] — [Título Curto]

> Status: Draft <!-- Draft | In Review | Active | Paused | Pivoted | Cancelled | Done. Status composto é aceito (ex.: `Done (PR #42 — 2026-05-12)`, `Draft (revised 2026-05-02)`, `Pivoted (2026-04-20 — ver § Post-mortem)`). -->
> Author: [Nome]
> Date: [YYYY-MM-DD]
> Owner: [Nome — quem responde por encerramento]
> Tipo de spec: [evidence-driven | deterministic | mixed] <!-- OBRIGATÓRIO. Sem default — escolha consciente. Ver `.core/process/spec-foundation.md` § "Tipos de spec". -->
> Decision Brief: [`./decision-brief.md`](./decision-brief.md) <!-- OPCIONAL. Obrigatório quando Tipo de spec = `evidence-driven` ou `mixed`. Omitir se `deterministic`. -->
> Plan: [`./plan.md`](./plan.md)

> **Princípio de imutabilidade:** após status `In Review`, este arquivo só
> muda por consenso explícito. Decisões em aberto vão para `plan.md` (vivo).
>
> **Princípios da Escrita:** ver `.core/process/spec-foundation.md` §
> "Princípios da Escrita" (agnosticismo humano/IA, BR IDs, contratos).

---

## 🎯 Objetivo

Em 1-3 parágrafos curtos:

- O **problema real** (não o sintoma); por que é prioridade agora.
- O **resultado esperado** observável (não a solução técnica — essa é do plan).

Evitar prescrição técnica (nome de arquivo, estrutura de pasta, lib específica)
neste arquivo. Detalhe técnico fica em `plan.md`.

---

## 📦 Escopo

### Dentro do escopo

- Item 1 (descrição curta, observável).
- Item 2.

### Fora do escopo (vira spinoff ou fica em outra spec)

- Item X — justificativa (1 linha) e ponteiro para spec destino ou entrada
  em `roadmap/backlog.md`.

---

## ✅ Critérios de Aceite (alto nível)

Critérios **observáveis** que indicam "spec está pronta para Done". Detalhamento
operacional (DoD por componente, casos de teste) fica em `plan.md`.

- [ ] Critério 1 — verificável de fora.
- [ ] Critério 2.
- [ ] Pipeline de check + test verde, sempre (ex.: `yarn check && yarn test` no `ai-guidelines`; substitua pelo equivalente do stack do consumidor — `npm test`, `pnpm verify`, `cargo test`, `pytest`, etc.).
- [ ] PR Draft revisado e aprovado por humano antes de Ready.

---

## 🔬 Pesquisa de contexto

Quando aplicável, ponteiros para artefatos de research/decisão desta spec:

- [`./decision-brief.md`](./decision-brief.md) — gate humano de decisões pré-design (specs `evidence-driven` ou `mixed`).
- Arquivos em `./research/` — sínteses externas, benchmarks, evidência empírica.

Se a spec não tem research nem decision-brief (típico de `deterministic`), omitir esta seção.

---

## 🧠 Decisão de Fusão

> _Subseção opcional._ Incluir apenas quando esta spec **absorve** uma ou mais candidatas
> do `roadmap/backlog.md` (ou de outras specs em curso). Documenta por que a fusão é
> melhor que manter as candidatas separadas.

- **Critério de fusão**: o que torna estas iniciativas inseparáveis (overlap de escopo, dependência forte, mesmo problema-raiz).
- **Análise**: tradeoffs considerados; alternativa de manter separadas e por que foi rejeitada.
- **Conclusão**: candidatas absorvidas (lista com slugs/IDs) e quais entregas a spec consolidada cobre.

---

## 🛠️ Dependências e impactos (alto nível)

- **Pré-requisitos**: specs/PRs que precisam estar mergeados antes.
- **Specs afetadas**: outras specs cujo escopo é tocado por esta.
- **Cross-refs com specs irmãs** _(opcional)_: para specs que coexistem com fronteira deliberada,
  registrar aqui:
  - **Spec X** — fronteira (o que é desta, o que é da outra) — motivo (por que separar).
- **Riscos macro**: 1-3 riscos não-técnicos (ex.: visibilidade pública, custo
  de adoção, quebra de contrato com consumidor real).

Detalhamento técnico (riscos por componente, mitigações) fica em `plan.md`.

---

## 🛑 Post-mortem / Motivo do Pivot

> _Subseção opcional._ Obrigatória quando o status final é `Pivoted` ou `Cancelled`.
> Pode ser preenchida durante `Paused` se houver hipótese explícita do que falhou.

- **Hipótese original**: o que se acreditava ao abrir a spec.
- **O que mudou**: evidência, contexto ou decisão que invalidou a hipótese.
- **Aprendizado**: o que fica registrado para specs futuras (link para entrada em `roadmap/backlog.md` se gerou candidata sucessora).

---

## 📚 Referências

- Specs relacionadas: 0XXX, 0YYY.
- ADRs aplicáveis: ADR 0XXX.
- Issues / PRs / decisões externas.
