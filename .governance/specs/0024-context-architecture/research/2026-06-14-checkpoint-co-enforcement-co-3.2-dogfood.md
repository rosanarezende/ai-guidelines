# Dogfood CO-3.2 — knowledge:compile + manifesto/paridade, e bug das duas opções de cancelar (2026-06-14)

> **Natureza deste documento:** evidência arquitetural do sub-checkpoint `CO-3.2`
> (`knowledge:compile + manifesto/paridade`) dentro do checkpoint `checkpoint-co-enforcement`
> (nó `co-enforcement`, seq 9, PR #42). NÃO é handoff datado (PIT-0010/GG-0004: handoffs
> persistidos são registro histórico, nunca superfície de retomada). Registra (1) o dogfood
> do próprio objeto do CO-3.2 e (2) um bug observado no dogfood de `guidelines decide`,
> corrigido junto com sua regressão.

## Contexto

Sessão retomada por handoff governado (`npm run guidelines -- handoff 0024`) + briefing de
trabalho (`npm run guidelines -- work --authorization explicit-work-request`). O briefing
inferiu modo `IMPLEMENT_CHECKPOINT` com sub-checkpoint ativo **CO-3.2 — knowledge:compile +
manifesto/paridade** (tasks.md linha 102). A transição CO-3.1 → CO-3.2 já estava registrada
pelo commit `fdebdbf` (decisão humana de avanço de sub-checkpoint, dogfood anterior) — **não
houve nova deliberação de transição** neste turno.

---

## Parte 1 — Bug observado no dogfood de `guidelines decide`: duas opções de cancelar

### Fato observado

No dogfood do `decide` (a superfície humana construída no CO-3), o wizard interativo
exibia **duas opções sem efeito de cancelamento** na tela de escolha de uma decisão:

```text
O que você decide?
  > Concluir o sub-checkpoint atual e ativar o próximo
    Manter o sub-checkpoint atual ativo
    Solicitar mais esclarecimentos (não escreve nada)
    Cancelar (não escreve nada)        ← escolha do contrato governado (id: cancel)
    Ver detalhes técnicos
    Cancelar                           ← injetada pelo wizard (__cancel__)
```

### Causa-raiz (estrutural, não cosmética)

A duplicação tinha DUAS fontes de "cancelar":

1. **Contrato governado** (`human-decision-policy.yml`): toda decisão declara uma escolha
   `cancel` (label `Cancelar (não escreve nada)`, `mutating: false`), sempre `available`
   (escolhas não-mutantes são `available: c.mutating ? available : true`). Ela é renderizada
   por `brief.choices` e tratada pelo caminho normal `plan()` → não-mutante → "Nada foi
   alterado."
2. **Wizard** (`src/cli/decide/decide.ts`): além de renderizar `brief.choices`, **injetava**
   um `{ name: "Cancelar", value: "__cancel__" }` hardcoded.

O wizard deveria ser um **renderizador do briefing governado** — injetando apenas afordâncias
genuínas de UI (o toggle "Ver detalhes técnicos"), nunca uma escolha de decisão que o contrato
já fornece. A injeção do `__cancel__` violava essa disciplina e produzia o duplicado.

### Hipótese falsificada

> "O wizard precisa de um `Cancelar` próprio como escape, independente do contrato."

Falsificada: a escolha `cancel` do contrato é declarada por **todo** tipo de decisão e é
**sempre `available`** (não-mutante), então a tela de escolha nunca fica sem um cancelamento
sem efeito. O escape do wizard já existe, governado, genérico para todos os tipos — o
`__cancel__` era redundância pura.

### Correção (genérica, sem label/índice)

Removida a injeção do `__cancel__` (e seu tratamento morto) no `runWizard`. A tela de escolha
passa a renderizar exatamente as escolhas governadas (`brief.choices` disponíveis) + o toggle
técnico. O `cancel` do contrato vira o **único** cancelamento sem efeito, genérico para todo
tipo de decisão, e flui pelo mesmo caminho `plan()` das demais escolhas não-mutantes
(`keep`/`request-explanation`/`request-changes`) — mais uniforme do que o short-circuit
anterior. A correção é estrutural (remoção da injeção na origem), **não** um filtro por label
(`"Cancelar (não escreve nada)"`) nem por índice de array.

