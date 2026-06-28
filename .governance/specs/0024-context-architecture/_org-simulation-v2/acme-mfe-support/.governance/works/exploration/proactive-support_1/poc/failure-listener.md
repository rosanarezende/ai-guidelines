# POC — listener de contagem de falhas (esboço)

> Output durável da exploration (`fate: promoted`). Não dá merge como está; a delivery de ajuda sob demanda **absorve** via `derives-from`.

## Ideia

Inscreve-se no evento de falha de login por **pub/sub genérico**; conta por sessão; dispara um handler ao atingir N.

```js
bus.listen("login", "step-failed", (msg) => {
  const n = bump(session.id, msg.field);
  if (n >= THRESHOLD) offerHelp(session.id, msg.field);
});
```

## Contrato de evento (a amarra cross-MFE)

- canal: `login`
- mensagem: `step-failed`
- payload: `{ field: string, attempts: number }`

_(pub/sub genérico — sem acoplar a nenhuma plataforma específica.)_
