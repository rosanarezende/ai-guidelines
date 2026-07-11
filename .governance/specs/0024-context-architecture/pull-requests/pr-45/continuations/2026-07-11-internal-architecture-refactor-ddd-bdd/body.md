# Internal architecture refactor DDD BDD

> Draft gerado por `continuation:prepare`. Revise antes de publicar.

## Origem

- Spec: 0024
- PR de origem: #45
- Body versionado de origem: `../../body.md`

## Intencao

Continua o trabalho governado a partir de `internal-architecture-refactor-ddd-bdd`.

## Escopo inicial esperado

- Reorganizar `src/cli` e testes de forma behavior-preserving para que o framework seja legivel e sustentavel por mantenedores.
- Ler explicitamente os artefatos do incubador Guilda antes de decidir a gramatica operacional: `work-graph-model/model.yml`, `work-graph-model/tracker.md`, `work-graph-model/features.md` e `work-graph-model/GUILDA-QRD-PRESERVATION-MATRIX.md`.
- Fechar ou dispositionar a gramatica operacional remanescente de `G01`, sem reabrir a gramatica de artefatos/evidencias ja fechada no PR #45.
- Definir o contrato do graph snapshot derivado: quais nos, arestas, source-refs e hashes existem; como regenerar; como validar; e como impedir segunda SSOT.
- Explicitar quais projecoes de `G05` o snapshot atende e quais ficam para consumidores posteriores.
- Aplicar apenas os aprendizados estruturais do work-graph-model que pertencem ao framework `ai-guidelines`; produto, UX, branding e roadmap da Guilda Governance permanecem migrados para o repo Guilda.
- Preservar o recorte definido por `[DEC-0024-G28]`: `G03` e `F-014` seguem como criterios principais de `broad-flow-falsification`, salvo se este PR optar por antecipar apenas uma decisao/documentacao sem falsificacao.

## Cross-ref

Continuacao governada de #45.

## Guardrails

- Nao declara Ready.
- Nao executa Human Gate.
- Nao faz merge.
- Nao avanca topologia.
- Criacao de PR remoto exige confirmacao humana explicita.
- Nao transforma snapshot/projecao em SSOT.
- Nao reativa a Guilda Governance como produto dentro deste repo.
- Nao resolve `G03`, `G05` completo ou `F-014` por declaracao implicita.

## Test plan inicial

- `npm run validate:changed`
- `npm run governed-work-map:check`
- Checks/testes especificos do graph snapshot quando implementados.
- Checks especificos do checkpoint antes de Ready.
