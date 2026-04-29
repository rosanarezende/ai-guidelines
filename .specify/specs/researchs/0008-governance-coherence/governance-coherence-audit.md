# Governance Coherence Audit (Sub-bloco A — Task 0.5)

> Mapa das referências cruzadas entre `AGENTS.md`, `.core/rules/global-rules.md`,
> `docs/rpi-protocol.md`, `docs/process/spec-foundation.md`,
> `docs/ai-efficiency-guide.md`, e do template injetado no consumidor
> (`.core/templates/AGENTS-core.md.tmpl`). Marca as que **quebram no consumidor
> pós-`adopt`** (path não existe em `.ai-guidelines/` injetado).

---

## Contexto

Após a Spec 0005 (pointer architecture), o consumidor recebe apenas:

- `AGENTS.md` (raiz, injetado como pointer).
- `.ai-guidelines/AGENTS.md` (core baseline).
- `.ai-guidelines/rules/` (todos os arquivos de `.core/rules/`).
- Outros arquivos opt-in (prettier, husky, ci).

**Não recebe:** `.core/docs/`, `.core/templates/`, nada mais de `.core/`.

Logo, **qualquer link em `.core/rules/*.md` ou `.core/templates/AGENTS-core.md.tmpl`
para `docs/...`, `rules/...` (sem o prefixo `.ai-guidelines/`), ou paths absolutos
do repositório fonte, vai quebrar no consumidor.**

---

## Referências mapeadas

### `.core/rules/global-rules.md`

| Linha | Referência                                                                                                                      | Quebra no consumidor?                      | Ação                                                                                                                                                                                                                                |
| :---- | :------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L19   | `[cinematic-ui-boilerplates.md](docs/cinematic-ui-boilerplates.md)` e `[advanced-ai-patterns.md](docs/advanced-ai-patterns.md)` | **Sim** — `docs/` não existe no consumidor | Remover links (docs são humanos da fonte). Regra permanece mas sem links. Candidatos também à Spec 0015.                                                                                                                            |
| L37   | `` `docs/ai-efficiency-guide.md` ``                                                                                             | **Sim**                                    | **Bloqueador 4 PR #19** — task A.6: remover linha ou substituir por nota "Para detalhe, consulte repositório fonte do ai-guidelines". Regras de eficiência ficam em `global-rules.md` seção Eficiência de IA (sub-bloco C no PR 2). |
| L39   | `` `docs/process/` ``                                                                                                           | **Sim**                                    | **Bloqueador 4 PR #19** — task A.6: remover linha. Conteúdo relevante de process/ já está em AGENTS.md regras 5-9.                                                                                                                  |
| L3    | `` Fonte de verdade: `ai-guidelines/rules/global-rules.md` ``                                                                   | Informativo, não é link                    | Manter (é descritivo).                                                                                                                                                                                                              |
| L38   | `.geminiignore`, `.claudeignore`                                                                                                | Nomes de arquivo (exemplos), não links     | Manter.                                                                                                                                                                                                                             |

### `.core/templates/AGENTS-core.md.tmpl`

| Linha | Referência                                                                          | Quebra no consumidor?         | Ação                                                                                                                                                                                                                               |
| :---- | :---------------------------------------------------------------------------------- | :---------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L19   | `` `rules/global-rules.md` `` e `[Economia de Tokens](docs/ai-efficiency-guide.md)` | **Sim** — paths pré-pointer   | **Bloqueador 3 PR #19** — task A.7: apontar para `.ai-guidelines/rules/global-rules.md` (path real do consumidor). Link `docs/ai-efficiency-guide.md` pode virar referência interna ou ser removido (decisão consistente com A.6). |
| L23   | "branch sintética (`feat/`, `fix/`, `docs/`)"                                       | Nomes de convenção, não paths | Manter.                                                                                                                                                                                                                            |

### `AGENTS.md` (raiz do repositório fonte)

| Linha | Referência                                                    | Quebra?                                                           | Ação                                                                          |
| :---- | :------------------------------------------------------------ | :---------------------------------------------------------------- | :---------------------------------------------------------------------------- |
| L21   | `.core/rules/global-rules.md` e `docs/ai-efficiency-guide.md` | Não — arquivo da raiz do fonte aponta para paths que existem ali. | Manter. Este arquivo não é injetado no consumidor; o `AGENTS-core.md.tmpl` é. |

### `docs/rpi-protocol.md`

Referências internas para `.specify/specs/<slug>/` e `~/.claude/plans/`: não são links Markdown quebráveis. Conteúdo será estendido em B.3 (seção "Quando usar spec-foundation vs plano leve"), sem criar referências quebradas.

### `docs/process/spec-foundation.md`

Atualmente aponta para `workflows/spec-foundation.md` em `../../workflows/` (path histórico do ROADMAP.md). Confere:

```text
.specify/specs/ROADMAP.md:15:
Detalhes do lifecycle em [`workflows/spec-foundation.md`](../../workflows/spec-foundation.md).
```

**Quebra!** Pasta `workflows/` não existe mais (removida na Spec 0004). Ação em B.4 ou em B.10/B.11 (reformulação ROADMAP): atualizar link para `docs/process/spec-foundation.md`.

### `docs/ai-efficiency-guide.md`

Já mapeado pelo sub-bloco C (PR 2). Tem links para `for-gemini/setup.md`, `for-claude/setup.md`, `for-codex/setup.md` — pastas removidas. **Não tocado no PR 1**; reescrita completa vem no PR 2.

---

## Síntese — referências quebradas a corrigir no PR 1

| #   | Arquivo                               | Linha | Tipo                                                            | Task                                      |
| :-- | :------------------------------------ | :---- | :-------------------------------------------------------------- | :---------------------------------------- |
| 1   | `.core/rules/global-rules.md`         | L19   | Links para docs humanos (`docs/cinematic-*`, `docs/advanced-*`) | A.6 (extensão — tratar junto com L37/L39) |
| 2   | `.core/rules/global-rules.md`         | L37   | Link para `docs/ai-efficiency-guide.md`                         | A.6 (bloqueador 4)                        |
| 3   | `.core/rules/global-rules.md`         | L39   | Link para `docs/process/`                                       | A.6 (bloqueador 4)                        |
| 4   | `.core/templates/AGENTS-core.md.tmpl` | L19   | Paths pré-pointer                                               | A.7 (bloqueador 3)                        |
| 5   | `.specify/specs/ROADMAP.md`           | L15   | Link para `workflows/spec-foundation.md` (pasta removida)       | B.10/B.11 (reformulação) ou B.4           |

---

## Síntese — referências NÃO quebradas

Todas as outras referências nos arquivos acima apontam para paths que existem
tanto na fonte quanto no consumidor (quando aplicável), ou são descritivas e não
são links Markdown reais.

## Gap analysis — links que deveriam existir mas não existem

- `AGENTS.md` da raiz ainda não tem cross-ref para `CONTRIBUTING.md` (task F.3
  vai adicionar).
- `CONTRIBUTING.md` atual não linka para os templates SDD novos (task F.2 vai
  adicionar).
- `README.md` não tem seção "Para começar" com 3 caminhos por persona (task
  F.1).
