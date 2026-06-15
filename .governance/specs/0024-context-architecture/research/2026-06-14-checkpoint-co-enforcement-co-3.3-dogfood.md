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
