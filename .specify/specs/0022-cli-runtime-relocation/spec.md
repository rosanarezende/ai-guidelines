<!-- ai-guidelines-template: spec-boilerplate v=1 -->

# Spec 0022 — CLI Runtime Relocation

> Status: Draft
> Author: Claude Code (em sessão com Rosana Rezende, 2026-05-18)
> Date: 2026-05-18
> Owner: Rosana Rezende
> Tipo de spec: mixed
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Plan: [`./plan.md`](./plan.md)

> **Princípio de imutabilidade:** após status `In Review`, este arquivo só
> muda por consenso explícito. Decisões em aberto vão para `plan.md` (vivo).
>
> **Princípios da Escrita:** ver `.core/process/governance-foundation.md` §
> "Princípios da Escrita" (agnosticismo humano/IA, BR IDs, contratos).

---

## 🎯 Objetivo

O framework `ai-guidelines` hoje tem **duas pastas raiz com código vivo** que cumprem papéis sobrepostos: `cli/` (41 arquivos `.mjs` que servem o comando publicado `npx ai-guidelines <init|adopt|update|providers>`) e `src/` (53 arquivos `.ts` com modelo DDD construído ao longo da Spec 0021). Para um humano novo lendo o repositório, a primeira pergunta é "qual é o código real?" — e a resposta hoje é "depende".

A Spec 0021 começou a unificação parcialmente: o sub-bloco 4.C.0 ativou o `TemplateEngine` em TypeScript (`src/app/use-cases/AssembleArtifact.ts`) substituindo o mirror estático que o `cli/` lia. Para tudo mais (orquestração de comandos, lógica de instalação, parsing de argumentos, governance), `cli/` permanece como entrypoint ativo. A coexistência ficou declarada como débito em `roadmap/backlog.md` ("Cutover completo da CLI mjs para `src/` DDD — trabalho de specs futuras dedicadas").

Esta spec resolve o **problema de layout** isoladamente: consolida o código de runtime num único lar (`src/`) sem refatorar conteúdo. O cutover **arquitetural** — substituir orquestradores `.mjs` por casos de uso DDD em `src/app/use-cases/` com TDD próprio — fica para Spec 0023+. Resultado observável após a 0022: a pasta raiz `cli/` deixa de existir; o `bin` do `package.json` aponta para um arquivo dentro de `src/`; o consumidor não nota diferença (mesmos comandos, mesmo comportamento); o desenvolvedor que abre o repo pela primeira vez vê apenas `src/` como home de código.

---

## 📦 Escopo

### Dentro do escopo

- Mover todo o conteúdo de `cli/` para dentro de `src/` (caminho exato decidido em `[DEC-0022-A02]`).
- Atualizar todos os imports internos (`#cli/*`, `#features/*`, `#governance/*`, `#fs/*`, `#app/*`) para apontar para o novo path.
- Atualizar o campo `bin` em `package.json` para apontar para o novo entrypoint.
- Atualizar scripts em `package.json` (`guidelines:*`, `test`, `test:smoke`, `test:coverage`, `build:rules`, `living-docs:*`) para refletir o novo path.
- Atualizar referências textuais a `cli/` em docs canônicas (`README.md`, `AGENTS.md`, `.core/`) **apenas onde o path morre após o move** — rebranding textual amplo fica fora (vide `[DEC-0022-A03]`).
- Garantir que `yarn check`, `yarn test`, `yarn test:smoke`, `yarn living-docs:check` continuam verdes.
- Validar via tarball (`npm pack`) que o consumidor real continua funcionando idêntico (smoke headless cross-OS).

### Fora do escopo (vira spinoff ou fica em outra spec)

- **Cutover arquitetural mjs → TypeScript DDD**: substituir `cli/app/engine.mjs`, `cli/app/install.mjs`, `cli/app/guidance.mjs` etc. por casos de uso DDD em `src/app/use-cases/` com TDD próprio. Estimativa empírica: 1-2 semanas. Fica para Spec 0023+ (entrada refinada em `roadmap/backlog.md`).
- **Rebranding textual completo** ("a CLI" → "o `ai-guidelines`" / "`yarn guidelines`" → "`yarn ai-guidelines`" / mensagem do `printHelp` / nomes dos scripts `guidelines:*`): decisão narrativa separada. Pode acontecer junto com esta em rodada curta após o gate ou virar spec própria (slug provisório `cli-naming-cleanup`). Default desta spec é deixar fora; ver `[DEC-0022-A03]`.
- **Renomear o pacote npm `ai-guidelines`**: registrado no backlog como decisão de positioning (ADR 0018 / sinal de mercado). Não no escopo desta spec.

