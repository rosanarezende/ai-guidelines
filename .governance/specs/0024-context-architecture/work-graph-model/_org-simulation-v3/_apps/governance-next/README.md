# Governance Next App

Aplicacao Next.js/React/MUI da simulacao v3 do `work-graph-model`.

Ela e a interface humana sobre a governanca file-first da org ficticia `acme-*`. O app nao e a fonte autoritativa: ele le o snapshot derivado de `_org-simulation-v3/acme/**`, chama o runtime local para comandos/dry-runs e mostra, em linguagem de produto, o que o modelo ja consegue provar.

## Estado atual

Pronto nesta fatia:

- App Next em TypeScript, isolado no workspace `acme-governance-next-app`.
- Home de adocao em `/`, com tarefas de entrada, pendencias e proximo passo derivado do snapshot.
- Onboarding em `/onboarding`, com diagnostico guiado de perfil, papeis, fontes de trabalho, assistente, integracoes e revisao final.
- Configuracoes em `/settings`, separando organizacao, papeis, fontes, assistente, integracoes e avancado.
- Console tecnico em `/console`, mantendo grafo, comandos, resolver, operacao e auditoria para quem precisa inspecionar a camada tecnica.
- APIs locais para snapshot, comandos e health-check do Ollama.
- Estrutura route-first com `app/*/page.tsx` fino e implementacao colocalizada em pastas privadas da rota.
- Locales privados (`_locales/pt-br.json`) colocalizados com view, step, section, componente compartilhado ou subdominio que consome o texto.
- Guard em `check-governance-app.mjs` para impedir retorno a `app/features`, `app/ui`, locale global, componente monolitico compartilhado e warnings conhecidos de MUI/React.
- Health-check do Ollama sem envio de prompt ou contexto; apenas consulta local de disponibilidade/modelos.

Ainda por vir:

- Persistencia governada do onboarding. Hoje varios passos sao experiencia local/UX; mudancas reais ainda precisam virar comandos governados.
- Criacao de conta, selecao de organizacao e suporte multi-organizacao/multi-workspace.
- Convites, aceite de papeis e contrato de identidade/permissao de usuarios reais.
- Configuracao real de fontes de trabalho alem das fixtures atuais.
- Assistente conversacional/matcher com politica de egress aplicada; hoje existe apenas health-check local.
- Adapters externos alem do catalogo e das provas locais atuais.
- Refatoracao TypeScript do backend/runtime da simulacao. O frontend ja esta em TS; a camada `_tools/_lib` ainda sera tratada em fatia propria.
- Fluxos completos de authoring para toda mutacao de governanca.
- Empacotamento desktop/mobile. O app foi estruturado para permitir evolucao futura, mas a superficie atual e web local.

## Rotas

| Rota                                        | Responsabilidade                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `/`                                         | Home de adocao para usuario nao tecnico: o que fazer agora, pendencias e estado do ciclo.        |
| `/onboarding`                               | Fluxo guiado de configuracao inicial da organizacao.                                             |
| `/settings`                                 | Configuracoes humanas por area: organizacao, papeis, fontes, assistente, integracoes e avancado. |
| `/console`                                  | Console tecnico com graph, commands, resolver, ops e audit.                                      |
| `/api/snapshot`                             | Snapshot derivado do runtime file-first.                                                         |
| `/api/commands/dry-run`                     | Validacao de comando sem escrita.                                                                |
| `/api/commands/execute`                     | Execucao de comando governado.                                                                   |
| `/api/integrations/assistant/ollama/health` | Health-check local do Ollama.                                                                    |

## Arvore de pastas

```text
governance-next/
  app/
    layout.tsx
    styles.css
    (home)/
      page.tsx                       # rota /, fina; route group nao altera a URL
      _view/
        HomeView/
          _locales/pt-br.json
          index.tsx
          HomeHeader.tsx
          ShortcutGrid.tsx
          SnapshotBadges.tsx
          OnboardingPartialCard.tsx
          AssistantPrompt.tsx
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
      page.tsx                       # rota /settings, fina
      _view/
        SettingsView/
          _locales/pt-br.json
          index.tsx
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
      page.tsx                       # rota /console, fina
      _view/
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
        onboardingStorage.ts
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

## Limite importante

A aplicacao deve ser honesta sobre o que e prova e o que e configuracao local. Quando uma tela ainda nao escreve estado governado, ela precisa dizer isso explicitamente. Quando uma integracao ainda e futura, ela deve aparecer como catalogada ou em breve, nao como mecanismo ativo.
