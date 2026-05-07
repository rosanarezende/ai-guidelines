# Research Index — Boilerplate

> Formato canônico do `.specify/specs/research-index.md`. Este índice
> centraliza o conhecimento (RAG orgânico) produzido por specs concluídas,
> evitando que pesquisa morra em pasta fechada.
>
> **Política de research lifecycle:** fonte canônica em
> `.core/process/spec-foundation.md` § "research/ — conhecimento de apoio"
> (renomear com prefixo `YYYY-MM-DD-` → mover para
> `.specify/specs/researchs/<domínio>/` → indexar aqui). Este boilerplate
> documenta o **formato do índice**; a política de migração não é redefinida
> aqui — segue a constituição.

Use este template para instanciar um novo `research-index.md` em projetos
que adotarem o framework pela primeira vez. Projetos que já têm índice
consultam este arquivo como referência editorial.

---

## Estrutura canônica

```markdown
# Research Index (Base de Conhecimento RPI)

> **Fonte de Verdade**: `.specify/specs/research-index.md`
> **Propósito**: Centralizar a inteligência do repositório. Agentes de IA
> recém-chegados devem usar este índice para recuperar contexto (RAG
> orgânico) sobre arquiteturas passadas, decisões de design e estudos de
> plataforma. Em vez de vasculhar dezenas de branches antigas, leia os
> links aqui listados.
> **Manutenção**: Toda vez que uma Spec for finalizada, o desenvolvedor
> (humano ou IA) **DEVE** transpor os arquivos de valor histórico de sua
> pasta `research/` local para `.specify/specs/researchs/<domínio>/` e
> indexar aqui (ver `.core/process/spec-foundation.md`).

---

## <🏛️ emoji> <Categoria 1 — ex.: Governança de IA e Engenharia Prompt>

<Frase curta explicando o que a categoria agrupa.>

- [<Título do estudo>](./researchs/<domínio>/YYYY-MM-DD-<slug>.md) _(<descrição parentética curta do valor do estudo>)_.
- [<Próximo estudo>](./researchs/<domínio>/YYYY-MM-DD-<outro-slug>.md) _(<descrição>)_.

## <🏗️ emoji> <Categoria 2 — ex.: Design e Decisões de Arquitetura>

<Frase curta explicando a categoria.>

- [<Título>](./researchs/<domínio>/YYYY-MM-DD-<slug>.md) _(<descrição>)_.

## <🛸 emoji> <Categoria 3 — ex.: Open Source e Publicação>

- [<Título>](./researchs/<domínio>/YYYY-MM-DD-<slug>.md)

---

_Fim do Índice atual._
```

---

## Regras de uso

### Ao fechar uma spec (encerramento pré-merge)

1. Para cada arquivo em `<slug>/research/` com valor reutilizável:
   1. **Renomear** com prefixo `YYYY-MM-DD-` (data de criação do estudo).
   2. **Mover** para `.specify/specs/researchs/<domínio>/` — `<domínio>` é o escopo
      semântico (ex.: `governance/`, `architecture/`, `oss/`). **Não criar pasta
      por spec** dentro de `researchs/`.
   3. **Classificar** numa categoria existente do índice (ou criar nova se ≥ 2
      estudos justificam).
   4. **Indexar** com **descrição parentética curta** (≤ 80 caracteres) que
      resuma o valor do estudo para um agente futuro sem contexto.
2. Ordenar dentro de cada categoria por relevância temática (não cronológica).
3. Confirmar que o link relativo funciona (`./researchs/<domínio>/YYYY-MM-DD-<slug>.md`).
4. Pasta `<slug>/research/` da spec pode ser deletada se não restar nada com
   valor histórico (ou mantida com rascunhos não-canônicos).

### Categorias

- Use emojis para distinção visual rápida. Emojis sugeridos (não
  obrigatórios): 🏛️ Governança, 🏗️ Arquitetura, 🛸 Open Source, 🔬 Pesquisa
  de mercado, 📐 Benchmarks.
- Categoria nova requer pelo menos 2 estudos para justificar criação;
  abaixo disso, encaixe em categoria próxima.
- Não há limite rígido de categorias, mas manter ≤ 6 ajuda a escanear.

### Entradas

Formato canônico de entrada:

```
- [<Título>](./researchs/<domínio>/YYYY-MM-DD-<slug>.md) _(<descrição parentética curta>)_.
```

- **Título** ≤ 60 caracteres, descritivo (o que o estudo ensina).
- **Path relativo** a partir de `.specify/specs/` — sempre apontando para
  `./researchs/<domínio>/<arquivo>` após a migração.
- **Descrição parentética** ≤ 80 caracteres, em itálico, entre parênteses.
  Dica: comece com substantivo ("Análise...", "Benchmark...", "Diagnóstico...").

### Nunca

- Não remova entradas ao rearranjar — só ao deletar o arquivo fonte.
- Não duplique um estudo em múltiplas categorias — escolha a mais forte.
- Não link para pastas (`./researchs/<domínio>/`) — sempre para arquivo
  específico.
- Não link para o path local da spec (`./XXXX-<slug>/research/...`) — esse
  caminho deixa de existir após a migração; o link canônico é
  `./researchs/<domínio>/YYYY-MM-DD-<slug>.md`.
