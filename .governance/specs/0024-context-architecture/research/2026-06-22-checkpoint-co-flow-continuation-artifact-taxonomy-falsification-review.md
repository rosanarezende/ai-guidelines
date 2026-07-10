---
artifact-kind: pre-coding-review
subject: "falsificacao pre-decisao da taxonomia de artefatos do PR 44"
date: 2026-06-22
disposition: evidence
---

# PR #44 — Revisão de falsificação pré-decisão da taxonomia de artefatos

Data: 2026-06-22
Spec: 0024 — context-architecture
Nó: `co-flow-continuation` (seq 11)
PR: #44 — `feat/spec-0024-co-flow-continuation`

## Natureza deste artefato (ler antes de tudo)

- **Revisão de falsificação pré-decisão, read-only.** Leitura adversarial da taxonomia de
  artefatos proposta em `...artifact-taxonomy-inventory.md`, feita _antes_ de qualquer DEC ou
  migração de pastas. Não é research comum (testa as alegações da proposta) e não é review de
  gate (não está sob `review-policy.yml`, sem Human Gate associado).
- **Narrativa de apoio, NÃO autoridade.** Em divergência, vencem `state.yml`, `tasks.md`,
  `decision-brief.md`, `reviews/`/`gates/` e Git/GitHub. Este arquivo não é SSOT.
- **Não executa decisão, Ready, Human Gate, merge ou avanço.** Nenhum efeito mutante; não move
  arquivos, não cria pastas, não altera frontmatter de terceiros.
- **O arquivo não decide nada.** Os findings precisam virar DEC / task / revisão governada
  depois. Ver § Fronteira explícita.

**Artefatos revisados:** `research/...artifact-taxonomy-inventory.md`;
`research/...spec-map-falsification-review.md`; `research/...spec-map-model.md`;
`research/...lifecycle-model-inventory.md`; `research/README.md`; `reviews/README.md`;
`state.yml`; `tasks.md`; `decision-brief.md`; ADR 0018/0021/0022/0025/0026; PIT-0001/0008/0010;
inventário real de `research/` (67 arquivos), `reviews/` e `research-library/`.

---

## Veredito curto

**O diagnóstico é correto e a separação conceitual é majoritariamente boa — mas a proposta, como
desenhada, tem 4 erros de classificação e um plano de rollout inseguro para o PR #44. Adotar o
_conceito_ agora (via DEC + `kind:` no frontmatter, aditivo); rejeitar a _migração física de
pastas_ no #44; corrigir os erros antes de ratificar.**

- **Reduz ambiguidade?** Sim, para navegação humana. Mas, do jeito que está, **introduz um novo
  risco de segunda fonte**: a "natureza" do artefato passaria a ser declarada em até 4 lugares
  (pasta + frontmatter + README + inventário), e a "ordem de autoridade" já aparece **divergente
  em 2 arquivos**. Isso é a própria falha que ADR 0026 nomeia.
- **Pastas novas agora?** Não. `kind:` no frontmatter resolve 90% com churn zero de paths e é
  melhor para o futuro `SpecMapViewModel`. Pastas só com dor de navegação comprovada (guard ADR
  0026 §3).
- **Migração física no #44?** Insegura: **107 referências por path** a `research/` em 35
  arquivos — várias em fontes que a tarefa proíbe tocar. Migração mínima segura = aditiva.

> **Adendo pós-print da árvore (ver fim do arquivo):** o print parcial + a raiz legada `.specify/`
> expuseram homes já existentes (`research-index.md`, `research-library/<domínio>/`,
> `.governance/visual-prompts/`) e um eixo-domínio doutrinário. Isso **reforça** o veredito e
> adiciona F10–F12, além de corrigir F9.

## Fatos observados

- **`research/` tem 67 arquivos** misturando ≥8 naturezas reais: pesquisa comparativa
  (cursor-opencode, hermes, multica, spec-kitty, architectural-inventory, g00-\*), **~8
  handoffs** (`*-handoff-next-session*`, `checkpoint-handoff-co-1/2`), dogfood/status
  (`*-dogfood-*`, `*-status`), reviews externas/falsificação (pr43-external-review,
  spec-map-falsification, confirm-in-run-falsification, codex-review), prompt
  (pr43-external-review-prompt), inventários de modelo (co-10.1, spec-map-model,
  lifecycle-model-inventory, artifact-taxonomy), gap/backlog (co-10.8-gap-feature-candidates,
  drift-classification/-autodetection), captura de PIT (pit-0010), planos
  (knowledge-health-promotion-and-backfill-plan) e **`findings.md`**. → O diagnóstico da proposta
  **sobrevive**: a mistura é real.
