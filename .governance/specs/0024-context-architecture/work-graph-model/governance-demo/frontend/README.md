# Governance Next App

Aplicacao Next.js/React/MUI da simulacao v3 do `work-graph-model`.

Ela e a interface humana sobre a governanca file-first. A org ficticia `acme-*` e uma FIXTURE DEMO: o app comeca por signup/organizacoes e so le o snapshot da acme quando a organizacao demo esta selecionada. O app nao e a fonte autoritativa da governanca: ele le o snapshot derivado, chama o runtime local para comandos/dry-runs e mostra, em linguagem de produto, o que o modelo ja consegue provar.

## Estado atual

Pronto nesta fatia:

- App Next em TypeScript, isolado no workspace `acme/governance-next-app`.
- Fluxo inicial real: `/signup` (identidade local honesta, `local-principal`) -> `/organizations` (criar/escolher organizacao; multi-organizacao com contexto separado) -> `/onboarding` por organizacao -> `/` Home da organizacao atual.
- Backend TypeScript do shell local em `server/adoption/` com boundaries claros: shared kernel em `../packages/domain`, contratos em `../packages/contracts`, use-cases em `application/`, persistencia file-first em `infrastructure/` (estado JSON + event-log JSONL + lock + escrita atomica + idempotencia por comando) e interface em `app/api/local/*` + cookie de sessao httpOnly.
- Fronteira backend por SDK: o app consome apenas `@demo/backend` (use cases/handlers server-side), `@demo/contracts` (tipos/DTOs compartilhados) e `@demo/domain` (funcoes/constantes puras browser-safe). `@demo/domain/server` e proibido no frontend. Import de modulo interno (`backend/src/...`, `tools/...`, qualquer `.mjs`) e barrado pelo guard — a fronteira ja nasce pronta para clientes web/native separados.
- API local tipada: rotas de graph queries (`/api/graph*`), integracoes (`/api/integrations*`), advisory do assistente e contrato verificavel em `/api/contract`; requests validadas por schema (400 fail-closed) na camada `backend/src/api`.
- Demo `acme-*` anexavel como organizacao `sandbox-demo` (badge demo); organizacao nova/vazia tem Home, Settings e Console honestos, sem dados da acme.
- Home de adocao (demo) com tarefas, pendencias derivadas e proximo passo; Home de organizacao nova com checklist real (perfil/host/fontes).
- Onboarding workspace-aware: diagnostico guiado, papeis (vazio honesto fora da demo), fontes, assistente Ollama-first, integracoes (catalogo neutro) e revisao; progresso partial/finished persiste por organizacao no servidor.
- Configuracoes por organizacao: demo usa as secoes completas do snapshot; organizacao nova mostra identidade, governanca ausente e troca de organizacao.
- Fontes de trabalho em `/sources`: fluxo guiado por situacao do projeto (local x nuvem; com Git, sem Git, pasta planejada, cloud-sync, monorepo, GitHub etc.), sempre mostrando a relacao com o governance host. Pasta local/sincronizada tambem pode ser escolhida no Explorer como snapshot do navegador (`snapshot-only`, sem Git/autoria); caminho manual fica como modo avancado para scan real pelo processo do app.
- Console tecnico em `/console` apenas para organizacao com host de governanca (hoje a demo); caso contrario, estado honesto.
- APIs locais para snapshot, comandos, health-check do Ollama e shell local (`/api/local/*`).
- Estrutura route-first com `app/*/page.tsx` fino, gate server-side (`resolveAdoptionGate`) e implementacao colocalizada em pastas privadas.
- Locales privados (`_locales/pt-br.json`) colocalizados.
- Guards em `tools/checks/check-governance-app.ts`: rotas do fluxo inicial obrigatorias, paginas com gate, snapshot da demo so com distincao `isDemo`, sem `localStorage`, dominio compartilhado puro, sem `app/features`/locale global/componente monolitico/JS novo.

Feito nesta fatia (R0/R1):

