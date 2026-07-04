# Legacy Surface Audit — governance-demo

Data: 2026-07-04

Escopo: `governance-demo/` + arquivos arquivados referenciados por ela em `../_archive/`

HEAD auditado inicialmente: `5778dfb6`

Atualizacao nesta mesma trilha: o antigo `backend/backends` foi removido como pasta de runtime; sua
responsabilidade agora vive em `backend/src/application/backend-examples/`, em TypeScript e dentro
do typecheck do backend.

Atualizacao posterior na mesma trilha: `backend/tools` tambem saiu do backend de produto. A
superficie operacional ativa agora vive em `tools/{checks,repo-first,read-models,journeys}` e foi
convertida para TypeScript executavel pelo Node nativo.

## Veredito

Nao ha base segura para deletar ou arquivar novas pastas agora. A maior parte do que parece legado e
superficie ativa por outro motivo: CLIs de validacao, fixtures de repos existentes ou exemplos
derivados de backend.

A decisao correta para esta fatia e classificar e congelar crescimento silencioso:

- codigo novo de produto/runtime continua proibido em `.mjs`;
- `backend/src`, `frontend`, `mock-api` e `test` sao os caminhos ativos em TypeScript;
- `tools/**/*.ts` fica como CLI ativo ja fora de `backend/`; fortalecimento de tipos internos deve
  acontecer por lote funcional;
- `backend/src/application/backend-examples/*.ts` fica ativo como projecao derivada tipada;
- `backend/examples/read-models/*` fica ativo como evidencia derivada para file/Neo4j/SQLite/Mongo;
- `acme/repos/**/*.mjs` fica ativo como fixture de empresa existente, nao como padrao de app novo;
- `_archive/*` permanece historico e nao deve voltar para a superficie ativa.

## Base verificada

- Working tree limpo no inicio da auditoria.
- `governance-demo/README.md` declara `frontend/` como superficie ativa, `backend/src/` como runtime
  TypeScript e `backend/examples/read-models/` como exemplos derivados verificados.
- `governance-demo/NEXT-STEPS.md` ja registra a v2 e os apps estaticos v3 como arquivados.
- `tools/checks/check-governance-app.ts` ja barra retorno de pastas ativas antigas como
  `_org-simulation-v2`, `_org-simulation-v3`, `_apps`, `_lib`, `_tools`, `acme-governance` e `repos`.
- Inventario `.mjs` atual:
  - `tools`: 0 arquivos;
  - `backend/backends`: removido como pasta rastreada;
  - `backend/src/application/backend-examples`: 2 arquivos `.ts`;
  - `backend/index.mjs` e `backend/paths.mjs`: 2 shims;
  - `acme/repos`: 20 arquivos de codigo/teste fixture;
  - outros: 0.

## Classificacao por superficie

