# ADR 0007 — Visibilidade Pública: Fresh Repo + Snapshot Curado

**Status**: Aceito
**Data**: 2026-04-25
**Decisores**: Rosana Rezende (mantenedor)
**Spec relacionada**: [`.specify/specs/0008-governance-coherence/`](../.specify/specs/0008-governance-coherence/) Sub-bloco G
**Substitui**: decisão preliminar de naming npm preservada no archive privado
**Estende**: ADR 0005 (curadoria público/privado)

---

## Contexto

O repo `ai-guidelines` foi criado como ferramenta interna do mantenedor para
governar workflows com IA em projetos próprios. Conforme o framework
amadureceu (Specs 0001-0008), surgiu o desejo de torná-lo público como:

- vitrine do trabalho do mantenedor;
- contribuição open source para a comunidade brasileira (especialmente
  mulheres e pessoas em situação de vulnerabilidade);
- destravar URLs GitHub nos `AGENTS.md` de consumidores (só funcionam com
  repo público);
- viabilizar publicação como package npm.

O [ADR 0005](0005-curadoria-publico-privado.md) já estabeleceu **taxonomia**
(que tipo de conteúdo é público vs restrito) durante a Spec 0004, mas não
decidiu **estratégia operacional** de flip. Este ADR resolve essa lacuna.

### Auditorias como evidência (G.0.1-G.0.4)

Quatro auditorias formais rodaram **antes** desta decisão para fundamentá-la
com dados:

- **G.0.1 (Auditoria de Naming)** — Valida naming híbrido `@ai-guidelines/core`.
- **G.0.2 (Auditoria de Menções Pessoais)** — 137 menções pessoais classificadas (preserve / rewrite / não migra).
- **G.0.3 (Auditoria de Citações)** — 3 citações legítimas, 2 misplaced removidas.
- **G.0.4 (Auditoria de Histórico Git)** — Zero credenciais expostas; risco editorial (transcripts em log) gerenciável via fresh repo.

---

## Opções consideradas

| Opção                                       | Prós                                                           | Contras                                                                                      |
| :------------------------------------------ | :------------------------------------------------------------- | :------------------------------------------------------------------------------------------- |
| 1. Manter privado                           | Preserva autonomia; sem trabalho                               | Bloqueia vitrine; bloqueia URLs GitHub em consumidores; impossibilita publicação npm         |
| 2. Público integral (flip simples)          | Simples; preserva git history completo                         | Expõe transcripts brutas, `.specify/memory/` antigas, specs 0001-0004 confusas via `git log` |
| 3. Público com curadoria via flip + rewrite | Preserva git history; ajusta conteúdo no HEAD                  | Conteúdo antigo permanece em git log; reescrita complexa e arriscada                         |
| **4. Público com curadoria via fresh repo** | **Clean slate; rastreabilidade preservada em archive privado** | **Perde git history pública; requer migração operacional manual**                            |

---

## Decisão

**Adotada: Opção 4 — Público com curadoria via fresh repo + snapshot curado.**

### Justificativa

- **Rastreabilidade preservada**: repo atual mantém-se privado como
  `ai-guidelines-archive` com todo git history (123 commits) intacto.
- **Clean slate público**: novo repo `rosanarezende/ai-guidelines` nasce com
  identidade alinhada à decisão de posicionamento "case study vivo" — sem
  ruído evolutivo cru.
- **Sem risco de squash/rewrite**: operação aditiva (clone + commit inicial),
  não destrutiva.
- **Auditorias confirmam viabilidade**: zero exposição de credenciais;
  conteúdo a remover do snapshot é editorial (transcripts brutas, specs
  antigas confusas).

### Naming npm

Uma decisão preliminar preservada no archive privado indicava
`@rosanarezende/ai-guidelines` (personal scope, convenção legacy). A pesquisa
de benchmarks (G.0.1) validou padrão `@<product>/<package>` em projetos open
source maduros (GitHub Spec Kit, Anthropic SDK, Vercel, Astro, Vue).