- Escolhas do onboarding persistem como comandos reais ao concluir: perfil + regra de acumulo, fontes declaradas e assistente (local salva provider com teste real; cloud fica pendente de aprovacao/egress). Recarregar preserva tudo.
- Governance host para organizacao nova: fit-check, scaffold real (`host.yml` + `events/events.jsonl` + `sourceRevision`) e vinculo pelos 3 formatos, ou sandbox explicito — na secao Governanca das configuracoes.
- Convites com token local (pending → accepted/declined/revoked/expired) e papeis por subject com aceite via `/api/local/members*` e `/api/local/roles*` (API de produto; telas dedicadas de membros/papeis sao fatia seguinte — o painel do onboarding segue como contrato declarado, marcado como pendente de aceite).
- mock-api + Playwright: jornada signup → workspace → onboarding parcial → Home roda contra seed resetavel.
- Spike da stack visual (QRD-27/28/29) em `app/spikes/visual-stack/`: view-models independentes de renderer
  (`_model/`), candidatos isolados (`_candidates/`), fixture sintetica seedada (ate ~6k nos/10k linhas) e tela
  comparativa interna com busca, filtros, foco, painel de detalhe e acao governada simulada (dry-run).
  Estado apos validacao da owner (QRD-29): React Flow+ELK agora aplicado em `/map` (ECharts = aba relacional
  opcional futura); Apache ECharts agora aplicado em `/results`; TanStack Table+MUI+virtualizacao agora aplicado em `/work`;
  Sigma x ECharts no console tecnico pendente de decisao (Reagraph rejeitado/removido); TanStack Query
  (= React Query atual) decidido para server state. Evidencia: `../../_reviews/2026-07-04-visual-stack-spike.md`.

Ainda por vir:

- Auth real (senha/SSO/identity-provider): o signup atual e identidade LOCAL, sem seguranca de conta; o cookie de sessao nao e assinado.
- Telas dedicadas de membros/papeis (fontes ja tem `/sources` real; PeopleStep/SourcesStep do onboarding continuam parcialmente UX e estao marcados assim).
- Detalhe acionavel por linha em `/work` (breakdown, repo-work ack, verdict); a rota atual e lista operacional derivada.
- GitHub work-source cloud real (contrato/kind/backlog modelados; conexao OAuth/App e fatia seguinte — nunca aparece como `connected` sem mecanismo).
- Health-check vivo do Neo4j como graph-read-model (config/status/sourceRevision persistem; verificacao ativa e fatia seguinte).
- Assistente conversacional completo: hoje ha health-check local e advisory local (`/api/integrations/assistant/advisory`) com egress fail-closed + redacao minima; UI conversacional e fatia futura.
- Adapters cloud alem dos locais (git-local, ci-local, code-quality, code-security OSV/deps.dev e observability ja tem mecanismo executavel; SonarQube remoto exige allowlist de egress e cliente ainda nao mecanizado).
- Empacotamento desktop/mobile.

## Rotas

