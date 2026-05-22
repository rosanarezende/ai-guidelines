# `.governance/visual-prompts/`

Templates de prompts versionados invocados pelo **wizard CLI** (opção "Gerar prompt visual" em `yarn guidelines workflow`). Geração de imagens acontece em ferramenta externa sob comando humano; runtime apenas substitui variáveis (`{{var}}`) e imprime o prompt pronto para copy-paste.

## Templates atuais

| Slug                                | Variáveis     | Destino primário (onde colar)                                                                 |
| ----------------------------------- | ------------- | --------------------------------------------------------------------------------------------- |
| `architecture-end-to-end.prompt.md` | (nenhuma)     | Gerador de imagem direto (Midjourney, DALL-E, Claude com diagram capability)                  |
| `value-delivered.prompt.md`         | `{{context}}` | IA conversacional com acesso ao repo (Claude com tool use, ChatGPT com browsing, Antigravity) |

## Fluxos disponíveis

**Direto (arquitetura):**

```
wizard → tipo (a) → wizard imprime o prompt
       → cole no gerador de imagem
```

**Via IA conversacional (valor entregue):**

```
wizard → tipo (b) → wizard pergunta contexto (ex.: PR #25)
       → wizard imprime o prompt
       → cole na IA conversacional (Claude, ChatGPT, Antigravity)
       → IA investiga o repo e devolve um prompt de imagem JÁ PRONTO
       → cole esse prompt no gerador de imagem
```

A diferença operacional entre os dois fluxos é apenas **onde a primeira cola vai**. O wizard imprime sempre um prompt único; quem faz o trabalho intermediário (investigação) é a IA conversacional, não o runtime.

**Automático local (em breve):**

```
wizard → tipo (c) → mensagem "em breve"
```

Cravado como sub-escopo da candidata `governance-dashboard-and-visual-artifacts` no backlog `Now`: investigação determinística via comandos `git`/`gh` no próprio wizard substituirá o passo manual via IA conversacional.

## Convenções

- **Sufixo `.prompt.md`** — distingue de markdown narrativo.
- **Variáveis nomeadas** `{{nome}}` — substituídas pelo wizard antes de imprimir.
- **Sem imagens versionadas no repo.** PNGs envelhecem com o estado do projeto; prompts versionados regeneram representação coerente sob demanda. Cf. [ADR 0023](../../.core/governance/adrs/0023-meta-artifacts-yaml-with-derivations.md).

## Anti-objetivos (cf. ADR 0018)

- LLM no runtime para refinar prompts (humano edita via PR; IA conversacional só é invocada externamente pelo humano).
- Geração de imagens no runtime (acontece em ferramenta externa sob comando humano).
- Cachear PNGs no repo.

## Materialização completa esperada

A candidata [`governance-dashboard-and-visual-artifacts`](../specs/roadmap/backlog.md) (backlog `Now`) vai materializar o pipeline visual completo. Este diretório é o embrião do padrão.
