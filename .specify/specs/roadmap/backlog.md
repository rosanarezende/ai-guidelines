# Backlog — ai-guidelines

Este arquivo é o backlog vivo do repositório. Captura specs em execução, próximas na fila, candidatas, bloqueadores cross-spec e itens oportunistas.

**Regra de ouro:** nada aqui entra em execução sem nova spec (`.specify/specs/<slug>/`). Este arquivo é leitura obrigatória antes de abrir spec nova ou fechar uma spec existente.

**Política repo-first, integração-friendly:** o repositório é a memória canônica. Ferramentas externas (GitHub Projects, Jira, Linear, etc.) podem ser camada colaborativa humana via campo opcional `tracker` nas entradas abaixo, mas o resumo mínimo no `backlog.md` é mandatório.

Detalhes de lifecycle em [`docs/process/spec-foundation.md`](../../../docs/process/spec-foundation.md).

---

## Em execução

Specs atualmente em branch ativa. Formato enxuto.

- (Nenhuma spec em execução)

---

## Concluídas (Abril/2026)

- **spec 0017** — Process Refinement & CLI Refactor.
  Fusão das candidatas `process-refinement` e `cli-refactor`. Entrega do **Monolithic Runtime Compiler**, sanitização de `docs/` e aliasing nativo de pacotes.

---

## Now (próxima fila, ordem importa)

Specs ou candidatas priorizadas para iniciar em seguida. Ordem indica prioridade.

- **cli-typescript** (Migração TypeScript da CLI)
  - **Fonte do insight:** Remanescente do cli-refactor após a Spec 0017 assumir a reorganização de pastas.
  - **Escopo potencial:** migrar `.mjs` → `.ts` com `tsconfig.json` estrito, obtendo type-safety nas interfaces de features, options e context.
  - **Pré-requisitos:** Spec 0017 concluída (estrutura estável antes de migrar linguagem). Decisão sobre bundler (tsup, esbuild, ou script Node nativo).
  - **Riscos antecipados:** migração TS pode inflar `package.json` com deps de build; aliases precisam funcionar tanto em dev (`tsx`/`ts-node`) quanto no bundle publicado; diff será massivo (renomear ~40 arquivos).

- **process-automations** (Automatização de ciclo de vida de Gaps via CLI)
  - **Fonte do insight:** Remanescente do process-refinement (o processo em si foi absorvido pela 0017, mas a automação via CLI é separada).
  - **Escopo potencial:** criar workflow/comando no CLI que facilite a alimentação de `NEXT.md` e `backlog.md` a partir de insights capturados no chat.