**Adotado**: `@ai-guidelines/core`. Org `ai-guidelines` ativa; `ai-guidelines-br`
(squat defensivo) reservada para extensões locale-specific futuras. Branding
"ai-guidelines BR" vai para README/CONTRIBUTING/comunicação, não para naming
técnico.

### Tratamento das specs antigas

Specs `0001-desacoplamento-e-agnosticidade`, `0002-project-init-automation`,
`0003-adopt-context-aware`, `0004-ai-dev-foundations-public-ready`,
`0004.1-sdd-contingency`, `0005-cli-adopt-refactor` **não migram cruas** ao
snapshot público. Razão: conteúdo confuso/exploratório das primeiras
iterações pré-amadurecimento do padrão SDD; viola decisão de posicionamento
"case study vivo" se exposto sem contexto.

**Substituído por**: narrativa curada em
[`.specify/specs/roadmap/historico.md`](../.specify/specs/roadmap/historico.md)
cobrindo:

- era pré-SDD (sem specs, edits diretos no repo);
- primeiras specs (0001-0004/5) — apenas temas/data/lições, sem conteúdo cru;
- maturidade (Specs 0005+ migram com conteúdo completo).

Mostra evolução real sem expor specs confusas. Não viola imutabilidade
pós-Review (specs antigas permanecem intactas no archive privado).

### Curadoria executada (G.curadoria, 3 commits)

Aplicada antes do snapshot, na branch `feat/spec-0008-F-G`:

- **Voz neutra** para menções pessoais inline (preservando autoria via ADR
  signatures + commit metadata).
- **Atribuição correta** a terceiros (link à fonte pública canônica — YouTube
  URLs em `synthesis.md` Fontes table e `backlog.md`).
- **5 transcripts brutas** permanecem no archive, não vão ao
  snapshot (zona cinza editorial; insights destilados em `synthesis.md`).
- **Email pessoal corrigido** em SECURITY.md / CODE_OF_CONDUCT.md
  (`contato@rosanarezende.com`).

---

## Plano de migração (executado pós-merge desta spec)

> **Ordem importante**: o nome `ai-guidelines` precisa ser liberado antes do
> repo novo poder usá-lo. Renomear o atual primeiro, criar o novo depois.

1. **Pré-snapshot**: merge do PR `feat/spec-0008-F-G`.
2. **Renomear repo atual** (libera o nome `ai-guidelines`):
   ```bash
   gh repo rename rosanarezende/ai-guidelines ai-guidelines-archive
   ```
   Mantém privado, preserva todo git history como acervo.
3. **Criar repo público novo** com o nome canônico:
   ```bash
   gh repo create rosanarezende/ai-guidelines --public \
     --description "ai-guidelines BR — case study vivo de governança IA multi-agente"
   ```
