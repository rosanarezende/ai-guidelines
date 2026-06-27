# Intent inline — Virtual (`proposal` | `patch` | `fix`)

> **Virtual = workspace proibido**: NÃO gera arquivo/pasta de intent. O intent é **1–3 linhas, inline**
> (corpo do PR / registro leve). Se a coisa crescer e precisar de pasta, **promove-se** a um Dense.

## `proposal`

```text
proposta: <decisão proposta> · alternativas: <…> · recomendação: <…>
→ se aceita, PROMOVE a `delivery` (herda o contexto).
```

## `patch`

```text
patch: o que estava errado: <…> · correção: <…> · como verifiquei: <…>
```

## `fix`

```text
fix: o que estava errado: <…> · correção: <…> · como verifiquei: <…>
```

<!-- Sem kernel de 4 linhas, sem espinha, sem corpo por kind: a forma Virtual é deliberadamente mínima.
     A burocracia escala com o peso do trabalho (Dense ganha arquivo; Virtual fica inline). -->
