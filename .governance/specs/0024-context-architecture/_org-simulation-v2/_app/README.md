# \_app — o app da org (intents · proposals · grafos)

App **novo, do zero** (substitui o `_viewer` legado, que será aposentado). Serve os **times** para:

- **cadastrar e editar** intents (iniciativas) e proposals (intake);
- **visualizar os grafos** da organização — um de **intents**, um de **proposals** — e os **detalhes** de cada nó.

> A capacidade cresce **aos poucos** a partir daqui (board, routing/tags na tela, etc.).

## Princípio (sem legado, sem modelo paralelo)

O app é uma **projeção** do modelo (Lente 5) — **não** é o modelo. Há **um modelo só: a `_lib`**.

- **Frontend** (Vite + React + TS): importa **só tipos** de `../_lib/domain` e renderiza JSON. Não conhece `fs`/YAML.
- **Backend** (`server.ts`, `node:http`): importa a **`_lib`** e expõe `/api`. Lê/grava intents e proposals **direto nos arquivos** `acme-governance/` (file-first) via `FileHostRepository.saveIntent`/`saveProposal`; deriva os grafos da org (`deriveManifestGraph`/`deriveRouting`/`deriveTagGraph`).

Ou seja: cadastrar/editar no app **edita os arquivos versionados** — nada de json-server nem banco próprio.

## Rodar

```
npm install     # 1ª vez
npm run dev      # sobe o backend (:5180) + o frontend (:5179) juntos
```

- Frontend em **http://localhost:5179**; chama `/api` (proxiado pro backend :5180).
- _(separado: `npm run server` · `npm run web`.)_

## `/api` (backend fino sobre a \_lib)

| método   | rota                 | faz                                                    |
| -------- | -------------------- | ------------------------------------------------------ |
| GET      | `/api/intents`       | lista as intents (de `acme-governance/intents/`)       |
| GET/POST | `/api/intents`       | — / cria (grava `intents/<id>/intent.yml`)             |
| GET/PUT  | `/api/intents/:id`   | detalhe / edita                                        |
| GET/POST | `/api/proposals`     | lista / cria (grava `acme-governance/proposals.yml`)   |
| GET/PUT  | `/api/proposals/:id` | detalhe / edita                                        |
| GET      | `/api/graph`         | os grafos derivados (conhecimento · roteamento · tags) |
| GET      | `/api/repos`         | os repos sob governança                                |

## Estado (incremental)

- ✅ **fundação:** esqueleto + backend read/write sobre a `_lib` + Início (intents + proposals reais).
- ⏳ próximos: grafo de intents · grafo de proposals · telas de detalhe · formulários de cadastro/edição.
