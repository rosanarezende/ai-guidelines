# \_viewer — app de autoria + dashboard (Vite + React + TS)

A "app/form de **Iniciativas**" (Lente 5): cadastra/atualiza Iniciativas (intents) e mostra o **board DERIVADO** pelo banco. Prova a ponta-a-ponta: **autoria (INPUT) → banco (deriva) → board**.

## Rodar

```
npm install        # 1ª vez
npm run dev:all    # sobe a API (json-server) + o app (vite) juntos
```

- A **API** (`json-server`) serve as Iniciativas de `db.json` (semeado de `db.seed.json` na 1ª vez; `db.json` é local, gitignored). Porta **5174**, proxiada em `/api`.
- O **app** (vite) abre na 5173.
- _(separado: `npm run api` e `npm run dev` em 2 terminais.)_

Para o **board** (`/board`), gere o snapshot do banco: `node ../_banks/run.ts`.

## Rotas

- `/` — lista das Iniciativas + cadastrar
- `/novo` — **cadastro** (título · objetivo · detalhes · perguntas)
- `/intent/:id` — **atualização**: adicionar pergunta · registrar resultado da exploração · **decidir**
- `/board` — o dashboard **DERIVADO** (lê o snapshot do banco)

## Camadas

- **Autoria** (json-server / `db.json`) = o INPUT que a app salva.
- **Board** (snapshot do banco) = o DERIVADO. _(conectar os dois — o banco derivar de `db.json` — é a próxima iteração.)_
