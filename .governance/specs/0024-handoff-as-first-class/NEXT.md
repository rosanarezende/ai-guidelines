<!-- ai-guidelines-template: next-boilerplate v=1 -->

# NEXT — Spec 0024 Handoff as First-Class

> **Arquivo de acompanhamento contínuo.** Instanciado no setup. Registra itens que extrapolem o escopo da 0024 e precisem sobreviver até o encerramento. **DELETADO no encerramento pré-merge**; itens relevantes migram para `.governance/specs/roadmap/backlog.md`.

---

## 🏛️ Débitos Adiados

### Débitos da Fase 0 (Setup)

_(Nenhum débito registrado ainda)_

### Débitos da Fase 1 (Implementação)

_(Stage 2 ainda não iniciado — Fase 0 evidence-driven em curso)_

---

## 💡 Insights e Descobertas

### 1. Equivalência estrutural entre Hermes skill loop e ai-guidelines governance lifecycle

- **O Contexto**: emergiu na sessão de planejamento da 0024 (2026-05-28) durante análise comparativa via transcrições.
- **O Insight**: Hermes faz `task completion → pattern extraction → skill creation → skill refinement`. ai-guidelines faz `observação → backlog → spec → decision-brief → ADR/regra`. Mesma forma estrutural (pipeline de promoção); Hermes opera em agent skills, ai-guidelines em governance. Implicação: handoff = projeção/lookup; aprendizado vive no lifecycle existente; conflar viola ADR 0018.
- **Ação Sugerida**: alimentar Bloco D (Promoção) do decision-brief; pode virar DEC explícita `[DEC-0024-D02]` cravando "handoff não promove autonomamente".

### 2. Tri-party humano + Claude + ChatGPT emergiu naturalmente na sessão de planejamento

- **O Contexto**: a sessão de abertura desta spec usou tri-party sem ritual prévio — ChatGPT como segunda opinião sobre tensão da cláusula anti-paper da ADR 0023, Claude como implementador + análise, owner como decisão final. Esse foi o segundo caso documentado de tri-party (primeiro: Spec 0023 PR5/PR #25).
- **O Insight**: o item `[1.H.10]` da Spec 0023 (avaliar promoção do modelo tri-party a ADR próprio) tinha critério "≥ 2 specs adicionais OU adoção espontânea". Esta sessão pode contar como segundo caso de uso espontâneo em PR não-trivial.
- **Ação Sugerida**: registrar como ponto de observação do Bloco A; se um terceiro caso emergir naturalmente durante a research desta spec, considerar promoção formal a ADR no encerramento.

### 3. Gate de CI faltante para validar `state.yml` schema globalmente

- **O Contexto**: descoberto via review do Copilot no PR #30 (2026-05-28). O `state.yml` inicial desta spec foi commitado com `stage: research` (inválido — schema canônico aceita apenas `discovery|decision|planning|implementation|closing|done`) e `focus`/`next` como strings escalares (inválido — schema exige `ReadonlyArray<string>`). `yarn validate` **não pegou** o bug porque o `parseWorkflowState()` é invocado apenas em runtime (quando comando `workflow continue` lê o `state.yml` da spec ativa), não no validate global.
- **O Insight**: existe pressão real para um gate de CI que valide TODOS os `state.yml` do repo contra o schema canônico (`src/domain/workflow/WorkflowState.ts` + `src/infrastructure/yaml/workflowStateSerializer.ts`). Sem isso, qualquer spec pode commitar `state.yml` quebrado e descobrir só quando alguém roda o runtime contra ela. Pattern análogo: `governance-pr-check` (cf. ADR 0021) é precisamente esse tipo de gate determinístico que move enforcement do agente para o sistema.
- **Ação Sugerida**: registrar como candidata derivada para a entry de backlog `coverage-rigor-enforcement` (já existe; cobre exatamente "PR que reduz coverage de qualquer arquivo crítico abaixo do piso falha"). Quando essa spec abrir, adicionar item "gate CI que valida schema de TODOS os `state.yml` do repo" como parte do escopo. Não-urgente neste momento (caso emergiu durante a 0024 e já foi corrigido); sinal para promoção quando ≥ 1 caso adicional aparecer OU quando `coverage-rigor-enforcement` for instanciada.

---

## ✂️ Itens descartados deliberadamente

_(Nenhum item descartado ainda — registrar quando research excluir explicitamente alguma direção investigada.)_
