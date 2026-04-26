# Spec [Número] — [Título Curto]

> Status: Draft <!-- Draft | In Review | Active | Done -->
> Author: [Nome]
> Date: [YYYY-MM-DD]
> Owner: [Nome — quem responde por encerramento]
> Plan: [`./plan.md`](./plan.md)

> **Princípio de imutabilidade:** após status `In Review`, este arquivo só
> muda por consenso explícito. Decisões em aberto vão para `plan.md` (vivo).

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
- [ ] `yarn check && yarn test` verde (sempre).
- [ ] PR Draft revisado e aprovado por humano antes de Ready.

---

## 🔬 Pesquisa de contexto

Quando aplicável, ponteiros para arquivos em `./research/`:

- [`research/synthesis.md`](./research/synthesis.md) — síntese principal.
- Outros arquivos de pesquisa relevantes.

Se a spec não tem research, omitir esta seção.

---

## 🛠️ Dependências e impactos (alto nível)

- **Pré-requisitos**: specs/PRs que precisam estar mergeados antes.
- **Specs afetadas**: outras specs cujo escopo é tocado por esta.
- **Riscos macro**: 1-3 riscos não-técnicos (ex.: visibilidade pública, custo
  de adoção, quebra de contrato com consumidor real).

Detalhamento técnico (riscos por componente, mitigações) fica em `plan.md`.

---

## 📚 Referências

- Specs relacionadas: 0XXX, 0YYY.
- ADRs aplicáveis: ADR 0XXX.
- Issues / PRs / decisões externas.
