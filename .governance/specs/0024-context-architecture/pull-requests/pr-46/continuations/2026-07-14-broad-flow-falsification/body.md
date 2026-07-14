# [🛠️13️⃣➜] [Spec 0024] Falsificação ampla do lifecycle governado

## Visão pretendida

Transformar os contratos estruturais consolidados no PR #46 em jornadas
executáveis que consigam provar e falsificar o lifecycle governado de ponta a
ponta. O resultado esperado não é uma coleção de happy paths: cada jornada deve
deixar explícitos contexto, autoridade, transição, evidência e valor entregue,
com projeções consistentes para humanos, CLI, site/mapa, PR body e checks.

## Resumo

Este Draft PR continua o trabalho governado do PR #46 no checkpoint
`broad-flow-falsification`, ainda dentro do nó topológico seq. 13. O PR #46
concluiu o refactor DDD/BDD e recebeu Human Gate; este recorte separado concentra
a falsificação ampla para manter revisão, evidências e riscos proporcionais.

O checkpoint materializa os critérios de `[DEC-0024-G23]` e
`[DEC-0024-G28]`: contrato canônico de journeys, prova de valor incremental,
promoção real versus contextual de work-items, projeções por consumidor e uma
disposição verificável para o comportamento não linear (`F-014`).

## Escopo

### Dentro do escopo

- Definir `fixtures/journeys` como contrato canônico e versionado das jornadas.
- Reconciliar as fontes paralelas atuais em `tests/consumer-journey/fixtures`,
  `site/src/content/simulatorProjects.ts` e `site:scenarios`, eliminando duplicação
  ou registrando disposição explícita quando a convergência não for correta.
- Falsificar jornadas que provem valor entregue, e não apenas transições válidas.
- Provar o pipeline `G03`: promoção real de work-item, promoção
  contextual/projetada e pontos que exigem decisão humana.
- Provar `G05` por consumidor real: CLI, site/mapa, PR body e checks.
- Incluir uma jornada não linear ou dispositionar `F-014` explicitamente como
  explicação opcional não bloqueante.
- Derivar casos da matriz Guilda para contratos, fixtures/seeds, adapters,
  separação identity × governance × content, governance host Git-backed e
  projeções por consumidor, mantendo produto Guilda no repositório irmão.
- Preservar a regra: uma pergunta importante tem uma derivação canônica; as
  superfícies apenas coletam fatos e renderizam a resposta.

### Fora do escopo

- Criar novo nó topológico para este checkpoint.
- Abrir ou implementar `dualroot-collapse`.
- Executar `continuation-review-human-gate`, Ready ou Human Gate automaticamente.
- Implementar shared kernel, aliases Guilda Flow ou troca cross-repo.
- Implementar desktop, portal, identidade, UX ou branding da Guilda.
- Fazer merge em `main` ou reescrever a stack.

## Critérios de saída

- Journeys canônicas possuem schema/contrato, ownership e validação executável.
- Fontes paralelas foram unificadas ou receberam disposição explícita, sem débito
  silencioso (`GG-0005`).
- Existem casos negativos para stale state, concorrência, input hostil e
  autoridade humana, proporcionais ao lifecycle coberto.
- `G03`, `G05` e `F-014` estão provados, falsificados ou rebaixados por decisão
  explícita com evidência.
- A matriz Guilda foi usada linha a linha; elementos de produto permanecem
  marcados como migrados para o repo Guilda.
- Body, tasks e projeções derivadas refletem o que foi realmente entregue.
- Reviews e Human Gate seguem o plano situado que a owner decidir para este PR.

## Guardrails

- O repo governado permanece SSOT; fixtures, mapas e snapshots são projeções.
- IA sintetiza e revisa; não decide gates nem executa mutações autônomas.
- Nenhum comando deste PR pode declarar Ready, registrar Human Gate, fazer merge
  ou avançar topologia sem decisão humana explícita.
- O checkpoint não reabre o refactor arquitetural aprovado no PR #46 sem finding
  factual novo.

## Test plan inicial

```bash
npm run build
npm run test
npm run validate:changed
npm run governed-work-map:check
npm run governance-graph:check
npm run handoff:check -- --spec 0024
```

Antes de Ready, executar `npm run validate` e as suítes específicas de journeys,
projeções e autorização criadas nesta fatia.

## Origem e cross-references

- Continuação governada do PR #46.
- Body versionado de origem: `../../body.md`.
- Pacote preparado por `continuation:prepare`; criação remota exige confirmação
  humana explícita.
- `[DEC-0024-G21]`, `[DEC-0024-G23]`, `[DEC-0024-G27]`, `[DEC-0024-G28]` e
  `[DEC-0024-G31]`.

## Disclosure

Este body foi preparado por IA a partir dos artefatos governados do repositório e
revisado sob decisão explícita da maintainer. O repositório vence esta narrativa.
