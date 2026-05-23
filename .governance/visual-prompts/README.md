# `.governance/visual-prompts/`

Templates de prompts versionados invocados pelo **wizard CLI** (opção "Gerar prompt visual" em `yarn guidelines workflow`). Geração de imagens acontece em ferramenta externa sob comando humano; runtime apenas substitui variáveis (`{{var}}`) e imprime o prompt pronto para copy-paste.

## Templates atuais

| Slug                                | Variáveis                         | Foco da investigação                                                |
| ----------------------------------- | --------------------------------- | ------------------------------------------------------------------- |
| `architecture-end-to-end.prompt.md` | (nenhuma)                         | Estrutura arquitetural do repositório atual (camadas, componentes). |
| `value-delivered.prompt.md`         | `{{context}}`, `{{localContext}}` | Comparativo antes/depois de um PR ou spec específica.               |

> **Prompts editoriais específicos do framework `ai-guidelines`** (capa do README, capas DX) vivem em [`docs/editorial/`](../../docs/editorial/) — gênero distinto (prompts diretos para gerador de imagem, não briefings dirigidos a IA conversacional); não invocáveis via wizard.

## Fluxo (todos os tipos hoje seguem o mesmo padrão: 2 etapas)

```
wizard → escolha o tipo de prompt visual
       → wizard prepara um briefing dirigido a uma IA conversacional
         (com acesso ao repositório)
       → wizard copia o briefing para o clipboard
       → você cola na sua IA conversacional preferida
         (Claude com tool use, ChatGPT com browsing, Antigravity,
          Cursor com o projeto aberto)
       → a IA investiga o repo e devolve um prompt de imagem JÁ PRONTO
       → você cola esse prompt no seu gerador de imagem
         (Midjourney, DALL-E, etc.)
```

Os templates aqui são **briefings dirigidos a IA conversacional**, não prompts diretos para gerador de imagem. A IA é quem investiga e produz o prompt final — o template apenas estrutura o que ela deve fazer e que forma o output deve ter.

## Modo automático (em breve)

Cravado como sub-escopo da candidata [`governance-dashboard-and-visual-artifacts`](../specs/roadmap/backlog.md) no backlog `Now`: investigação determinística local via comandos `git`/`gh` no próprio wizard (sem IA conversacional intermediária). Quando materializar, adicionará variantes `*-auto` ao menu do wizard para fluxo single-stage end-to-end.

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
