# \_viewer — dashboard do banco derivado (Vite + React + TS)

App de **leitura** que renderiza o **snapshot** gerado pelo banco (`_banks/run.ts`). Prova a ponta-a-ponta: **arquivos de governança (INPUT) → banco (deriva) → snapshot (JSON) → app (visual)**.

## Rodar

```
node ../_banks/run.ts     # 1) gera public/snapshot.json (DERIVADO)
npm install               # 2) 1ª vez
npm run dev               # 3) abre o dashboard
```

O snapshot é **regenerável** (não versionado — `public/snapshot.json` é gitignored). O app é só leitura, via `fetch("/snapshot.json")`.

## O que mostra (interativo)

- **Perguntas** — respondida ≠ resolvida (o gate humano); _clique no card_ p/ ver o verdict; filtro **só não-resolvidas**.
- **Contratos** — known / pending.
- **Plano** — `breaks-into` por status (done / active / draft).
- **Bancos de repo** — cada exploration (status · fate · verdict · POC promovida).
- Botão **↻ recarregar** o snapshot.