4. **Snapshot e Lançamento Inicial**:
   4.1. **Preparar diretório de trabalho**:
   Obter o hash de referência do archive (pós-merge) e preparar o clone limpo.

   ```bash
   # No repositório archive (após o merge):
   git rev-parse HEAD # Copie este <hash> para o passo 4.4

   # No diretório de trabalho temporário:
   git clone git@github.com:rosanarezende/ai-guidelines-archive.git snapshot-tmp
   cd snapshot-tmp
   rm -rf .git
   ```

   4.2. **Executar Curadoria de Arquivos**:
   Deletar fisicamente os arquivos que não devem migrar (ver [lista de exclusões](#lista-de-exclusões-do-snapshot)).

   > **Nota**: `.gitignore` sozinho não remove arquivos já presentes no diretório; a deleção física é obrigatória antes do próximo passo.

   4.3. **Sanitizar `.gitignore`**:
   Remover a seção `### TEMPORÁRIO: Exclusões de Snapshot` do arquivo `.gitignore`, deixando apenas as regras de runtime (ex: `node_modules`).

   4.4. **Inicializar novo repositório local**:

   ```bash
   git init -b main
   git add .
   git status # REVISÃO OBRIGATÓRIA: Confirmar que arquivos excluídos não aparecem
   git commit -m "feat: initial public release (snapshot from archive @ <hash>)"
   ```

   4.5. **Publicar no repositório canônico**:

   ```bash
   git remote add origin git@github.com:rosanarezende/ai-guidelines.git
   git push -u origin main
   ```

5. **Comunicar a mudança publicamente** (CHANGELOG, release notes, README
   do archive). Uma vez público, qualquer repo é consumidor potencial — não
   há lista nominal a notificar; consumidores ativos atualizam URLs de
   pointer architecture quando conveniente.
6. **Publicar npm** (etapa subsequente, opcional):
   ```bash
   npm publish --access public @ai-guidelines/core
   ```

---

## Consequências

### Positivas

- Vitrine pública desbloqueada; contribuição open source para comunidade BR
  habilitada.
- URLs GitHub em `AGENTS.md` de consumidores funcionam após migração.
- Publicação npm habilitada com naming canônico padrão (`@<product>/core`).
- Repo público nasce com identidade nítida, alinhada ao posicionamento
  "case study vivo" — sem ruído evolutivo cru.
- Archive privado preserva rastreabilidade completa para uso interno e
  como acervo.

### Negativas / Riscos

| Risco                                              | Mitigação                                                                                            |
| :------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| Perda de git history pública                       | Archive privado preservado; este ADR documenta migração com hash do último commit pré-snapshot       |
| Pessoas que linkam commits antigos perdem contexto | Cross-ref no `historico.md` e neste ADR; archive privado responde por links internos quando feasible |
| Tempo de migração + risco operacional              | Plano de migração detalhado acima; etapas testáveis isoladamente                                     |
| Impacto em consumidores existentes                 | Comunicação via CHANGELOG/release notes; pointer architecture sincroniza no próximo `adopt`          |

### Lista de exclusões do snapshot

Conteúdo presente no archive mas **não migrado** ao snapshot público:

- `.specify/specs/0008-governance-coherence/research/npm-org-naming-benchmarks.md`
- `.specify/specs/0008-governance-coherence/research/name-attribution-audit.md`
- `.specify/specs/0008-governance-coherence/research/third-party-citations-audit.md`
- `.specify/specs/0008-governance-coherence/research/git-history-exposure-audit.md`
- `.specify/specs/0008-governance-coherence/research/transcripts-*.md`
  (5 arquivos remanescentes — zona cinza editorial; insights em `synthesis.md`).
- Specs `0001-desacoplamento-e-agnosticidade/`, `0002-project-init-automation/`,
  `0003-adopt-context-aware/`, `0004-ai-dev-foundations-public-ready/`,
  `0004.1-sdd-contingency/`, `0005-cli-adopt-refactor/` (substituídas por
  narrativa em `historico.md`).
- `adrs/0001-polyrepo-federado.md` e
  `adrs/0002-mfe-adiado-para-fase-3.md` (decisões de workspace/projeto
  pessoal preservadas no archive privado; este ADR registra o naming npm de
  forma autossuficiente).
- Backlog candidato de MFE real removido em curadoria: era relacionado a outro
  repo e não pertence ao escopo público do `ai-guidelines`.
- `.specify/memory/` (notas pessoais; confirmar `.gitignore` antes do
  snapshot).
- Quaisquer outros artefatos identificados no momento do snapshot via
  checklist em G.3.

---

## Cross-refs

- [ADR 0005 — Curadoria Público/Privado](0005-curadoria-publico-privado.md)
  — taxonomia base; este ADR estende com estratégia operacional.
- [ADR 0006 — Licença Apache-2.0](0006-licenca.md).
- Spec 0008 Sub-bloco G —
  [`plan.md`](../.specify/specs/0008-governance-coherence/plan.md)
  "Decisões revisitadas" entry de 2026-04-25.
- Memória `project_ai_guidelines_visibilidade_publica.md` (atualizada
  pós-merge com link a este ADR).

---

_Nota: As 4 auditorias de fundamentação (G.0.1-G.0.4) são artefatos operacionais preservados no archive privado._