- **`research-library/` já existe** (`.governance/specs/research-library/architecture/`, 2
  arquivos: `2026-05-19-lifecycle-architecture.md`, `2026-06-05-enforcement-surfaces.md`) — é
  irmão de `specs/`, cross-spec, e já é citado por PIT-0008 e ADR 0026. O caminho de promoção
  **já existe e é usado**.
- **`reviews/` é maduro e load-bearing:** per-checkpoint/per-role YAML + `events/` +
  `resolutions` + templates; `review:check` no `validate` (em `repo-validation` required). Já há
  `c-co-flow-convergence-{technical_audit,architectural_review,security_review}.yml`.
- **107 referências por path** a `research/...` em 35 arquivos. Inbound de fontes governadas:
  `tasks.md` (10), `spec.md` (9), `decision-brief.md` (6), `plan.md` (5), `NEXT.md` (3), vários
  `reviews/*.yml`, e **`findings.md` (9)**.
- **Referência stale já existente:** ADR 0026 (`.core/`) aponta para
  `research/2026-06-05-enforcement-surfaces.md`, mas o arquivo vive em
  `research-library/architecture/`. Uma promoção anterior **moveu sem atualizar a referência**.
- **Duas "ordens de autoridade" já divergem** entre `research/README.md` e o
  `artifact-taxonomy-inventory.md` §3 (detalhe na seção Divergências).

## Interpretação

A proposta acerta na dor (research/ virou balde) e na intenção (impedir que artefato humano
compita com SSOT). Mas mistura dois níveis que deveriam ser separados:

1. **Um nível conceitual** (que naturezas de artefato existem e qual a regra de autoridade de
   cada uma) — isso é doutrina, pertence a DEC + frontmatter `kind:`, e é seguro.
2. **Um nível físico** (criar `dogfood/`, `model-reviews/`, `evidence/`, `backlog/`) — isso é
   reorganização de paths, cara, com churn, e perigosa enquanto 107 referências apontam para os
   caminhos atuais.

Tratar (1) e (2) como uma decisão só é o que torna a proposta arriscada. O valor está quase todo
em (1); o custo e o risco estão quase todos em (2). A recomendação separa os dois.

## Divergências (qual fonte contradiz qual)

- **`research/README.md` × `artifact-taxonomy-inventory.md` §3 — ordem de autoridade
  divergente.** O README lista 5 níveis (reviews/gates **e** Git/GitHub juntos no nível 4); o
  inventário §3 lista 7 níveis (reviews/gates no 4, **Git/GitHub no 5**, assets no 6). Dois
  artefatos, duas ordens. Já é a segunda-fonte-de-verdade nascendo dentro da própria proposta.
- **`artifact-taxonomy-inventory.md` §3 (ordem linear única) × `lifecycle-model-inventory.md` §4
  (autoridade por conceito).** O lifecycle-inventory — do mesmo PR — modela autoridade **por
  domínio** (topologia→`state.yml`; branch/PR→Git; findings→`reviews/`; decisão→`decision-brief`).
  A taxonomia **achata** isso num ranking total, que é lossy: sugere, por exemplo, que
  `decision-brief` (nível 3) vence Git/GitHub (nível 5) sobre _quais commits existem_ — o que é
  falso. Autoridade é por domínio, não um totem linear.
- **Proposta (handoff = categoria a "manter datado") × ADR 0022 + PIT-0010.** ADR 0022 tornou
  handoff uma **projeção derivada** (`flow handoff`/`deriveHandoff`), não artefato persistido;
  PIT-0010 cravou "memória de agente não é contrato". Os ~8 handoffs em `research/` são
  **sedimento legado** de antes do `deriveHandoff`. Dar a eles uma pasta abençoada (`handoff/`)
  **re-legitima** o anti-padrão que ADR 0022 aposentou.
- **ADR 0026 × realidade do filesystem.** ADR 0026 referencia
  `research/2026-06-05-enforcement-surfaces.md`; o arquivo está em `research-library/architecture/`.
  Prova concreta de que mover arquivos sem atualizar referências **gera drift** — exatamente o
  risco da migração proposta.

