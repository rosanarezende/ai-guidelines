# Governance Demo Tools

`tools/` e a bancada operacional da `governance-demo`.

Ela existe para provar, publicar e manter a simulacao `acme-*`. Ela nao e o backend de produto, nao e API do app e nao deve receber feature nova de governanca. O backend ativo fica em `../backend/src`; o app chama esse backend por `@demo/backend` e `@demo/backend/domain`.

## Para que serve

Use `tools/` quando precisar:

- verificar se os YAML da org ficticia continuam validos;
- rodar o corpus adversarial e os smokes da runtime;
- publicar ou conferir os sidecars `.governance/` dos repos ficticios;
- exportar read-models derivados para file, SQLite, Neo4j e Mongo;
- provar uma jornada completa de adocao de repos existentes;
- testar adapters locais de integracao sem transformar nenhuma ferramenta externa em SSOT.

Nao use `tools/` para:

- criar regra de negocio nova;
- implementar tela do app;
- gravar estado autoritativo por fora dos comandos governados;
- importar dentro de `backend/src`;
- criar caminho alternativo ao SDK `@demo/backend`.

## Organizacao

| Pasta          | Responsabilidade                                           | Exemplos                                                                                                     |
| -------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `checks/`      | Validacao e falsificacao da sim.                           | `validate.ts`, `test-adversarial.ts`, `check-runtime.ts`, `check-governance-app.ts`, `check-integrations.ts` |
| `repo-first/`  | Publicacao e conferencia dos sidecars dos repos ficticios. | `publish-contexts.ts`, `check-repo-works.ts`, `prepare-capability-review.ts`                                 |
| `read-models/` | Exportacao e smoke das projecoes derivadas de banco/grafo. | `export-backend-examples.ts`, `check-backend-examples.ts`, `load-neo4j-example.ts`                           |
| `journeys/`    | Dogfood ponta-a-ponta.                                     | `adoption-journey.ts`                                                                                        |

## Contrato de arquitetura

- `tools/**/*.ts` pode importar o SDK publico do backend em `../backend/src/index.ts`.
- `tools/**/*.ts` pode importar fixtures JavaScript dos repos ficticios `acme/repos/**` quando o objetivo for provar comportamento de uma empresa existente.
- `backend/src` nao pode importar `tools/*`.
- `frontend` nao pode importar `tools/*`.
- `backend/examples/read-models/*` e artefato derivado; se estiver stale, rode `node tools/read-models/export-backend-examples.ts`.
- Evento historico em `acme/governance/events/events.jsonl` nao deve ser reescrito apenas para trocar caminho de CLI.

## Comandos mais usados

```bash
node tools/checks/validate.ts
node tools/checks/test-adversarial.ts
node tools/checks/check-runtime.ts
node tools/checks/check-governance-app.ts

node tools/repo-first/check-repo-contexts.ts
node tools/repo-first/check-repo-works.ts
node tools/repo-first/check-repo-contracts.ts

node tools/read-models/export-backend-examples.ts --check
node tools/read-models/check-backend-examples.ts
node tools/read-models/load-neo4j-example.ts --dry-run

node tools/journeys/adoption-journey.ts
```

## TypeScript

Os CLIs rodam como TypeScript nativo no Node >= 22.18. O typecheck da pasta e separado do backend:

```bash
npx tsc -p tools/tsconfig.json
```

O `tsconfig` de `tools/` e propositalmente menos estrito que `backend/tsconfig.json`, porque os CLIs ainda orquestram fixtures JavaScript da empresa ficticia. Codigo de produto continua exigindo TypeScript estrito em `backend/src`, `frontend`, `mock-api` ou `test`.
