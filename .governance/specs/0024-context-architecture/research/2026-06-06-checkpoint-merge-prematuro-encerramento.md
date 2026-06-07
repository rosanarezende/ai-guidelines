# Checkpoint de ENCERRAMENTO — investigação "merge prematuro" (Spec 0024 / PR #35)

> **Documento de encerramento de ARCO** (situado). Encerra a investigação "como impedir
> merge prematuro?" como **descoberta de pesquisa**, sem solução de enforcement aprovada.
> NÃO reabrir as investigações falsificadas (§3). NÃO é o SSOT do #35 mainline — esse segue
> em `2026-06-05-checkpoint-pr35-visual-governance.md` (cutover/Commands/confirm-in-run).
> Data: 2026-06-06.

---

## 1. Estado atual

| Item                 | Valor                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| Branch               | `feat/spec-0024-pr-cli-cutover` (#35, Draft)                                                                   |
| HEAD                 | linha **limpa** sobre `bde1709`: research → active-specs fix → active-specs:check → PIT-0008 → este checkpoint |
| Linha de trabalho    | **sem implementação experimental ativa** (governance-pr-check revertido ao estado pré-arco)                    |
| Evidência preservada | tag `evidence/merge-prematuro-falsified` → `f5feb48` (c626ce6/a6d509a/f5feb48)                                 |
| `yarn validate`      | verde (inclui o novo `active-specs:check`)                                                                     |
| Push                 | nada pushado; origin segue em `bde1709`                                                                        |

## 2. A pergunta — e como ela evoluiu

- **Hipótese inicial:** "como impedir merge prematuro?" — tratá-lo como algo a **bloquear** num PR.
- **Pergunta final (correta):** "como uma spec **aterrissa** em main?" — promoção/aterrissagem é **operação (evento)**, não estado contínuo de PR.

## 3. Tentativas realizadas e FALSIFICADAS — **NÃO REABRIR**

Todas tentaram enforçar um constraint de **evento** numa superfície de **estado contínuo** (status check), e todas falharam pelo mesmo sintoma (vermelho cedo demais / verde tarde demais):

| Commit (tag de evidência) | Tentativa                                                 | Falsificada por                                                             |
| ------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------- |
| `c626ce6`                 | `base==main` + **R8/review.md** no governance-pr-check    | autorização (terminal) em estado contínuo → vermelho permanente / bootstrap |
| `a6d509a`                 | **landing_policy** (campo persistido) + vehicle por role  | 3ª representação do que a topologia já dizia (drift)                        |
| `f5feb48`                 | **vehicle derivado da topology** + gate `Ready+base=main` | **contradição formal com R7** (que EXIGE não-veículos em Ready)             |

Também falsificadas (linguagem de superfícies, no research): GitHub Reviews, Ready, Draft, `base==main` — todas superfícies de estado contínuo ou de autorização, incapazes de representar um constraint de evento. Mapa completo: `research-library/architecture/2026-06-05-enforcement-surfaces.md`.

## 4. O que SOBREVIVEU (consolidado, landed)

1. **Taxonomia de superfícies** (research): restrição de **evento ≠ superfície de estado contínuo**; **declaração ≠ enforcement**. Reutilizável muito além de merge (releases, ADRs, gates, encerramento, deploys). → `research-library/architecture/2026-06-05-enforcement-surfaces.md`.
2. **PIT-0008** (insights.yml): o insight recorrente capturado para detecção de reaparecimento.
3. **`active-specs:check`** (novo gate em `validate`): fecha a causa-raiz do drift SSOT→projeção (`entry.stage == state.yml.stage`).
4. **Modelo conceitual** (validado, não cravado em ADR): o **Integration PR é melhor entendido como veículo de promoção**; aterrissar é **operação** (MergeStack), não estado; o pipeline de promoção **já existe** (OpenIntegrationPR → R8 → MergeStack).

## 5. Decisões cravadas nesta rodada — **NÃO REABRIR**

- **Enforcement contínuo de merge prematuro = falsificado.** Sem solução escolhida; sem implementação aprovada.
- **`Ready ≠ Mergeable` (ADR 0024) segue válido** — a investigação o reforçou.
- **A superfície correta de enforcement é de evento/operação/acesso** (merge queue `merge_group`, a operação MergeStack, ou restrição do caminho de merge) — **não** status check. Decisão de QUAL superfície fica **deferida** (rodada futura, fora deste escopo).
- **Fila multi-spec = YAGNI hoje** (só a 0024 está ativa; 0023 está `done`). O valor "múltiplas specs concorrentes" era baseado em projeção stale.
- **Teto estrutural:** owner/admin bypassa qualquer enforcement (limite do GitHub) — todo enforcement é "impede acidental / exige bypass deliberado".

## 6. Estado do código

- `governance-pr-check.ts` / `WorkflowState.ts` / `workflowStateSerializer.ts` / testes: **revertidos ao estado pré-arco** (`bde1709`). Sem gate de landing/vehicle/landing_policy.
- `active-specs.yml`: 0023 corrigido para `done/completed` (era `closing/active`).
- Novo: `active-specs:check` (gate + teste + wire em `validate`).

## 7. Pendências reais (sem reabrir investigação)

- **`confirm-in-run`** (anterior ao arco, ainda pendente): decisão da owner sobre o portão transacional compartilhado — bloqueia a etapa 3 do #35 (integration-open/merge-stack como Commands). É o **próximo passo do #35 mainline**. _[SUPERSEDED 2026-06-06: confirm-in-run resolvido SEM abstração; integration-open/merge-stack NÃO convergem (falsificado, ADR 0026 — são passos do workflow). SSOT: checkpoint cutover-knowledge.]_
- **Superfície de enforcement de aterrissagem:** escolher entre merge queue / operação / acesso. Deferido — rodada de modelagem/decisão futura. **Não** voltar para status check.
- **`active-specs.yml` 0024.branch** ainda aponta `ruleset-producibility` (#33); o cursor é `pr-cli-cutover` (#35). Não é violação de invariante (registra "última publish-state"); refresh = **re-rodar `publish-state` de #35** (não hand-edit). _(O `active-specs:check` checa `stage`, não `branch`.)_
- **Framing do Integration PR** (homologação em ADR 0024 × veículo de promoção): clarificação doutrinária futura (não redesenhar ADR agora).

## 8. Higiene de contexto

- Este checkpoint **encerra o arco merge-prematuro**. O **#35 mainline** retoma de `2026-06-05-checkpoint-pr35-visual-governance.md` + memórias.
- Commits falsificados vivem na tag `evidence/merge-prematuro-falsified` — **não** são base a continuar.

## 9. Cross-refs

- Research: `research-library/architecture/2026-06-05-enforcement-surfaces.md` · lente irmã `2026-06-04-epistemic-commitment-model.md`.
- Insight: `PIT-0008` (`.governance/runtime/insights.yml`).
- Gate: `src/cli/activeSpecsConsistencyCheck.ts` (`active-specs:check`).
- ADRs: 0024 (Ready≠Mergeable), 0020 (merge atômico / unidade de release = stack), 0025 (contêiner-primeiro).
- SSOT do #35 mainline: `2026-06-05-checkpoint-pr35-visual-governance.md`.