| Rota                                                        | Responsabilidade                                                                                   |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `/`                                                         | Home da organizacao ATUAL (demo: snapshot; nova: checklist honesto). Gate redireciona o fluxo.     |
| `/signup`                                                   | Identidade local minima (`local-principal`); honesto: nao e conta segura nem auth cloud.           |
| `/organizations`                                            | Criar/escolher organizacao (empresa/pessoal/cliente, perguntas guiadas) + anexar demo `acme-*`.    |
| `/onboarding`                                               | Fluxo guiado da ORGANIZACAO atual; progresso partial/finished persiste por organizacao.            |
| `/settings`                                                 | Configuracoes da organizacao atual (demo: secoes completas; nova: identidade/governanca/troca).    |
| `/map`                                                      | Mapa de governanca por objetivo; demo usa React Flow + ELK sobre API real.                         |
| `/results`                                                  | Dashboard de resultados da organizacao atual; demo usa ECharts + TanStack Query sobre API real.    |
| `/work`                                                     | Lista operacional de trabalho; demo usa TanStack Table + MUI + virtualizacao sobre API real.       |
| `/sources`                                                  | Fluxo guiado para fontes de trabalho; host x fonte, Explorer snapshot e scan avancado.             |
| `/console`                                                  | Console tecnico da organizacao com host de governanca (hoje a demo).                               |
| `/spikes/visual-stack`                                      | Bancada INTERNA do spike da stack visual (QRD-27/28); fora da navegacao de produto.                |
| `/spikes/control-plane-portal`                              | Bancada INTERNA do spike S1: portal/control plane + Git-backed governance host; fora da navegacao. |
| `/api/map/governance`                                       | View-model derivado para `/map`; workspace novo responde vazio honesto ate ter host/objetivos.     |
| `/api/results/dashboard`                                    | View-model derivado para `/results`; workspace novo responde vazio honesto ate ter host/outcomes.  |
| `/api/work/items`                                           | View-model derivado para `/work`; workspace novo responde vazio honesto ate ter host/contextos.    |
| `/api/local/signup`                                         | Cria local-principal + sessao (cookie httpOnly, nao assinado — nao e auth).                        |
| `/api/local/logout`                                         | Limpa a sessao local; nao apaga organizacoes, workspaces nem event-log.                            |
| `/api/local/organizations`                                  | Cria organizacao vazia ou anexa a demo; atualiza sessao.                                           |
| `/api/local/organizations/select`                           | Troca a organizacao ativa da sessao.                                                               |
| `/api/local/onboarding/status`                              | Marca partial/finished por organizacao (nunca rebaixa finished).                                   |
| `/api/local/onboarding/{path,profile,workspace-mode,stack}` | Persistem caminho, perfil+regra de acumulo, modo e stack (R1).                                     |
| `/api/local/members` + `invites/[id]` + `groups`            | Pessoas, convites com token/aceite/expiracao e times/grupos locais.                                |
| `/api/local/roles` + `roles/[id]`                           | Papeis por subject (proposed → accept/reject/revoke); authority sempre derivada.                   |
| `/api/local/governance-host`                                | Fit-check, criar (scaffold real + sourceRevision), vincular ou declarar sandbox.                   |
| `/api/local/work-sources` + `[id]/scan` + `browser-scan`    | Fontes com sourceTrust explicito; scan local real ou snapshot do navegador.                        |
| `/api/local/assistant` + `test` + `defaults`                | Providers multi-assistente com teste real, egress fail-closed e default por funcao.                |
| `/api/local/integration-backlog` + `integrations/[id]`      | Backlog honesto (disponivel/release-1/em-breve/adiado) + estado por workspace.                     |
| `/api/snapshot`                                             | Snapshot derivado do runtime file-first (demo).                                                    |
| `/api/commands/dry-run`                                     | Validacao de comando sem escrita (request validada por schema; 400 fail-closed).                   |
| `/api/commands/execute`                                     | Execucao de comando governado.                                                                     |
| `/api/graph`                                                | Nos/arestas do grafo DERIVADO com filtro por tipo/texto (inclui `sourceRevision`).                 |
| `/api/graph/node`                                           | No por id/GlobalRef com vizinhanca imediata.                                                       |
| `/api/graph/adjacency`                                      | Vizinhanca ate N saltos.                                                                           |
| `/api/graph/path`                                           | Menor caminho entre dois nos (repo/objective/target/intent/...).                                   |
| `/api/graph/contract-impact`                                | Impacto de contrato: consumers, intents, outcomes citando revisao, targets.                        |
| `/api/graph/intent-deps`                                    | Dependencias diretas/transitivas e superficie da intent.                                           |
| `/api/graph/conflicts`                                      | Conflitos/contensoes modelados (contrato, atestacao, erros de validacao).                          |
| `/api/integrations`                                         | Adapters mecanizados + status honesto de cada um.                                                  |
| `/api/integrations/[id]/test`                               | Testa um adapter real (opcionalmente contra um repo).                                              |
| `/api/integrations/assistant/ollama/health`                 | Health-check local do Ollama.                                                                      |
| `/api/integrations/assistant/advisory`                      | Conselho do assistente LOCAL (egress fail-closed + redacao minima; nunca vira mutacao).            |
| `/api/contract`                                             | Contrato verificavel da API local (schemas JSON por rota).                                         |

## Arvore de pastas

