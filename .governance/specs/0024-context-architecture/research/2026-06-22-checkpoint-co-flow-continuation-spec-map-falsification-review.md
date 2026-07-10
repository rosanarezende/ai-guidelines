---
artifact-kind: pre-coding-review
subject: "falsificacao pre-implementacao do modelo de mapa e inventario do PR 44"
date: 2026-06-22
disposition: evidence
---

# PR #44 — Revisão de falsificação pré-implementação do modelo de mapa/inventário

Data: 2026-06-22
Spec: 0024 — context-architecture
Nó: `co-flow-continuation` (seq 11)
PR: #44 — `feat/spec-0024-co-flow-continuation` (base: `feat/spec-0024-co-flow-convergence`)

## Natureza deste artefato (ler antes de tudo)

- **Revisão de falsificação pré-implementação.** Leitura adversarial e read-only do modelo
  visual + documental, feita _antes_ de qualquer refactor arquitetural. Não é research comum
  (não coleta evidência nova; testa as alegações dos artefatos) e **não** é Technical
  Audit / Architectural Review / Security de gate (não está sob `review-policy.yml`, o nó não
  está em CO-10.10 e não há Human Gate associado).
- **Narrativa de apoio, NÃO autoridade.** Em qualquer divergência, vencem `state.yml`,
  `tasks.md`, `decision-brief.md`, Git/GitHub e os comandos governados. Este arquivo não é SSOT.
- **Não executa decisão, Ready, Human Gate, merge ou avanço.** Nenhum efeito mutante. Não
  altera topologia, cursor, readiness, tasks, gates ou body de PR.
- **Findings precisam ser resolvidos depois** por DEC / task / revisão governada. Este arquivo
  apenas os registra; resolvê-los é trabalho governado posterior (owner). Ver § 5–7.

**Responde:** as "perguntas para revisão externa" do inventário (§10) e as "decisões abertas"
do mapa (§5).

**Artefatos revisados:** `assets/spec-0024-map-v2.html`;
`research/2026-06-22-checkpoint-co-flow-continuation-spec-map-model.md`;
`research/2026-06-22-checkpoint-co-flow-continuation-lifecycle-model-inventory.md`;
`research/2026-06-21-checkpoint-co-flow-continuation-drift-classification.md`;
`state.yml`; `tasks.md`; `plan.md`; `decision-brief.md`; body real do PR #44 (via `gh pr view 44`);
ADR 0018/0021/0022/0025/0026; PIT-0001/0007/0008.

---

## 1. Veredito

**Sim, com correções — e as correções precedem o uso do mapa como base dos próximos PRs.**

A modelagem _conceitual_ (nó topológico × checkpoint × PR; nomes semânticos no lugar de
`CO-10.8.*`; mapa como projeção, não SSOT) é coerente com o repo e **reforçada** por doutrina
aceita (ADR 0025, ADR 0026, PIT-0008). Não há conflito de princípio.

O que falha é o **estado de reconciliação**: a decomposição semântica e a "Opção A do #44"
existem só no mapa + 2 research, **não estão em nenhuma fonte governada**, **não têm DEC**,
**contradizem `tasks.md`/`state.yml`** e **não batem com o body real do PR #44**. Usar o mapa
como base nesse estado inverte a seta projeção→realidade — o anti-padrão que ADR 0025/0026 e
PIT-0001 existem para barrar.

- **Como decisão de modelo:** madura; pode ser cravada (via DEC) essencialmente como está.
- **Como base topológica dos PRs 45/46/47:** ainda não, enquanto os bloqueadores de § 5 abertos.

A correção é barata e delimitada (1 decisão + reconciliar 3 arquivos + reescrever o body), não
um retrabalho de modelagem.

## 2. Fatos observados (e o que sobreviveu à falsificação)