## Findings por severidade (com método de falsificação)

### 🔴 F1 — BLOQUEADOR (para migração física no #44): 107 referências por path travam o movimento

**Falsifiquei:** `grep "research/[0-9A-Za-z]"` no diretório da spec → **107 ocorrências em 35
arquivos**, incluindo `tasks.md`, `spec.md`, `decision-brief.md`, `plan.md`, `NEXT.md`,
`reviews/*.yml` e `findings.md`; e `grep` em `.core/governance/adrs` → ADR 0026 cita um path
`research/...`. Mover arquivos para `dogfood/`/`model-reviews/`/`evidence/` **quebraria** essas
referências **ou** exigiria editar `state.yml`/`tasks.md`/`decision-brief.md` — que esta tarefa
(e o bom senso de #44) proíbe tocar. O caso `enforcement-surfaces` prova que a quebra já
acontece na prática.
**Consequência:** a única migração segura no #44 é **aditiva** (frontmatter/README), não
relocação.

### 🔴 F2 — ALTO: declarar `kind` em pasta + frontmatter + README + inventário viola ADR 0026

**Falsifiquei:** ADR 0026 §1/§2: reificar uma projeção em cópias paralelas que exigem
sincronização manual é o modo de falha nº 1 da 0023/0024; só se justifica se **remove** drift.
A proposta declararia a natureza do artefato em até 4 lugares (caminho da pasta, `kind:` no
frontmatter, tabela do README, tabela do inventário). São **4 cópias da mesma classificação** →
drift garantido quando uma mudar. Pelo próprio ADR 0026, escolher **uma** fonte de `kind` (o
frontmatter) e derivar o resto.
**Implicação:** pasta-como-kind **e** frontmatter-kind ao mesmo tempo é o erro; escolher um.

### 🟡 F3 — MÉDIO: a proposta sub-classifica handoff (contra ADR 0022/PIT-0010)

**Falsifiquei:** ver Divergências. A linha "Handoff/snapshot … manter datado" trata como
categoria perene o que a doutrina aposentou como artefato persistido. Risco: um `handoff/`
convida novos handoffs persistidos, reabrindo o mis-binding que `deriveHandoff` fechou.
**Correção:** handoffs antigos = **arquivo histórico/legado** (marcar `kind: handoff-legacy`,
não criar pasta de incentivo); o handoff vivo é derivado, não um arquivo.

### 🟡 F4 — MÉDIO: "review pré-codificação" e "review externa de recorte entregue" são coladas

**Falsifiquei:** §7 do inventário agrupa, na mesma linha, `pr43-external-review` e
`spec-map-falsification-review` como "review pré-codificação/externa". Mas o **pr43** revisou
**código já entregue** (CO-10.1..10.7) — é review externa _pós_-implementação, vizinha de um AR
independente; o **spec-map** revisou um **modelo** _antes_ de codar. Colar os dois repete a
conflação que a proposta quer eliminar. São tipos distintos: `model-review` (pré-código) ×
`external-recorte-review` (pós-código, fora da policy de gate).

### 🟡 F5 — MÉDIO: `evidence/` colide com o `audit_evidence` selado de `reviews/`

**Falsifiquei:** `reviews/README.md` define `audit_evidence` como VO **selado**
(coverage/scope/basis), tamper-evidente, **dentro** do review de gate. Um `evidence/` genérico
("outputs, logs, matrizes de prova") reusa uma palavra já carregada → risco de um agente
externalizar para `evidence/` o que deveria ser `audit_evidence` selado (quebrando o modelo de
integridade), ou vice-versa. Precisa de nome mais nítido (`proofs/`, `fixtures-evidence/`) ou
fronteira explícita.

### 🟡 F6 — MÉDIO: `backlog/`/`gaps/` fragmenta homes de "trabalho futuro" que já existem

**Falsifiquei:** o repo já tem **5 homes** para trabalho futuro: `PIT` (insights), `findings.md`
(findings estruturais abertos, citado por `plan.md`), `roadmap/backlog.md`, `tasks.md` (executável)
e `decision-brief` (DEC). E `[DEC-0024-G16]` já cravou o padrão "gaps em artefato exclusivo,
promovidos por decisão" (o `co-10.8-gap-feature-candidates.md` é o caso). Um `backlog/` seria o
**6º** home → fragmentação, não consolidação. Backlog precisa de **roteamento** para os homes
existentes, não de pasta nova.

### 🟡 F7 — MÉDIO: `findings.md` é categoria escondida e quase-governada

**Falsifiquei:** `plan.md` e `tasks.md` apontam para `research/findings.md` como o lar dos
"findings estruturais abertos" migrados do brief. Logo `findings.md` **não é research comum** —
é um registro quase-governado que a SSOT referencia (9 refs internas + citado no plano). A
taxonomia não o nomeia; deixá-lo como "research genérico" é parte do problema que ela quer
resolver.

### ⚪ F8 — BAIXO: invariantes §8 (status não autoriza) são enforcement, mas pastas são L1

**Falsifiquei:** ADR 0021 (enforcement estrutural ≠ consciência). A invariante "status antigo não
pode bloquear ou autorizar trabalho" é uma promessa de **enforcement**; pastas/frontmatter são
**awareness (L1)**. A proteção real já existe no runtime (handoff/work derivam de
`state.yml`/`tasks.md`, não de `research/`). Não vender a taxonomia como se ela _impusesse_ a
invariante — ela só a torna mais óbvia para humanos.

### ⚪ F9 — BAIXO: "prompt" não precisa de categoria de topo

O `pr43-external-review-prompt.md` é um prompt acoplado a um review. Melhor **co-localizar** (seção/
sibling do review; prompt de imagem ao lado do asset) do que criar `prompts/`. A própria proposta
hesita ("ainda sem casa clara") — resolver por co-locação.

## Riscos reais

- **Segunda fonte de verdade por metadados (F2):** o maior risco é a taxonomia se tornar ela
  mesma um sistema com cópias paralelas de `kind`/autoridade que divergem (já começou — duas
  ordens de autoridade).
- **Re-legitimar handoff persistido (F3):** uma pasta `handoff/` desfaz, na prática, um ganho de
  ADR 0022.
- **Churn destrutivo (F1):** migração física no #44 quebra 107 referências e mistura
  reorganização documental com os reparos operacionais do checkpoint — o oposto do que
  `research/README.md` § "Débito conhecido" já difere para o próximo nó.
- **Over-engineering (ADR 0026 §3):** 4 pastas novas sem dor de navegação medida é trocar uma
  elegância por outra.

## Bloqueadores

1. **Migração física de pastas no PR #44** está bloqueada por F1 (107 referências; exigiria
   editar SSOT proibida). Fonte que contradiz: o filesystem real + a regra da tarefa "não alterar
   `state.yml`/`tasks.md`/`decision-brief`".