```text
frontend/
  server/                            # backend TS do shell local (sem React/MUI)
    adoption/
      application/use-cases.ts       # signup, criar/anexar/selecionar org, onboarding status
      infrastructure/
        paths.ts                     # .local-state/ (gitignored; estado do usuario da maquina)
        file-state-store.ts          # JSON atomico + events.jsonl + lock + idempotencia
      gate.ts                        # resolveAdoptionGate/entryRedirect (usado pelas pages)
      session.ts                     # cookie httpOnly (sessao LOCAL, nao e auth)
  app/
    layout.tsx
    styles.css
    signup/
      page.tsx                       # rota /signup, fina + gate
      _view/SignupView/              # _locales + index.tsx
    organizations/
      page.tsx                       # rota /organizations, fina + gate
      _view/OrganizationsView/       # _locales + index + OrganizationList + CreateOrganizationForm
    (home)/
      page.tsx                       # rota /, fina; gate decide signup/orgs/onboarding/home
      _view/
        HomeView/                    # home da organizacao DEMO (snapshot acme)
          _locales/pt-br.json
          index.tsx
          HomeHeader.tsx
          ShortcutGrid.tsx
          SnapshotBadges.tsx
          OnboardingPartialCard.tsx
          AssistantPrompt.tsx
        WorkspaceHome/               # home de organizacao NOVA (sem snapshot)
    onboarding/
      page.tsx                       # rota /onboarding, fina
      _view/
        OnboardingView/
          _locales/pt-br.json
          index.tsx
          OnboardingActions.tsx
          OnboardingStepper.tsx
          OnboardingStepContent.tsx
          summary.ts
      _steps/
        WelcomeStep/
          _locales/pt-br.json
          index.tsx
        ProfileDiagnosisStep/
          _locales/pt-br.json
          index.tsx
          ManualProfileOptions.tsx
          RecommendationCard.tsx
        PeopleStep/
        SourcesStep/
        AssistantStep/
        IntegrationsStep/
        ReviewStep/
      _components/
        _locales/pt-br.json
        DiagnosisQuestion.tsx
        OptionCard.tsx
        ProfileDetailList.tsx
        StepHeading.tsx
        WelcomeCard.tsx
        index.ts
      _model/
        diagnosis/
          _locales/pt-br.json
          index.ts
      _state/
        OnboardingContext.tsx
    settings/
      page.tsx                       # rota /settings, fina + gate (demo vs organizacao nova)
      _view/
        SettingsView/                # organizacao DEMO (snapshot completo)
          _locales/pt-br.json
          index.tsx
        WorkspaceSettingsView/       # organizacao NOVA (estado real, sem acme)
      _sections/
        OrganizationSection/
        RolesSection/
        SourcesSection/
        AssistantSection/
        IntegrationsSection/
        AdvancedSection/
      _model/
        _locales/pt-br.json
        index.ts
    results/
      page.tsx                       # rota /results, fina + gate
      _model/                        # view-model de resultados, independente de ECharts
      _view/
        ResultsView/                 # ECharts + TanStack Query sobre /api/results/dashboard
    map/
      page.tsx                       # rota /map, fina + gate
      _model/                        # view-model de mapa, independente de React Flow
      _view/
        MapView/                     # React Flow + ELK + filtros/painel de detalhe
    work/
      page.tsx                       # rota /work, fina + gate
      _model/                        # view-model da lista operacional
      _view/
        WorkView/                    # TanStack Table + MUI + virtualizacao
    sources/
      page.tsx                       # rota /sources, fina + gate
      _components/
        WorkSourcesManager/          # cadastro, scan e lista reutilizados em Settings
      _view/
        SourcesView/                 # explicacao de host x fonte + caminho local/servidor
    console/
      page.tsx                       # rota /console, fina + gate (demo; senao estado honesto)
      _view/
        ConsoleUnavailable/          # organizacao sem host de governanca
        GovernanceConsole.tsx
        ConsoleHeader.tsx
        ConsoleStats.tsx
        ConsoleTabs.tsx
        ConsoleHealthAlerts.tsx
        ConsoleProfilePanel.tsx
        consoleNavigation.tsx
      _panels/
        CompanyDashboard.tsx
        OwnerWorkspace.tsx
        ExecutionWorkspace.tsx
        OpsWorkspace.tsx
        AuditConsole.tsx
      _commands/
        CommandWorkspace.tsx
        commandTypes.ts
        commandPayloads.ts
        commandEnvelope.ts
    _domain/
      adoption/
        model.ts
        shellClient.ts               # gateway client do shell local (fetch /api/local/*)
        assistant/
        confidence/
        profiles/
        roles/
        sources/
        summary/
    _ui/
      charts/
        EChartsPanel.tsx             # wrapper compartilhado para charts de produto
      shared/
        _locales/pt-br.json
        DataPill.tsx
        EntityCard.tsx
        Flex.tsx
        IssueList.tsx
        JsonBlock.tsx
        ResponsiveGrid.tsx
        SectionCard.tsx
        StatCard.tsx
        StatusChip.tsx
        index.ts
      adoption/
        index.ts
        components/
      shell/
        _locales/pt-br.json
        AppShell.tsx
      theme.ts
    api/
      snapshot/
      commands/
      integrations/
  lib/
    i18n.ts
  next.config.ts
  package.json
  tsconfig.json
```

## Convencoes

