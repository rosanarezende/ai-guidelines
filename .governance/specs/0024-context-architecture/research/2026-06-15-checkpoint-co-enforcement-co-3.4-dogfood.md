# Dogfood CO-3.4 — enforcement advisory-first do recibo de carga (2026-06-15)

> Spec 0024 · `checkpoint-co-enforcement` · sub-checkpoint CO-3.4 (PR #42, modo
> unit). Registro de dogfood + falsificações do caminho NÃO-lançante do recibo de
> carga nas 2 superfícies mutantes situadas — `workflow publish-state` e
> `review:publish` — advisory-first. Escopo ESTRITO do CO-3.4: só estas duas
> superfícies; o dispatcher amplo de enforcement permanece em CO-6.

## Contexto

CO-3.4 entrega o que o `assertFreshHandoffReceipt` (testado e deliberadamente NÃO
conectado no CO-4) prometia, mas em variante **advisory-first** (nunca lança,
nunca bloqueia) e apenas nas duas superfícies escolhidas. O ponto: quando um
agente/humano retoma sem reconciliar (recibo de carga ausente/stale), o comando
mutante **nomeia** o risco e aponta o comando de recarga — sem impedir a ação.

A sessão anterior (Antigravity) deixou um WIP funcional na working tree
(`reviewPublish.ts` + `workflow.ts`), recuperado verbatim em `ffc0e7c` e refinado
em `acb6da0` + `7fdf242`.

## Objeto entregue

- `handoffReceipt.ts`: fonte única da renderização — `specIdFromLabel`,
  `describeReceiptStaleReason` (razão canônica consumida pela guarda lançante E
  pelo advisory), `formatReceiptAdvisory` (linha advisory determinística; `null`
  se fresh). `validateLoadReceipt` ganhou `ignoreSourceIds` (aditivo/back-compat).
- `handoff.ts`: `emitReceiptAdvisory(repoRoot, priorReceiptText, logger)` —
  caminho não-lançante centralizado das 2 superfícies; deriva o snapshot SEM
  escrita e SEM rede; degrada de forma diagnosticável.
- `workflow.ts` (`runPublishState`) e `reviewPublish.ts` (`runReviewPublish`)
  chamam `emitReceiptAdvisory`; `review:publish` captura o recibo PRÉVIO antes do
  ato de carga.

## Reprodução (real, neste repo mantenedor)

```bash
# carga fresh → publish-state (sem --status, p/ não mutar active.yml): SEM advisory
npm run guidelines -- handoff 0024
npm run guidelines -- workflow publish-state          # só erro de --status; nenhum advisory

# recibo stale-head (corrompe head no .git/, efêmero) → advisory dispara
python3 -c "import json;p=__import__('subprocess').check_output(['git','rev-parse','--absolute-git-dir']).decode().strip()+'/ai-guidelines/handoff-load.json';r=json.load(open(p));r['head']='deadbee';json.dump(r,open(p,'w'))"
npm run guidelines -- workflow publish-state
#  ⚠️  [advisory] retomada não reconciliada — recibo stale: HEAD carregado deadbee ≠ HEAD atual acb6da0. Recarregue com: npm run guidelines -- handoff 0024
```

Evidência: recibo FRESH ⇒ silêncio; recibo STALE ⇒ advisory + comando de recarga;
nenhuma mutação de arquivo versionado (publish-state sem `--status` sai antes da
escrita do `active.yml`). Advisory-first: em nenhum caso o exit code muda por causa
do recibo.

## Falsificações (todas viraram teste vermelho-primeiro)

### F1 — `publish-state` reescrevia o recibo silenciosamente

O WIP usava `loadHandoffSnapshot`, que é um ATO DE CARGA: `createLoadReceipt` +
`writeReceipt` (efeito colateral). Resultado: cada execução de `publish-state`
reescrevia o recibo como fresh, **mascarando staleness** em execuções seguintes e
violando o invariante cravado ("recibo stale NUNCA é atualizado silenciosamente").
Correção: derivar via `collectHandoffFacts` + `deriveHandoff` (sem escrita).
Regressão (`workflow.integration.test.ts`): após um run com recibo ausente, nenhum
recibo é criado; com recibo stale-head, ele **permanece** stale-head após o run.

### F2 — advisory de `review:publish` era código morto

`runReviewPublish` chama `collectReviewBrief`, que reusa `loadHandoffSnapshot` e
**reescreve o recibo fresh** ANTES do ponto do advisory. Logo, o advisory validava
contra um recibo que ele mesmo acabara de atualizar ⇒ **sempre fresh** ⇒ jamais
disparava. Correção: capturar `readReceiptText` ANTES do briefing e validar o
recibo PRÉVIO. Falsificação (`reviewPublish.test.ts`): com recibo missing/stale-head
o advisory dispara e a publicação prossegue (exit 0).

### F3 — falso-positivo na fonte remota `pull-request`

Dogfood real: logo após uma carga fresh, `publish-state` acusava "fontes
divergiram (pull-request)". A carga coleta o PR via `ghRemotePrCollector` e grava
o fingerprint remoto; o advisory derivava sem remote ⇒ `pull-request` "unavailable"
⇒ divergência falsa a cada execução. Correção: o advisory é **local** (sem rede) e
**ignora** `pull-request` (`ignoreSourceIds`); a frescura do PR é domínio do
`handoff:check`, que faz remote explicitamente. Falsificação (`handoffReceipt.test.ts`):
pull-request divergente é ignorada ⇒ fresh; divergência LOCAL (state.yml) ainda é
detectada. Benefício colateral: zero chamada de rede `gh` por execução nas
superfícies mutantes (suíte afetada caiu de ~36s para ~5s).

## Os 5 estados, provados

- **Renderização** (`handoffReceipt.test.ts`): `formatReceiptAdvisory` para
  fresh→null, missing, invalid, stale-head, stale-sources (strings exatas) + prova
  de fonte única (advisory ∩ guarda lançante compartilham `describeReceiptStaleReason`).
- **End-to-end `publish-state`** (`workflow.integration.test.ts`): os 5 estados via
  recibo controlado em repo git real + degradação diagnosticável + 2 regressões
  anti-reescrita. Todos com exit 0 (advisory-first).
- **End-to-end `review:publish`** (`reviewPublish.test.ts`): missing/fresh/stale-head
  com publicação prosseguindo (exit 0).

## Degradação diagnosticável

O `catch` silencioso do WIP (`// Silently ignore…`) virou linha advisory que NOMEIA
o motivo: `ℹ️  [advisory] verificação de recibo de carga ignorada — contexto de
carga indisponível (<erro>)`. Provado por cenário com spec irresolvível (branch
`main`, sem `.governance`): a linha aparece e nunca vira erro/bloqueio.

## Fronteira honrada

- CO-3.4 segue `[/]` em `tasks.md`; **não** marcado `[x]`. O enforcement amplo
  (dispatcher) é CO-6, fora daqui.
- A **eliminação integral da árvore `/cli`** NÃO faz parte do CO-3.4. Decisão da
  owner (2026-06-15) abre um sub-checkpoint próprio **CO-3.5 — colapso integral do
  runtime CLI**, no MESMO nó/PR/Gate; o desenho anterior ("`/cli` permanece como
  wrapper/compatibilidade") foi falsificado por evidência operacional e está
  registrado como decisão governada superada (ver o registro de decisão e
  `plan.md`). Nesta sessão: CO-3.5 nasce `[ ]`, sem início; `/cli` intacto.
- Nenhum `decide` mutante exercido; sem Ready/gate/merge; PR #42 segue Draft.
