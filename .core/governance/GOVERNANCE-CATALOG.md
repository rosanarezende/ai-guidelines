# GOVERNANCE-CATALOG.md — Carrier Canônico da Arquitetura de Informação

> **Âncoras:** `[DEC-0021-B02]`, `[DEC-0021-B03]` — Modelo híbrido (catálogo curto + topologia física direcionada).
> Para detalhes técnicos de invariantes, bounded contexts e glossário: ver `ARCHITECTURE-REFERENCE.md`.

---

## 1 — Classes de gênero (7 pilares MECE)

Os 7 pilares são **mutuamente exclusivos e coletivamente exaustivos**. Todo trabalho rastreado deve caber em exatamente um.

| Kind         | Classe  | Intenção                                                     | `workspacePath` |
| :----------- | :------ | :----------------------------------------------------------- | :-------------- |
| `spec`       | Dense   | Trabalho formal e planejado com artefatos versionados        | Obrigatório     |
| `experiment` | Dense   | Hipótese de produto com métricas de sucesso e outcome        | Obrigatório     |
| `spike`      | Dense   | PoC, prototipagem ou estudo técnico time-boxed (aprendizado) | Obrigatório     |
| `incident`   | Dense   | Ocorrência operacional rastreada com severidade              | Obrigatório     |
| `proposal`   | Virtual | Discussão ou proposta sem entregável físico                  | Proibido        |
| `patch`      | Virtual | Mudança de manutenção simples sem burocracia de spec         | Proibido        |
| `fix`        | Virtual | Correção rastreada de baixo custo                            | Proibido        |

**Promoções permitidas:**

- `proposal → spec` quando `status ∈ {review, done}` e `workspacePath` definido.
- `experiment → spec` quando `outcome === 'won'` e `workspacePath`; herda `hypothesis` e `successMetrics`.
- `patch`, `fix`, `incident`: ciclo fechado — nenhuma promoção permitida.

---

## 2 — Paths canônicos

### 2.1 No repo do mantenedor (este repositório)

| Path                                   | Responsabilidade                                                                    |
| :------------------------------------- | :---------------------------------------------------------------------------------- |
| `.core/governance/`                    | Artefatos de governança transversal (este catálogo, ARCHITECTURE.md, ADRs)          |
| `.core/governance/adrs/`               | ADRs canônicas globais (0001-…) — lar consolidado em PR4 `[DEC-0021-B04]`           |
| `.core/governance/recipes/`            | Recipes YAML da TemplateEngine (composição modular)                                 |
| `.core/governance/templates/partials/` | Partials Markdown atômicos (blocos compostos por recipes)                           |
| `.core/process/`                       | Constituição operacional viva (process, spec-foundation → renomeado em 4.B)         |
| `.core/rules/`                         | Regras distribuídas: `top/` sempre injetado; `center/`, `base/` opt-in; `adapters/` |
| `.specify/specs/`                      | Workspace de specs (`spec_workspace_dir` canônico)                                  |
| `.specify/specs/roadmap/`              | Backlog + histórico de specs                                                        |
| `.specify/specs/researchs/`            | Arquivo de pesquisas internas                                                       |

### 2.2 No repo do consumidor

| Path                       | Responsabilidade                                                                          | Estado       |
| :------------------------- | :---------------------------------------------------------------------------------------- | :----------- |
| `.governance/`             | Root canônico unificado — declarado em `[DEC-0021-A03]`                                   | Ativo (PR2+) |
| `.governance/registry.yml` | Estado primário estruturado (SSOT) — nunca editar derivados à mão                         | Ativo        |
| `.governance/intake/`      | Lar reservado para PRD/intake estruturado (`stakeholder-intake-pipeline`)                 | Reservado    |
| `.governance/handoff/`     | Lar reservado para contratos de handoff/decision logs (`handoff-contracts-formalization`) | Reservado    |
| `.governance/telemetry/`   | Lar reservado para telemetria do framework (`framework-observability-dashboard`)          | Reservado    |
| `.ai-guidelines/`          | Bridge legada — CLI mjs ainda escreve aqui; migração consumer-side ocorre em PR4          | Depreciado   |
| `.specify/`                | Legacy workspace dir — migração para `.governance/` ocorre em PR4                         | Depreciado   |

---

## 3 — Regras de lookup

| Pergunta                                              | Fonte canônica                                      |
| :---------------------------------------------------- | :-------------------------------------------------- |
| Qual o estado atual de um trabalho?                   | `.governance/registry.yml` (SSOT estruturado)       |
| Qual o processo de abertura e ciclo de vida?          | `.core/process/spec-foundation.md` (ver nota 4.B)   |
| Quais decisões arquiteturais estáveis guiam o design? | `.core/governance/adrs/` (após PR4)                 |
| Quais regras o LLM recebe?                            | `AGENTS.md` → bloco `<AI_GUIDELINES>` compilado     |
| Quais regras são fonte (editáveis)?                   | `.core/rules/{top,center,base,adapters}/`           |
| Como montar artefatos novos?                          | `.core/governance/recipes/` + `partials/`           |
| O que os testes cobrem (Living Docs)?                 | `.governance/living-docs.yml` (gerado — não editar) |
| Qual o roadmap operacional desta spec?                | `.specify/specs/0021-*/tasks.md`                    |

---

## 4 — Lifecycle de um artefato

```
Draft → In Progress → In Review → Done (ou Cancelled / Superseded)
```

- **Dense kinds** ganham `workspacePath` ao transitar de Draft para In Progress.
- **Virtual kinds** nunca têm workspace físico; são encerrados por resolução direta.
- **Promoting:** a promoção muda o `kind` e preserva o `id`; o histórico de status não é truncado.
- **Archival:** artefatos `Done` permanecem no registry; migração para histórico narrativo ocorre manualmente via roadmap.

---

## 5 — Gêneros futuros reservados

Os paths `.governance/{intake,handoff,telemetry}/` são criados idempotentemente por `AdoptWorkspace` como reserva explícita de lar canônico. Conteúdo entra somente com as specs futuras responsáveis:

| Gênero futuro       | Path reservado           | Spec futura                         |
| :------------------ | :----------------------- | :---------------------------------- |
| PRD / intake        | `.governance/intake/`    | `stakeholder-intake-pipeline`       |
| Handoff / decisions | `.governance/handoff/`   | `handoff-contracts-formalization`   |
| Telemetria          | `.governance/telemetry/` | `framework-observability-dashboard` |

---

> **Manutenção:** qualquer mudança de path canônico exige atualização simultânea neste catálogo **e** na topologia física correspondente. Se o catálogo e o repo divergirem, o catálogo está errado.