- **Sobreviveu:** o Human Gate de `co-flow-convergence` (PR #43) é real e `approved`
  (2026-06-21) — `gates/c-co-flow-convergence.yml`. A afirmação do mapa "Nó 10 aprovado por
  Human Gate" e a do `state.yml` resistem.
- `state.yml § topology` modela o nó ativo com **um único** checkpoint
  `checkpoint-co-flow-continuation` embutindo CO-10.8..CO-10.10.
- `tasks.md` mantém `CO-10.8.2` (arquitetura interna/DDD/BDD) marcado **`[/]` EM EXECUÇÃO**.
- Última decisão governada = **`[DEC-0024-G20]` (2026-06-21)**; **não há G21**. G20 crava
  CO-10.8 = "arquitetura interna/DDD/BDD visual".
- Os 8 nomes semânticos (`drift-diagnosis-and-repair`, `lifecycle-model-inventory`,
  `checkpoint-model-boundaries`, `lifecycle-architecture-refactor`, `broad-flow-falsification`…)
  aparecem em **exatamente 3 arquivos**: o mapa + os 2 research. Zero em SSOT.
- **Body real do PR #44:** escopo declarado = drift diagnosis/repair + `pr-body:create`
  templates + contratos de validação diária + guards anti-duplicação + classificação de
  `research/`. **Não menciona** "decisão de modelo + inventário" como entrega.

## 3. Divergências (mapa × inventário × state.yml × tasks.md × plan × body do #44)

| Tema                     | Mapa V2 / Inventário         | `state.yml`            | `tasks.md`                                             | `decision-brief`          | Body PR #44                          |
| ------------------------ | ---------------------------- | ---------------------- | ------------------------------------------------------ | ------------------------- | ------------------------------------ |
| Decomposição do nó 11    | **8 checkpoints semânticos** | **1** checkpoint       | CO-10.8.1 `[x]`, **CO-10.8.2 `[/]`**, 10.9/10.10 `[ ]` | CO-10.8..10.10 (G20)      | `checkpoint-co-flow-continuation`    |
| Refactor (CO-10.8.2)     | empurrado p/ "PR posterior"  | embutido no nó ativo   | **EM EXECUÇÃO `[/]`**                                  | CO-10.8 = DDD/BDD (G20)   | fora do escopo                       |
| Recorte "Opção A" do #44 | "decisão registrada / done"  | ausente                | ausente                                                | **sem DEC (para em G20)** | não menciona                         |
| Entrega primária do #44  | "modelo + inventário"        | "primeiro foco: drift" | drift + DDD/BDD                                        | —                         | drift + pr-body + validação + guards |
| `integration-final`      | **omitido**                  | nó terminal (seq null) | presente (R8)                                          | —                         | —                                    |
| Drift #8                 | **não re-hospedado**         | —                      | **CO-10.8.2**                                          | —                         | "classificação inicial de research/" |
| Nomenclatura `CO-10.8.*` | abandonar                    | —                      | **ainda em uso**                                       | G20 usa CO-10.8..         | —                                    |

## 4. Findings por severidade (com método de falsificação)

### 🔴 F1 — BLOQUEADOR: decomposição e "Opção A" não estão em nenhuma fonte governada (sem DEC)

**Falsifiquei:** `grep` dos 8 nomes → só no mapa + 2 research, zero em SSOT. `grep` no
`decision-brief.md` → cadeia para em `[DEC-0024-G20]`; não há G21. O mapa afirma "Decisão
registrada para o PR #44" e marca a Opção A como `done`, mas o ledger governado não tem esse
registro. Precedente da própria spec (G19/G20 registraram recortes como DEC) implica que um
recorte do #44 exigiria `[DEC-0024-G21]`.
**Por que bloqueia:** se os PRs 45/46/47 nascerem desses nomes, o mapa vira a origem de facto da
topologia — projeção liderando a realidade (viola ADR 0026 §2 e a tese da 0024) e reincide em
PIT-0001 (retomada lê nomes narrados que a topologia derivável não confirma).

### 🔴 F2 — BLOQUEADOR: conflito direto com `tasks.md`/`state.yml` sobre CO-10.8.2

**Falsifiquei:** `tasks.md` marca `CO-10.8.2` como `[/]` (em execução); `state.yml` embute
CO-10.8..10.10 num único checkpoint; `[DEC-0024-G20]` (1 dia antes) cravou CO-10.8 = DDD/BDD. O
mapa re-decompõe isso em `model-boundaries` + `inventory` + `confrontation` + `refactor` + `bdd`
e empurra o refactor para depois.
**Implicação:** "Opção A = #44 sem refactor pesado" só é verdade se `tasks.md`/`state.yml` forem
reconciliados e um novo DEC autorizar abandonar `CO-10.8.*`. Hoje a SSOT viva diz que o refactor
está _em execução dentro do #44_ — o oposto da Opção A.

### 🔴 F3 — ALTO: o body real do #44 não corresponde à narrativa "modelo + inventário"

**Falsifiquei:** `gh pr view 44`. O body lista como entregue drift doctor + `pr-body:create`
templates + contratos de validação diária + guards + classificação de `research/`; "decisão de
modelo + inventário" não aparece. O critério de saída do **próprio inventário** (§11: "o PR body
declarar claramente o que o PR #44 fecha") não está satisfeito. O #44 já carrega 4–5 frentes de
implementação → a tese "evita o tamanho do #43" é parcialmente contrariada pelo próprio PR.

### 🟡 F4 — MÉDIO: nome enganoso — "Opção A" está sobrecarregado

**Falsifiquei:** `grep "Opção A"` → já existe uma "Opção A" load-bearing (Human Gate #35 /
2026-06-07 = "CO integra a cauda da 0024"; `gates/c-cli-cutover.yml`, `plan.md:27`). Reusar o
rótulo para o recorte do #44 colide num repo que aposentou "PR-N" justamente por ambiguidade.

### 🟡 F5 — MÉDIO: drift #8 fica órfão no novo modelo

**Falsifiquei:** `drift-classification.md` crava "#8 fica explicitamente para CO-10.8.2";
`tasks.md` confirma. Nenhum dos 8 checkpoints semânticos re-hospeda o drift #8; o nó
`housekeeping` do mapa é sobre pontes/scripts legados, não sobre `research/` contradizer o
estado. Pior: o body do #44 já faz "classificação inicial de research/" (= trabalho do drift #8)
→ está sendo _executado_ mas _sumiu_ do modelo de checkpoints.

### 🟡 F6 — MÉDIO: o mapa omite `integration-final`

**Falsifiquei:** `state.yml` tem `integration-final` (terminal, seq null) após
`knowledge-readiness`. O mapa termina em "Nó 16 · knowledge-readiness" descrito como
"fechamento da spec". O boundary onde o merge único modo `unit` vive (ADR 0024, `review.md` R8)
desaparece da projeção.

### 🟡 F7 — MÉDIO: re-litiga doutrina já aceita (ADR 0025)

**Falsifiquei:** o mapa lista "formalizar que PR é contêiner e checkpoint é unidade de entrega?"
como pendência (decision-box, item 3). Mas ADR 0025 (Aceita) já cravou "contêiner de PR precede
o código". O modelo deveria derivar de ADR 0025, não reabri-lo.

### ⚪ F8 — BAIXO: distinção nó/checkpoint visualmente borrada

§1 define os 3 papéis corretamente, mas o timeline renderiza nós futuros com o mesmo card
`.checkpoint` e prefixo "Nó N" usando o número de `sequence` — enquanto a regra §4 do próprio
mapa diz "sequência é atributo do nó, não parte do nome". Tensão interna leve.

### ⚪ F9 — BAIXO: status incoerente no mapa

`lifecycle-model-inventory` está `active`/"candidato próximo" embora o artefato já exista
completo e `checkpoint-model-boundaries` esteja como "decisão atual". As tags não refletem o que
já foi produzido.

### ⚪ F10 — BAIXO: matriz de transições é majoritariamente happy-path

A matriz (inventário §6) não modela explicitamente o loop de rejeição/changes-requested
(Ready→Gate→rejeitado→volta a work), retomada/offline-degradado (citado em tasks.md CO-10.4,
ausente da matriz) nem rollback/abandono de checkpoint.

## 5. Bloqueadores (para usar o mapa como base dos próximos PRs)

1. **Sem DEC governado** registrando "abandonar `CO-10.8.*` + adotar checkpoints semânticos +
   recorte Opção A do #44" (F1).
2. **`tasks.md`/`state.yml` não reconciliados** com a decomposição; CO-10.8.2 segue `[/]`
   contradizendo "refactor fica para depois" (F2).
3. **Body do #44 não declara** o recorte modelo+inventário, violando o critério §11 do próprio
   inventário (F3).

## 6. Recomendações (trabalho governado posterior — não executado aqui)

1. Registrar **`[DEC-0024-G21]`**: abandonar `CO-10.8.*` como checkpoint real; adotar os slugs
   semânticos; cravar o recorte do #44.
2. Reconciliar `state.yml § topology` e `tasks.md` com a decomposição decidida (mover/encerrar
   `CO-10.8.2 [/]` conforme a decisão).
3. Reconciliar `state.yml § next` para parar de narrar "CO-10.8..CO-10.10" se o modelo mudou
   (evita reincidência de PIT-0001).
4. Atualizar o body do #44 declarando o que fecha e o que fica fora (critério §11).
5. Re-hospedar o drift #8 num checkpoint semântico explícito (higiene de artefatos ≠
   `housekeeping` de pontes legadas).
