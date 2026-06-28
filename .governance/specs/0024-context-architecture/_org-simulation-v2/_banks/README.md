# \_banks — os bancos derivados (Lente 5), em TypeScript

> **Grafos que se comunicam → bancos derivados.** Cada banco lê SÓ o seu grafo; a governança consome as **projeções** dos repos (banco→banco), não os arquivos deles. Recomputa do grafo a cada run; o que ele **materializa** em `_viewer/public/snapshot.json` é um **snapshot regenerável** (GERADO), não autoridade.

## Rodar

```
node _banks/run.ts
```

_(TypeScript nativo do Node 24 — type-stripping, sem build nem dependência extra.)_

Gera o **snapshot** em `_viewer/public/snapshot.json` (**GERADO** — derivado, regenerável). **Visualize** com o app Vite + React: `cd _viewer && npm install && npm run dev` (lê o snapshot via `fetch`; interativo).

## Arquivos (1 responsabilidade cada)

| arquivo                | papel                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `types.ts`             | tipos do grafo (registries) × tipos das projeções (o que cada banco publica)           |
| `io.ts`                | leitura tipada do disco (YAML + frontmatter); descoberta dos repos                     |
| `derive-repo.ts`       | **banco do repo** — projeta só os arquivos do repo (verdict ← answer, via closed-by)   |
| `derive-governance.ts` | **banco de governança** — consome as projeções dos repos e resolve questions/contratos |
| `report.ts`            | renderização pro **console** (separada da lógica)                                      |
| `materialize.ts`       | materializa o **snapshot JSON** em `_viewer/public/` (o app Vite consome via `fetch`)  |
| `run.ts`               | orquestra: deriva → console → materializa o **snapshot** p/ o viewer                   |

## A comunicação

A aresta cross-grafo é o `answers: <repo>/<intent>#<qN>` na registry da exploration. O banco do repo a publica na projeção; o banco de governança casa por ela (sufixo) pra resolver a question — sem nunca ler o arquivo do outro repo.
