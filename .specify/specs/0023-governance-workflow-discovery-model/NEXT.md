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

> **Particularidade desta spec (Stage A — Discovery):** itens registrados aqui durante Stage A são **descobertas que extrapolam o escopo**, não tarefas de implementação. Tarefas operacionais só existem após gate humano + criação de `tasks.md`. Esta restrição é consistente com a hipótese H4 do `research.md` (a maior parte do churn vem da ausência de discovery, não da ausência de planning).

---

## 🏛️ Débitos Adiados

### Débitos da Fase A (Discovery)

_(Nenhum débito registrado ainda — a investigação está em curso em [`./research.md`](./research.md). Eventuais descobertas que extrapolem o escopo serão registradas aqui à medida que aparecerem.)_

---

## 💡 Insights e Descobertas

### 1. Esta 0023 nasce como dogfooding intencional do lifecycle que ela define

- **O Contexto**: a 0023 é a primeira spec do repositório criada explicitamente em estado "Stage A — Discovery", com setup contendo **apenas** `spec.md` + `research.md` + `NEXT.md`. `decision-brief.md`, `plan.md` e `tasks.md` foram deliberadamente omitidos. Isso é simultaneamente um experimento metodológico e uma instrumentação: se o próprio lifecycle proposto não consegue ser aplicado à spec que o define, isso é evidência crítica de revisão pré-canonização.
- **O Insight**: dogfooding em spec metodológica funciona como teste de tensão duplo — (a) confirma que a forma proposta é executável em prática real, com atritos verificáveis e não hipotéticos; (b) revela problemas que só aparecem no uso (não na análise antecipada). Se a 0023 conseguir progredir até gate sob essa disciplina, a evidência é forte. Se precisar quebrar a disciplina para conseguir progredir, isso é **falsificação útil** — não fracasso a esconder.
- **Ação Sugerida**: registrar o resultado deste dogfooding como parte do **output** da 0023 (seção "como aplicar" do `spec.md` final), não como débito separado. Se confirmado, virar princípio explícito no `governance-foundation.md`: "specs metodológicas usam, da Stage A em diante, o próprio lifecycle que propõem; falhas de aplicação são evidência crítica de revisão pré-canonização".

### 2. `research.md` como artifact de primeira classe não tem precedente no template SDD vigente

- **O Contexto**: o template SDD atual em `.specify/templates/` tem `spec-boilerplate`, `decision-brief-boilerplate`, `plan-boilerplate`, `tasks-boilerplate` e `next-boilerplate` — mas **não** `research-boilerplate`. Pesquisas profundas existem hoje em `.specify/specs/researchs/` (não-template) e em arquivos `audit-YYYY-MM-DD-*.md` ad-hoc dentro de pastas de specs (ex.: `audit-2026-05-10-pre-2d-sanitization.md` na 0021). Esses arquivos cumprem informalmente o papel de research, mas sem contrato canônico.
- **O Insight**: a ausência de `research-boilerplate` é sintoma da herança "execution-first" do framework. O template assume que toda iniciativa vai diretamente para `decision-brief`. A 0023 deve produzir esse boilerplate como **output canônico** (não como missão paralela). E precisa decidir explicitamente: pesquisas locais à spec (em `research.md` + `research/` na própria pasta da spec) vs. pesquisas reutilizáveis cross-spec (em `.core/research/` por tema, ainda não criado). O `research.md` da própria 0023 implementa essa distinção como protótipo do contrato.
- **Ação Sugerida**: parte do output canônico desta spec — não débito futuro. Será materializado como entrega final junto com o lifecycle e a matriz workflow → artefatos.

### 3. `closure-review.md` da 0021 também é precedente sem template

- **O Contexto**: durante o fechamento da 0021, foi inaugurado o uso de `closure-review.md` (sem template) como artifact de boundary review e debt transfer assessment para spec de fundação. Esse arquivo foi insumo direto para abrir esta 0023, mas continua sendo um precedente único — não há contrato canônico para "como specs de fundação fecham".
- **O Insight**: dois artifacts informais (`research.md` no Stage A e `closure-review.md` no Stage F-equivalente) emergiram da prática real porque o lifecycle vigente não tem lugar canônico para eles. Isso reforça a hipótese H3 do `research.md` (boilerplates atuais embutem epistemologia execution-first).
- **Ação Sugerida**: incluir `closure-review.md` como artifact opcional no output da 0023, com critério explícito de "quando usar" (specs de fundação / specs com amendments de escopo / specs com sub-blocos pós-gate). Provavelmente também merece boilerplate próprio, mas isso é decisão a tomar pós-gate.

---

## ✂️ Itens descartados deliberadamente

> _Subseção opcional._ Incluir apenas itens **avaliados e explicitamente rejeitados** com rationale que evita re-discussão futura.

- **Decisão antecipada sobre os 7 pilares estarem "certos" ou "errados"** — rejeitado em 2026-05-19. Motivo: conclusão antecipada cristalizaria framing antes do discovery. A spec produz **rationale** sobre a posição taxonômica dos pilares; "manter" ou "ajustar" é output da investigação, não premissa.
- **Redesenhar todos os boilerplates existentes nesta spec** — rejeitado em 2026-05-19. Motivo: boilerplates são consequência do lifecycle, não ponto de partida. Alterações pontuais a boilerplates atuais podem acontecer durante a execução; redesign completo é trabalho de spec dedicada, sequenciada após esta.
- **Importar modelos prontos do mercado (Growth Engineering, SAFe, Shape Up, etc.) como verdade estrutural** — rejeitado em 2026-05-19. Motivo: framings organizacionais externos são enviesados pelo contexto em que nasceram. Servem apenas como inspiração abstrata para a noção de separação epistemológica entre tipos de trabalho — não como template a ser portado.
- **Abrir specs paralelas (0024 taxonomia, 0025 boilerplates, etc.) antes desta fechar** — rejeitado em 2026-05-19. Motivo: fragmentação prematura cria coordenação caótica. Esta 0023 cobre lifecycle + taxonomia de workflows + taxonomia de artefatos + `research.md` + política de pesquisas profundas em **uma spec coesa**. Especs derivadas só fazem sentido após a 0023 ter rationale fechado.
- **Tratar `research.md` como "Stage 1 do `tasks.md` existente" em vez de artifact independente** — rejeitado em 2026-05-19. Motivo: as variantes `tasks-evidence-driven-boilerplate` e `tasks-mixed-boilerplate` já existem, mas seguem dentro do paradigma execution-first (Stage 1 é etapa do tasks, não artifact separado). O `research.md` independente é precisamente o artifact que falta no nível certo — não um sub-bloco do tasks.
