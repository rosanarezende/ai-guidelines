# Read-model examples

Exemplos derivados da runtime v3 para os quatro formatos estudados na v2.

| formato | papel                                | status neste exemplo      |
| ------- | ------------------------------------ | ------------------------- |
| file    | SSOT file-first + read-model pequeno | completo e prioritário    |
| neo4j   | grafo de impacto cross-repo          | completo e prioritário    |
| sqlite  | read-model relacional local          | exemplo completo derivado |
| mongo   | snapshot documental/event-like       | exemplo completo derivado |

Snapshot: 8cd5bdadf2ae · 174 nós · 374 arestas · 4 issues.

Regra: estes arquivos são projeções. Ação governada deve reler o YAML/event-log autoritativo.

Veja `ACTION-CONTRACT.md` para o contrato operacional que impede o read-model de virar SSOT.
