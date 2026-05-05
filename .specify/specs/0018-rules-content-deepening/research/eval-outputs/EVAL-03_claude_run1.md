# EVAL-03 — Async/Concurrency (GR-0005) | Claude Run 1

- **Provedor:** Claude (Sonnet 4.6)
- **Effort:** Medium
- **Data:** 2026-05-05
- **Prompt:** EVAL-03 (Async/Concurrency)
- **Diretório:** Vazio (sem AGENTS.md / governança)

---

## Resposta completa

```js
async function consolidateUserData(userId) {
  const [profile, preferences, orderHistory] = await Promise.all([
    fetch(`/api/users/${userId}/profile`).then((res) => {
      if (!res.ok) throw new Error(`Perfil não encontrado: ${res.status}`);
      return res.json();
    }),
    fetch(`/api/users/${userId}/preferences`).then((res) => {
      if (!res.ok) throw new Error(`Preferências não encontradas: ${res.status}`);
      return res.json();
    }),
    fetch(`/api/users/${userId}/orders`).then((res) => {
      if (!res.ok) throw new Error(`Histórico não encontrado: ${res.status}`);
      return res.json();
    }),
  ]);

  const summary = {
    userId,
    name: profile.name,
    email: profile.email,
    preferences,
    totalOrders: orderHistory.length,
    lastOrderDate: orderHistory.at(-1)?.date ?? null,
    consolidatedAt: new Date().toISOString(),
  };

  await db.userSummaries.upsert({ where: { userId }, data: summary });

  return summary;
}
```

Pontos-chave da implementação:

- `Promise.all` executa as três requisições em paralelo — sem ele, cada `await` esperaria a anterior terminar, triplicando o tempo de resposta.
- Falha rápida: se qualquer das três requisições falhar, `Promise.all` rejeita imediatamente e o `upsert` não é executado, evitando salvar dados incompletos.
- `upsert` em vez de `insert` garante idempotência — re-executar a função atualiza o registro existente em vez de lançar erro de duplicidade.

Se você precisar que uma falha parcial não cancele tudo, substitua `Promise.all` por `Promise.allSettled` e trate cada resultado individualmente antes de montar o `summary`.

---

## Avaliação (preenchida pelo agente)

- **Modelo:** Claude Sonnet 4.6 (medium effort)
- **Seguiu a regra?** Sim
- **Score:** 2 (compliant)
- **Nota:** Resposta textbook para GR-0005. Usa `Promise.all` para as 3 chamadas independentes (paralelo explícito). O `await` do banco (`upsert`) ocorre apenas após os 3 resultados. Cada promise individual trata erros (`if (!res.ok) throw`). O modelo até explica **por quê** usou `Promise.all` em vez de `await` sequencial, e sugere `Promise.allSettled` para cenários de tolerância parcial. Baseline 100% compliant com GR-0005 para este modelo.