6. Renomear "Opção A" para algo desambiguado (ex.: `recorte-modelo-inventario-#44`).
7. Incluir `integration-final` no mapa (ou rotular `knowledge-readiness` como não-terminal).
8. Citar ADR 0025 e remover a "decisão pendente" sobre PR-como-contêiner.

## 7. Perguntas que precisam de decisão humana

1. A re-decomposição de CO-10.8 em ~5 checkpoints semânticos vira `[DEC-0024-G21]`, ou
   mantém-se `CO-10.8.*` apenas anexando slugs legíveis?
2. O #44 fecha só "modelo + inventário", ou assume as frentes que já estão no diff (pr-body
   templates, contratos de validação, guards, classificação de research/)?
3. CO-10.8.2 (refactor, hoje `[/]`) sai do #44 para PR posterior, ou continua?
4. Drift #8 pertence a `housekeeping`, a um checkpoint novo de higiene, ou segue no refactor?
5. O mapa estático versionado é provisório até o `SpecMapViewModel` gerado, ou o HTML manual em
   `assets/` é permanente? (define se F1 é transitório ou estrutural)

## 8. Dogfood / meta-finding — falta um tipo governado de review pré-codificação

**Observação estrutural (esta própria revisão é a evidência).** Ao tentar registrar este
artefato, ficou claro que a taxonomia atual de artefatos/reviews **conflaciona cinco coisas
distintas** num mesmo balde (`research/`):

