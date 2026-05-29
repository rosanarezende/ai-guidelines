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

### 2. Tri-party humano + Claude + ChatGPT iterou em 3 turnos durante a sessão de planejamento

- **O Contexto**: a sessão de abertura desta spec usou tri-party em 3 turnos distintos sem ritual prévio: (1) ChatGPT como segunda opinião sobre tensão da cláusula anti-paper da ADR 0023; (2) ChatGPT estruturando os 5 eixos de pressão; (3) ChatGPT como reviewer atrasado dos artifacts do PR #30 — turno que identificou o gap "unidade promovível" e cravou `[DEC-0024-D04]`. Claude como implementador + análise estrutural em todos os turnos; owner como decisão final.
- **O Insight**: o item `[1.H.10]` da Spec 0023 (avaliar promoção do modelo tri-party a ADR próprio) tinha critério "≥ 2 specs adicionais OU adoção espontânea". Esta sessão fornece **3 casos documentados** de tri-party (cf. evidence artifact § "Continuação tri-party — 3º turno"). Padrão observado: cada turno revela gap que turnos anteriores não viam — não é só "dupla opinião + decisão", é iteração refinada com reviewer atrasado funcionando como "leitor que não estava na construção".
- **Ação Sugerida**: considerar promoção formal a ADR já no encerramento da Stage 1 desta spec, dado que critério de [1.H.10] está próximo de saturar (3 turnos numa sessão + 1 caso anterior da Spec 0023). ADR proposta cobriria: papel de cada agente; quando convocar reviewer atrasado vs second opinion no fluxo; antipattern de "consenso prematuro" (turno único).

### 3. Gate de CI faltante para validar `state.yml` schema globalmente

- **O Contexto**: descoberto via review do Copilot no PR #30 (2026-05-28). O `state.yml` inicial desta spec foi commitado com `stage: research` (inválido — schema canônico aceita apenas `discovery|decision|planning|implementation|closing|done`) e `focus`/`next` como strings escalares (inválido — schema exige `ReadonlyArray<string>`). `yarn validate` **não pegou** o bug porque o `parseWorkflowState()` é invocado apenas em runtime (quando comando `workflow continue` lê o `state.yml` da spec ativa), não no validate global.
- **O Insight**: existe pressão real para um gate de CI que valide TODOS os `state.yml` do repo contra o schema canônico (`src/domain/workflow/WorkflowState.ts` + `src/infrastructure/yaml/workflowStateSerializer.ts`). Sem isso, qualquer spec pode commitar `state.yml` quebrado e descobrir só quando alguém roda o runtime contra ela. Pattern análogo: `governance-pr-check` (cf. ADR 0021) é precisamente esse tipo de gate determinístico que move enforcement do agente para o sistema.
- **Ação Sugerida**: registrar como candidata derivada para a entry de backlog `coverage-rigor-enforcement` (já existe; cobre exatamente "PR que reduz coverage de qualquer arquivo crítico abaixo do piso falha"). Quando essa spec abrir, adicionar item "gate CI que valida schema de TODOS os `state.yml` do repo" como parte do escopo. Não-urgente neste momento (caso emergiu durante a 0024 e já foi corrigido); sinal para promoção quando ≥ 1 caso adicional aparecer OU quando `coverage-rigor-enforcement` for instanciada.

---

## ✂️ Itens descartados deliberadamente

_(Nenhum item descartado ainda — registrar quando research excluir explicitamente alguma direção investigada.)_
