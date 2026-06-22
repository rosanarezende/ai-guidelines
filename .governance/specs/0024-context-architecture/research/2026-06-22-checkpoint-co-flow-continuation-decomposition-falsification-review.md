# PR #44 — Revisão de falsificação da hipótese de decomposição (decidir agora, migrar depois)

Data: 2026-06-22
Spec: 0024 — context-architecture
Nó: `co-flow-continuation` (seq 11)
PR: #44 — `feat/spec-0024-co-flow-continuation`

## Natureza deste artefato

- **Revisão de falsificação pré-decisão, read-only, NÃO autoridade.** Testa uma hipótese de
  decomposição de PRs; não a implementa.
- **Não executa decisão, Ready, Human Gate, merge ou avanço.** Não move arquivos.
- **Não edita** `state.yml`/`tasks.md`/`decision-brief.md`/gates/PR/código.
- **Findings viram DEC/task/revisão governada depois.** Companheiro de
  `...artifact-taxonomy-falsification-review.md` e `...repo-tree-inventory.md` (§9).

**Hipótese avaliada (enunciado da owner):** (a) PR #44 fecha a **decisão arquitetural** sobre a
taxonomia; (b) a implementação física/mecânica vai para o PR seguinte; (c) esse PR seguinte talvez
absorva a **parte de research/index/artefatos** do `dualroot-collapse`; (d) o restante
(templates, `.specify` legado, bridge/runtime) fica para uma etapa posterior.

---

## 1. Veredito curto

**Aprovar com ajustes.** O split _decidir-agora / implementar-depois_ é doutrinariamente sólido —
sustentado por ADR 0020, ADR 0025 e, de forma forte, ADR 0021. **Mas a premissa (c) é parcialmente
falsa:** a "parte de research/index" **não é separável** do `.specify` legado como o enunciado
assume — a fatia load-bearing dela **é** `.specify`. Ajuste central: desenhar o corte do próximo PR
em **"aditivo + canônico-only"** (toque zero em `.specify`, zero movimentação de arquivos
referenciados), e deixar **todo** o `.specify`-touching no `dualroot-collapse`. Além disso, #44 só
pode "decidir" sem inchar **se soltar o refactor DDD/BDD (CO-10.8.2)**.

## 2. Fatos observados (sem interpretação)