2. **Ratificar a taxonomia como está** está bloqueado por F2/F4 (cópias paralelas de `kind`;
   conflação model-review × external-review) — precisa de correção antes de virar DEC.
3. **Ordem de autoridade** não pode ser ratificada enquanto `research/README.md` e o inventário
   §3 disserem coisas diferentes, e enquanto contradisser o modelo por-domínio do
   `lifecycle-model-inventory.md` §4.

## Recomendação

**Adotar agora (seguro, aditivo):**

1. **`kind:` no frontmatter como fonte ÚNICA da natureza** do artefato, com um enum pequeno:
   `research` · `dogfood` · `status` · `model-review` · `external-review` · `inventory` ·
   `gap` · `handoff-legacy` · `prompt` · `plan`. Mais um `authority: none` explícito e, quando
   aplicável, `supersedes:`/`promoted-to:`. Zero churn de path, queryável pelo futuro
   `SpecMapViewModel` (determinístico, ADR 0018).
2. **Uma única ordem de autoridade canônica**, escrita por DEC e **por domínio** (não linear),
   reusando `lifecycle-model-inventory.md` §4; `research/README.md` e o inventário passam a
   **apontar** para ela, não a redeclarar.
3. **Roteamento de backlog/gap** para os homes existentes (PIT / `findings.md` / `roadmap` /
   `tasks.md` / DEC) — sem pasta nova.

**Esperar (decisão deliberada, com gatilho):**

4. **Pastas físicas** (`dogfood/`, `model-reviews/`, `evidence/`/`proofs/`) só quando houver dor
   de navegação comprovada (guard ADR 0026 §3: ≥2 instâncias ou sync-manual recorrente) **e**
   num movimento que atualize as referências — naturalmente no nó `housekeeping` ou no fechamento
   da spec, não no #44.
