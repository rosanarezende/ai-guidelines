<!-- ai-guidelines-template: plan-boilerplate v=1 -->

# Plan — Spec 0024 Handoff as First-Class

> Spec: [`./spec.md`](./spec.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: Draft

> **Vive durante a execução.** Diferente da `spec.md` (imutável após In Review),
> este arquivo é atualizado conforme o entendimento técnico evolui.

---

## 🛰️ Stage 1 / Stage 2

> **Stage 1 (Research → opções).** Coletar evidência via análise comparativa dos 5+ sistemas externos enumerados em `spec.md § Pesquisa de contexto`. Preencher `decision-brief.md` com opções por DEC `[DEC-0024-XYZ]`. Termina no **Gate humano** que marca cada ponto `Resolved`.
>
> **Stage 2 (Design + Implementação).** Cada subseção do "Design e Arquitetura" abaixo (atualmente em **placeholder**) deriva linearmente das decisões cravadas no brief. Stage 2 só inicia após o gate fechar.
>
> **Esta spec é research-first.** A implementação do comando `workflow handoff` está **fora do escopo** desta spec (vira spec separada — provavelmente 0025 — após Stage 1 fechar).

---

## 🔬 Research lifecycle (Stage 1 ativo)

> Lista canônica de perguntas de research a responder. Cada pergunta cruza-se com pontos `[DEC-0024-*]` do decision-brief.

| Pergunta de research                                                                  | DEC alimentado(s)                              |
| :------------------------------------------------------------------------------------ | :--------------------------------------------- |
| Como Hermes Agent resolve seleção/persistência/promoção?                              | A01, A02, B01, B02, D01, D02                   |
| Como Cursor SDK estrutura harness (sandbox + context mgmt + session)?                 | A01, A02, A03, B01                             |
| Como Open Code mantém provider-agnosticism estrutural?                                | A01, F01, F03                                  |
| Como Anthropic Dreaming faz curadoria de memória?                                     | B02, D01, D02, D03                             |
| Como Spec Kitty estrutura missions/work packages/agent loops?                         | A01, B01, D01, E02                             |
| O que sistemas baseados em grafos (LangGraph/AutoGen/GraphRAG) revelam sobre seleção? | A01, A03, E01 (dependente de fonte recuperada) |
| Qual a matriz consumidor × formato ideal observada empiricamente?                     | E01, E02, E03                                  |
| Qual o ponto comum (se algum) que TODOS os sistemas externos perdem vs ai-guidelines? | F01, F02, F03                                  |

**Critério de saída da research** (cf. `spec.md § Critérios de Aceite`):

1. Cada um dos 5 eixos (Seleção / Persistência / Promoção / Projeção / Governança) tem ≥ 1 resposta evidence-backed nos artifacts.
2. ≥ 2 sistemas estudados convergem em ≥ 2 dessas respostas (sinal de pressão arquitetural recorrente real, não idiossincrasia).
3. Bloco A (preâmbulo do decision-brief) cresce para ≥ 3 observações cravadas adicionais com cross-ref aos artifacts (já 5 cravadas na instanciação; ≥ 8 ao gate).

---

## 🏗️ Design e Arquitetura

### Princípio guia

[Placeholder até gate fechar.] O "como" estrutural emerge das decisões do decision-brief. Hipótese atual (não cravada):

- Handoff = projeção determinística sobre SSOT existente.
- Lifecycle de promoção = governance lifecycle atual (sem mudança).
- Multi-consumidor = generalização cuidadosa de ADR 0023.
- Governance-first = invariante a preservar (possível ADR no encerramento).

### Componentes ou Sub-blocos

> [Placeholder até gate fechar.] Componentes específicos emergem das decisões `[DEC-0024-XYZ]`. Por enquanto, áreas-alvo prováveis (cf. `decision-brief.md § Bloco C`):
>
> - `src/cli/workflow.ts` — adição de modo "handoff" como projeção alternativa ao briefing
> - `src/app/workflow/*` — novo use case (provável: `AssembleHandoff`)
> - `src/app/ports/*` — possível porta nova para projection rendering
> - `AGENTS.md` — possível redução para stub (consequência médio prazo per ADR 0022)
>
> Detalhamento técnico se materializa apenas no `plan.md` v2 pós-gate.

---

## ✅ Critérios de Aceite Detalhados (DoD operacional)

### Stage 1 (research em curso)

- [ ] Research artifact por sistema externo declarado em escopo (≥ 5 artifacts).
- [ ] Matriz pressão × sistema preenchida em `research/2026-05-28-pressure-axes-scope.md`.
- [ ] Bloco A do decision-brief cresce para ≥ 8 observações cravadas.
- [ ] Cada DEC `[DEC-0024-XYZ]` tem opções populadas com Pró/Contra.

### Globais (toda a spec)

- [ ] Pipeline `yarn format ; yarn validate` verde.
- [ ] Não-objetivos cravados em `spec.md` continuam respeitados ao longo do ciclo (auditoria final).
- [ ] PR Draft revisado e aprovado por humano antes de Ready.

---

## 🧪 Estratégia de Testes

> [Placeholder até Stage 2.] Esta spec é research-first; não há código de produto novo. Testes emergem na spec implementadora (0025+) com base nas decisões cravadas no gate.

---

## 🛠️ Arquivos modificados (esperado)

### Stage 1 (atual)

- `.governance/specs/0024-handoff-as-first-class/spec.md` — instanciação inicial.
- `.governance/specs/0024-handoff-as-first-class/decision-brief.md` — DECs `Open` → opções populadas → `Resolved` via gate.
- `.governance/specs/0024-handoff-as-first-class/plan.md` — placeholder Stage 2 → v2 pós-gate.
- `.governance/specs/0024-handoff-as-first-class/tasks.md` — Fase 0 (Setup + Research + Brief + Gate); Fases 1+ pós-gate.
- `.governance/specs/0024-handoff-as-first-class/state.yml` — schema 4-chave canônico.
- `.governance/specs/0024-handoff-as-first-class/NEXT.md` — débitos e insights.
- `.governance/specs/0024-handoff-as-first-class/research/*.md` — artifacts comparativos.
- `.governance/specs/roadmap/backlog.md` — move handoff de Now §1 para Em execução.
- `.gitignore` — adiciona `temp/` para suportar artefatos de pesquisa locais.

### Stage 2 (futuro — escopo da spec derivada, não desta)

[Emerge do plan.md v2.]

---

## ⚠️ Riscos técnicos (concretos)

| Risco                                                                                                      | Mitigação                                                                                                                        |
| :--------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| Research deriva para benchmarking superficial ("como funciona feature X").                                 | Critério de saída cravado em pressões arquiteturais, não em features. Matriz pressão × sistema obriga o eixo correto.            |
| Spec congela ontologia cedo demais (promove "rules-as-catalog" / "selection cost" a ADR antes de validar). | DECs começam `Open` sem opções pré-formuladas; recomendação inicial opcional somente quando ≥ 1 research convergente.            |
| Spec drift para memory engine (viola não-objetivo).                                                        | Bloco B (Persistência) explicitamente investiga "o que persiste", não "como persistir". Auditoria contínua em revisões da brief. |
| ADR 0018 violado por research que prescreve learning loop autonomous.                                      | DEC-0024-D02 cravada como ponto defensivo explícito (recomendação inicial = "NÃO autônomo").                                     |
| Slug provisional `handoff-as-first-class` engana sobre escopo real.                                        | Nota explícita no header de spec.md; re-slug aceito quando research consolidar.                                                  |

---

## 📐 Decisões revisitadas

_(Nenhuma decisão revisitada ainda — preencher conforme research expor reversões de hipóteses.)_

---

## 📎 Anexo — Conteúdo candidato pré-research

_(Não-aplicável — esta spec nasce pós-Spec 0023 sem rascunho herdado a reconciliar.)_
