# Research Index — Boilerplate

> Formato canônico do `.specify/specs/research-index.md`. Este índice
> centraliza o conhecimento (RAG orgânico) produzido por specs concluídas,
> evitando que pesquisa morra em pasta fechada.

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
> (humano ou IA) **DEVE** transpor os arquivos de sua pasta `research/`
> local para este índice. Nenhum conhecimento deve morrer na pasta da
> spec fechada.

---

## <🏛️ emoji> <Categoria 1 — ex.: Governança de IA e Engenharia Prompt>

<Frase curta explicando o que a categoria agrupa.>

- [<Título do estudo>](./XXXX-<slug>/research/<arquivo>.md) _(<descrição parentética curta do valor do estudo>)_.
- [<Próximo estudo>](./YYYY-<slug>/research/<outro-arquivo>.md) _(<descrição>)_.

## <🏗️ emoji> <Categoria 2 — ex.: Design e Decisões de Arquitetura>

<Frase curta explicando a categoria.>

- [<Título>](./XXXX-<slug>/research/<arquivo>.md) _(<descrição>)_.

## <🛸 emoji> <Categoria 3 — ex.: Open Source e Publicação>

- [<Título>](./XXXX-<slug>/research/<arquivo>.md)

---

_Fim do Índice atual._
```

---

## Regras de uso

### Ao fechar uma spec (Fase 3 — encerramento)

1. Para cada arquivo em `<slug>/research/`, classifique-o em uma das
   categorias existentes ou crie categoria nova se necessário.
2. Escreva uma **descrição parentética curta** (≤ 80 caracteres) que
   resuma o valor do estudo para um agente futuro que não tem contexto.
3. Ordene dentro de cada categoria por relevância temática (não
   cronológica).
4. Confirme que o link relativo funciona (`./XXXX-<slug>/research/<arquivo>.md`).

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
- [<Título>](./path/to/research.md) _(<descrição parentética curta>)_.
```

- **Título** ≤ 60 caracteres, descritivo (o que o estudo ensina).
- **Path relativo** a partir de `.specify/specs/`.
- **Descrição parentética** ≤ 80 caracteres, em itálico, entre parênteses.
  Dica: comece com substantivo ("Análise...", "Benchmark...", "Diagnóstico...").

### Nunca

- Não remova entradas ao rearranjar — só ao deletar o arquivo fonte.
- Não duplique um estudo em múltiplas categorias — escolha a mais forte.
- Não link para pastas (`./XXXX-<slug>/research/`) — sempre para arquivo
  específico.
