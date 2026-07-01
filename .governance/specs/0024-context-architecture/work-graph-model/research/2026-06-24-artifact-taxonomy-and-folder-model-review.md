---
artifact-kind: pre-coding-review
subject: modelo de taxonomia de artefatos + organização de pastas da spec (artifact-kind, disposição, lares físicos)
date: 2026-06-24
reviewer: internal
method: assessment
---

# Design review — taxonomia de artefatos e modelo de pastas da spec

> **Natureza:** `pre-coding-review` (dogfood do próprio tipo). **Não-autoridade**, não é DEC, não move nem executa nada. Captura o desenho convergido na iteração owner↔Claude para **não perder o raciocínio** (anti-`GG-0005`) e separar **decidido** de **aberto**, marcando **#45 vs futuro**. Quando virar trabalho, promover para DEC.

## Por que existe

A iteração sobre "onde mora `pre-coding-review`" abriu uma revisão maior da organização de artefatos da spec. Muitas decisões de desenho ficaram só no chat; este artefato as fixa antes de qualquer execução.

## 1. Decidido (convergido)

| #   | Decisão                                                                                                                                                                                                                                                           | Estado                              |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| D1  | `artifact-kind` = conjunto **fechado** (`research`, `pre-coding-review`, `delivery-review`, `dogfood`, `inventory`, `gap`, `prompt`, `projection`, `handoff-legacy`), **distinto** de `WorkItemKind` (7 MECE, ADR 0010)                                           | **implementado** (`6c011e0`)        |
| D2  | Lar humano = `GOVERNANCE-CATALOG.md §1.A`; SSOT de máquina = `.core/governance/artifact-taxonomy.yml`                                                                                                                                                             | implementado                        |
| D3  | `artifact-kind:check` **brando** (valor inválido falha; não-classificado = advisory)                                                                                                                                                                              | implementado (`ea06931`)            |
| D4  | Classificação **conservadora** (41/78): review family + handoffs + dogfood + inventory + ambíguos resolvidos                                                                                                                                                      | implementado (`f1b4f9f`, `0f8bae5`) |
| D5  | Nome **`pre-coding-review`** (não "model-review" — evita confusão com modelo/LLM)                                                                                                                                                                                 | implementado                        |
| D6  | Família review separada por **sujeito**: `pre-coding-review` (modelo/direção, antes de codar) × `delivery-review` (entrega/PR, pré-gate); `reviewer`/`method` = **metadado**, não kind                                                                            | implementado                        |
| D7  | `research/` permanece **singular** (incontável em inglês; renomear é convenção do framework inteiro, fora do #45)                                                                                                                                                 | decidido                            |
| D8  | **Modelo de pastas** (ainda **não** executado): `falsifications/` (irmã de `research/`/`reviews/`/`gates/`) = lar de `pre-coding-review`; `evidence/` = `dogfood`; `legacy/` = `handoff-legacy` + inventários superados; `research/` = pesquisa exploratória viva | decidido, **não executado**         |
| D9  | Dimensão **`disposição`** (`living` / `evidence` / `legacy` / `open`) a adicionar no `artifact-taxonomy.yml` — torna explícito que "lixo" (debris de lacuna de processo, ex.: handoff) **não merece modelagem**                                                   | decidido, não implementado          |
| D10 | **`gates/` é o blueprint** de tipo governado saudável (ver §3)                                                                                                                                                                                                    | observação âncora                   |
| D11 | **`pr-bodies/` é fonte governada** (não projeção): fica como lar governado, **não** sob `assets/`; só **value-images** vão para `assets/pr/value-images/`                                                                                                         | decidido                            |

## 2. Aberto (precisa de decisão / é futuro)

| #   | Questão                                                                                                                                                                                                                      | Dono / quando                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| O1  | `delivery-review`: tipo distinto ou **dobra no modelo de gate review**? (é o caso-teste da pergunta A6)                                                                                                                      | model-review-contract (#45) / `internal-refactor`      |
| O2  | `inventory`: triagem **um a um** (vivo→fica/promove × superado→`legacy/`)                                                                                                                                                    | execução da reorg                                      |
| O3  | **Mapa derivado**: gerado por script a partir dos dados, alto valor, **morando na raiz da spec** (não hand-authored em `assets/`)                                                                                            | R3/G05 — `internal-refactor`/`broad-flow` (**futuro**) |
| O4  | `spec.md`/`plan.md`: viés de spec-kit. `plan.md` **narra a topologia que o `state.yml` já guarda como dado** (redundância); `spec.md` é o irredutível (intenção). "O que (e em que formato) o humano registra para iniciar?" | E1/E3, G01/G04 — **fundacional**, `internal-refactor`  |
| O5  | `assets/`: manter ou quarentenar versões superadas do mapa (`v2`/`v3` × `v4` vivo)                                                                                                                                           | execução                                               |
| O6  | `research/` no plural (padronização de pastas) — **rejeitado por ora**; se um dia, é decisão de **framework** própria                                                                                                        | futuro/framework                                       |

## 3. `gates/` como blueprint (o que "funciona de fato")

`gates/` é o molde de um tipo governado saudável — seis propriedades que `research/` não tinha **nenhuma**:

1. **um arquivo por unidade** (`c-<checkpoint>.yml`, 1 por checkpoint) — sem acúmulo/mistura;
2. **schema fixo e mínimo** (checkpoint, actor, decision, note);
3. **propósito único**;
4. **nasce como registro, não workspace** (criado _depois_ da decisão);
5. **enforçado** (`review:check`: `approved` exige zero finding high aberto);
6. **templated** (`_TEMPLATE.gate.yml`).

→ É exatamente o molde de `pre-coding-review`: um-por-unidade + schema (`subject`+`date`) + propósito único + registro-não-workspace + check + template.

## 4. Espectro de autoridade (mapa do diretório da spec)

| Camada                | Onde                                                                                        | Autoridade        | `artifact-kind`?                       |
| --------------------- | ------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------- |
| Polo governado (SSOT) | `state.yml`, `tasks.md`, `decision-brief.md`, `plan.md`, `reviews/`, `gates/`, `pr-bodies/` | máxima            | **não** — natureza vem do lar          |
| Polo projeção         | `assets/` (+ mapa-derivado-futuro na raiz)                                                  | zero (nunca SSOT) | `projection` (marca no nível da pasta) |
| Meio advisory         | `research/`, `falsifications/`, `evidence/`, `legacy/`                                      | baixa             | **sim** — é onde a tag importa         |

Lição: o `artifact-kind`/`disposição` existe **para domar o meio**; os polos já são claros.

## 5. Escopo — #45 vs futuro

- **#45 (agora):** fechar o **tipo `pre-coding-review`** (schema `subject`+`date`, check, doc, exemplo, enriquecer os ~10). A **reorg de pastas** (D8) exige **DEC** que autorize a exceção escopada ao G21 e supersede o adiamento do `research/README §Débito` — a owner decide se traz a reorg para o #45 ou defere.
- **Futuro (deliberado, fora do #45):** mapa derivado (O3), redesenho `spec.md`/`plan.md` (O4), reorg ampla por disposição se deferida, plural de pastas (O6).

## 6. Próximo artefato mínimo

**DEC-0024-G24** formalizando o que é **decidido** (D7–D11 + a dimensão `disposição`), autorizando (ou não) a reorg agora, e deixando O1/O3/O4 explicitamente **abertos**. Esta `pre-coding-review` é o insumo que precede essa DEC (o lifecycle correto: pre-coding-review → DEC → execução).
