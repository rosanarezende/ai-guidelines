---
artifact-kind: pre-coding-review
---

# PR #45 — Revisão de nomenclatura e confronto para o mapa V4

Data: 2026-06-22
Spec: 0024 — context-architecture
Nó/cursor: `artifact-taxonomy-and-model-review-contract` (PR #45, seq 12)
Artefato gerado: `assets/spec-0024-map-v4.html`

## Natureza deste artefato

- **Revisão de confronto + investigação de nomenclatura, read-only, NÃO autoridade.** Embasa a V4;
  não a torna SSOT.
- **Não registra DEC, não altera `state.yml`/`tasks.md`/`decision-brief.md`/gates/topologia.**
- **Findings viram DEC/task depois.** A V4 é projeção experimental de vocabulário, pendente de DEC.

## 1. Por que uma investigação de nomenclatura

A revisão de confronto da V3 apontou que **"Fase" colide com usos legados** e que um nível acima de
checkpoint só é seguro se for **derivado** de `state.yml`, não autoridade nova. Antes de codar a V4,
medi a colisão empírica de cada candidato e escolhi um nome de menor risco.

## 2. Colisão empírica (linhas em arquivos `.md`/`.yml`/`.html` versionados — `git grep -wic`)

| Candidato   | Linhas | Arquivos | Leitura                                                                                     |
| ----------- | -----: | -------: | ------------------------------------------------------------------------------------------- |
| `bloco`     |   1058 |      167 | **extremo** — `sub-bloco`, `Bloco E` é vocabulário-núcleo de ADR/0023. Descartar.           |
| `fase`      |    543 |      102 | **forte** — `Fase de Absorção/Review/Encerramento` no próprio `tasks.md`.                   |
| `camada`    |    201 |       69 | alto — camadas L1–L4 de enforcement (ADR 0021).                                             |
| `ciclo`     |    195 |       94 | alto — `ciclo de vida`/lifecycle.                                                           |
| `pacote`    |    114 |       50 | alto — npm package.                                                                         |
| `trilha`    |     68 |       36 | médio — `plan.md`: "Trilha (SSOT = state.yml)".                                             |
| `movimento` |     55 |       34 | médio — `próximo movimento` (gates/state).                                                  |
| `frente`    |     42 |       19 | **baixo** — maioria é o idioma "à frente"; já há `Frente C+D`/`Frente #3` como agrupamento. |
| `jornada`   |     30 |       14 | médio — consumer journeys/jornadas reais.                                                   |
| `marco`     |      6 |        4 | baixíssimo, mas **semântica errada** (ponto/milestone, não span).                           |
| `segmento`  |      3 |        2 | baixíssimo, mas **seco/técnico** (o pedido proíbe burocrático).                             |

## 3. Avaliação por critério

| Critério                              | `Frente` (escolhido)            | `Fase` (descartado)                    | `Bloco` (descartado)          |
| ------------------------------------- | ------------------------------- | -------------------------------------- | ----------------------------- |
| Clareza humana                        | alta ("frente de trabalho")     | alta, mas ambígua no repo              | baixa (técnico)               |
| Baixa colisão                         | **sim** (42, e idiomática)      | não (543, legado em `tasks.md`)        | não (1058)                    |
| Agrupa vários nós/checkpoints         | sim (span de trabalho)          | sim                                    | sim                           |
| Compatível com `state.yml § topology` | sim (rótulo derivado sobre nós) | sim                                    | sim                           |
| Fácil no site/mapa                    | sim ("Frente 5")                | sim                                    | sim                           |
| Risco de SSOT paralela                | baixo se derivado               | médio (já há "Fase" com outro sentido) | alto (confunde com sub-bloco) |

## 4. Escolha

**Nível acima de checkpoint = `Frente`.** Hierarquia testada na V4:
**Spec › Frente › Checkpoint › Etapa › Tarefa**, com **PR** como contêiner de revisão (não nível).

- **Por que `Frente`:** menor colisão real entre os nomes com semântica de _span_; já tem
  **precedente alinhado** no repo (`Frente C+D`/`Frente #3` = agrupamento de trabalho de hardening);
  linguagem humana natural; agrupa vários nós sem virar termo de grafo (evita "nó") nem reusar
  "Fase".

**2 alternativas descartadas:**

1. **`Fase`** — colisão forte (543 linhas/102 arquivos), e o pior caso é dentro do próprio
   `tasks.md` (`Fase de Absorção/Review/Encerramento`, com numeração e granularidade diferentes).
   Mantê-la exigiria desambiguar em todo handoff/retomada — risco de PIT-0001 (narrativa lida como
   contrato). **Como evitar a colisão, se a owner insistir em `Fase`:** renomear as fases legadas do
   `tasks.md` para "Estágios do lifecycle da spec" (Setup/Absorção/Review/Encerramento) e reservar
   "Fase N" só para a macro-sequência — mas isso edita `tasks.md` e é mais caro que adotar `Frente`.
2. **`Bloco`** (e `Camada`) — colisão extrema (1058/201 linhas); `sub-bloco`/`Bloco E` e as camadas
   L1–L4 são vocabulário-núcleo de ADR 0021/0023. Reusar criaria confusão ativa.

_Menções descartadas por encaixe:_ `Marco` (ponto, não span); `Segmento` (seco); `Etapa maior`
(colide com "Etapa", que já é o nível abaixo do checkpoint); `Ciclo`/`Jornada`/`Movimento`/`Trilha`
(colisão média com lifecycle/consumer-journey/`próximo movimento`/`Trilha SSOT`).

## 5. Achados de confronto que a V4 incorpora (não esconde)

1. **`Frente` é derivada, não autoridade.** Uma Frente = conjunto ordenado de nós de
   `state.yml § topology` com um rótulo humano. A V4 declara isso e linka cada checkpoint à sua
   **casa governada**.
2. **Tensão do #45 exposta:** `state.yml` comenta que `artifact-taxonomy-and-model-review-contract`
   "não é um novo nó topológico", mas o estrutura com `sequence: 12` sob `active`. A V4 **mostra**
   essa incoerência na seção "Tensões", em vez de escondê-la agrupando #44+#45.
3. **Gaps só entram com disposição (GG-0005):** absorver / virar etapa / virar checkpoint / virar
   Frente futura / rejeitar por DEC. Gap sem disposição = débito silencioso.
4. **Firmeza decrescente:** Frentes 5–6 firmes; 7–8 são intenção revisável (a história da 0024
   reescreveu a cauda ≥6×: G08/G10/G16/G18/G19/G20/G21).
5. **Risco de plano-sombra:** a V4 é projeção experimental; em divergência vencem
   `state.yml`/`tasks.md`/`decision-brief`/`gates`/Git.

## 6. O que a DEC futura precisa resolver (não decidido aqui)

- Adotar/rejeitar `Frente` como vocabulário e definir a **regra de derivação** (Frente = nós).
- Resolver a tensão estrutural do #45 (nó **ou** checkpoint-de-nó, não ambos).
- Resolver a colisão "Fase" no `tasks.md` se algum vocabulário "Fase" sobreviver.
- Definir a regra de **firmeza** (firme/revisável) como atributo, não decomposição fixa da cauda.

## 7. Fronteira explícita

Esta revisão e a V4 **não decidem nada** e não alteram fontes governadas. A V4 é maquete de
vocabulário para decisão humana futura. Em divergência, vence o estado governado.
