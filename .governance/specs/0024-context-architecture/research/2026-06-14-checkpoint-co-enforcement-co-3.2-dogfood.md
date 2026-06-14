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