5. **Tipo governado `model-review`** (com não-autoridade estrutural + roteamento finding→DEC/task)
   é trabalho de **review-policy**, não de pasta; modelar junto da reorganização de reviews
   (vizinho de `lifecycle-code-confrontation`/`review-policy`), tratando-o como _capacidade
   ofertada, não obrigação_ (PIT-0012).

**Migração mínima segura no PR #44:** apenas (1)+(2)+(3) — aditivo. Nenhum arquivo movido.
`research/README.md` ganha a tabela de `kind:` e o ponteiro para a ordem de autoridade canônica.

## Perguntas que exigem decisão humana

1. Fonte única de `kind`: **frontmatter** (recomendado) ou **pasta**? (não os dois — F2)
2. A taxonomia vira **`[DEC-0024-G21/G22]`** agora, ou espera o nó `housekeeping`?
3. `model-review` deve gerar **finding governado** (entra em alguma policy) ou fica como parecer
   narrativo não-autoritativo? (liga-se ao tipo de review-policy)
4. Handoffs antigos: marcar `handoff-legacy` e **congelar** a categoria (sem novos), confirmando
   ADR 0022?
5. Quais arquivos promover **já** a `research-library/` (ver abaixo) vs no fechamento?
6. O `SpecMapViewModel` futuro deve **consumir** `kind:` (define se a escolha é frontmatter)?

## Apêndice — onde cada coisa deveria ir (classificação inicial, não-autoritativa)

- **DEC:** a taxonomia em si (categorias + ordem de autoridade + fonte de `kind`); a fronteira
  model-review × external-review.
- **Task:** aplicar `kind:` aos 67 arquivos; reconciliar as duas ordens de autoridade; rotear o
  `gap-feature-candidates` para o home decidido.
- **Só pesquisa (fica em `research/`):** comparativos (cursor-opencode, hermes, multica,
  spec-kitty), `architectural-inventory`, `g00-*`, `graph-store-options`.
- **Candidatos a `research-library/`** (já estabilizados, cross-spec, sem SHA específico):
  `2026-05-30-projection-vs-entity-lens.md` (já virou **ADR 0026** → promover/linkar),
  `2026-06-04-epistemic-commitment-model.md` (base do **PIT-0007**), e, depois de ratificada,
  esta própria taxonomia (critério de separação projeção × entidade já é citado como candidato no
  §6 do inventário). Corrigir, no caminho, a referência stale de ADR 0026 a `enforcement-surfaces`.
- **Categoria errada hoje (mover quando houver migração segura):** os ~8 handoffs (→
  `handoff-legacy`), `findings.md` (→ quase-governado, não research genérico),
  `pr43-external-review` (→ `external-review`, não model-review), `co-10.8-gap-feature-candidates`
  (→ gap roteado).

## Adendo (revisão pós-print da árvore + raiz legada `.specify/`)

> Incorpora fatos que o print parcial da árvore e a raiz legada `.specify/` expuseram. **Reforça**
> F1/F2/F6 e **corrige** F9 e o Apêndice. Não muda o veredito — endurece o "não criar pastas no #44".

**Fatos novos observados:**

- **Já existe um contrato de promoção doutrinário** em `.core/process/governance-foundation.md` §4.5
  (linhas ~210-211, 459): research consolidada é **movida para
  `.governance/specs/research-library/<domínio>/`** (`governance/`/`architecture/`/`oss/`),
  **indexada no `research-index.md`**, com prefixo `YYYY-MM-DD-`, no fechamento da spec. Regra
  textual: **"Não crie pastas por spec."** Canônico = `.governance` (ADR 0019); **legado
  `.specify/specs/researchs/` é read-only/migração — research nova nunca nasce no legado.**
- **Homes que a proposta declara inexistentes já existem:** `.governance/specs/research-index.md`
  (índice canônico cross-spec), `research-library/<domínio>/` (por **domínio**),
  `.governance/visual-prompts/` (+ subsistema de código `src/cli/visual-prompts/` com catálogo e
  renderer), `.governance/specs/roadmap/{backlog,historico}.md`.
