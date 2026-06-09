# Checkpoint Comment Template — comentários de Gate em PRs governance-first

> **O que é.** Template **copiável** para os comentários de proveniência de um **checkpoint** (unidade de implementação de uma spec) num Pull Request real. Padroniza a rastreabilidade do ritual de **Gate** — `implementation → revisões exigidas pela review-policy → Human Gate` — para que humano e agentes postem comentários consistentes (não "crus" demais).
>
> **Vocabulário (cf. `plan.md § Glossário` da spec em curso):** **PR / `#N`** = Pull Request real do GitHub · **Checkpoint N** = unidade de implementação da spec · **Gate** = ritual de validação. **Não usar "PR-N" como unidade interna** — só `Checkpoint N`.
>
> **Princípio (anti-taxonomia).** Todos os campos são **texto livre**. Valores após `ex.:` são **exemplos orientativos**, nunca enum obrigatório — a 0024 removeu taxonomias rígidas e o template **não as recria**. Os exemplos existem para preservar contexto operacional, não para fechar a lista.
>
> **Origem (dogfooding):** ritual validado ao vivo no PR **#32** (Spec 0024), checkpoints 1–2.1. Relaciona-se com ADR 0020 (governança precede execução), ADR 0024 (Draft≠Ready≠Mergeable; modos `unit`/`sequential`), `pr-title-conventions.md` e o comportamento não-linear observado em `research/findings.md` (`F-014`).

---

## Cabeçalho obrigatório (sempre)

```md
🧭 Workflow Provenance (este comentário)
ref: #<PR> @ <sha>
checkpoint: <N ou N.N>
spec: <slug — ex.: 0024-context-architecture>
decision_scope: <texto livre>
role: <implementation|technical_audit|architectural_review|human_gate|outro>
actor: <ex.: claude-cli|codex-cli|chatgpt|@owner|tool>
model: <opcional — volátil>
at: <ISO 8601 ou timezone local>
```

> **`decision_scope`** — sobre o que aquela decisão/registro incide. **Texto livre**; exemplos orientativos (não lista fechada): `checkpoint` · `pull request` · `integração` · `encerramento da spec` · `release` · `outro`. Resolve gate de checkpoint / de PR / de integração / de encerramento **sem criar novos templates**.

---

## Corpo por `role`

> Os quatro papéis abaixo têm corpo orientativo (hints de projeção). `role` é **string livre** — novas roles não exigem mudança de schema.

### `role: implementation`

```md
## Implementação — Checkpoint <N>: <título curto>

- Objetivo: <1 linha>
- Arquivos alterados: <lista>
- Validação executada: <comandos — ex.: yarn format ; yarn validate>
- Escopo: <atômico? invadiu escopo de outro checkpoint? — não/sim + porquê>
- Notas: <churn, renormalização de serializer, decisões de escopo, etc.>
```

### `role: technical_audit`

```md
## Technical Audit Gate — Checkpoint <N>

- Status: <ex.: PASS | PASS_COM_OBSERVAÇÕES | FAIL>
- Escopo auditado: commit <sha> + arquivos <lista>
- Achados críticos: <lista | "Nenhum">
- Achados não-bloqueantes: <lista | "Nenhum">
- Evidências: <bullets com comandos/paths>
- Recomendação final: <1 linha>
```

### `role: architectural_review`

```md
## Architectural Review Gate — Checkpoint <N>

- Status: <ex.: PASS | NEEDS-FIX>
- Coerente com o contrato da spec: <2–4 bullets>
- Riscos de drift: <lista | "Nenhum">
- Mudanças recomendadas: <pequenas e acionáveis | "Nenhuma">
- Recomendação ao gate humano: <ex.: aprovar | aprovar com observações | solicitar ajustes>
```

> A revisão **recomenda**; ela não autoriza merge nem avanço. **Quem autoriza é o owner** (Human Gate).

### `role: human_gate`

```md
## Human Gate — Checkpoint <N>

- Decisão do owner: <texto livre>
- Próxima ação: <texto livre>
- Exceção deliberada: <não | sim — se sim, justificar>
- Justificativa: <texto livre>
```

> **Exemplos de decisão do owner** (orientativos, não lista fechada): _Aprovo o merge do PR_ · _Aprovo o avanço para o próximo checkpoint_ · _Reenquadro o checkpoint_ · _Solicito retorno para implementação_ · _Escalo para revisão adicional_ · _Aceito uma exceção deliberada_.
>
> **Exemplos de próxima ação** (orientativos): _Mergear o PR_ · _Abrir o próximo PR_ · _Prosseguir para o próximo checkpoint_ · _Retornar para implementação / auditoria / revisão arquitetural_ · _Revisitar uma DEC_ · _Reabrir um finding_ · _Atualizar plano_ · _Registrar em NEXT_.
>
> O Human Gate **não decide apenas merge** — ele decide o **próximo movimento do sistema**. Merge é só um caso particular.

---

## Exceção deliberada — o registro que torna o fluxo governável

> O instrumento central da governança **não-linear**: o humano registra **conscientemente** quando seguiu, contornou ou quebrou uma regra — e **por quê**. Sempre acompanhado de justificativa. É o que distingue "desvio governado" de "drift silencioso".
>
> **Exemplos:** seguir uma rota diferente da planejada · agrupar checkpoints · antecipar trabalho · aceitar risco conscientemente · executar correção local fora da ordem prevista · manter trabalho no mesmo PR quando a regra sugeria abrir outro (escopo puramente documental).
>
> Coerente com o comportamento não-linear **observado** no dogfooding (`research/findings.md` `F-014`): o registro **documenta** o desvio sem pretender **modelá-lo** num enum.

---

## Regras

- **Texto livre em todos os campos.** Exemplos (`ex.:`, "Exemplos de…") são orientativos, **nunca enum obrigatório** (anti-taxonomia). Compatível com novas roles / novos `decision_scope` **sem alteração de schema**.
- **Nunca usar "PR-N"** como unidade de implementação. Só `Checkpoint N`. `PR / #N` = Pull Request real.
- `ref:` sempre no formato **`#<PR> @ <sha>`**. `checkpoint:`, `spec:` e `decision_scope:` sempre presentes. `model:` é opcional (volátil).
- A revisão arquitetural **recomenda**; o Human Gate **decide**. Não confundir os papéis.
- **Um comentário por evento de Gate.** Não reescrever comentários anteriores (são trilho de auditoria); correções vão em comentário novo (errata).
