---
dec: DEC-0024-G25
nature: decided-model
status: draft (corpo compilado da DEC; ainda NÃO cravada no decision-brief)
date: 2026-06-24
grounded-by:
  - research/2026-06-24-intent-brief-work-initiation-artifact.md
  - research/2026-06-24-governed-work-flow-model.md
---

# DEC-0024-G25 (corpo decidido) — Modelo de fluxo do trabalho governado

> **Natureza:** **decision-class** (corpo compilado de uma DEC), **não `research`** — por isso **não
> carrega `artifact-kind`** (deriva a natureza de ser corpo de DEC). **Compila, não resume:** consolida
> o que ficou **decidido** nas research de grounding, descartando o vai-e-vem da iteração mas
> **preservando o raciocínio/FATO**. As research permanecem como **trilha datada** (grounding via
> `grounded-by`); esta é a **superfície que se lê** para saber "o que está decidido". **Status: draft**
> — vira `Resolved` quando a owner cravar a DEC no `decision-brief.md`.

## Pergunta

Qual artefato o humano alimenta para **iniciar um trabalho** (substituto do `spec.md`, enviesado por
spec-kit), e como o fluxo `intent → research → decision → tasks` se modela **através dos 7 tipos** —
como prosa ou como **grafo tipado**?

## Princípio-mãe

**Modelagem como indexação, não prosa.** Artefato = **nó**; relação = **aresta tipada como dado**;
otimiza-se para a **consulta (o fim)**, não para a facilidade de escrever agora. (Tese detalhada em
`governance-self-index` → consolidação do grafo.)

## Decidido

### D1 · `intent-brief` é o artefato de abertura

Substitui o papel do `spec.md`. Lastro: _commander's intent_ (o "porquê + resultado" irredutível) +
família `-brief` (par de `decision-brief`). **Schema de 3 camadas:**

- **Kernel (4 linhas — único obrigatório):** _Pretendemos ⟨resultado⟩ · fazendo ⟨abordagem⟩ · saberemos
  por ⟨sinal⟩ · pronto quando ⟨critério⟩._
- **Espinha (recomendada):** problema · resultado desejado · limite/appetite · sinal de sucesso.
- **Corpo por kind (advisory):** menu de prompts por tipo; campos já exigidos no domínio (`hypothesis`/
  `successMetrics`/`severity`) reaparecem aqui sem rigidez nova.

**Densidade regula a burocracia (já no modelo):** Dense (`delivery`/`experiment`/`spike`/`incident`) →
**arquivo**; Virtual (`proposal`/`patch`/`fix`, workspace proibido) → **inline/ledger**.

### D2 · Pilar `spec → delivery`; umbrella mantém `kind`

`spec` ecoava o **documento**, não a **natureza** (os 6 irmãos nomeiam a natureza). `delivery` é amplo
(não "feature"/"capability", que carregam escala SAFe), ecoa a ADR 0010 (_"entrega que muda
capacidade"_) e alinha com `delivery-review`. **Umbrella fica `kind`** (scan: `type` quebra a convenção
`XxxKind` e colide com o `type` de decisão/evento do `decide/`). Rename de pilar = **item 6 da ADR 0010**
(renomear por colisão sem reabrir taxonomia); **execução diferida** (toca `WorkItem.ts`, registry, catálogo).
Explicabilidade: largar o jargão **"MECE"** → _"7 tipos de trabalho; cada item é exatamente um; juntos
cobrem tudo"_; conceito falado = **"pilares de valor"** (ADR 0010 + `Pillars.test.ts`).

### D3 · O fluxo é um grafo tipado

`intent-brief --opens--> [research ⇄ finding] --resolves--> decision --authorizes--> tasks --breaks-into-->
checkpoint/etapa/tarefa`, com `state.yml § topology` como **SSOT**. **Tarefas nascem _depois_ das
decisões.** **Não-linearidade = append-only + `supersedes`:** durante a execução, uma tarefa `raises` um
novo `finding` → investigação → `decision` que `supersedes` a anterior → novas tarefas. O velho fica
`Convergido`/`Resolved` (histórico honesto); **nada se reescreve** — a não-linearidade vira topologia
rastreável (cura do drift `state ↕ tasks`).

**Percurso da pergunta (resolve "nó vs estado"):** o **`finding` é o NÓ** (a pergunta), com `status`
(`Aberto→Convergido` = o "estado" do `F-006`); **`research`/`decision` são nós-artefato** que o finding
referencia (`Evidências`/`Impacto`). `Convergido` é imutável; revisão abre **novo** finding.

### D4 · 7 tipos, um grafo, sete caminhos

