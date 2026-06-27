# \_banks — os bancos derivados (Lente 5), em TypeScript

> **Grafos que se comunicam → bancos derivados.** Cada banco lê SÓ o seu grafo; a governança consome as **projeções** dos repos (banco→banco), não os arquivos deles. Nada de estado derivado guardado — recomputa do grafo a cada run.

## Rodar

```
node _banks/run.ts
```

_(TypeScript nativo do Node 24 — type-stripping, sem build nem dependência extra.)_

## Arquivos (1 responsabilidade cada)

| arquivo                | papel                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `types.ts`             | tipos do grafo (registries) × tipos das projeções (o que cada banco publica)           |
| `io.ts`                | leitura tipada do disco (YAML + frontmatter); descoberta dos repos                     |
| `derive-repo.ts`       | **banco do repo** — projeta só os arquivos do repo (verdict ← answer, via closed-by)   |
| `derive-governance.ts` | **banco de governança** — consome as projeções dos repos e resolve questions/contratos |
| `report.ts`            | renderização (separada da lógica)                                                      |
| `run.ts`               | orquestra: deriva os repos → passa as projeções pra governança → imprime               |

## A comunicação

A aresta cross-grafo é o `answers: <repo>/<intent>#<qN>` na registry da exploration. O banco do repo a publica na projeção; o banco de governança casa por ela (sufixo) pra resolver a question — sem nunca ler o arquivo do outro repo.