- `app/*/page.tsx` deve ser fino: carregar dados e delegar para a view privada da rota.
- A Home usa `app/(home)/page.tsx` porque route groups do Next organizam a rota raiz `/` sem criar o segmento `/home`.
- Pastas privadas do App Router usam `_nome` quando nao devem virar rota.
- Experiencia de tela mora perto da propria rota: `/onboarding` usa `app/onboarding/_view`, `_steps`, `_components` e `_model`.
- Estado de fluxo local pode viver em `_state` da rota; evite prop drilling quando uma mesma tela coordena varios passos.
- Server-state usa TanStack Query pelo provider global `app/_providers/QueryProvider.tsx`; telas de produto nao criam `QueryClientProvider` proprio.
- Query keys compartilhadas ficam em `app/_domain/queryKeys.ts`, sempre escopadas por workspace e recurso.
- Context API fica reservado para fluxo local complexo (`onboarding`, `Cup/CWP`, shell se crescer). Nao use Context como fonte autoritativa.
- Redux/Zustand/Jotai nao entram sem novo QRD: o SSOT autoritativo continua no backend file-first/event-log.
- Codigo compartilhado de dominio de produto fica em `app/_domain/<domain>`.
- UI compartilhada fica em `app/_ui`. Ela nao deve conhecer detalhes de rota, comando ou arquivo YAML.
- Cada componente em `app/_ui/shared` deve viver em arquivo proprio; `index.ts` e apenas o barrel de exports.
- Pastas e arquivos de codigo usam nomes em ingles. Portugues fica em labels, copy e `_locales/pt-br.json`.
- Texto visivel de usuario deve morar em `_locales/pt-br.json` colocalizado com a view, step, section, componente ou subdominio que o consome.
- Nao recriar ontologia do modelo no frontend; prefira tipos de `@demo/contracts` e derivacoes em `app/_domain/adoption/*`.
- Paginas e rotas server-side importam o SDK publico diretamente de `@demo/backend`; nao crie facade decorativo em `lib/`.
- Evitar `Date.now()`, `Math.random()` e formatacao dependente do cliente durante render para nao reabrir mismatch de hydration.
- Evitar componentes que vazem props invalidas para DOM; o app ja abandonou o uso problematico de `Grid`/`Stack` nessa superficie.

## Comandos uteis

Rodar o app (na raiz do repositorio):

```bash
npm --workspace acme-governance-next-app run dev:real   # backend real (file-first .local-state)
npm --workspace acme-governance-next-app run dev:mock   # mock-api + app em modo mock (lowdb)
npm --workspace acme-governance-mock-api run dev        # so a mock-api (porta 3025)
npm --workspace acme-governance-mock-api run reset      # reset de seed (default blank)
npm --workspace acme-governance-e2e run test:e2e        # jornada Playwright contra mock seedada
```

Fonte de dados por env (QRD-01) — nunca por localStorage:

```text
GOVERNANCE_DATA_SOURCE=real-runtime | mock-api | demo-acme
GOVERNANCE_API_BASE_URL=http://127.0.0.1:3025   # quando mock-api
```

Contrato completo de ambientes, scripts, Docker Compose e guardrails de
producao: [`../ENVIRONMENTS.md`](../ENVIRONMENTS.md).

Regra de seguranca: mock proibida em produção; `GOVERNANCE_DATA_SOURCE=mock-api`
falha fechado quando o app resolve `GOVERNANCE_APP_ENV=production`.

Checar TypeScript do app:

```bash
cd .governance/specs/0024-context-architecture/work-graph-model/governance-demo
npm --workspace acme-governance-next-app exec tsc -- --noEmit
```

Checar build/snapshot da sim:

```bash
cd .governance/specs/0024-context-architecture/work-graph-model/governance-demo
node tools/checks/check-governance-app.ts
```

## Shell local de adocao — o que e real e o que nao e

| Camada                                                 | Estado                                                                                                                                                           |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| local-principal, organizacoes, memberships, onboarding | REAL e persistido file-first em `.local-state/` (JSON + event-log JSONL + lock + escrita atomica).                                                               |
| Sessao                                                 | Cookie httpOnly NAO assinado. Lembra principal/organizacao nesta maquina. NAO e autenticacao.                                                                    |
| Demo `acme-*`                                          | FIXTURE: organizacao `sandbox-demo` que aponta para o host governado da sim. Nunca e "a realidade" do user.                                                      |
| Escolhas do onboarding (perfil/papeis/fontes)          | Parcialmente reais: perfil/regra, pessoas/grupos/papeis, host, fontes e assistente ja passam por `/api/local/*`; fluxos sem tela dedicada ficam marcados no app. |
| Auth/SSO/convites/aceite de papeis                     | Futuro (adapter identity-provider); a modelagem (principals[], memberships explicitas) nao fecha a porta.                                                        |

## Limite importante

A aplicacao deve ser honesta sobre o que e prova e o que e configuracao local. Quando uma tela ainda nao escreve estado governado, ela precisa dizer isso explicitamente. Quando uma integracao ainda e futura, ela deve aparecer como catalogada ou em breve, nao como mecanismo ativo. O snapshot governado da acme so aparece quando a organizacao demo esta selecionada; organizacao nova ve o proprio estado, mesmo que vazio.