Cada tipo percorre um subconjunto da cadeia; Dense percorrem mais, Virtual colapsam.

- **`experiment` é PRIMÁRIO** (em growth, o trabalho principal; entrega valor real; destinos diversos:
  `won` → `promotes-to` `delivery` herdando `hypothesis`/`successMetrics`; `lost` → clean-up/kept;
  `inconclusive` → itera). **Não** é filho de delivery — a relação é **promoção** (lateral), não subordinação.
- **Modo de investigação de um `finding`, por risco:** `research` (análise de mesa) | `spike` (PoC/
  protótipo, _"dá pra fazer?"_). O `spike` é o pilar de investigação (standalone ou aberto para resolver
  um finding); seu `learning-record` `resolves` o finding. `experiment` **não** é modo de investigação.

### D5 · Hierarquia G22 refinada

`delivery › (Frente: lente derivada opcional) › Checkpoint › (Etapa: opcional) › Tarefa`. A hierarquia é
a **decomposição da execução** (Stage 2), distinta da cadeia Stage 1.

**`Frente` = lente derivada opcional + 5 guardrails:** (1) derivada, nunca entidade armazenada
(`group-by` de `owner`/`area` no checkpoint); (2) eixo de agrupamento declarado e fechado (MECE no eixo);
(3) limiar pra aparecer (≥N checkpoints E ≥2 owners/áreas); (4) **sem autoridade** (gate continua por
checkpoint); (5) check de coerência. Ganha o lugar em time+muitos checkpoints; some no solo.

### D6 · Fechamento em dois eixos

- **Resultado** (o que aconteceu) — **polimórfico por tipo:** `delivery`→capacidade entregue (PR/merge,
  sem verdict) · `experiment`/`spike`→`learning-record` · `incident`→postmortem · `patch`/`fix`→
  commit+verificação.
- **Autoridade** (podemos fechar/avançar?) — **`gate`** (Human Gate), de quem tem autoridade sobre o
  checkpoint (nem sempre quem desenvolve), gated por reviews limpos.

`gate ≠ learning-record`; `gate --references--> learning-record` (o resultado alimenta o gate). Experiment
tem os dois; delivery só o gate. Simetria: fechamento polimórfico espelha a abertura polimórfica.

### D7 · Pausa é DERIVADA, não 6º status

O limbo ("nem ativo, nem fechado") deriva de uma **fonte**, nunca é status armazenado:

- **blocked** — de um `finding` aberto sob investigação; cai quando o `learning-record` `resolves` o finding.
- **paused** — de uma **pausa deliberada** (registro próprio: quem/quando/porquê/retomar-quando).

### D8 · Derived-only / sem 2ª SSOT

O grafo, snapshots e qualquer banco são **projeções estritamente derivadas** do Markdown/YAML; **o repo
vence** (reafirma `[DEC-0024-G07]`/`G08`/`G23` e `GG-0005`).

## Roteamento (critérios de aceite, não nova topologia)

- **`internal-architecture-refactor-ddd-bdd`:** forma do grafo de governança (estende `KnowledgeGraph`);
  **1ª aresta concreta `grounded-by`** (de-para DEC↔research); colapso `state`/`tasks`/`plan` numa SSOT +
  derivados (**aposentar `plan.md`**); rename `spec→delivery`; template `intent-brief` + extensão do check.
- **`#45`** mantém o escopo atual (artifact-taxonomy); **não** implementa intent-brief nem rename.

## Spun-off (research/consolidação própria)

- **Registro de pausa deliberada** (artefato leve a desenhar).
- **Grafo de governança cross-repo** + banco como agregação derivada → consolidação do grafo.

## O que NÃO está sendo decidido

Implementar o template/rename/grafo/banco; o schema final de `learning-record`/registro-de-pausa;
cross-repo/identidade global; superseder `G08`/`G22`/ADR 0010 ou qualquer eixo cravado; reordenar a
sequência; executar Ready, Human Gate, merge, advance, `mark-readiness` ou abrir PR.

## Grounding (trilha datada — não reabrir para saber a verdade atual)

- `research/2026-06-24-intent-brief-work-initiation-artifact.md` (nome/schema/exemplos/ciclo-de-vida).
- `research/2026-06-24-governed-work-flow-model.md` (cadeia/7-tipos/hierarquia/fechamento/pausa).
- Linhagem: `[DEC-0024-G08]`/`G23` (grafo derived-only) · `[DEC-0024-G22]` (hierarquia) · `F-006`
  (research/finding/decision/execution = estados) · ADR 0010 (7 pilares; item 6 rename).
