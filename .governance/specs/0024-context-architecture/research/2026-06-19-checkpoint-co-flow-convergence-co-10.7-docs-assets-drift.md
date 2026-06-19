# CO-10.7 docs/assets drift inventory

> Spec 0024 · PR #43 · `checkpoint-co-flow-convergence`.
> Este artefato separa o que deve ser corrigido agora do que deve esperar a
> reproducao das jornadas reais no site e na documentacao.

## 1. Pergunta de controle

Rosana perguntou se ja e o momento de atualizar assets e arquivos de `docs/`,
porque eles podem nao refletir mais o que CO-10.7 esta entregando.

Resposta operacional:

```text
sim para drift factual pequeno
nao para reescrita ampla antes das jornadas reais da CLI publica
```

## 2. Fatos observados

### 2.1 Superficies atuais

- `npx ai-guidelines` e a superficie publica para consumidores.
- `npm run flow` e a superficie local de contribuicao deste repositorio.
- `site/` substituiu o antigo `FLOW.html`.
- `site:flow:*`, `site:scenarios:*` e `site:assets:*` ja existem no contrato de
  scripts.
- `consumer:journey:*` ja existe como trilha de falsificacao de consumidores.

### 2.2 Drift factual corrigido nesta rodada

- `AGENTS.md` ainda apontava para `FLOW.html`.
- `CONTRIBUTING.md` ainda apontava para `FLOW.html`.

Correcao feita:

```text
FLOW.html -> site/ e site/README.md
```

Motivo:

```text
o arquivo FLOW.html nao e mais a superficie viva do produto
```

### 2.3 Drift factual detectado, mas nao corrigido agora

`docs/cli/ai-guidelines-cli.md` ainda mistura, na secao de workflow runtime,
referencias de mantenedor (`npm run flow`) com a discussao mais ampla da CLI.

Interpretacao:

```text
isso nao e necessariamente falso para mantenedores
mas pode confundir consumidores se virar documentacao publica principal
```

Tratamento esperado:

```text
separar claramente referencia publica (`npx ai-guidelines`)
de referencia interna do repo-fonte (`npm run flow`)
depois que as jornadas reais forem refletidas no site
```

### 2.4 Drift editorial/assets detectado

Arquivos em `docs/editorial/` e imagens em `docs/assets/` ainda carregam parte da
narrativa anterior:

- prompts de imagem focados em `npm run flow`;
- prompts de README anteriores ao site React;
- assets criados antes da separacao clara entre consumidor e mantenedor.

Interpretacao:

```text
esses arquivos sao material editorial/projecao visual
nao devem ser reescritos antes de sabermos quais telas reais da CLI publica
queremos mostrar
```

## 3. Classificacao de acao

### 3.1 Corrigir agora porque esta falso

| Item                             | Estado    | Acao                                   |
| -------------------------------- | --------- | -------------------------------------- |
| `AGENTS.md` -> `FLOW.html`       | corrigido | aponta para `site/` e `site/README.md` |
| `CONTRIBUTING.md` -> `FLOW.html` | corrigido | aponta para `site/` e `site/README.md` |

### 3.2 Atualizar quando refletirmos as jornadas reais no site

| Item                            | Por que esperar                                                          |
| ------------------------------- | ------------------------------------------------------------------------ |
| `docs/cli/ai-guidelines-cli.md` | precisa separar publico vs mantenedor sem duplicar a experiencia do site |
| `docs/editorial/*.prompt.md`    | deve nascer das telas reais da CLI/site, nao da narrativa antiga         |
| `docs/assets/*.png`             | deve representar os fluxos reais aprovados, nao imagens temporarias      |
| `README.md`                     | deve ser porta publica consistente com o site e com `npx ai-guidelines`  |
| `site` reference/content        | deve consumir jornadas reais, nao compensar lacunas da CLI               |

### 3.3 Deixar para fechamento final da Spec 0024

| Item                                       | Motivo                                                            |
| ------------------------------------------ | ----------------------------------------------------------------- |
| consolidacao ampla da documentacao publica | depende de CO-10.7, CO-10.8 e dos nos seguintes                   |
| reorganizacao historica de `research/`     | ja registrada como debito; pode exigir decisao propria            |
| imagens finais de marketing/produto        | devem refletir o estado final da spec, nao o meio da convergencia |

## 4. Regra de trabalho para CO-10.7

Durante CO-10.7, a documentacao nao deve ensinar uma experiencia que a CLI ainda
nao prova.

Regra pratica:

```text
CLI real primeiro
site reflete depois
docs/assets consolidam por ultimo
```

## 5. Criterio de falsificacao

O inventario esta incompleto se uma pessoa ainda precisar decidir manualmente se
um texto e publico ou interno.

Checklist para a proxima rodada:

- [ ] exemplos publicos usam `npx ai-guidelines`;
- [ ] exemplos internos usam `npm run flow` e aparecem apenas como contribuicao do
      repo-fonte;
- [ ] prints/transcripts do site existem na CLI real;
- [ ] `docs/assets` nao contradiz o fluxo publico;
- [ ] README e docs nao prometem comando/opcao que nao exista no registry;
- [ ] smoke/package/consumer journey aparecem como validacoes de release/falsificacao,
      nao como acao diaria padrao do usuario.

## 6. Fronteira

Este artefato nao executa:

- readiness;
- advance-subcheckpoint;
- Ready;
- Human Gate;
- merge;
- abertura de novo PR;
- reescrita ampla de `docs/`;
- regeneracao de assets finais.

Ele registra apenas o inventario e corrige links factualmente quebrados para
evitar que `FLOW.html` continue parecendo superficie viva.