| Tipo                                   | O que é                                                           | Autoridade                              | Onde mora hoje                                    |
| -------------------------------------- | ----------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------- |
| Pesquisa / evidência / dogfood         | coleta de fato, exploração, log de jornada                        | nenhuma                                 | `research/`                                       |
| **Review pré-codificação / modelagem** | avaliação adversarial de um _modelo/projeto_ antes de implementar | apoio, não-autoridade                   | **sem casa própria** → cai em `research/`         |
| Review de gate (TA / AR / Security)    | avaliação da _implementação_ de um checkpoint sob policy          | findings com ciclo; destrava Human Gate | `reviews/c<N>-<role>.yml` + `review-policy.yml`   |
| Decisão humana                         | recorte/autorização governada                                     | autoridade máxima                       | `decision-brief.md` (DEC) + `gates/` (Human Gate) |
| Projeção visual                        | leitura humana derivada do estado                                 | nenhuma (projeção)                      | `assets/` (mapa)                                  |

O inventário (`...lifecycle-model-inventory.md` §2 "Fronteiras de modelo") tem **uma única
linha "Review"** apontando para `reviews/` + `review-policy.yml` — ela cobre o **review de
gate**, mas **não distingue** o review pré-codificação. Resultado: uma falsificação como esta
não tem tipo governado. Ela não é:

- **research comum** (é avaliativa/adversarial, não coleta de evidência);
- **TA/AR/Security de gate** (o nó não está em CO-10.10; não é exigida por policy; não destrava
  Human Gate);
- **DEC** (não decide nada; alimenta uma decisão futura).

**Por que isto importa (e por que não é só renomear — passa o crivo de ADR 0026 §2):** o
critério de ADR 0026 para reificar um tipo é "remove drift/cópia/sincronização-manual real?".
Aqui remove: `research/` está **comprovadamente** sobrecarregado — é a mesma classe do **drift
#8** (`research/` contradiz o estado oficial). Dar casa própria ao review pré-codificação:

- separa **avaliação** de **evidência** (hoje misturadas), atacando o drift #8 na origem;
- deixa explícito que esta revisão é **não-autoridade** sem depender de um cabeçalho manual em
  prosa (hoje a única salvaguarda é o § "Natureza" deste arquivo);
- permite que a **review-policy** trate review pré-codificação como _capacidade ofertada_, não
  _obrigação_ (PIT-0012: capacidade ≠ obrigação), distinta do TA/AR/Security required de gate.

**Encaminhamento proposto (governado, não executado aqui):** registrar este caso como evidência
para uma revisão da **política de reviews e artefatos** da 0024 — candidato a DEC próprio e/ou a
um checkpoint dedicado (provável vizinho de `lifecycle-code-confrontation`/`review-policy`).
Critérios mínimos para o novo tipo, se promovido: determinístico quanto a _onde mora_; rótulo de
não-autoridade estrutural (não só textual); separado da obrigatoriedade (catálogo ≠ requisito);
e que **não** vire SSOT paralela (ADR 0026 / inventário invariante #10). **Não auto-promover**
(guard §3 de ADR 0026): sobe a DEC por decisão da owner, não por contagem.

## 9. Conclusão

O modelo conceitual está pronto para ser cravado; a topologia derivada dele **não** está pronta
para servir de base enquanto os 3 bloqueadores de § 5 não forem fechados por trabalho governado.
Em paralelo, esta revisão expôs um gap real de modelagem (§ 8): o framework precisa de um **tipo
governado de review pré-codificação**, distinto de research comum e do TA/AR/Security de gate —
e este caso é a primeira evidência para reorganizar a política de reviews/artefatos da 0024.

_Revisão read-only. Nenhum arquivo de estado, tarefa, gate ou PR foi alterado na produção deste
registro._
