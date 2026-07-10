# Backend action contract

Este contrato é parte do dogfood: um read-model pode acelerar consulta, mas não pode virar fonte de ação.

- `READ_MODEL_IS_DERIVED_ONLY`: `file/read-model.json`, `neo4j/*.cypher`, `sqlite/*.sql` e `mongo/*.jsonl` são projeções derivadas.
- `MUST_REREAD_AUTHORITATIVE_SOURCE`: qualquer comando governado deve reler YAML/event-log autoritativo antes de escrever, promover, aprovar ou publicar outcome.
- `FAIL_CLOSED_ON_STALE_SOURCE`: se o hash/base-revision da fonte não bate, o comando deve falhar fechado.
- `NO_ACTION_FROM_DERIVED_GRAPH`: Neo4j/SQLite/Mongo podem responder dashboard, impacto e investigação; não autorizam mutação por conta própria.

A sim v3 ainda não tem adapters transacionais SQLite/Neo4j/Mongo. Estes arquivos são exemplos operacionais de projeção, não mudança de SSOT.