- **seguranca-ia-supply-chain** (spec 0012 — Segurança de IA tools / supply chain)
  - **Fonte do insight:** incidente Vercel/Contex.ai (abril/2026), análise Lucas Montano [Hackearam a Vercel via AI](https://www.youtube.com/watch?v=oDXYfesz0qw). Síntese em `synthesis.md` Tema 4.
  - **Insight central:** ataque NÃO foi exploit de NextJS nem da API Vercel — foi via Contex.ai (AI agents) autorizado por funcionário Vercel via Google Workspace OAuth. Padrão emergente: cada AI tool autorizada via OAuth = nova superfície de ataque. _"O elo mais fraco nunca esteve sendo modelo. É a integração ou OAuth que essas ferramentas pedem na tela de onboarding."_
  - **Escopo potencial:** reescrever Regra 3 atual de `global-rules.md` cobrindo threat model OAuth de AI tools; criar `.core/rules/security.md` com política de marcação default sensitive, checklist de auditoria periódica de OAuth, política "nenhuma AI tool nova sem security review", rotação defensiva de secrets pós-incidente; comando CLI `audit-security` enumerando tools com OAuth.
  - **Audiência diferente de 0008:** governança de **operador humano** (não do agente IA) — por isso spec separada.
  - **Pré-requisitos:** Spec 0008 mergeada; idealmente decisão de visibilidade pública (cross-ref `project_ai_guidelines_visibilidade_publica.md`).
  - **Sinal de "está na hora":** consumidor real precisa autorizar nova AI tool e pergunta "como avalio o risco?"; ou outro incidente público similar (provável dada a tendência 2026).

### Oportunidades Priorizadas (Sem Spec)

- ~~**DRY nos testes das features Opt-in**: Abstrair o boilerplate de testes de integração/sincronização de regras (tdd, bdd, quality-gates) em um utilitário genérico `test-helpers.mjs`. (Débito da Spec 0016).~~ **Resolvido:** PR #1, Fase 2.7 — `cli/features/opt-in/test-helpers.mjs` com factory `createOptInRuleTestSuite()`.
- **Sobreposição Hierárquica na Arquitetura de Prompt**: parcialmente resolvido pelo ADR 0004 (Governance Single Responsibility) na Vaga E da spec 0004. Monitorar compliance em sessões futuras.
- **CLI `audit` — detecção de conflitos em configs globais**: comando que detecta `~/.gemini/GEMINI.md`, `~/.claude/CLAUDE.md`, `.cursorrules` globais, `~/.config/codex/instructions.md` e alerta sobre regras conflitantes com a Prime Directive do repositório. Fonte: ADR 0004.
- ~~**Automatizar ciclo de vida de Gaps**: workflow que facilite a alimentação de `NEXT.md` e `backlog.md` a partir de insights capturados no chat.~~ **Absorvido** por `process-refinement` (escopo item 4).
- **Scaffold de fundação de spec via CLI** (`ai-guidelines spec init <slug>`): gerar `spec.md` + `plan.md` + `tasks.md` + `NEXT.md` a partir dos boilerplates com placeholders.

---

## Next (depois, ordem flexível)

Specs ou candidatas que entram na fila depois de esgotado o Now. Ordem pode ser reorganizada sem renumeração.

- **npm-publication** (spec 0006 — Publicação npm + automação cross-repo)
  - **Escopo:** publicar core como package `@<scope>/ai-guidelines` (`init`/`adopt` via `npx`); ativar `pr-curator` como GH Action real em repositório da mantenedora;
  - **Critérios de aceite (esboço):** `npx` funciona em projeto novo e existente;
  - **Pré-requisitos:** Spec 0005 concluída (✓); decisão de naming (bloqueador #1).
  - **Riscos antecipados:** GitHub tokens cross-repo exigem PAT fino ou GitHub App; Action que abre PRs em outro repo pode virar ruído sem gatilho correto (label `growth-relevant`); NPM org paga vs GitHub Packages.
  - **Research obrigatória — Update Strategy para Consumidores**: quando o framework atualiza templates (rules, AGENTS), como consumidores recebem o update? Atualmente `adopt --force` sobrescreve tudo. Investigar: (1) merge inteligente que preserve customizações locais vs atualizações upstream; (2) notificação de updates disponíveis (ex: comparar hash local vs publicado); (3) modelo de semver para templates (breaking change = regra removida/renomeada). Insight: revisão pós-Spec 0008 revelou que reescrever templates core impacta todos os consumidores — sem estratégia de migração, updates são destrutivos.

- **tracker-automation** (Automação profunda de Trackers)
  - **Contexto:** A Spec 0016 revelou que apenas instruir o agente num arquivo `.md` não garante automação confiável com GitHub Projects V2 (que usa GraphQL e IDs globais).
  - **Escopo:** Feature opt-in (`tracker-github`) que injete scripts integradores (ex: `scripts/trackers/github-adapter.mjs`) e ensine o agente a rodar esses comandos no terminal para mover cards, garantindo precisão determinística.
  - **Origem:** Descoberta na Spec 0016.

- **regra-hierarquia** (spec 0011 — Hierarquia de regras por subdiretório)
  - **Fonte do insight:** Diego (Rocketseat), [Claude Code em monorepo full-stack](https://www.youtube.com/watch?v=ARYzqW0W7iI) 2026-01-22. Síntese em `.specify/specs/0008-governance-coherence/research/synthesis.md` Tema 1.
  - **Insight central:** ferramentas como Claude Code já carregam contexto sob demanda em subdiretórios. Em vez de inflar `AGENTS.md` raiz, separar por domínio: `api/AGENTS.md`, `api/src/auth/AGENTS.md`, `dashboard/AGENTS.md`. Resultado: contexto cirúrgico, sem inflar tokens.
  - **Escopo potencial:** padronizar hierarquia em `.core/rules/<topic>/AGENTS-fragment.md`; atualizar `cli/features/core/rules.mjs`; documentar no `AGENTS.md` raiz como agentes buscam fragmentos. Princípio (Diego): documentar **padrões**, não nomes de arquivo/pasta.
  - **Pré-requisitos:** Spec 0008 mergeada (sub-bloco A define regra acionável vs doc humano); decidir se hierarquia espelha layout do consumidor ou usa namespacing dentro de `.ai-guidelines/rules/<topic>/`.
  - **Sinal de "está na hora":** quando `global-rules.md` consolidado da 0008 inflar (>200 linhas) ou consumidor reclamar que "regras de domínios diferentes todo mundo lê tudo".

- **harness-engineering** (spec 0009 — Harness Engineering)
  - **Fonte do insight:** Uncle Bob via [Lucas Montano — "até o Uncle Bob virou Vibe Coder"](https://www.youtube.com/watch?v=MvFO-W9zZRk) (cyclomatic complexity, mutation testing); [Lucas Montano — "Vai Faltar Dev 2027"](https://www.youtube.com/watch?v=T9V7EyB_B9w) (bugs típicos de IA invisíveis em review humano: N+1, race conditions, memory leaks).
  - **Cross-ref Spec 0008-E:** 0008 entrega o **checklist editorial**; 0009 entrega a **implementação técnica**.
  - **Tipos de falha que spec-driven não resolve sozinho:** amnésia entre sessões, falso "done", implementador e validador no mesmo processo, slop acumulado (degradação 5-10%/iteração), bugs de IA invisíveis em review humano.
  - **Escopo potencial:** agente validador separado com contrato "um-a-um"; sensores automáticos obrigatórios (prettier/typecheck/testes como gate, análise estática, mutation kill rate, detecção de bugs típicos de IA, secret scanning); evaluation como gate; integração com `/ultra-review`.
  - **Custo de adoção:** custo elevado assumido — multi-agent + sensors em cada feature = 2-3× tokens por PR. Compensa apenas quando custo de regressão começar a doer mais que custo de tokens.
  - **Pré-requisitos:** Spec 0003 mergeada (✓); idealmente Spec 0008 mergeada antes (sub-bloco B canoniza RPI ↔ spec-foundation; sub-bloco E canoniza checklist editorial); pelo menos um ciclo real de regressão para justificar overhead.
  - **Sinal de "está na hora":** um usuário rodar `/clear` esperando continuar uma spec e o agente novo não conseguir retomar com `tasks.md` + git; ou PR precisar de 3+ rounds de correção por causa de coisas que sensor automático pegaria.

---

## Later (gatilho específico)

Specs ou candidatas que aguardam um gatilho externo (adoção, incidente, decisão estratégica). Documente o gatilho explícito.

- **quota-awareness** (spec 0014 — Quota Awareness Dashboard)
  - **Fonte do insight:** pesquisa Spec 0008 — `synthesis.md` Tema 5 (Lucas Montano "Vai Faltar Dev 2027") + decisão registrada 2026-04-24.
  - **Gatilho:** Spec 0008-C concluída (interpretação manual documentada) + um consumidor real estourar quota e perguntar "como eu sabia que estava perto disso?".
  - **Escopo potencial:** feature opt-in `quota-dashboard` ao lado de `prettier`/`husky`/`ci`; lê quotas via APIs de provider (Anthropic, OpenAI, Google) ou MCPs; sugere ações em thresholds (rotacionar para modelo mais barato, fragmentar tarefa, pausar até reset). **Decisão sempre fica com o usuário** — ferramenta sugere, não age.
  - **Riscos antecipados:** APIs de usage variam entre providers; credenciais = mais OAuth (cross-ref Spec 0012); sugerir "rotação para mais barato" pode parecer paternalista — UX precisa preservar autonomia do dev.

## Bloqueadores cross-spec

Decisões ou trabalho que bloqueiam múltiplas specs. Cada bloqueador lista as specs impactadas.

### 1. Naming decision do package `ai-guidelines`

- **Impacta:** spec 0006.
- **Candidatos:** `@rosanarezende/ai-guidelines`, `@ai-guidelines-br/core`, abreviações do nome pessoal.
- **Critérios de decisão:** visibilidade no portfólio vs. continuidade metodológica para futura empresa; adoção BR pós-IA (scopes pessoais vs org); tooling (NPM org paga vs GitHub Packages vs default registry); rename pós-adoção é custoso — decidir antes de publicar.
- **Ação pendente:** pesquisar benchmarks pós-IA (cenário 2026) antes da spec 0006.

---

## Itens oportunistas (sem spec)

Ideias, insights e débitos pequenos que ainda não justificam uma spec dedicada.

- **Catalogar skills em `skills/`** com metadados (quando usar, última verificação, exemplos). Cross-ref Spec 0015 (auditoria pode mover skills/ para `docs/`).
- **Publicar versão sanitizada** do `ai-guidelines` como package da futura empresa quando aplicável (continuidade metodológica).
- **Expor skills via servidor MCP local** para Claude Desktop / Claude CLI consumir dinamicamente.
- **Avaliar Multica novamente** quando surgir nova oportunidade.
- **Cobertura para monorepos** com workspaces ativos (pnpm/yarn/npm workspaces) no init kit.
- **CI multi-SO para validação de EOL cross-platform**: smoke tests do CLI em runners Windows/Linux/macOS. _(herdado do `NEXT.md` da spec 0003.)_
- **Merge semântico em repos com `.husky/` preexistente**: substituir "abort ou `--force`" por merge entre hooks existentes e do kit.
- **`init-project.ps1` Windows nativo**: para quem não tem Git Bash. Baixa prioridade enquanto Git Bash é o default.
- **Expansão do `adopt` para migrações mais agressivas**: upgrades de `AGENTS.md` legados sem marcadores e hooks Husky com shape mais complexo.
- **Adapters por IA no repo-alvo**: criar `for-claude/`, `for-gemini/`, `for-codex/` automaticamente durante o init.
- **Template de `CLAUDE.md` / `GEMINI.md` / `CODEX.md` por IA**: hoje o init só gera `AGENTS.md` agnóstico; extensões específicas ficam manuais.
- **Workflow / skill `codex-cross-review`** (Lucas Montano, Opus 4.7): antes de abrir PR, rodar Codex CLI com `--base <branch>` e classificar achados em P1/P2/P3. Adotar quando houver métrica de nitpicks recorrentes em review humano que codex pegaria.
- **Estratégia de 1M token context** (Opus 4.7): para refactors de módulo grande, mandar arquivos inteiros em vez de resumos. Tradeoff — gasta mais por operação, economiza em iterações. Regra prática: usar quando o próprio Claude pedir arquivo extra 2+ vezes na mesma sessão.
- **Kubb / Swagger → hooks tipados + mocks** (Diego Fernandes, não é ai-guidelines): quando repositórios mantenedores tiverem APIs próprias, Kubb lê OpenAPI e gera código tipado. Apontamento cross-repo.
- **Governança de Diálogo e Decisão**: pesquisar alternativas ao `interaction-map.md` (Decision Logs agentic-aware) para evitar artefato efêmero sem peso de Plano.
- **Check de Atualização interino no CLI**: antes da Spec 0006 (NPM), avaliar sensor leve no CLI que consulte API do GitHub para alertar sobre novas tags de release. Ver `research/update-notifications-strategy.md`.
- **Ajustes de UX no Gate de Cobertura**: refinar mensagens de erro e thresholds com base nos aprendizados da spec 0004 (thresholds realistas vs artificiais).

---

## Regras de uso

1. Nada aqui entra em execução sem nova spec dedicada em `.specify/specs/<slug>/`.
2. Ao fechar uma spec (status Done), revisar seu `NEXT.md`: migrar itens ainda relevantes para este arquivo; depois **deletar** o `NEXT.md` da spec.
3. Ao abrir spec nova: ler este arquivo primeiro, referenciar itens relevantes no `spec.md` da nova spec (não duplicar conteúdo).
4. Se um item oportunista virar prioridade, promover para spec própria — não executar ad-hoc.
5. Bloqueadores cross-spec ficam aqui, não dentro de `NEXT.md` de specs individuais (evita duplicação).
6. Candidatas vivem por **slug semântico**; número só na criação da branch. Reorganizar prioridade = mover entre seções, não renumerar.
7. **Ciclo de Fricção:** toda Issue aberta com tag `friction` ou que reporte falhas sistêmicas no CLI (init/adopt) deve ser avaliada como candidata a Spec antes de qualquer correção ad-hoc, garantindo que o framework evolua por design e não por "patches".