| Superficie                                      | Papel atual                                                               | Classificacao           | Decisao agora       | Proxima acao                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------- | ----------------------- | ------------------- | ------------------------------------------------------------------------------- |
| `backend/src/`                                  | runtime tipado: dominio, aplicacao, ports/adapters, API                   | ativo primario          | manter              | toda feature nova de backend entra aqui                                         |
| `frontend/`                                     | app Next/MUI ativo                                                        | ativo primario          | manter              | continuar telas humanas sem reintroduzir console como fluxo principal           |
| `mock-api/`                                     | harness local de desenvolvimento/e2e                                      | ativo primario          | manter              | expandir seeds e cenarios E2E quando houver novas jornadas                      |
| `test/`                                         | Playwright/e2e da demo                                                    | ativo primario          | manter              | cobrir seeds criticas progressivamente                                          |
| `backend/index.mjs`                             | shim de compatibilidade; reexporta `./src/index.ts` e backends de exemplo | legado tecnico ativo    | manter temporario   | remover quando CLIs nao precisarem mais do barrel `.mjs`                        |
| `backend/paths.mjs`                             | shim de compatibilidade; reexporta `src/shared/paths.ts`                  | legado tecnico ativo    | manter temporario   | remover quando todos os CLIs forem TS ou importarem paths TS diretamente        |
| `tools/**/*.ts`                                 | checks, publishers, adopcao repo-first, dogfood e smokes operacionais     | CLI ativo operacional   | manter, nao crescer | fortalecer tipos por grupos funcionais                                          |
| `backend/src/application/backend-examples/*.ts` | export/smoke deterministico dos exemplos de backend derivados             | projecao ativa tipada   | manter              | manter junto da aplicacao backend; exporter CLI continua so como invocador fino |
| `backend/examples/read-models/*`                | read-models derivados file/Neo4j/SQLite/Mongo + contrato de acao          | artefato ativo derivado | manter              | regenerar apenas via exporter; nao editar como SSOT                             |
| `acme/repos/**/*.mjs`                           | codigo MVP de repos ficticios, simulando empresa que ja tem JS            | fixture ativa           | manter              | opcional: adicionar um repo TS futuro; nao converter todos por padronismo       |
| `acme/repos/**/test.mjs`                        | testes locais que os adapters/smokes executam                             | fixture ativa           | manter              | migrar apenas junto do repo fixture correspondente                              |
| `frontend/app/settings/_sections/*`             | secoes da Settings demo acme, importadas por `SettingsView`               | ativo de demo           | manter              | renomear se a duplicidade com WorkspaceSettings continuar confundindo           |
| `../_archive/org-simulation-v2`                 | historico operacional v2 e referencia de aprendizados                     | arquivo historico       | manter arquivado    | usar so como referencia; nao importar no fluxo ativo                            |
| `../_archive/org-simulation-v3-static-apps-v1`  | prototipos estaticos F3/F4 e ferramentas antigas                          | arquivo historico       | manter arquivado    | nao mover de volta; guards ja falham se retornar a superficie ativa             |
| `templates/`                                    | templates ativos de adocao/capability extraction                          | ativo auxiliar          | manter              | revisar junto de fluxos de scaffold/adocao                                      |

## Decisoes explicitas

### Nao deletar agora

Nenhum arquivo/pasta foi identificado como lixo seguro para remocao imediata. Os grupos suspeitos
tem consumidores documentados ou papel de fixture.

### Nao arquivar agora

Nao ha nova pasta a mover para `_archive` nesta fatia. O que precisava estar arquivado ja esta fora
da superficie ativa (`org-simulation-v2` e apps estaticos v3).

### Fortalecer depois, com criterio

O fortalecimento de tipos dos CLIs deve ser por lote funcional, nao por padronismo:

1. `tools/checks/check-governance-app.ts`, `check-runtime.ts`, `test-adversarial.ts` e
   `adoption-journey.ts` primeiro, porque sao guards centrais.
2. publishers repo-first (`publish-*`, `check-repo-*`, `prepare-capability-review`) depois, porque
   ainda exercitam o dogfood de repos existentes.
3. fixtures acme apenas quando houver valor de simulacao, por exemplo adicionar um repo TypeScript,
   nao converter todos os repos ficticios como se empresas reais fossem homogeneas.

## Guardrails

- Proibido criar novo `.mjs` em `backend/src`, `frontend`, `mock-api` ou `test`.
- Novo mecanismo de produto/backend entra em TypeScript.
- `.ts` existente em `tools` so deve ser alterado quando o proprio CLI for a fatia; a pasta ja
  esta fora do runtime backend.
- `backend/examples/read-models` e read-model derivado, nao SSOT; toda acao governada deve reler YAML/event-log.
- `_archive` e referencia historica; import ativo de la precisa ser tratado como regressao.

## Impacto no acompanhamento

Esta auditoria fecha a base de W18: o legado foi classificado. A meta nao esta "pronta" no sentido
de produto; ela apenas deixa claro que a proxima etapa nao e limpeza por delecao, e sim
fortalecimento gradual dos CLIs operacionais e ampliacao das telas/rotas reais.
