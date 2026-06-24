---
artifact-kind: research
---

# Direcao — Graph snapshot minimo

- **Data:** 2026-06-23
- **Spec:** 0024 — context-architecture
- **Checkpoint ativo:** `artifact-taxonomy-and-model-review-contract` (PR #45)
- **Natureza:** research/direction, investigacao R3/S1
- **Origem:** rodada Claude Code sobre snapshot minimo derivado
- **Autoridade:** nao-operacional. Em divergencia, vencem `state.yml`,
  `tasks.md`, `decision-brief.md`, reviews/gates, Git e GitHub.
- **Status:** insumo para spike S1 futuro; nao e DEC, nao e contrato implementado.

## 1. Por que este artefato existe

Depois das pesquisas sobre prova de valor incremental e MECE/queries, faltava
definir o menor contrato de graph snapshot derivado que responda queries locais
reais sem criar motor de grafo, banco ou segunda SSOT.

Esta pesquisa registra a investigacao R3/S1: um primeiro slice de snapshot JSON
derivado, inspirado no formato do `KnowledgeGraph`, capaz de responder tres
queries locais.

## 2. Veredito capturado

O snapshot minimo e:

- arquivo JSON derivado;
- travessia no mesmo formato conceitual do `KnowledgeGraph`;
- nos discriminados por `id`;
- arestas `{ from, to, relation }`;
- rastreabilidade obrigatoria por `path` e `hash`;
- gerado a partir do repo em um commit fixo;
- nao editavel manualmente;
- nao-SSOT.

O primeiro slice precisa apenas de cerca de cinco tipos de no e seis relacoes
para responder tres queries locais reais.

## 3. Queries escolhidas

### Q1 — Bloqueios do no ativo

Pergunta:

> O que bloqueia o checkpoint ativo agora?

Mapeia para a superficie de `work`/`decide`:

- readiness;
- findings abertos;
- gate;
- dependencias imediatas.

### Q2 — Gate decidivel e findings bloqueantes

Pergunta:

> Ha finding bloqueante aberto no no ativo?

Mapeia para:

- `review:check`;
- gate decidibility;
- GG-0001.

### Q3 — Proveniencia da decisao

Pergunta:

> Qual DEC autoriza o checkpoint Y e o que ela supersede?

Mapeia para:

- rastreabilidade;
- lineage de decisao;
- impacto de mudanca.

Essas tres queries cobrem next-action, honestidade de gate e linhagem de
decisao, sem inflar o primeiro slice.

## 4. Schema minimo proposto

Forma serializada, inspirada no `KnowledgeGraph`:

```json
{
  "snapshot_version": 1,
  "repo": "owner/name",
  "spec": "0024",
  "generated_from": "<commit-sha>",
  "nodes": [
    {
      "id": "owner/name/0024/checkpoint/artifact-taxonomy-and-model-review-contract",
      "type": "checkpoint",
      "status": "active",
      "kind": null,
      "source": {
        "path": ".governance/specs/0024-context-architecture/tasks.md",
        "line": 130,
        "hash": "..."
      }
    }
  ],
  "edges": [
    {
      "from": "owner/name/0024/review/example",
      "to": "owner/name/0024/finding/example/F1",
      "relation": "emits"
    }
  ]
}
```

### Raiz

- `snapshot_version`
- `repo`
- `spec`
- `generated_from`

### Node

- `id`
- `type`
- `status` opcional
- `kind` opcional
- `severity` opcional
- `source`

### Edge

- `from`
- `to`
- `relation`

Observacao: `kind` e propriedade de natureza, nao eixo primario. `status` e
estado/lifecycle. `severity` aplica quando o no e finding.

## 5. Nos do primeiro slice

| type                   | Derivado de                              | Atributos principais                 |
| ---------------------- | ---------------------------------------- | ------------------------------------ |
| `checkpoint` / `etapa` | `tasks.md` + `state.yml` cursor/sequence | `planned`, `active`, `ready`, `done` |
| `decision`             | `decision-brief.md`                      | `pendente`, `resolved`, `supersedes` |
| `review`               | `reviews/*.yml`                          | `approved`, `changes_requested`      |
| `finding`              | `reviews/*.yml` findings                 | `severity`, `disposition`            |
| `gate`                 | `gates/*.yml` + `state.yml` gate status  | `open`, `closed`, `approved`         |

Opcional como ancora leve:

- `spec`
- `pr`

Fora do primeiro slice:

- `Outcome`;
- `ValueClaim`;
- `Slice`;
- `Risk`;
- `AdoptionScenario`;
- qualquer entidade de banco/cross-repo.

Esses itens aguardam necessidade provada por query/check.

## 6. Arestas do primeiro slice

| relation          | De -> para                                    | Uso                     |
| ----------------- | --------------------------------------------- | ----------------------- |
| `contains`        | spec -> checkpoint -> etapa; pr -> checkpoint | estrutura               |
| `sequenced_after` | checkpoint -> checkpoint                      | ordem e next            |
| `reviews`         | review -> checkpoint                          | review anexa ao no      |
| `emits`           | review -> finding                             | proveniencia de finding |
| `decides`         | decision -> checkpoint                        | autorizacao             |
| `supersedes`      | decision -> decision                          | linhagem                |

`blocks` nao deve ser armazenada no primeiro slice. Ela e derivada:

- finding aberto bloqueia seu checkpoint;
- readiness ausente bloqueia avance;
- gate aberto bloqueia conclusao.

Guardar `blocks` cedo demais aumenta chance de drift.

## 7. Rastreabilidade

Campos obrigatorios:

- `source.path`: arquivo versionado de origem;
- `source.hash`: fingerprint ou hash do span;
- `generated_from`: commit SHA do snapshot inteiro.

Campos condicionais:

- `source.line`: quando o no mapeia uma linha/span;
- `source.ref`: quando o artefato e git-scoped, como review com `subject_ref`.

Regra:

> Cada no precisa apontar para a fonte que o gerou. O snapshot nao adiciona fato
> novo; apenas projeta fatos versionados.

## 8. Identidade cross-repo-ready

Mesmo sem banco, `id` deve nascer namespaced:

```text
repo/spec/<type>/<slug>
```

Exemplo:

```text
rosanarezende/ai-guidelines/0024/checkpoint/artifact-taxonomy-and-model-review-contract
```

Isso evita colisao futura quando snapshots de varios repos forem unidos por uma
camada externa.

Nao implementar agora:

- resolver de alias;
- deduplicacao cross-repo;
- identidade global formal;
- ingestao em banco.

## 9. Guardrails derived-only

- Snapshot e projecao pura: `repo@commit -> JSON`.
- Deterministico: nos e arestas ordenados por `id`.
- Regeneravel a qualquer momento.
- Header futuro deve marcar "DERIVED — nao editar".
- SSOT continua em `state.yml`, `tasks.md`, reviews, gates e
  `decision-brief.md`.
- Divergencia snapshot x SSOT significa snapshot errado.
- `snapshot:check`, quando existir, deve comparar regenerado x versionado.

## 10. Impacto por etapa

### Agora

Esta nota apenas fixa uma hipotese de contrato para pesquisa. O spike S1 futuro
deve ser throwaway e nao entrar no `validate`.

### `internal-architecture-refactor-ddd-bdd`

Dona da decisao A1:

- estender `KnowledgeGraph`;
- criar novo bounded context;
- ou criar read-model acima de contexts.

Tambem deve ser dona da implementacao futura de:

- comando de snapshot;
- `snapshot:check`;
- primeiro slice de 5 nos / 6 arestas.

### Spike futuro

So depois:

- ingestao em banco;
- identidade global resolvida;
- snapshots temporais/versionados;
- escolha de engine.

## 11. Riscos reais

- Reimplementar motor em vez de reutilizar o padrao `KnowledgeGraph`.
- Puxar entidades de valor antes de query/check exigir.
- Adicionar `snapshot:check` ao `validate` antes de provar o contrato.
- Criar identidade local demais e bloquear cross-repo.
- Deixar snapshot virar segunda SSOT.
- Fazer DB-first disfarçado.

## 12. Proximo artefato minimo

Spike S1 throwaway, gated por aprovacao posterior:

> Script experimental que gera snapshot da Spec 0024 e responde as tres queries,
> sem comando publico, sem check no validate, sem banco e sem compromisso de
> manter codigo.

Se passar:

- contrato vira criterio de aceite de `internal-architecture-refactor-ddd-bdd`;
- comando `snapshot` e `snapshot:check` podem ser planejados;
- banco continua fora ate existir query Tier 2 real.

## 13. Rodada seguinte possivel

Antes de pedir spike, uma ultima rodada investigativa util pode ser:

> PR #45 scope check apos G23/R2/R1/R3: verificar se o escopo atual de
> `artifact-taxonomy-and-model-review-contract` continua suficiente e nao deve
> absorver grafo, snapshot, valor ou banco.

Essa rodada ajuda a proteger o PR ativo contra inflacao de escopo.