- **Dual-root real:** `.specify/specs/research-index.md` se autodeclara "Fonte de Verdade" e tem o
  **mesmo** mandato de promoção do índice canônico — duas fontes concorrentes, já resolvidas a favor
  de `.governance` (ADR 0019 + governance-foundation §4.5) e agendadas para `dualroot-collapse`
  (`[DEC-0024-G18]`). A `.specify/specs/researchs/` tem ~48 arquivos por domínio.
- **Índice já stale:** `research-library/architecture/` tem 2 arquivos (`lifecycle-architecture`,
  `enforcement-surfaces`); o `research-index.md` canônico lista **só 1**. enforcement-surfaces foi
  promovido mas nunca indexado.

### 🟡 F10 — A proposta organiza por KIND; a doutrina organiza por DOMÍNIO (eixos ortogonais)

**Falsifiquei:** governance-foundation §4.5 + ADR 0019 + a árvore real
(`research-library/{architecture,governance,oss}`, `.specify/specs/researchs/{architecture,governance,oss}`)
→ o eixo de organização **estabelecido e doutrinário** é **domínio temático**. As pastas-por-kind da
proposta (`dogfood/`, `model-review/`, `evidence/`) são um **segundo eixo concorrente**. Um arquivo é
"architecture" **e** "model-review" ao mesmo tempo — pasta (1 arquivo = 1 pasta) não representa 2D.
**Conclusão:** `kind` **tem** que ser frontmatter (ortogonal ao domínio); kind-folders brigariam com o
eixo-domínio já cravado. Endurece F2.

### 🟡 F11 — A promoção NÃO é "pouco operacionalizada": é definida e não-enforçada

**Falsifiquei:** a proposta §4 diz "promoção ainda pouco operacionalizada". Mas governance-foundation
§4.5 + `research-index-boilerplate.md` + os dois `research-index.md` **definem** o contrato. O que falta
é **enforcement** (nenhum check de que todo arquivo em `research-library/` esteja indexado —
enforcement-surfaces prova). O gap é ADR 0021 (awareness não-enforçada), **não** desenho de taxonomia.
Direção certa: um `research-index:check` futuro, não pastas novas.

### 🟡 F12 — A decisão de taxonomia está ACOPLADA ao dual-root collapse

**Falsifiquei:** `.specify/specs/researchs/` + `.specify/specs/research-index.md` são a estrutura
paralela legada, agendada para `dualroot-collapse` (`[DEC-0024-G18]`, seq 12). Decidir kind-folders no
#44 (seq 11) cria uma **terceira** estrutura que o collapse terá de reconciliar. Taxonomia de research e
dual-root são o **mesmo problema visto duas vezes**; a parte **física** deveria ser decidida **no**
`dualroot-collapse`, não antes. Reforça o "esperar" da Recomendação.

### ⚪ F9 — CORRIGIDO: prompts visuais já têm home (e código)

A F9 original ("prompt não precisa de categoria de topo; co-localizar") está **parcialmente errada**:
`.governance/visual-prompts/` existe **com catálogo e renderer** (`src/cli/visual-prompts/`). "Prompt sem
casa clara" (proposta) e "co-localizar" (F9) só valem para **prompts de review** (ex.:
`pr43-external-review-prompt.md`), que seguem sem home e devem co-localizar com o review. Prompt
**visual/imagem** → `.governance/visual-prompts/` (já governado, first-class).

**Correção do Apêndice:** "candidatos a `research-library/`" vão para `research-library/<domínio>/` (por
domínio, prefixo `YYYY-MM-DD-`) **e** entram no `research-index.md` — não soltos. E o `research-index.md`
canônico precisa de entrada para `enforcement-surfaces` (drift atual a reparar).

## Fronteira explícita

Este arquivo **não decide nada** e não move/edita nenhum artefato. Ele falsifica a taxonomia
proposta e registra findings. Para ter efeito, cada finding precisa virar **DEC** (a taxonomia,
a ordem de autoridade, a fonte de `kind`), **task** (aplicar frontmatter, reconciliar READMEs) ou
**revisão governada** (o tipo `model-review` na review-policy). Em qualquer divergência, vencem
`state.yml`, `tasks.md`, `decision-brief.md`, `reviews/`/`gates/` e Git/GitHub.

_Revisão read-only. Nenhum arquivo de estado, tarefa, gate, PR ou de terceiros foi alterado na
produção deste registro._
