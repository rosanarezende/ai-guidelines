# \_viewer — app de autoria + dashboard (Vite + React + TS)

> ⚠️ **Legado:** o banco `_banks/` foi **arquivado** em `_archive/_banks/` (SUPERSEDED pela `_lib`). A **view atual** é estática: `node ../_lib/build.ts` → `npm run dashboards` (ver `src/dashboard/`). Esta README descreve a **app de autoria antiga** (json-server + `derive-app`), pendente de fiação à lib nova.

A "app/form de **Iniciativas**" (Lente 5): cadastra/atualiza Iniciativas (intents) e mostra o **board DERIVADO** pelo banco. Prova a ponta-a-ponta: **autoria (INPUT) → banco (deriva) → board**.

## Rodar

```
npm install        # 1ª vez
npm run dev:all    # sobe a API (json-server) + o app (vite) juntos
```

- A **API** (`json-server`) serve as Iniciativas de `db.json` (semeado de `db.seed.json` na 1ª vez; `db.json` é local, gitignored). Porta **5174**, proxiada em `/api`.
- O **banco** (`derive-app`, em _watch_) lê o `db.json` e re-deriva o board (`public/snapshot.json`) a cada mudança.
- O **app** (vite) abre na 5173.
- _(separado: `npm run api`, `npm run bank:watch`, `npm run dev`.)_

## Rotas

- `/` — lista das Iniciativas + cadastrar
- `/novo` — **cadastro** (título · objetivo · detalhes · perguntas)
- `/intent/:id` — **atualização**: adicionar pergunta · registrar resultado · **decidir** · **levantar proposta**
- `/propostas` — **dashboard de propostas** (backlog de intake): filtra por status/time/tag, ordena por **ICE**, **tria** (promove/descarta)
- `/propostas/nova` — **levantar proposta** (intake HUMANO, capturado a QUALQUER momento; ou via link numa pergunta)
- `/board` — o dashboard **DERIVADO** (lê o snapshot do banco)

## Camadas (ciclo FECHADO)

- **Autoria** (json-server / `db.json`) = o INPUT que a app salva.
- **Banco** (`../../_archive/_banks/derive-app.ts`, **arquivado**) lia o `db.json` → **DERIVA** → `public/snapshot.json`.
- **Board** (`/board`) renderiza o snapshot. Cadastrou/decidiu → o watcher re-deriva → clique **↻** no board.

_(o simulador YAML — `_archive/_banks/run.ts`, arquivado — era outra frente.)_
