# Governance Next App

Aplicacao Next.js/React/MUI da simulacao v3 do `work-graph-model`.

Ela e a interface humana sobre a governanca file-first da org ficticia `acme-*`. O app nao e a fonte autoritativa: ele le o snapshot derivado de `_org-simulation-v3/acme/**`, chama o runtime local para comandos/dry-runs e mostra, em linguagem de produto, o que o modelo ja consegue provar.

## Estado Atual

Pronto nesta fatia:

- App Next em TypeScript, isolado no workspace `acme-governance-next-app`.
- Home de adocao em `/`, com tarefas de entrada, pendencias e proximo passo derivado do snapshot.
- Onboarding em `/onboarding`, com diagnostico de perfil, papeis, fontes de trabalho, assistente, integracoes e revisao final.
- Configuracoes em `/settings`, separando Organizacao, Papeis, Fontes, Assistente, Integracoes e Avancado.
- Console tecnico em `/console`, mantendo grafo, comandos, resolver, operacao e auditoria para quem precisa inspecionar a camada tecnica.
- APIs locais para snapshot, comandos e health-check do Ollama.
- Locales colocalizados por view, step, section, componente ou subdominio com texto de usuario.
- Guard em `check-governance-app.mjs` para impedir retorno ao locale global e para validar o build/snapshot do app.
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

## Arvore de Pastas

```text
governance-next/
  app/
    api/
      commands/
        dry-run/
        execute/
      integrations/
        assistant/
          ollama/
            health/
      snapshot/
    settings/
    console/
    onboarding/
    page.tsx
    layout.tsx
    styles.css
    features/
      adoption/
        assistant/
          locales/
        components/
          attention-list/
            locales/
          cards/
            locales/
          role-contract-list/
            locales/
          source-list/
            locales/
          status/
            locales/
        confidence/
          locales/
        profiles/
          locales/
        roles/
          locales/
        sources/
          locales/
        summary/
          locales/
      console/
        commands/
        views/
      home/
        views/
          HomeView/
            locales/
      onboarding/
        components/
          locales/
        diagnosis/
          locales/
        steps/
          WelcomeStep/
            locales/
          ProfileDiagnosisStep/
            locales/
          PeopleStep/
            locales/
          SourcesStep/
            locales/
          AssistantStep/
            locales/
          IntegrationsStep/
            locales/
          ReviewStep/
            locales/
        views/
          OnboardingView/
            locales/
      settings/
        sections/
          OrganizationSection/
            locales/
          RolesSection/
            locales/
          SourcesSection/
            locales/
          AssistantSection/
            locales/
          IntegrationsSection/
            locales/
          AdvancedSection/
            locales/
        settings-model/
          locales/
        views/
          SettingsView/
            locales/
    ui/
      shared/
        DataPill.tsx
        EntityCard.tsx
        Flex.tsx
        IssueList.tsx
        ResponsiveGrid.tsx
        SectionCard.tsx
        StatCard.tsx
        StatusChip.tsx
        index.ts
        locales/
      shell/
        locales/
      theme.ts
  lib/
    governance-server.ts
    i18n.ts
    types.ts
  next.config.ts
  package.json
  tsconfig.json
```

## Convencoes

- Rotas em `app/*` devem ser finas: carregar dados e delegar a experiencia para `features/*`.
- Pastas e arquivos de codigo usam nomes em ingles. Portugues fica em labels, copy e `locales/pt-br.json`.
- `features/*` contem experiencia de produto e regras de apresentacao por dominio.
- Views de tela inteira ficam em `features/<feature>/views/<ViewName>`. Nao crie uma pasta global `views`.
- `ui/*` contem casca, tema e componentes compartilhados que nao pertencem a uma feature especifica.
- Cada componente em `ui/shared` deve viver em arquivo proprio; `index.ts` e apenas o barrel de exports.
- `lib/*` contem bordas do app: servidor, i18n e tipos importados do dominio da simulacao.
- Texto visivel de usuario deve morar em `locales/pt-br.json` colocalizado com a view, step, section, componente ou subdominio que o consome.
- Nao recriar ontologia do modelo no frontend; prefira tipos reexportados por `@/lib/types` e derivacoes em `features/adoption/*`.
- Evitar `Date.now()`, `Math.random()` e formatacao dependente do cliente durante render para nao reabrir mismatch de hydration.
- Evitar componentes que vazem props invalidas para DOM; o app ja abandonou o uso problematico de `Grid`/`Stack` nessa superficie.

## Comandos Uteis

Rodar o app:

```bash
npm --prefix .governance/specs/0024-context-architecture/work-graph-model/_org-simulation-v3/_apps/governance-next run dev
```

Checar TypeScript do app:

```bash
npm --workspace acme-governance-next-app exec tsc -- --noEmit
```

Checar build/snapshot da sim:

```bash
cd .governance/specs/0024-context-architecture/work-graph-model/_org-simulation-v3
node _tools/check-governance-app.mjs
```

## Limite Importante

A aplicacao deve ser honesta sobre o que e prova e o que e configuracao local. Quando uma tela ainda nao escreve estado governado, ela precisa dizer isso explicitamente. Quando uma integracao ainda e futura, ela deve aparecer como catalogada ou em breve, nao como mecanismo ativo.
