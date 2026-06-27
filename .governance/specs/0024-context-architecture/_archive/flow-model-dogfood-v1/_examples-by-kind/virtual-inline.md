# Virtual (`proposal`/`patch`/`fix`) — inline, SEM arquivo/pasta

> Aqui só para **ilustrar a forma** (na prática vão no corpo do PR/registro, não num arquivo).

## `proposal`

```text
proposta: adotar `intent-brief` no lugar de `spec.md` · alternativas: manter spec.md; só renomear
· recomendação: Caminho A + regra Dense/Virtual
→ se aceita, PROMOVE a `delivery`.
```

## `patch`

```text
patch: o que estava errado: dep `yaml` antiga sem o parser dos checks · correção: bump 2.x
· como verifiquei: `validate` verde + testes dos checks
```

## `fix`

```text
fix: o que estava errado: regex de frontmatter não casava CRLF · correção: `\r?\n` no separador
· como verifiquei: teste novo com arquivo CRLF
```
