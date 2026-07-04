# Governance Next App

Aplicacao Next.js/React/MUI da simulacao v3 do `work-graph-model`.

Ela e a interface humana sobre a governanca file-first. A org ficticia `acme-*` e uma FIXTURE DEMO: o app comeca por signup/organizacoes e so le o snapshot da acme quando a organizacao demo esta selecionada. O app nao e a fonte autoritativa da governanca: ele le o snapshot derivado, chama o runtime local para comandos/dry-runs e mostra, em linguagem de produto, o que o modelo ja consegue provar.

## Estado atual

Pronto nesta fatia:

- App Next em TypeScript, isolado no workspace `acme-governance-next-app`.
- Fluxo inicial real: `/signup` (identidade local honesta, `local-principal`) -> `/organizations` (criar/escolher organizacao; multi-organizacao com contexto separado) -> `/onboarding` por organizacao -> `/` Home da organizacao atual.
- Backend TypeScript do shell local em `server/adoption/` com boundaries claros: dominio puro em `_lib/domain/adoption-shell.ts`, use-cases em `application/`, persistencia file-first em `infrastructure/` (estado JSON + event-log JSONL + lock + escrita atomica + idempotencia por comando) e interface em `app/api/local/*` + cookie de sessao httpOnly.
- Demo `acme-*` anexavel como organizacao `sandbox-demo` (badge demo); organizacao nova/vazia tem Home, Settings e Console honestos, sem dados da acme.
- Home de adocao (demo) com tarefas, pendencias derivadas e proximo passo; Home de organizacao nova com checklist real (perfil/host/fontes).
- Onboarding workspace-aware: diagnostico guiado, papeis (vazio honesto fora da demo), fontes, assistente Ollama-first, integracoes (catalogo neutro) e revisao; progresso partial/finished persiste por organizacao no servidor.
- Configuracoes por organizacao: demo usa as secoes completas do snapshot; organizacao nova mostra identidade, governanca ausente e troca de organizacao.
- Console tecnico em `/console` apenas para organizacao com host de governanca (hoje a demo); caso contrario, estado honesto.
- APIs locais para snapshot, comandos, health-check do Ollama e shell local (`/api/local/*`).
- Estrutura route-first com `app/*/page.tsx` fino, gate server-side (`resolveAdoptionGate`) e implementacao colocalizada em pastas privadas.
- Locales privados (`_locales/pt-br.json`) colocalizados.
- Guards em `check-governance-app.mjs`: rotas do fluxo inicial obrigatorias, paginas com gate, snapshot da demo so com distincao `isDemo`, sem `localStorage`, dominio compartilhado puro, sem `app/features`/locale global/componente monolitico/JS novo.

Ainda por vir:

- Auth real (senha/SSO/identity-provider): o signup atual e identidade LOCAL, sem seguranca de conta; o cookie de sessao nao e assinado.
- Persistencia governada do onboarding alem do status: as escolhas (perfil/papeis/fontes) ainda sao UX; viram comandos governados em fatia futura.
- Vincular host de governanca a organizacao nova (hoje so a demo tem host) e importar/adaptar repos reais.
- Convites e aceite de papeis (hoje: contrato declarado + risco pendente).
- Assistente conversacional/matcher com politica de egress; hoje ha health-check local e preferencia de sessao.
- Adapters externos alem do catalogo.
- Migracao TypeScript da runtime `_lib`/`_tools` da sim (o shell local ja nasceu TS; o motor governado segue MJS).
- Empacotamento desktop/mobile.

## Rotas