> Nota de escopo: `renderChoices` (em `render.ts`) tem um `q. Cancelar` hardcoded análogo,
> mas é **código morto** (sem call-site em todo o repo) — fora do bug reportado (o wizard) e
> deixado intacto para não expandir escopo.

### Regressão

`src/cli/decide/decide.test.ts` `[73]`: captura os `value`s apresentados na tela de escolha e
exige `["go", "cancel", "__technical__"]` — exatamente as escolhas governadas + o toggle, sem
`__cancel__`. Falsificada: reintroduzir a injeção faz a tela apresentar
`["go", "cancel", "__technical__", "__cancel__"]` e o teste falha (verificado: `toEqual`
recebe o `__cancel__` extra). Os testes `[48]`/`[50]` já exercitavam a escolha `cancel` do
contrato (não a injetada), então continuam verdes sem alteração.

---

## Parte 2 — Dogfood do CO-3.2: knowledge:compile + manifesto/paridade

### Objeto entregue

- **`knowledge:compile`** (entrypoint humano, `cli/knowledge-compile.mjs` →
  `src/cli/knowledgeCompile.ts`): orquestra o compilador TS determinístico de CO-3.1
  (`compileConstraints` via `runConstraintsCheck`), **persiste** o manifesto runtime
  (`.governance/runtime/constraints/manifest.json`) e, como guarda-chuva, reusa o compilador
  de regras (`build:rules`). `build:rules` permanece **alias compatível** standalone.
- **Serializer canônico** (`src/app/constraints/constraintManifest.ts`): bytes estáveis
  (chaves ordenadas recursivamente + 2 espaços + newline), OWNED pelo serializer e
  **prettier-ignored** (precedente do ledger de insights — reformatar quebraria a paridade
  raw↔canônica).
- **`knowledge:check`** (paridade derivada, no `validate`): **existência** (artefato
  presente), **classe** (parse + versão + forma de topo) e **sync** (recompilar as fontes
  vivas reproduz byte-a-byte). REQUIRED como invariante de estado contínuo.

### Reprodução (real, neste repo)

```text
npm run knowledge:compile        # persiste o manifesto (2 constraints · 2 bindings) + build:rules
npm run knowledge:check          # ✅ íntegro e em sync
```

### Falsificação end-to-end do gate (drift detectável)

```text
# (1) SYNC — adulterar 1 byte do manifesto persistido
echo -n ' ' >> .governance/runtime/constraints/manifest.json
npm run knowledge:check          # ❌ "manifesto fora de sync" — exit 1

# (2) EXISTÊNCIA — remover o manifesto
rm .governance/runtime/constraints/manifest.json
npm run knowledge:check          # ❌ "manifesto ausente" — exit 1

# regenerar e comparar
npm run knowledge:compile        # reproduz o manifesto
npm run knowledge:check          # ✅ exit 0 — bytes IDÊNTICOS ao backup pré-adulteração
```

A regeneração é **byte-idêntica** (determinismo do compilador + serializer canônico), então o
artefato versionado é uma projeção fiel: qualquer mudança em fonte de constraint, contrato de
script (resolução de superfície) ou registry (metadados de comando) muda os bytes e o
`knowledge:check` reprova até a owner/implementador recompilar e versionar — padrão
`living-docs:check` / `runtime-bootstrap:check`.

### Decisões de implementação

- **Separação de `constraints:check`:** aquele valida as INVARIANTES do modelo em memória
  (CO-3.1), REQUIRED, sem persistir. O `knowledge:check` gateia a PARIDADE do artefato
  persistido. São checks distintos no `validate` (a recompilação dupla é determinística e
  barata).
- **Import lazy do `build:rules`:** o módulo puxa o prettier transitivamente, que quebra sob
  o runner de testes sem `--experimental-vm-modules`. O dep default carrega `build:rules` por
  `import()` dinâmico, mantendo os testes (que injetam `buildRules`) puros — mesmo padrão do
  lazy-load do inquirer no `decide`.
