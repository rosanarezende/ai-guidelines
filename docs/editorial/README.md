# `docs/editorial/`

Prompts editoriais específicos do framework `ai-guidelines` para imagens do README e material institucional. Diferentes dos templates em [`.governance/visual-prompts/`](../../.governance/visual-prompts/) em dois eixos:

| Eixo             | `.governance/visual-prompts/`                                   | `docs/editorial/` (este diretório)                                     |
| ---------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Tipo**         | Briefing dirigido a IA conversacional (IA investiga o repo).    | Prompt direto para gerador de imagem (Midjourney/DALL-E/Claude).       |
| **Genericidade** | Genérico — funciona em qualquer repo via wizard CLI.            | Específico ao framework — descreve a arquitetura própria.              |
| **Invocação**    | `npm run flow` → opção de prompt visual (clipboard automático). | Leitura manual + copy-paste do bloco `<prompt>` em ferramenta externa. |

## Templates atuais

**Imagem 1 — capa principal do README** (substitui `docs/assets/ai-guidelines-flow.png`):

| Slug                     | Proporção | Quando usar                                                                                                                  |
| ------------------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `readme-cover.prompt.md` | 4:3       | Refresh da capa hero. Ciclo de governança + kernel `.governance/registry.yml` + extensões. Capacidades direcionais marcadas. |

**Imagens 2-4 — DX** — três imagens com **papéis distintos no README** (não são variantes para escolher uma; todas vão a produção):

| Slug                               | Proporção | Papel no README / ângulo                                                                                      |
| ---------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------- |
| `readme-dx-flow.prompt.md`         | 16:9      | Seção "Operação do ciclo" — sessão típica em 4 momentos (menu, execução, estado publicado, governança ativa). |
| `readme-dx-capability.prompt.md`   | 1:1       | Seção "Comandos essenciais" — superfície de comandos primários + profundidade opt-in.                         |
| `readme-dx-before-after.prompt.md` | 16:9      | Seção "Por que existe" — contexto fragmentado a cada sessão vs. contexto canônico no repositório.             |

## Estado atual de produção (2026-05-26)

As **4 imagens** estão inline no README, cada uma na sua seção:

| Prompt                             | Imagem em produção                                                           | Seção do README     |
| ---------------------------------- | ---------------------------------------------------------------------------- | ------------------- |
| `readme-cover.prompt.md`           | [`ai-guidelines-flow.png`](../assets/ai-guidelines-flow.png)                 | topo (capa hero)    |
| `readme-dx-flow.prompt.md`         | [`ai-guidelines-dx-flow.png`](../assets/ai-guidelines-dx-flow.png)           | Operação do ciclo   |
| `readme-dx-capability.prompt.md`   | [`ai-guidelines-capability.png`](../assets/ai-guidelines-capability.png)     | Comandos essenciais |
| `readme-dx-before-after.prompt.md` | [`ai-guidelines-before-after.png`](../assets/ai-guidelines-before-after.png) | Por que existe      |

Regenerações futuras substituem a imagem em produção via `mv` direto sobre o destino canônico em `docs/assets/`.

## Princípios cravados nos prompts

Os 4 prompts honram simultaneamente:

- **[ADR 0018 — Governance-First, AI-as-Channel](../../.core/governance/adrs/0018-governance-first-ai-as-channel.md) (Aceita).** Kernel é `.governance/registry.yml` + governance core. `AGENTS.md` é canal output entre vários, não kernel central. Framework é governance machinery; IA é canal opt-in.
- **[ADR 0022 — Handoff situado](../../.core/governance/adrs/0022-handoff-situated-precedes-static-distribution.md) (Proposta).** Handoff é princípio direcional ainda não materializado (candidata `handoff-as-first-class` no backlog). Nos visuais, aparece marcado como "em construção" (pontilhado, badge "em breve") — visão direcional honesta, não promessa cumprida.
- **Honestidade entregue vs. direcional.** Operação do ciclo, governança ativa, publish-state e índice público são capacidades entregues. Handoff, boilerplate por classe, dashboard são candidatas `Now` no backlog — aparecem visualmente diferenciadas.

## Como usar

1. Abra o `.prompt.md` desejado.
2. Copie o conteúdo entre `<prompt>` e `</prompt>`.
3. Cole em sua ferramenta de geração de imagem (Midjourney, DALL-E, Claude com tool use, Gemini, ChatGPT).
4. Para `readme-dx-before-after`, escolha 1 das 2-3 captions alternativas que o prompt oferece antes de gerar.
5. Salve o resultado no path indicado pelo comentário HTML no topo do arquivo (ex.: `docs/assets/ai-guidelines-flow.png`).

## Convenções

- **Sufixo `.prompt.md`** — alinhado com `.governance/visual-prompts/` para que o gênero seja reconhecível.
- **Comentário HTML no topo** — histórico de versões, destino do PNG, decisões de design.
- **Sem PNGs versionados aqui** — apenas em `docs/assets/`. Prompts versionados regeneram representação coerente sob demanda (cf. [ADR 0023](../../.core/governance/adrs/0023-meta-artifacts-yaml-with-derivations.md)).

## Manutenção — manter os prompts sincronizados (como um todo)

Os 4 prompts descrevem o **mesmo runtime** sob ângulos diferentes. Quando o runtime muda (novo comando, mudança no wizard, no modelo de boundaries ou nas mensagens da CLI), **atualize todos os prompts afetados na mesma rodada** — não só o que estava em foco. Drift entre prompts gera imagens que se contradizem.

Checklist ao alterar o runtime:

- [ ] Contagem/ícones do wizard conferem em `readme-dx-flow` (8 opções) e nas secundárias do `readme-dx-capability`.
- [ ] Comandos primários/secundários do `readme-dx-capability` refletem a superfície real (`workflow`, `continue`, `review`, `publish-state`, `release-prep`…), sem jargão interno (nada de "L2", `DEC-…`, `ADR-…` no texto visível).
- [ ] Boundaries da spec (Execução `tasks.md` / Prontidão `review.md` / Pós-merge `release-log.md`) aparecem coerentes em `readme-dx-flow`, `readme-dx-before-after` e nas fases do ciclo em `readme-cover` (Execução/PR/Merge).
- [ ] Linhas literais de terminal (em `readme-dx-flow`) batem com as strings reais da CLI.
- [ ] Todo texto renderizável em pt-BR (exceto literais de comando/arquivo em monospace).

## Anti-objetivos

- LLM no runtime para refinar prompts (humano edita via PR; geração externa).
- Geração de imagens no runtime (acontece em ferramenta externa).
- Cachear PNGs como SSOT (PNG é derivação; prompt é fonte).
- Misturar com `.governance/visual-prompts/` (gêneros diferentes; ver tabela no topo).
