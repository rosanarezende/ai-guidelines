# Próximos passos — dogfood repo-first robusto

> Autoridade: `../model.yml` é o SSOT do modelo. Este arquivo é roteiro operacional da sim v3.
> Regra: toda fase precisa de mecanismo verificável, fixture adversarial e projeção no grafo/dashboard.

## Estado atual

A v3 já prova a estrutura repo-first mínima:

- repos acme têm código MVP importável;
- cada repo tem `.governance/manifest.yml`, `context.json`, `works/*.yml` e, quando owner, `registry/contracts/*.yml`;
- o host valida `repo-context-*`, `repo-work-*` e `repo-contract-*`;
- `node _tools/adoption-journey.mjs` exercita código, contextos, work acknowledgements, contratos, red-team e grafo.

O que ainda falta para parecer uma adoção real: outcome publicado, lifecycle das peças, testes locais por repo e drift código↔governança mais profundo.

## Fase A — primeiro outcome real

**Escolha inicial:** `intent-cta-upgrade`, por ser validate-first, cross-repo e com attester independente (`acme-analytics`).

Entregas:

- adicionar outcome válido em `acme/outcomes/outcomes.yml`;
- provar que ele soma apenas no `primary-target` da intent;
- citar `source`, `revision`, `window`, `metric`, `attested-by`, `contract-revisions` e `envelope`;
- atualizar o app/graph apenas por geração, sem preencher dashboard à mão.

Falsificações obrigatórias:

- outcome sem `revision` falha;
- outcome com `aggregation` diferente da metric-definition falha;
- outcome somando em target diferente sem decision falha;
- outcome de intent que muda contrato sem citar revisão falha;
- outcome self-attested sem colapso logado falha.

Critério de aceite:

- `node _tools/adoption-journey.mjs` passa;
- red-team inclui pelo menos um caso positivo real e um caso inválido derivado do novo outcome;
- grafo mostra outcome → target → objective.

## Fase B — lifecycle repo-local das peças

Problema atual: o repo reconhece a peça, mas não declara progresso real.

Modelo operacional:

- `status: acknowledged | active | blocked | done | dropped`;
- `active` exige `owner`, `started-at` e `base-revision`;
- `done` exige `completed-at`, `evidence`, `source-commit` e `verification`;
- `blocked` exige `blocked-by` ou `reason` rastreável;
- `dropped` exige decisão/fate e não pode alimentar outcome de valor.

Falsificações obrigatórias:

- outcome antes de work necessário estar `done` falha;
- `done` sem evidência de código/teste falha;
- work com `source.breakdownHash` stale falha;
- work `blocked` sem motivo rastreável falha;
- `dropped` ainda somando outcome falha.

Critério de aceite:

- os repo-work acknowledgements deixam de ser apenas confirmação de existência;
- dashboard separa trabalho reconhecido, ativo, bloqueado e concluído.

## Fase C — aprofundar repos críticos

Repos prioritários:

- `acme-core-api`: monolito modular com owners por módulo e seams reais para strangler;
- `acme-checkout`: fluxo usuário + flag + integração com checkout API;
- `acme-analytics`: schema de eventos + baseline + attestation de outcome.

Entregas:

- testes locais por repo (`npm test` ou script equivalente) sem instalar dependência externa;
- schema de eventos versionado no `acme-analytics`;
- contrato de `acme-user-context` com payload mais concreto;
- fixture que altera código sem republicar `context.json` e falha por stale;
- fixture que altera contrato local sem atualizar `contracts.yml` e falha.

Critério de aceite:

- `check-code-fixtures` continua sendo integração global;
- cada repo crítico também prova seu comportamento localmente;
- capability extraction passa a ter evidência de testes/exportações, não só palavras do manifesto.

## Fase D — policy e confiança remanescentes

Ainda não mecanizado na v3 física:

- ACL por edge/query dentro do host;
- revogação/nonce de authority;
- fallback rastreável quando política bloqueia egress/matcher;
- quarantine de segredo colado em YAML;
- independência do oráculo (`policy-pack`, fixtures e expected-outcomes com autores distintos).

Critério de aceite:

- cada controle tem resolver fail-closed ou warning visível, nunca campo decorativo;
- cada gap tem fixture adversarial que primeiro falha e depois passa.

## Fase E — destino da v2

Decisão pendente:

- arquivar `_org-simulation-v2` como histórico;
- migrar apenas aprendizados ainda únicos;
- ou manter temporariamente como comparação, com aviso explícito de que v3 é a frente ativa.

Critério de aceite:

- não existem duas simulações ativas com modelos concorrentes;
- README/tracker apontam uma única frente operacional.
