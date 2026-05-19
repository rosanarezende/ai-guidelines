<!-- ai-guidelines-template: next-boilerplate v=1 -->

# NEXT — Spec 0023 Modelo de Workflow de Governança e Descoberta

> **Arquivo de acompanhamento contínuo.** Instanciado **sempre** no setup da spec.
> Ao final de cada fase, registre aqui apenas itens que **extrapolem o escopo**
> desta spec e precisem sobreviver até o encerramento. Se a pendência será
> resolvida antes do merge desta própria spec, ela deve ir para o `tasks.md`.
> **DELETADO no encerramento pré-merge** (fase final do `tasks.md`); itens relevantes
> migram antes para `.specify/specs/roadmap/backlog.md` ou viram issues.
>
> Fonte: `.core/process/governance-foundation.md` — política de NEXT.md.

> **Particularidade desta spec (Stage A — Discovery):** itens registrados aqui durante Stage A são **descobertas que extrapolam o escopo**, não tarefas de implementação. Tarefas operacionais só existem após gate humano + criação de `tasks.md`. Rationale longo (hipóteses, evidências, anti-patterns) **não** vem para cá — fica em [`./research.md`](./research.md).

---

## 🏛️ Débitos Adiados

### Débitos da Fase A (Discovery)

_(Nenhum débito registrado ainda — a investigação está em curso em [`./research.md`](./research.md). Descobertas que extrapolem o escopo serão registradas aqui à medida que aparecerem.)_

---

## 💡 Insights e Descobertas

> Apenas registros curtos. Argumentação longa vai para [`./research.md`](./research.md) (hipóteses H1–H4, anti-patterns AP1–AP5, evidências §2).

### 1. Dogfooding intencional do lifecycle proposto

- Setup desta spec contém **apenas** `spec.md` + `research.md` + `NEXT.md`. `decision-brief.md`/`plan.md`/`tasks.md` não devem nascer antes do gate humano.
- Se a 0023 não conseguir progredir sob a própria disciplina, isso é **falsificação útil** — registrar como evidência crítica, não esconder.
- Resultado vira parte do output final (seção "como aplicar" do `spec.md` Done), não débito separado.

### 2. `research.md` como artifact de primeira classe não tem precedente no template SDD

- Pesquisas hoje vivem em `.specify/specs/researchs/` e em `audit-YYYY-MM-DD-*.md` ad-hoc dentro de pastas de specs — ver [`research.md` §2.3](./research.md#23-confusão-de-artifact-artefatos-informais-cumprindo-papéis-canônicos).
- Esta spec deve produzir `research-boilerplate.md` como **output canônico** (não como missão paralela).
- **Candidato para `decision-brief.md`:** estrutura mínima obrigatória + cardinalidade (1:1 vs múltiplos por tópico) + ciclo de vida.

### 3. `closure-review.md` da 0021 também é precedente sem template

- Inaugurado durante o fechamento da 0021 como artifact de boundary review / debt transfer — ver [`research.md` §2.3](./research.md#23-confusão-de-artifact-artefatos-informais-cumprindo-papéis-canônicos).
- Reforça a hipótese H3 do `research.md` (boilerplates atuais embutem epistemologia execution-first).
- **Candidato para `decision-brief.md`:** se formalizar ou não como artifact opcional + critério objetivo de "quando usar".