- `state.yml § topology`: `co-flow-continuation` seq 11 = **1 checkpoint**
  (`checkpoint-co-flow-continuation`, embute CO-10.8..10.10); `dualroot-collapse` seq 12 = 1
  checkpoint (`checkpoint-dualroot-collapse`, descrito como "colapso do dual-root; migração
  `.specify` + `.ai-guidelines` — `test:smoke` gateia").
- `tasks.md`: CO-10.8.1 `[x]`; **CO-10.8.2 `[/]` (em execução)** = "arquitetura interna/DDD/BDD +
  drift #8"; CO-10.9 `[ ]`; CO-10.10 `[ ]`.
- `decision-brief.md`: última decisão = **`[DEC-0024-G20]`**; **não há G21**. Nenhuma DEC menciona
  taxonomia de artefatos.
- ADR 0019: `.governance/` é root canônico; `.specify/` é legado/bridge.
- ADR 0020: governança precede execução. ADR 0025: contêiner/decisão precede o código.
- ADR 0021: "**decisões estruturantes detectadas no dogfooding entram no escopo corrente, não em
  NEXT/backlog**" (≥5 deferimentos voltaram com custo maior).
- ADR 0026: projeção ≠ entidade de 1ª classe (não reificar; só separar se remove drift).
- `governance-foundation.md` §4.5: contrato de promoção já existe — research consolidada →
  `research-library/<domínio>/` + `research-index.md`; "**não crie pastas por spec**"; `.specify`
  é read-only/migração.
- Contagens de referência (snapshot, `repo-tree-inventory.md` §9): `.specify/` 578 linhas (**32 em
  `src/`**); `.governance/` 993 (**128 em `src/`**); `research-library/` 24 (1 em `src/`); **~17
  citações em ADRs de `.core/`** apontam para `.specify/specs/researchs/*.md`; 207 refs a
  arquivo `.specify` concreto; 176 refs a `research/AAAA-….md`.

## 3. Interpretação — tarefa a tarefa

### 3.1 Faz sentido #44 decidir a taxonomia agora, sem migração física? → **Sim, com condições.**

Três doutrinas convergem PARA decidir agora:

- **ADR 0020 / ADR 0025:** decisão precede execução; o contêiner fecha a decisão antes do código.
- **ADR 0021 (forte):** a taxonomia **emergiu do dogfood deste PR** (a sobrecarga de `research/`).
  Pela regra "decisão estruturante do dogfooding entra no escopo corrente", **deferi-la seria o
  anti-padrão** que custou caro ≥5×. Isto é o argumento mais forte a favor da hipótese.

Condições (senão recai nos meus findings anteriores): **(i)** precisa de **DEC** que escope a
decisão (hoje #44 = CO-10.8 DDD/BDD por G20, não "taxonomia"); **(ii)** decidir só o **núcleo
maduro**, deferindo sub-questões abertas; **(iii)** soltar o refactor DDD/BDD para não inchar.

### 3.2 Conflitos

- **`state.yml`/`tasks.md`/`decision-brief`:** não é "contradição" — é **ausência de governança**.
  A hipótese muda topologia (split do `dualroot-collapse`, novo PR) e re-escopa #44; isso **exige
  DEC + reconciliação** (como G18/G20 fizeram). Hoje a topologia diz outra coisa (1 nó
  dualroot-collapse; #44 = DDD/BDD). Conflito resolvível só por decisão governada.
- **ADR 0025 / ADR 0020 / ADR 0021:** **reforçam** a hipótese (ver 3.1). Sem conflito.
- **ADR 0019:** compatível — o canônico já existe; mas é a fonte do **problema de seam** (3.3): a
  research legada vive em `.specify`.
- **ADR 0026:** sem conflito _se_ a implementação usar `kind:` em frontmatter (fonte única), não um
  registro paralelo; e não duplicar o contrato de promoção (§4.5) nem a review-policy. Watch-item.
- **PIT-0001:** sem conflito direto, mas split de nós + novo PR cria topologia que `next[]`/narrativa
  têm de acompanhar **atomicamente**, senão reincide o mis-binding. Watch-item.
- **PIT-0008:** não se aplica (não é restrição de evento sobre estado contínuo). Sem conflito.

### 3.3 O próximo PR deve absorver "parte do dualroot-collapse"? → **Falsifico a separabilidade limpa.**

"research/index/artefatos" **não é um bloco movível único**. Ele se parte em duas fatias:

- **Fatia canônica/aditiva (segura no próximo PR):**
  - `kind:` no frontmatter dos artefatos — aditivo, zero movimentação. **Sim.**
  - reparar o índice canônico stale (`enforcement-surfaces` não indexado) — só `.governance`. **Sim.**
  - estabelecer/iniciar **enforcement** do contrato de promoção (`research-index:check`) — `.governance`. **Sim.**
  - rotular projeções visuais como não-autoridade (`kind: projection`) — aditivo. **Sim.**
  - promover os 2 candidatos já estáveis (`projection-vs-entity-lens`→ADR 0026;
    `epistemic-commitment-model`→PIT-0007) para `research-library/<domínio>` — pontual. **Sim.**
- **Fatia legada (É `.specify`; NÃO separável):**
  - migrar `.specify/specs/researchs/*` (48 arq.) → `research-library/` — **quebra ~17 citações de
    ADR** + move arquivos referenciados.
  - unificar/retirar o `research-index.md` **legado** (que se autodeclara "Fonte de Verdade").
    Essas **são** `dualroot-collapse`; rotulá-las "research/index" não as torna canônico-only.

Sobre os outros itens listados:

- **`kind:` ou mecanismo equivalente:** núcleo da implementação; aditivo. **Próximo PR.**
- **`research-library`:** estrutura/enforcement/promoção pontual = próximo PR; **backfill amplo da
  legada = `dualroot-collapse`.**
- **model-review/pre-coding review:** é mudança de **review-policy** (capacidade≠obrigação,
  PIT-0012), **não** file-move. **Decidir** o _kind_ em #44, mas **implementar** o tipo governado é
  eixo separado — **não** empacotar maquinaria de policy num PR de etiquetagem.
- **mapas/projeções visuais:** rotular como não-autoridade = aditivo (próximo PR); construir o
  `SpecMapViewModel` (gerador determinístico) = código maior, **separável/depois**.

### 3.4 O que fica FORA do próximo PR (→ `dualroot-collapse` ou separado)

Migração da research legada (`.specify/specs/researchs`) + unificação do índice legado;
consolidação de templates (4 locais; 183+113 refs); remoção da ponte de runtime (~32 arq. `src/`
tocam `.specify`); remoção física de `.specify`; `taxonomy-removal` (G02, já é housekeeping);
implementação do tipo governado `model-review` (review-policy); gerador `SpecMapViewModel`.

## 4. Riscos (os 6 pedidos)

| Risco                     | Veredito                                                                                | Mitigação                                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **#44 grande demais**     | Real **se** mantiver o refactor DDD/BDD (CO-10.8.2) junto da decisão                    | #44 = só decisões + drift (feito); refactor sai por DEC                                                                                 |
| **Decisão sem evidência** | Real para sub-questões abertas (model-review governado, enum exato, "pastas algum dia") | Decidir só o núcleo maduro; deferir o aberto com gatilho nomeado                                                                        |
| **Duplicar modelos**      | Real                                                                                    | DEC **deriva de** ADR 0019/0026 + §4.5; resolver as **2 ordens de autoridade** divergentes em 1                                         |
| **2ª fonte de verdade**   | Controlável                                                                             | `kind:` em frontmatter (fonte única), não registro paralelo; mapa = não-autoridade                                                      |
| **Quebrar referências**   | **Zero por construção** se o próximo PR for aditivo/canônico-only                       | O seam "não toca `.specify`, não move arquivo referenciado" mantém breakage=0                                                           |
| **dualroot sem escopo**   | **É o maior risco da hipótese**                                                         | Desenhar o seam por `.specify`-touch (não por "research vs templates"); assim o `dualroot-collapse` **continua íntegro e bem-definido** |

## 5. Recomendação final — **Aprovar com ajustes** (decomposição refinada)

A hipótese acerta no eixo (decidir↔implementar) mas erra o seam (research↔.specify). Decomposição
proposta:

| Etapa                                   | Conteúdo                                                                                                                    | Toca `.specify`? | Move arquivo referenciado?         |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------------------------------- |
| **PR #44 — decisão**                    | DEC da taxonomia (núcleo maduro) + model-boundaries + inventário + drift (feito). **Refactor DDD/BDD sai.**                 | não              | não                                |
| **PR seguinte — implementação aditiva** | `kind:` frontmatter; reparar índice canônico; `research-index:check`; rotular projeções; promover 2 candidatos prontos      | **não**          | **não**                            |
| **`dualroot-collapse` (seq 12)**        | migrar `.specify/researchs`→library; unificar índice legado; consolidar templates; remover ponte runtime; apagar `.specify` | sim              | sim (com repointe no mesmo commit) |
| **Separados/depois**                    | tipo governado `model-review` (review-policy); gerador `SpecMapViewModel`                                                   | —                | —                                  |

**Reenquadramento-chave:** o "PR seguinte" **não é "parte do `dualroot-collapse`"** — é a
**implementação aditiva da taxonomia**, que por acaso é canônico-only. O que é genuinamente
dualroot (a dimensão `.specify`) **permanece inteiro** no nó seq 12. Isso elimina o risco "dualroot
sem escopo": em vez de esvaziar o nó, mantém-no coeso.

## 6. Perguntas que exigem decisão humana

1. A decisão da taxonomia vira **`[DEC-0024-G21]`** e o refactor DDD/BDD (CO-10.8.2) **sai** de #44?
   (sem isso, #44 incha — risco nº 1)
2. O seam do próximo PR é **"aditivo/canônico-only"** (recomendado) ou você quer mesmo puxar a
   migração da research legada (que é `.specify`, quebra ~17 ADRs)?
3. `model-review` como **tipo governado** entra agora (review-policy) ou só o _kind_ é reconhecido e
   o tipo fica para depois?
4. O próximo PR é **nó novo** na topologia ou sub-checkpoint de `co-flow-continuation`? (define como
   `state.yml`/`tasks.md` são reconciliados)
5. Decidir o núcleo e **deferir explicitamente** as sub-questões abertas — aceitável, ou você quer
   fechar tudo de uma vez (com o risco "decisão sem evidência")?

## 7. Fronteira explícita

Este arquivo **não decide nada** e não move/edita artefatos. Avalia uma hipótese de decomposição e
registra findings. Para ter efeito, vira **DEC** (taxonomia + topologia do split), **task**
(implementação aditiva) e/ou **revisão governada** (tipo `model-review`). Em divergência, vencem
`state.yml`/`tasks.md`/`decision-brief.md`/`reviews/`/`gates/` e Git/GitHub.

_Read-only. Nenhum arquivo de estado, tarefa, gate, PR ou código foi alterado._