- **`script-contracts.yml` é SSOT:** os scripts novos foram declarados no contrato e
  projetados via `script-contracts:sync` (o sync é contrato→package.json; editar só o
  package.json é revertido pelo próximo sync).

### Testes

- `src/app/constraints/constraintManifest.test.ts` `[51]`–`[58]`: determinismo,
  invariância à ordem de chaves, forma (newline/2-espaços), round-trip e paridade de classe
  (JSON inválido / versão divergente / campo ausente / raiz não-objeto).
- `src/cli/knowledgeCompile.test.ts` `[59]`–`[69]`: persiste serializado + orquestra
  build:rules; não persiste sob violação; core ausente ⇒ exit 2; propaga falha do build:rules;
  e os três eixos de paridade do `check` (existência / classe / sync / não-reproduzível /
  dispatcher).

---

## Parte 3 — Refinamento do dogfood: a “Próxima ação” não mostrava comandos governados

### Fato observado

Ao retomar o CO-3.2 por `guidelines work`, a seção §11 “Próxima ação” dizia O QUE deve
acontecer ("Implementar o sub-checkpoint ativo CO-3.2") mas **não mostrava quais comandos
governados** estão disponíveis para EXECUTAR ou apenas INSPECIONAR essa ação. O humano sabia
o destino, não o trajeto governado — exatamente o tipo de contrato executável invisível que o
laço CO combate (PIT-0011).

### Correção (next_action estruturada, derivada do estado)

`WorkBrief.nextAction` deixou de ser `{ description, basis }` e passou a `WorkNextAction`:
resumo humano + **comandos governados** (papel `reconcile`/`recommended`/`read-only`/`after`,
rótulo pt-BR, comando) + **ações que continuam proibidas**. Os comandos são **derivados do
TIPO de decisão pendente** (`--type <tipo> --brief-only` interpola o tipo; nunca texto livre),
projetados por `deriveWorkNextAction(mode, object, facts, …)`:

- **advance-subcheckpoint** (implement com sub ativo + próximo pendente, ou transição): resumo
  "Concluir CO-3.2 e ativar CO-3.3"; recomendado `npm run guidelines -- decide`; somente leitura
  `… decide --type advance-subcheckpoint --brief-only`; depois `… work --authorization
explicit-work-request`; ainda proibido: Human Gate, Ready, merge, próximo PR.
- **close-dispositions** (await_revalidation): a owner encerra os problemas revalidados.
- **human-gate** (prepare_close/current): exercível só com Ready + CI verde + reviews
  satisfeitos; **bloqueado** (ex.: PR Draft) ⇒ SÓ a inspeção read-only (não sugere o wizard
  interativo — comando incompatível com o estado).

Regras honradas: no **máximo 3 comandos**; **estados sem decisão não inventam `decide`**
(`resolve_findings`/tarefa de topo ⇒ zero comando); **estados bloqueados mostram a
reconciliação PRIMEIRO** (`reconcile:check`/`git status`/`git pull --ff-only` conforme o
motivo); a **mesma** `next_action` alimenta o renderer (§11) e o contrato do relatório final
(uma fonte só). `stillForbidden` é curado por tipo a partir do `not_authorized` de
`human-decision-policy.yml`.

### Falsificação (live + unit)

- **Live:** com este próprio trabalho não-commitado, `guidelines work` infere **`blocked`**
  (working tree funcional suja) e a §11 projeta **primeiro** `Reconciliar … : git status` —
  zero `decide`. Prova viva da regra "bloqueado ⇒ reconciliação primeiro, nunca inventa
  decide".
- **Unit `[38]`–`[46]`:** estado real ⇒ "Concluir CO-3.2 e ativar CO-3.3" com os 3 comandos
  exatos + proibições; transição; close-dispositions; human-gate bloqueado (1 comando
  read-only, sem recomendado) e exercível (3 comandos); resolve_findings e tarefa de topo sem
  `decide`; drift ⇒ `reconcile:check` primeiro; renderer projeta a mesma next_action.
