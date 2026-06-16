# Dogfood CO-3.3 — migração e remoção do substrato legacy (2026-06-14)

> Spec 0024 · `checkpoint-co-enforcement` · sub-checkpoint CO-3.3 (PR #42, modo
> unit). Registro de dogfood + falsificação da migração do resíduo
> legacy-transitório do monólito (cercado no PR #38) para o compilador
> TypeScript em `src/`, e sua remoção sob `grep monolith = 0`.

## Contexto

O monólito (`cli/governance/monolith/**`: `compiler`, `rules-parser`,
`rules-builder`, `rules-loader`, `token-budget`) era a superfície de
compatibilidade que sobrou após a migração do `build:rules`/`runtime-bootstrap`/
`pointers` para `src/` (RulesCatalogBuilder · RulesRuntimeCompiler ·
AgentsRuntimeBootstrap). O resíduo **ativo** restante era:

- `token-budget` (lógica de orçamento) consumido por `check-budget`
  (`cli/features/core/budget-report.mjs`);
- `getOptInRuleRelativePath` (`rules-loader`) consumido pelas features
  editoriais (`bdd`/`tdd`/`quality-gates`);
- `loadRulesCatalog` / `buildAgentsRuntimeStub` (`compiler`), este último já
  duplicado de forma canônica em `AgentsRuntimeBootstrap.ts`.

CO-3.3 porta essa lógica para `src/`, reconecta os consumidores via ponte
`dist/` (padrão já usado por `pointers.mjs`) e deleta o substrato.

## Objeto entregue

- `src/app/services/TokenBudget.ts` — port verbatim da aritmética (Tok-H,
  `LIMITS`, `HARD_REDIRECT_BASE_TOKENS = 95`, `analyzeScopeBudgets`/
  `analyzeAgentsMdBudget`/`analyzePerAdapterBudgets`/`analyzeBudget`). O texto
  do stub do AGENTS.md passou a ser **injetável** (default = `buildAgentsRuntimeStub`
  canônico).
- `src/app/services/OptInRulePaths.ts` — port de `getOptInRuleRelativePath`.
- `cli/features/core/budget-report.mjs` — lê `rules.json` inline + carrega
  `analyzeBudget` de `dist/`; `cli/features/opt-in/editorial/opt-in-rule-paths.mjs`
  centraliza a ponte para `bdd`/`tdd`/`quality-gates`.
- Fixtures `rules-builder` → `src/app/services/__fixtures__/`.
- Removidos `cli/governance/monolith/**` + `cli/governance/index.mjs` (morto) +
  alias `#governance/monolith/*`.
- `src/test-utils/NoMonolithResidue.test.ts` — guarda do critério.

## Reprodução (real, neste repo)

```bash
# 1) gate completo (build:all + 183 node:test + 1653 jest + checks) — verde
npm run validate            # VALIDATE_EXIT=0

# 2) critério de aceitação: grep monolith = 0 no código
grep -rniI monolith --include="*.mjs" --include="*.js" --include="*.ts" cli src \
  | grep -v NoMonolithResidue        # (vazio)

# 3) check-budget end-to-end pelo caminho reconectado (dist)
npm run build && npm run guidelines -- check-budget
```

`check-budget` (3) imprime o relatório real, agora medindo o stub **canônico**:

```
Payload (distributed files):
  ✅ AGENTS.md (compilado)          892 /  2700 tokens ( 33%)
  ✅ entrypoint claude              222 /   800 tokens ( 28%)
```

## Falsificação

1. **Paridade da aritmética.** `TokenBudget.test.ts` carrega os valores _golden_
   verbatim do antigo `token-budget.test.mjs` (somas por escopo, `595 = 500 + 95`
   no per-adapter, ordenação por id, warnings de soft ceiling a 75%). Mudar
   qualquer constante (ex.: `HARD_REDIRECT_BASE_TOKENS`) derruba o teste. ✅ verde.

2. **Bug encontrado no dogfood — medição do stub stale.** O monólito media
   `buildAgentsRuntimeStub` da própria cópia em `compiler.mjs`, que estava
   **stale** (era yarn-era: `yarn guidelines handoff`, sem os bullets de
   work/review/decide). O `check-budget` reportava ~290 tokens para um AGENTS.md
   que na prática (escrito por `pointers.mjs` via stub canônico TS) tem **892**.
   A migração injeta o stub canônico ⇒ a medição passa a refletir o arquivo
   real (892/2700, dentro do orçamento, sem warning). Falsificação: o teste do
   stub default afirma `tokens === calculateTokH(buildAgentsRuntimeStub())` e
   `< LIMITS.agentsMd`.

3. **Guarda `grep monolith = 0`.** `NoMonolithResidue.test.ts` varre
   `cli/**` + `src/**` e exige zero referências (além do próprio guarda) + a
   ausência do diretório do monólito. Reintroduzir um `import` do substrato
   torna o guarda vermelho. ✅ verde.

4. **Consumidores contra `dist/`.** As features editoriais (`bdd`/`tdd`/
   `quality-gates`) e `pointers` foram exercidas contra o TS compilado
   (node:test 25/25), provando que a ponte resolve o módulo e preserva o
   comportamento de sync (incluindo i18n e fallback PT).

## Decisões de implementação

- **Stub injetável** em `TokenBudget.ts`: separa a _lógica_ (testável com golden
  determinístico) da _entrada_ (stub real), e foi o que permitiu corrigir a
  medição stale sem acoplar o teste ao tamanho do stub.
- **Ponte `dist/` por consumidor** (não duplicação): mantém o TS como SSOT única
  e segue o precedente de `pointers.mjs` (`validate` constrói `dist/` antes dos
  testes `.mjs`).
- **Fixtures co-localizadas** com o único teste sobrevivente que as usa
  (`RulesCatalogBuilder.test.ts`); as fixtures de `rules-parser` (só usadas por
  testes deletados) saíram com o substrato.

## Fronteira honrada

- CO-3.3 segue `[/]` em `tasks.md`; **o avanço para CO-3.4 NÃO foi exercido** —
  é decisão governada da owner (`decide advance-subcheckpoint`) e exige CI verde
  (4 verificações ainda pendentes no push). Sem Ready, sem gate, sem merge.
- `check-budget` é diagnóstico advisory (não entra no `validate`); o `❌
universal 1746/1500` é sinal **pré-existente** do catálogo de regras, não um
  efeito desta migração (a math de escopo é preservada bit-a-bit).

## Parte 2 — Correções de dogfood da nova sessão (2026-06-14)

Quatro achados ao reabrir o CO-3.3 numa sessão limpa. Todos corrigidos na
ESTRUTURA (não cosméticos), com falsificação registrada.

### P1 — Projeção de tarefa do `handoff` divergia do `work`

**Fato.** Com CO-3.3 `[/]` em `tasks.md`, o `handoff` declarava "não há tarefa
executável" (§5) enquanto o `work` identificava CO-3.3 — duas projeções da MESMA
fonte divergindo. O handoff só contava checkboxes `[ ]` de TOPO do checkpoint; os
sub-checkpoints aninhados eram invisíveis para ele, e o `work` compensava
re-derivando no ramo de fallback.

**Causa-raiz (estrutural).** Duas derivações de sub-checkpoint: `work` usava
`resolveSubCheckpointWork`; o `handoff` (`deriveNextAction`) não consultava
`facts.subCheckpoints`.

**Correção.** `resolveSubCheckpointWork` + tipos movidos para `handoffFacts.ts`
(fonte ÚNICA; re-export em `workBrief` para compat). `deriveNextAction` passou a
consultá-la antes do fallback (kinds novos `implement-subcheckpoint` /
`advance-subcheckpoint-transition`); o switch do `work` roteia esses kinds para a
MESMA função. Resultado real: handoff §5 agora = "Implementar o sub-checkpoint
ativo CO-3.3 — … (tasks.md linha 103)", idêntico ao `work`.

**Invariante falsificável** (`handoffWorkParity.test.ts`): com CO-3.1/3.2 done,
CO-3.3 `[/]`, CO-3.4 `[ ]` — se `work` deriva `IMPLEMENT_CHECKPOINT` com objeto,
o `handoff` nomeia o MESMO objeto (id+linha) e nenhum declara zero tarefas;
quando tudo conclui, ambos caem no mesmo fallback (sem objeto).

### P2 — Guard `grep monolith = 0` era lexical (frágil)

**Fato.** A guarda proibia a PALAVRA "monolith" no código — falso-positivo em
proveniência/comentário/nomes; forçou remover paths úteis e renomear um dir de
teste só para passar.

**Correção.** Guard ARQUITETURAL (`NoMonolithResidue.test.ts`): verifica (1) dir
`cli/governance/monolith/` ausente, (2) alias `#governance/monolith/*` fora de
`package.json#imports`, (3) nenhum import/require/dynamic-import resolve o path do
substrato (extrai SPECIFICADORES de módulo, não a palavra), (4) corolário: zero
consumidor vivo, (5) re-export `index.mjs` ausente. Proveniência em comentário
NÃO falha (meta-teste do extrator). **Revertido:** paths de proveniência
restaurados em `TokenBudget*.ts`/`OptInRulePaths*.ts`; rename `monolithic-core`
em `pointers.test.mjs` (sem valor arquitetural) desfeito.

### P3 — Narrativa stale em `tasks.md` (CO-3.1 `[x]` dizia "EM EXECUÇÃO")

**Correção.** Coerência estado↔narrativa integrada ao `active-specs:check`
(reusa `parseSubCheckpoints` — sem parser paralelo; lê o cursor da topologia):
`[x]` não pode narrar "em execução/progresso"; `[ ]` não pode narrar
"concluído/implementado"; no máximo um `[/]`. Um `[/]` PODE dizer "Implementado"
(implementado mas ainda não avançado — o caso real do CO-3.3). `tasks.md` saneado
(CO-3.1 → "Concluído.").

**Falsificável:** `active-specs:check` falha citando o sub-checkpoint incoerente;
o check passa no repo real (CO-3.3 `[/]` "Implementado" NÃO é falso-positivo).

### P4 — Mudança do token budget formalizada

Os testes separam **paridade da aritmética** (golden, stub injetado) de **mudança
intencional da entrada** (stub legado→bootstrap canônico): a math não depende do
stub (breakdown idêntico); o default mede o stub canônico; a diferença de
contagem vem do input e fica dentro do orçamento; nenhum limite mudou. O contrato
ADVISORY do `check-budget` é provado por `budget-report.test.mjs` (estouro =
exit 0; catálogo ausente = exit 1; `check-budget` fora do `validate`).

### Fronteira (Parte 2)

CO-3.3 segue `[/]`; CO-3.4 segue `[ ]`. Nenhum `decide` exercido. Correções
dentro do checkpoint autorizado; sem Ready/gate/merge.
