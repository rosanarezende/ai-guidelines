# Próximos passos — sim v3 após o dogfood repo-first robusto

> Autoridade: `../model.yml` é o SSOT do modelo. Este arquivo é roteiro operacional da sim v3.
> Regra: toda fase precisa de mecanismo verificável, fixture adversarial e projeção no grafo/dashboard.

## Estado atual

A v3 já prova uma adoção repo-first mais próxima de uma empresa que já tem seus repos:

- repos acme têm código MVP importável;
- repos críticos (`acme-core-api`, `acme-checkout`, `acme-analytics`) têm testes locais sem dependência externa;
- cada repo tem `.governance/manifest.yml`, `context.json`, `works/*.yml` e, quando owner, `registry/contracts/*.yml`;
- o host valida `repo-context-*`, `repo-work-*` e `repo-contract-*` por resolver fail-closed;
- `intent-cta-upgrade` publica um outcome real em `acme/outcomes/outcomes.yml`, com source/revision/window/attester/envelope e rollup derivado;
- peças repo-local têm lifecycle (`acknowledged|active|blocked|done|dropped`) e outcome não soma antes de `done`;
- `acme/trust-policy.yml` materializa controles de ACL local, revogação, fallback de matcher, secret quarantine e independência do oráculo;
- `node _tools/adoption-journey.mjs` exercita código, contextos, work acknowledgements, contratos, red-team, testes locais e grafo.

## Fases A–E fechadas nesta leva

### Fase A — primeiro outcome real

Fechado em `intent-cta-upgrade`:

- outcome válido em `acme/outcomes/outcomes.yml`;
- source, revision, window, metric, aggregation, attested-by, contract-revisions e envelope resolvidos;
- grafo/dashboard projetam outcome → target → objective;
- fixtures adversariais bloqueiam outcome sem revisão, agregação incompatível, target errado, contrato omitido e self-attestation sem colapso.

### Fase B — lifecycle repo-local das peças

Fechado nos acks `.governance/works/intent-cta-upgrade--*.yml`:

- `done` exige owner, datas, base revision, source commit, evidência e verificação;
- `blocked` exige causa rastreável;
- `dropped` exige decisão/fate e não pode alimentar outcome de valor;
- outcome emitido por uma intent falha se alguma peça necessária ainda não está `done`.

### Fase C — aprofundar repos críticos

Fechado com testes locais e drift falsificável:

- `acme-core-api`: monolito modular com teste de módulos e API legada;
- `acme-checkout`: fluxo usuário + tracking;
- `acme-analytics`: schema de eventos + eventos de exposição/conversão;
- fixtures cobrem código que muda sem republicar `context.json` e contrato local que muda sem atualizar o registry central.

### Fase D — policy e confiança remanescentes

Fechado como primeira versão física de `trust-policy.yml`:

- ACL por edge/query dentro do host;
- revogação/nonce/idempotência no envelope;
- fallback rastreável quando política bloqueia matcher externo;
- quarantine de segredo colado;
- independência do oráculo do corpus.

### Fase E — destino da v2

Fechado:

- `_org-simulation-v2` fica arquivada como histórico operacional e referência de aprendizados únicos;
- `_org-simulation-v3` é a única frente ativa de dogfood físico.

## Próximo ciclo

1. **Revisão adversarial pós-F7:** pedir ao Claude Code/Fable 5 para revisar o diff desde `a970415b`, sem implementar, usando [`CLAUDE-CODE-FABLE-5-HANDOFF.md`](CLAUDE-CODE-FABLE-5-HANDOFF.md).
2. **Walkthrough da owner:** percorrer no app company/owner a cadeia `objective → target → intent → repo-work done → outcome → actual`.
3. **Segunda intent com outcome:** escolher uma intent que toque contrato ou objetivo operacional para provar que o mecanismo não está especial-cased no `intent-cta-upgrade`.
4. **Operacional sem intent:** publicar um outcome standalone no bucket operacional para validar o caminho solo/reativo.
5. **Resolver de decisão humana:** transformar alertas remanescentes em decisões append-only quando a owner escolher colapso, exceção ou correção estrutural.

## Comandos de aceite

```bash
cd _org-simulation-v3
node _tools/validate.mjs
node _tools/test-adversarial.mjs
node _tools/check-local-repo-tests.mjs
node _tools/adoption-journey.mjs
node _tools/build-graph.mjs
```