---

## ✅ Critérios de Aceite (alto nível)

- [ ] Pasta raiz `cli/` não existe mais (verificável via `ls`).
- [ ] `package.json:bin` aponta para arquivo dentro de `src/`.
- [ ] `yarn check && yarn test` verde (mantém os 296+ tests passando após a Spec 0021).
- [ ] `yarn test:smoke` verde em ubuntu/macos/windows × node 22/24 (matriz CI atual).
- [ ] Tarball gerado por `npm pack` contém o entrypoint correto e os artefatos compilados em `dist/`.
- [ ] Consumidor que instala via `npm i ai-guidelines` e roda `npx ai-guidelines init` em diretório vazio recebe o mesmo output que recebia antes (smoke real).
- [ ] CI 8/8 verde no PR.
- [ ] PR Draft revisado e aprovado por humano antes de Ready.

---

## 🔬 Pesquisa de contexto

- [`./decision-brief.md`](./decision-brief.md) — gate humano de decisões pré-design (3 pontos A + 1 ponto C).
- **Origem do insight**: sessão de design 2026-05-18 entre Rosana Rezende e Claude Code, durante a finalização da Spec 0021 PR #14. A hipótese inicial da owner era que a Spec 0021 entregaria o cutover completo `cli/` → `src/`; a auditoria do estado real (41 mjs vs 53 ts coexistindo, com bin apontando para `cli/`) revelou que o cutover ficou em "frações" (engine de templates). A divergência levou à decisão de separar o problema em duas specs: **0022 cirúrgica (de-arrumação)** e **0023+ arquitetural**.

---

## 🛠️ Dependências e impactos (alto nível)

- **Pré-requisitos**: Spec 0021 PR #14 mergeada (entrega `dist/` no tarball npm + `prepack` build automático + fail-fast em `engine-unavailable` no `templates.mjs`). Sem essa base, a 0022 fica especulando sobre o entrypoint da engine. Esta spec assume que a 0021 já está em `main`.
- **Specs afetadas**:
  - **Spec 0023+** (cutover arquitetural) usa o resultado desta como ponto de partida. A entrada no backlog refinada por esta spec dá o gancho.
- **Cross-refs com specs irmãs**:
  - **Spec 0021** — fronteira: a 0021 entrega o "porquê" (governance-driven, `.governance/` canônico, engine ativada parcialmente) e a 0022 entrega o "como mexer no esqueleto físico"; a 0021 não toca paths `cli/`, a 0022 não toca conteúdo de `src/domain/` ou `src/app/use-cases/`.
- **Riscos macro**:
  - **Quebrar imports cross-arquivo** durante o move (mitigação: atualização atômica de `package.json:imports` + sweep mecânico antes de qualquer test).
  - **Quebrar smoke tests cross-OS** porque algum path Windows é case-sensitive ou tem comportamento diferente em path resolution (mitigação: rodar `yarn test:smoke` localmente antes de cada push e confiar na matriz CI 3 OSs × 2 Nodes).
  - **Quebrar consumidores externos** se o `bin` mudar de nome publicado (mitigação: o name do `bin` é decidido pelo `package.json:name = ai-guidelines`, não pelo path do arquivo — o consumidor continua rodando `npx ai-guidelines`; só o **path interno** muda).
  - **Conflito de merge com a 0021** se a 0021 sofrer rebases entre agora e o merge desta (mitigação: a 0022 nasce de `main`, faz rebase em cima do main quando a 0021 mergear, e os escopos das duas são ortogonais — 0021 nunca toca `cli/`, 0022 só toca `cli/` e referências a ele).

---

## 📚 Referências

- Spec 0021 — Governance Information Architecture (origem do débito declarado em `roadmap/backlog.md`).
- ADR 0018 — Governance-first, AI-as-Channel (princípio narrativo análogo: nomear o produto explicitamente em vez do genérico).
- `roadmap/backlog.md` — entry "Cutover completo da CLI mjs para `src/` DDD" (refinada por esta spec em "de-arrumação" 0022 + "arquitetural" 0023+).
- Sessão de design 2026-05-18 (Rosana + Claude Code) — trilha narrativa nos commits que abrem esta spec.