| Rota                                        | Responsabilidade                                                                                |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `/`                                         | Home da organizacao ATUAL (demo: snapshot; nova: checklist honesto). Gate redireciona o fluxo.  |
| `/signup`                                   | Identidade local minima (`local-principal`); honesto: nao e conta segura nem auth cloud.        |
| `/organizations`                            | Criar/escolher organizacao (empresa/pessoal/cliente, perguntas guiadas) + anexar demo `acme-*`. |
| `/onboarding`                               | Fluxo guiado da ORGANIZACAO atual; progresso partial/finished persiste por organizacao.         |
| `/settings`                                 | Configuracoes da organizacao atual (demo: secoes completas; nova: identidade/governanca/troca). |
| `/console`                                  | Console tecnico da organizacao com host de governanca (hoje a demo).                            |
| `/api/local/signup`                         | Cria local-principal + sessao (cookie httpOnly, nao assinado — nao e auth).                     |
| `/api/local/organizations`                  | Cria organizacao vazia ou anexa a demo; atualiza sessao.                                        |
| `/api/local/organizations/select`           | Troca a organizacao ativa da sessao.                                                            |
| `/api/local/onboarding/status`              | Marca partial/finished por organizacao (nunca rebaixa finished).                                |
| `/api/snapshot`                             | Snapshot derivado do runtime file-first (demo).                                                 |
| `/api/commands/dry-run`                     | Validacao de comando sem escrita.                                                               |
| `/api/commands/execute`                     | Execucao de comando governado.                                                                  |
| `/api/integrations/assistant/ollama/health` | Health-check local do Ollama.                                                                   |

## Arvore de pastas

```text
governance-next/
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
    governance-server.ts
    i18n.ts
    types.ts
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
- Codigo compartilhado de dominio de produto fica em `app/_domain/<domain>`.
- UI compartilhada fica em `app/_ui`. Ela nao deve conhecer detalhes de rota, comando ou arquivo YAML.
- Cada componente em `app/_ui/shared` deve viver em arquivo proprio; `index.ts` e apenas o barrel de exports.
- Pastas e arquivos de codigo usam nomes em ingles. Portugues fica em labels, copy e `_locales/pt-br.json`.
- Texto visivel de usuario deve morar em `_locales/pt-br.json` colocalizado com a view, step, section, componente ou subdominio que o consome.
- Nao recriar ontologia do modelo no frontend; prefira tipos reexportados por `@/lib/types` e derivacoes em `app/_domain/adoption/*`.
- Evitar `Date.now()`, `Math.random()` e formatacao dependente do cliente durante render para nao reabrir mismatch de hydration.
- Evitar componentes que vazem props invalidas para DOM; o app ja abandonou o uso problematico de `Grid`/`Stack` nessa superficie.

## Comandos uteis

Rodar o app:

```bash
npm --prefix .governance/specs/0024-context-architecture/work-graph-model/_org-simulation-v3/_apps/governance-next run dev
```

Checar TypeScript do app:

```bash
cd .governance/specs/0024-context-architecture/work-graph-model/_org-simulation-v3
npm --workspace acme-governance-next-app exec tsc -- --noEmit
```

Checar build/snapshot da sim:

```bash
cd .governance/specs/0024-context-architecture/work-graph-model/_org-simulation-v3
node _tools/check-governance-app.mjs
```

## Shell local de adocao — o que e real e o que nao e

| Camada                                                 | Estado                                                                                                      |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| local-principal, organizacoes, memberships, onboarding | REAL e persistido file-first em `.local-state/` (JSON + event-log JSONL + lock + escrita atomica).          |
| Sessao                                                 | Cookie httpOnly NAO assinado. Lembra principal/organizacao nesta maquina. NAO e autenticacao.               |
| Demo `acme-*`                                          | FIXTURE: organizacao `sandbox-demo` que aponta para o host governado da sim. Nunca e "a realidade" do user. |
| Escolhas do onboarding (perfil/papeis/fontes)          | UX/projecao; viram comandos governados em fatia futura. So o status partial/finished persiste.              |
| Auth/SSO/convites/aceite de papeis                     | Futuro (adapter identity-provider); a modelagem (principals[], memberships explicitas) nao fecha a porta.   |

## Limite importante

A aplicacao deve ser honesta sobre o que e prova e o que e configuracao local. Quando uma tela ainda nao escreve estado governado, ela precisa dizer isso explicitamente. Quando uma integracao ainda e futura, ela deve aparecer como catalogada ou em breve, nao como mecanismo ativo. O snapshot governado da acme so aparece quando a organizacao demo esta selecionada; organizacao nova ve o proprio estado, mesmo que vazio.
