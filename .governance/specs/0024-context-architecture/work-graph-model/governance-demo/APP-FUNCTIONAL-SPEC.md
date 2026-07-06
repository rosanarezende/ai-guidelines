# Especificacao funcional do app de governanca

> **Status:** contrato de produto versionado para a `governance-demo`.
> **Data:** 2026-07-04.
> **Ultima revisao:** 2026-07-05.
> **Escopo:** telas, fluxos, funcionalidades, dependencias de backend e lacunas da aplicacao Next/MUI.
> **Autoridade:** o modelo conceitual continua em [`../model.yml`](../model.yml). Este documento define a experiencia de produto que deve tornar o modelo operavel por uma pessoa usuaria.
> **Produto:** o que o app se propoe a ser e sua relacao com a CLI `ai-guidelines` ficam em [`APP-PRODUCT-STATEMENT.md`](APP-PRODUCT-STATEMENT.md).
> **Decisoes de app:** ambientes, mock API, MSW e e2e ficam em [`APP-DECISIONS.md`](APP-DECISIONS.md).
> **Mapa de iteracao visual:** o controle de telas iteradas/validadas fica em [`APP-ITERATION-MAP.md`](APP-ITERATION-MAP.md). Este arquivo descreve o contrato funcional; o mapa registra a validacao real subindo o app.
> **Matriz de cobertura:** a relacao entre promessa de produto, contratos automatizados, seeds e lacunas fica em [`APP-COVERAGE-MATRIX.md`](APP-COVERAGE-MATRIX.md).
> **Politicas explicaveis:** decisoes de bloquear, avisar, rebaixar ou revisar ficam em [`POLICY-HANDBOOK.md`](POLICY-HANDBOOK.md), que tambem serve como fonte para assistentes.
> **Cup/CWP:** o overlay contextual de coautoria fica em [`APP-DECISIONS.md#qrd-32---cupcwp-como-par-contextual-de-trabalho`](APP-DECISIONS.md#qrd-32---cupcwp-como-par-contextual-de-trabalho) e deve ser validado junto com cada tela no [`APP-ITERATION-MAP.md`](APP-ITERATION-MAP.md).

## 1. Objetivo do documento

Este arquivo existe para impedir que a aplicacao pareca pronta apenas porque existem APIs, checks ou comandos tecnicos.

Ele parte da declaracao de produto: o app e a superficie humana do framework, enquanto a CLI `ai-guidelines` continua sendo a superficie headless para terminal, CI e automacao. As duas superficies precisam operar o mesmo modelo, o mesmo governance host e os mesmos comandos conceituais.

Ele descreve, tela por tela, o que o app precisa entregar desde o primeiro acesso ate o uso diario:

- criacao de conta local;
- criacao e selecao de organizacoes/workspaces;
- convite de pessoas;
- atribuicao de papeis;
- configuracao de perfil de governanca;
- configuracao de assistente/modelo;
- integracoes e matcher;
- conexao de fontes de trabalho;
- planejamento de ciclo;
- registro, triagem, gate e ativacao de iniciativas;
- breakdown, execucao, contratos, outcomes, incidentes, auditoria e dashboards.

Quando uma funcionalidade ainda nao tem backend real, isso fica explicitamente marcado para decisao: criar agora, manter como futura feature ou remover da experiencia.

## 2. Legenda de status

| Status            | Significado                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| `UI real`         | Existe tela utilizavel por pessoa usuaria e a acao chama backend persistente.                            |
| `UI parcial`      | Existe tela, mas parte relevante ainda e estado local, fixture, botao desabilitado ou copy de prototipo. |
| `Backend real`    | Existe dominio/API/comando/resolver executavel e verificavel.                                            |
| `Console tecnico` | Existe mecanismo, mas hoje so e acessivel por console tecnico ou payload manual.                         |
| `Demo/read-only`  | A tela mostra dados da acme demo ou read-model, mas nao permite operar o fluxo real.                     |
| `Futuro`          | Nao existe mecanismo suficiente; precisa ser decidido e implementado.                                    |
| `Nao fazer agora` | Deve permanecer fora do escopo atual para evitar over-engineering.                                       |

## 2.1 Cobertura QRD-01..07 → mecanismo (R0 entregue)

| QRD    | Mecanismo entregue                                                                                                                                                                                 |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QRD-01 | `GOVERNANCE_APP_ENV` + `GOVERNANCE_DATA_SOURCE` + `GOVERNANCE_API_BASE_URL` em `frontend/server/adoption/data-source.ts`; mock proibida em produção (fail-closed); fonte NUNCA vem de localStorage |
| QRD-02 | `mock-api/` com lowdb + handlers TypeScript; contratos reaproveitados do domínio real (reducer único)                                                                                              |
| QRD-03 | pasta separada `governance-demo/mock-api/`; nome oficial `mock-api`                                                                                                                                |
| QRD-04 | Hono + `@hono/node-server`; frontend consome via `GOVERNANCE_API_BASE_URL`                                                                                                                         |
| QRD-05 | MSW entra quando houver primeiros testes de componente/hook (ainda não há)                                                                                                                         |
| QRD-06 | Playwright em `governance-demo/test/`; primeira jornada: signup → workspace → onboarding parcial → Home; seed resetada por teste                                                                   |
| QRD-07 | régua aplicada: jornada e2e = `UX-provada`; persistência via `/api/local/*` = `Produto-integrado`; governança real segue nos checks do backend                                                     |

## 2.2 APIs de produto do shell (R1 entregue)

Rotas Next (`frontend/app/api/local/*`) sobre use cases + reducer puro
(`@demo/domain`, fisicamente em `packages/domain/src/onboarding`); toda mutação
vira comando + evento:

| Rota                                        | Método   | Função                                                                         |
| ------------------------------------------- | -------- | ------------------------------------------------------------------------------ |
| `/api/local/signup`                         | POST     | cria local-principal + sessão                                                  |
| `/api/local/logout`                         | POST     | limpa cookie da sessao local; nao apaga workspaces nem event-log               |
| `/api/local/organizations[/select]`         | POST     | criar/anexar demo/selecionar workspace                                         |
| `/api/local/onboarding/status`              | POST     | partial/finished (nunca rebaixa finished)                                      |
| `/api/local/onboarding/path`                | POST     | guided/advanced                                                                |
| `/api/local/onboarding/profile`             | POST     | perfil de governanca + regra de acumulo sensivel                               |
| `/api/local/onboarding/workspace-mode`      | POST     | local/shared/controlled                                                        |
| `/api/local/onboarding/stack`               | POST     | execution-mode, operational-store, graph-read-model, identity (+ warnings)     |
| `/api/local/members`                        | GET/POST | visão pessoas/grupos/convites/papéis/authority derivada · convidar (token)     |
| `/api/local/members/invites/[id]`           | POST     | accept (com token) / decline / revoke; expiração honesta                       |
| `/api/local/members/groups`                 | POST     | criar time/grupo local                                                         |
| `/api/local/roles`                          | GET/POST | catálogo + atribuições · propor papel por subject (proposed; self-assigned)    |
| `/api/local/roles/[id]`                     | POST     | accept / reject / revoke                                                       |
| `/api/local/governance-host`                | GET/POST | fit-check · create (scaffold real + sourceRevision) · link · sandbox           |
| `/api/local/work-sources`                   | GET/POST | listar/adicionar fonte (entra como `declared`)                                 |
| `/api/local/work-sources/[id]/scan`         | POST     | scan local real (git head, hash, cloud-sync) → `sourceTrust` derivado          |
| `/api/local/work-sources/[id]/browser-scan` | POST     | registra snapshot escolhido no navegador (`snapshot-only`, sem Git/autoria)    |
| `/api/local/assistant`                      | GET/POST | config providers · salvar provider (teste real) · dismiss                      |
| `/api/local/assistant/test`                 | POST     | Ollama `/api/tags` ou OpenAI-compatible `/v1/models`; egress fail-closed       |
| `/api/local/assistant/defaults`             | POST     | default por função (QRD-24)                                                    |
| `/api/local/integration-backlog`            | GET      | catálogo projetado: disponivel/release-1/em-breve/adiado + nota de honestidade |
| `/api/local/integrations/[id]`              | POST     | configured/disabled por workspace                                              |

## 3. Principios de produto

1. **A pessoa nao deve precisar entender YAML, GlobalRef, resolver ou event-log para comecar.**
2. **A UI deve diferenciar dado real, demo, rascunho, declaracao manual e evidencia verificada.**
3. **Toda escolha importante do onboarding precisa sobreviver ao reload e aparecer nas configuracoes.**
4. **Toda acao que altera governanca passa por backend, comando ou use case nomeado.**
5. **Integracoes potencializam o que o framework ja faz, mas nao substituem o SSOT file-first.**
6. **Assistente e matcher sao canais assistivos: sugerem, explicam e aceleram, mas nao decidem.**
7. **Console tecnico e area avancada; nao e o caminho feliz do usuario.**
8. **Mock API valida experiencia, nao governanca.** Jornadas podem nascer contra `mock-api`, mas so contam como governanca real quando passarem pelo backend real/command runtime/resolver.
9. **Cup/CWP e par contextual, nao autoridade.** O overlay ajuda a operar a tela atual, mas usa contexto reduzido por policy e nunca grava mutacao autoritativa sem confirmacao humana.

## 3.1 Stack visual e spikes obrigatorios

Autoridade: [`APP-DECISIONS.md#qrd-27---stack-de-visualizacao-do-app`](APP-DECISIONS.md#qrd-27---stack-de-visualizacao-do-app)
e [`APP-DECISIONS.md#qrd-29---reconciliacao-pos-validacao-da-owner`](APP-DECISIONS.md#qrd-29---reconciliacao-pos-validacao-da-owner)
(QRD-28 e historico da rodada 1).

Spikes executados em 2026-07-04 em duas rodadas (`frontend/app/spikes/visual-stack/`,
evidencia em `../_reviews/2026-07-04-visual-stack-spike.md`); a rodada 2
reconciliou com a validacao de produto da owner. Estado por superficie:

| Superficie            | Uso principal                                                                               | Estado (QRD-29)                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Mapas de governanca   | Explicar caminhos de decisao, evidencias, contratos, riscos, objetivos e proximos passos.   | PRIMARIO EM VALIDACAO REAL: `/map` com React Flow (`@xyflow/react`) + ELK (`elkjs`); ECharts graph = aba opcional futura. |
| Dashboards            | Mostrar resultados derivados, comparativos de ciclo, targets, outcomes e confianca.         | PRIMARIO EM VALIDACAO REAL: Apache ECharts em `/results`; MUI X Charts = alternativa.                                     |
| Tabelas/data grids    | Operar listas densas de iniciativas, contratos, pendencias, evidencias, auditoria e fontes. | PROVAVEL PRIMARIO: TanStack Table + MUI (confirmar virtualizacao em lista real); MUI X Data Grid/AG Grid = alternativas.  |
| Grafo tecnico/console | Explorar vizinhanca, shortest path, impacto de contrato, dependencias e densidade.          | PENDENTE DE DECISAO: Sigma.js+Graphology (console denso) x ECharts graph (visualizacao amigavel); Reagraph rejeitado.     |
| Server state do app   | Cache, mutations, invalidacao e atualizacao das rotas do produto.                           | DECIDIDO: TanStack Query (= React Query atual; cache por workspace/sourceRevision).                                       |

Regras de produto:

- O grafo tecnico nunca substitui Home, onboarding, planejamento nem dashboards.
- A visualizacao relacional (ECharts graph) e aba secundaria opcional; o mapa
  guiado (React Flow+ELK) e a experiencia principal para stakeholders.
- TanStack Query e SERVER state: nao substitui banco, Context API,
  Zustand/Redux nem o SSOT file-first.
- `/results` e a primeira tela real que aplica QRD-29: Apache ECharts +
  TanStack Query sobre `/api/results/dashboard`. Ela confirma dashboards na
  demo; workspace novo ainda precisa de host/outcomes antes de ter dados.
- Se listas operacionais exigirem scroll infinito real (>100 linhas por pagina),
  a decisao de tabela volta para novo QRD.
- Cytoscape esta banido do produto, do roadmap e dos spikes.
- A camada de dados deve expor view-models independentes de renderer
  (`GovernanceMapViewModel`, `GovernanceDashboardViewModel`,
  `GovernanceTableViewModel`). Trocar renderer nao pode alterar dominio,
  comandos, resolver ou fonte autoritativa.

## 3.2 Cup / CWP — overlay contextual transversal

Autoridade: [`APP-DECISIONS.md#qrd-32---cupcwp-como-par-contextual-de-trabalho`](APP-DECISIONS.md#qrd-32---cupcwp-como-par-contextual-de-trabalho).

**Nome de produto:** Cup.
**Nome tecnico:** CWP (`contextual-work-partner`).
**Definicao:** um par de trabalho contextual que acompanha a pessoa usuaria nas
telas do app, entende o contexto permitido e ajuda a explicar, rascunhar,
comparar e preparar proximos passos sem decidir ou salvar estado sozinho.

Cup existe para resolver uma tensao central do produto:

- o modelo e poderoso e grafado;
- a pessoa usuaria nao deve operar como se estivesse lendo YAML/event-log;
- o app precisa explicar decisoes, fontes, roles, targets, outcomes,
  integracoes e politicas sem esconder o que ainda e incerto;
- IA ajuda muito, mas nao pode virar bypass de authority, policy, egress ou
  sourceRevision.

### 3.2.1 Superficies do Cup

| Superficie             | Funcao                                                                                           | Estado inicial |
| ---------------------- | ------------------------------------------------------------------------------------------------ | -------------- |
| Launcher global        | botao discreto persistente para abrir/fechar o painel                                            | C0             |
| Painel lateral         | conversa/contexto/acoes sugeridas sem cobrir a tela                                              | C0             |
| Hints inline           | convites contextuais em pontos dificeis da tela                                                  | C0-C1          |
| Context summary        | mostra o que Cup consegue ver nesta tela e por que outras coisas estao bloqueadas                | C1-C2          |
| Specialist mode        | muda linguagem e checklist por superficie (`source-guide`, `setup-guide`, `results-guide`)       | C3             |
| Provider-assisted mode | usa provider local/cloud aprovado para resumo, sugestao ou rascunho                              | C4             |
| Draft action mode      | prepara payload/dry-run de comando, sempre com confirmacao humana antes de qualquer persistencia | C5-C6          |

### 3.2.2 Pipeline obrigatorio

```text
Page CwpPageContext
  -> CWP Context Resolver
  -> Authority + Policy + Egress Resolver
  -> Specialist Router
  -> deterministic explainer OR assistant/matcher provider
  -> answer / suggestion / draft
  -> human confirmation if mutation
  -> interaction audit
```

Cup nunca acessa o mundo por atalho. Ele recebe contexto resolvido pelo app.
Quando a tela nao tem workspace, host, fonte ou permissao suficiente, Cup deve
dizer isso de forma simples e sugerir o menor proximo passo seguro.

### 3.2.3 Contrato minimo de contexto por pagina

Cada rota de produto deve conseguir publicar um descritor semelhante a:

```ts
type CwpPageContext = {
  route: string;
  workspaceId?: string;
  actorId?: string;
  surface:
    | "signup"
    | "organizations"
    | "onboarding"
    | "home"
    | "settings"
    | "sources"
    | "planning"
    | "intake"
    | "triage"
    | "gates"
    | "work"
    | "contracts"
    | "results"
    | "operations"
    | "audit"
    | "integrations"
    | "map"
    | "console";
  focusedRefs: string[];
  visibleDataClasses: Array<"public" | "internal" | "restricted">;
  allowedActions: string[];
  blockedActions: Array<{ action: string; policyRef: string; reason: string }>;
  sourceRevision?: string;
  baseRevision?: string;
};
```

O contexto publicado pela pagina e uma intencao; o backend ainda precisa
recalcular authority, policy e egress. A UI nao pode autoafirmar que Cup tem
permissao.

### 3.2.4 Especialistas por rota

| Rota/superficie          | Especialista CWP      | Oportunidade principal                                                                  |
| ------------------------ | --------------------- | --------------------------------------------------------------------------------------- |
| `/signup`                | `adoption-guide`      | explicar conta local, auth futura, demo e diferenca entre login e authority             |
| `/organizations`         | `workspace-guide`     | escolher workspace, anexar demo, entender local/shared/controlled                       |
| `/onboarding`            | `setup-guide`         | guiar perfil, responsabilidades, host, fontes, assistente e integracoes                 |
| `/sources`               | `source-guide`        | escolher local/cloud/GitHub, explicar `sourceTrust`, `.governance` e `.governance-host` |
| `/settings`              | `configuration-guide` | reconciliar configuracoes com onboarding e policy                                       |
| `/planning`              | `planning-guide`      | transformar objetivos em metricas, targets, allocation e contexto progressivo           |
| `/intake`                | `initiative-guide`    | rascunhar problema, hipotese, aposta, lacunas e fontes afetadas                         |
| `/triage`                | `triage-guide`        | sugerir perguntas, repos, contratos, unknowns e comparar matcher providers              |
| `/gates`                 | `decision-guide`      | explicar autoridade, risco, evidencia e consequencia da decisao                         |
| `/work`                  | `execution-guide`     | interpretar repo-work, acks, bloqueios e pendencias                                     |
| `/contracts`             | `contract-guide`      | explicar owner, consumers, compatibility-window, contention e migrations                |
| `/results`               | `results-guide`       | explicar outcome, actual, rollup, stale, self-attested e confianca                      |
| `/operations`            | `operations-guide`    | incidentes, follow-ups, SLO e trabalho operacional                                      |
| `/audit`                 | `policy-guide`        | explicar bloqueio/aviso/rebaixamento citando policy                                     |
| `/integrations`/settings | `integration-guide`   | configurar providers, egress, health, probe e backlog                                   |
| `/map`                   | `graph-guide`         | explicar caminho, impacto, vizinhanca e risco no grafo                                  |
| `/console`               | `technical-guide`     | orientar sem substituir console tecnico nem executar comando sozinho                    |

### 3.2.5 Matriz de poderes

Cup pode:

- explicar a tela atual;
- citar politica aplicavel;
- resumir o que esta visivel para aquela pessoa;
- sugerir proximo passo;
- comparar opcoes;
- rascunhar texto;
- apontar lacunas;
- preparar dry-run;
- chamar matcher/assistant provider quando policy permitir;
- registrar sugestao aceita/rejeitada/sobrescrita quando isso influenciar uma
  decisao.

Cup nao pode:

- aprovar gate;
- alterar authority;
- aceitar papel por outra pessoa;
- reduzir classificacao;
- ignorar egress;
- elevar `sourceTrust`;
- marcar provider como conectado sem mecanismo;
- publicar outcome;
- alterar event-log;
- executar mutacao autoritativa sem confirmacao humana.

### 3.2.6 Fases de implementacao

| Fase | Entrega                                                         | Dependencias                   | Bloqueia validacao das telas? |
| ---- | --------------------------------------------------------------- | ------------------------------ | ----------------------------- |
| C0   | launcher + painel lateral + mensagens estaticas por rota        | frontend shell                 | nao                           |
| C1   | `CwpPageContext` por rota + resumo do contexto que Cup pode ver | rotas existentes               | nao                           |
| C2   | policy explainer deterministico usando `POLICY-HANDBOOK.md`     | policy handbook                | nao                           |
| C3   | specialist router deterministico por superficie                 | C1                             | nao                           |
| C4   | provider assistivo local/cloud por policy                       | assistant provider + egress    | sim, para respostas com IA    |
| C5   | draft action/dry-run                                            | command runtime + baseRevision | sim, para mutacoes            |
| C6   | audit de coautoria: sugestao aceita/rejeitada/sobrescrita       | event/audit model              | sim, para uso governado pleno |

**Decisao operacional:** C0-C3 podem comecar antes da validacao tela-a-tela,
porque ajudam a identificar onde a UX ainda confunde. C4-C6 ficam para depois
do pipeline de provider/policy/audit.

## 4. Perfis de usuario do app

| Perfil de app     | O que precisa fazer                                                        | Observacao de seguranca                                                       |
| ----------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `local-user`      | Entrar no app local, criar workspaces, selecionar contexto.                | Nao substitui identidade corporativa nem autoridade governada.                |
| `workspace-admin` | Configurar organizacao, fontes, pessoas, papeis, integracoes e politicas.  | Pode convidar/atribuir, mas aprovacoes sensiveis exigem autoridade resolvida. |
| `sponsor`         | Aprovar perfil de governanca, excecoes e gates de maior impacto.           | Nao deve ser inferido automaticamente do admin.                               |
| `payer`           | Ver/gerir responsabilidade financeira e custos quando houver plano/cloud.  | Papel separado do admin; pode nao existir na versao local.                    |
| `security-owner`  | Aprovar egress, assistente cloud, secrets, policy e integracoes sensiveis. | Deve ser separado quando o perfil exigir SoD.                                 |
| `technical-owner` | Atender triagem, contratos, repos, capabilities e breakdown.               | Nao deve auto-atestar independencia quando tambem e owner da fonte.           |
| `attester`        | Atestar actual/outcome/evidencia.                                          | Deve ser validado contra definidor da meta e time medido.                     |
| `member`          | Participar de iniciativas, revisar pendencias, publicar evidencia.         | Permissoes dependem do workspace.                                             |
| `auditor`         | Ver decisoes, event-log, break-glass, self-attestation e drifts.           | Leitura ampla, escrita restrita.                                              |

## 5. Mapa de telas

| Area          | Tela/rota desejada       | Estado atual                                     | Papel principal                                 |
| ------------- | ------------------------ | ------------------------------------------------ | ----------------------------------------------- |
| Entrada       | `/signup`                | `UI real` para identidade local minima           | Criar usuario local                             |
| Entrada       | `/organizations`         | `UI real/parcial`                                | Criar, escolher e anexar demo                   |
| Onboarding    | `/onboarding`            | `UI parcial`                                     | Configurar workspace                            |
| Home          | `/`                      | `UI parcial`                                     | Proximo passo e pendencias                      |
| Configuracoes | `/settings`              | `UI parcial`                                     | Ajustar organizacao                             |
| Mapa          | `/map`                   | `UI real/read-only` na demo                      | Caminho objetivo → resultado                    |
| Console       | `/console`               | `Console tecnico`                                | Operacao avancada                               |
| Planejamento  | `/planning`              | `Futuro`                                         | Ciclo, objetivos, targets                       |
| Intake        | `/intake`                | `Futuro`, comando existe no console              | Registrar proposta/iniciativa                   |
| Triagem       | `/triage`                | `Futuro`, comando existe no console              | Perguntas, matcher, contratos                   |
| Gates         | `/gates`                 | `Futuro`, comando existe no console              | Aprovar/descartar/promover                      |
| Execucao      | `/work`                  | `UI real/read-only` na demo                      | Lista operacional de trabalho                   |
| Fontes        | `/sources`               | `UI real/parcial`                                | Repos/pastas/contextos/capabilities             |
| Contratos     | `/contracts`             | `Futuro`, API/grafo existem                      | Coordenar contratos cross-repo                  |
| Resultados    | `/results`               | `UI real/read-only` na demo                      | Outcomes, actual, dashboards                    |
| Operacao      | `/operations`            | `Demo/read-only` no Console                      | Incidentes, standalone, SLO                     |
| Auditoria     | `/audit`                 | `Console tecnico`                                | Event-log, decisoes, policy                     |
| Integracoes   | `/integrations`          | `Futuro` como rota dedicada; parcial em settings | Descobrir, comparar, conectar e testar adapters |
| Assistente    | `/assistant` ou settings | `UI parcial`                                     | Ollama/cloud/modelos/policy                     |
| Cup/CWP       | overlay transversal      | `Futuro`                                         | Ajuda contextual por tela                       |

### 5.1 Mapa de governanca (`/map`)

**Estado atual:** tela read-only da demo com `/api/map/governance`, TanStack
Query, React Flow + ELK, seletor de objetivo, busca, filtros por tipo/confianca/
risco, filtro de contrato, foco de vizinhanca e painel de detalhe. Workspace
novo responde vazio honesto ate existir governance host publicado.

**Ainda falta:** visualizacao relacional opcional em ECharts graph, links de
acao governada por tipo de no e mapa para workspace real fora da demo.

## 6. Fluxo 0: primeiro acesso e conta local

### 6.1 Tela: Criar conta local (`/signup`)

**Objetivo:** permitir que uma pessoa comece a usar o app sem confundir identidade local com autoridade governada.

**Usuario ve:**

- explicacao curta: "Esta conta identifica voce neste app local; as permissoes reais sao configuradas por workspace";
- campos: nome, email opcional, idioma;
- aviso: conta local nao e autenticacao corporativa;
- acao primaria: `Criar e continuar`;
- opcoes de entrada:
  - `Continuar localmente`;
  - `Entrar com GitHub`;
  - `Entrar com Google`;
  - `Conectar provedor corporativo (OIDC)`;
  - `Usar demo acme`.

**Backend necessario:**

- `local-principal.create` ou use case equivalente;
- persistencia local file-first em `.local-state`;
- cookie/sessao local;
- leitura de usuario atual.

**Estado atual:**

- existe fluxo local de signup e sessao local.
- ainda nao ha auth real, aceite de termos, identity-provider, reset ou multi-device.

**Decisao vigente:**

- seguir [`APP-DECISIONS.md`](APP-DECISIONS.md) QRD-19.
- primeiros providers externos seguem [`APP-DECISIONS.md`](APP-DECISIONS.md) QRD-20: GitHub, Google / Google Workspace e OIDC generico avancado.
- signup local cria um `local-principal`, nao uma autoridade governada.
- `local-principal` basta para `local`/sandbox.
- `shared` exige pelo menos `local-auth`, convite e aceite explicito de membership/papeis.
- `controlled` exige `local-auth` endurecido ou identity-provider externo.
- login GitHub/Google autentica a pessoa, mas nao cria membership, authority, acesso a repos ou acesso a Drive/Gmail automaticamente.

### 6.2 Tela: Selecionar ou criar organizacao (`/organizations`)

**Objetivo:** deixar claro que uma pessoa pode ter varios workspaces: empresa, projeto pessoal, cliente, sandbox ou demo.

**Usuario ve:**

- lista de workspaces existentes;
- badge para demo;
- status do onboarding por workspace;
- botao `Criar workspace`;
- botao `Anexar demo acme`;
- explicacao: workspace e o limite de dados, fontes, membros, papeis e governanca.

**Campos para criar workspace:**

- nome;
- tipo: empresa, projeto pessoal, cliente, laboratorio/demo;
- uso esperado: governanca real, avaliacao, aprendizado;
- idioma;
- fuso horario;
- opcional: caminho do governance host se ja existir.

**Backend necessario:**

- `workspace.create`;
- `workspace.select`;
- `workspace.attachDemo`;
- storage por workspace;
- `last-workspace-id`.

**Estado atual:**

- criacao/selecao de organizacao existe.
- estado local foi limpo em 2026-07-05 para reiniciar a iteracao visual por
  signup -> onboarding -> settings.
- demo acme nao deve aparecer como realidade padrao, apenas quando anexada.

**Lacunas:**

- workspace pode vincular/criar governance host pela API e pela secao de
  configuracoes; a validacao visual do fluxo ainda precisa acontecer.
- nao ha importacao de workspace existente.
- nao ha exclusao/arquivamento de workspace.

## 7. Fluxo 1: onboarding da organizacao

O onboarding precisa ser um fluxo funcional, nao apenas informativo. Ao final, ele deve gravar uma configuracao minima governada ou uma configuracao local explicitamente marcada como rascunho.

O onboarding tem dois caminhos:

- **Padrao guiado:** a pessoa responde perguntas de contexto; o app recomenda perfil, modo do workspace, execucao e adapters minimos. Nao pergunta banco/Docker/Neo4j como primeira camada.
- **Avancado:** a pessoa tecnica pode ajustar `execution-mode`, `operational-store`, `graph-read-model`, auth, fontes, assistente e integracoes. O app valida compatibilidade e mostra requisitos/riscos.

### 7.1 Etapa: Boas-vindas

**Objetivo:** estabelecer o contrato do framework.

**Usuario ve:**

- "Seus arquivos continuam sendo a fonte";
- "Integracoes ajudam, mas nao substituem o estado autoritativo";
- "Assistente sugere, voce decide";
- "Quando faltar independencia, o app mostra a limitacao em vez de esconder".

**Backend necessario:**

- nenhum backend alem de leitura de workspace.

**Estado atual:**

- existe UI.

### 7.2 Etapa: Diagnostico do perfil de governanca

**Objetivo:** guiar a escolha do perfil de governanca sem exigir que a pessoa conheca `full`, `compact`, `trio` ou `solo`.

Esta etapa responde: **como as decisoes e responsabilidades se dividem?**

Ela nao deve escolher automaticamente onde o app roda, como autentica, qual banco usa ou quais ferramentas conecta. Isso e `workspace-mode` + adapters, conforme [`APP-DECISIONS.md`](APP-DECISIONS.md) QRD-14.

**Decisao vigente:** seguir [`APP-DECISIONS.md`](APP-DECISIONS.md) QRD-23 e [`POLICY-HANDBOOK.md`](POLICY-HANDBOOK.md). `compact` avisa/revisa por default, mas bloqueia perda de auditoria, aumento de trust sem prova, reducao de seguranca e publicacao enganosa no rollup.

**Perguntas sugeridas:**

1. Quantas pessoas participam da governanca?
   - so eu;
   - 2 a 5;
   - 6 a 20;
   - mais de 20.
2. As pessoas que decidem sao diferentes das que executam/atestam?
   - sim, normalmente;
   - as vezes;
   - nao.
3. Existe aprovador de seguranca/egress separado?
   - sim;
   - ainda nao;
   - nao se aplica.
4. O app deve bloquear acumulacao sensivel ou registrar e revisar depois?
   - registrar com transparencia;
   - avisar e revisar depois;
   - bloquear ate outra pessoa aprovar.

**Recomendacao deve mostrar:**

- perfil recomendado;
- por que;
- o que o app vai fazer;
- o que o app nao vai fazer;
- riscos visiveis;
- o que muda se a regra de acumulacao sensivel mudar.

**Backend necessario:**

- `profile.recommend` pode ser puro/derivado;
- `profile-declaration.save`;
- policy efetiva por workspace;
- impacto de enforcement calculavel.
- policy explanation vinculada a `POLICY-HANDBOOK.md`.

**Estado atual:**

- UI existe e melhorou.
- `profile-declaration.save` existe via `/api/local/onboarding/profile` e e
  chamado ao avancar/concluir a etapa.
- recomendacao ainda e principalmente view-model e precisa ser validada contra
  a experiencia real do usuario no app.

**Lacuna critica:**

- a persistencia existe, mas a validacao visual precisa provar que onboarding,
  Home e Settings mostram o mesmo perfil e a mesma regra de acumulo sensivel.

### 7.3 Etapa: Modo do workspace

**Objetivo:** escolher a postura operacional do workspace sem prender a pessoa a uma ferramenta especifica.

Esta etapa responde: **quao compartilhado e verificavel este workspace precisa ser?**

**Opcoes:**

| Modo         | Copy humana      | Uso                                                          |
| ------------ | ---------------- | ------------------------------------------------------------ |
| `local`      | Local/individual | uma pessoa, avaliacao local ou sandbox                       |
| `shared`     | Compartilhado    | mais de uma pessoa acessa e opera o mesmo workspace          |
| `controlled` | Controlado       | acesso, egress e auditoria precisam de controles mais fortes |

**Usuario ve:**

- recomendacao baseada nas respostas anteriores;
- botao para trocar de modo;
- botao `Ajustar opcoes avancadas`;
- o que o modo garante;
- o que ele nao garante;
- quais adapters sao compativeis;
- quais escolhas aumentam ou reduzem friccao;
- aviso claro quando uma empresa escolhe `local` apenas para avaliacao;
- aviso claro quando uma pessoa solo escolhe `controlled` e aceita mais configuracao.

**Backend necessario:**

- `workspace-mode.save`;
- validacao de requisitos minimos por modo;
- lista de adapters compativeis por categoria;
- status de cada requisito: satisfeito, pendente, dispensado com justificativa.

**Estado atual:**

- o conceito esta decidido em QRD-14.
- APIs para `workspace-mode` e `workspace-stack` existem.
- a UI ainda nao separa explicitamente `governance-profile`, `workspace-mode`
  e adapters no caminho padrao validado visualmente.

**Lacuna critica:**

- sem este eixo, o onboarding tende a misturar tamanho do time com seguranca, identidade e ferramentas.

### 7.4 Etapa: Opcoes avancadas de execucao e dados

**Objetivo:** permitir que pessoas tecnicas escolham como o app roda e quais stores/read-models usa, sem impor essa decisao ao usuario comum.

Esta etapa responde: **como este workspace sera executado, persistido e projetado?**

**Nao aparece por default** no caminho padrao. Deve ficar atras de `Ajustar opcoes avancadas`.

**Usuario ve:**

- stack recomendada pelo caminho padrao;
- `execution-mode`: `local-process`, `docker-compose`, `self-hosted-server`;
- `operational-store`: `files`, `sqlite`, `postgres`;
- `graph-read-model`: `none`, `file-export`, `neo4j`;
- `identity-provider`: `none`, `local-auth`, `github-oauth`, `google-oidc`, `oidc`, `gitlab-oauth`, `bitbucket-oauth`;
- `work-source`: `local-folder`, `git-local`, `github`, `gitlab`, `bitbucket`, `gitea`, `manual`;
- `assistant`: `none`, `ollama`, `openai-compatible`, `cloud-approved`;
- impacto de cada escolha;
- requisitos locais: Docker instalado, porta livre, backup, credenciais, policy de egress;
- riscos/degradacoes quando a escolha nao atende totalmente o `workspace-mode`.

**Copy obrigatoria:**

- `Neo4j e um read-model de grafo. Ele ajuda a explorar relacoes, impacto e dependencia, mas nao vira fonte autoritativa por padrao.`
- `Neo4j pode ser habilitado ja no primeiro release pelo modo avancado. Se estiver desligado, o app continua funcionando com grafo simples/exportado.`
- `SQLite e simples para uso local ou servidor unico. Para multiusuario robusto, Postgres pode ser mais adequado.`
- `Docker padroniza o ambiente do workspace. Sem Docker, ha menos friccao, mas mais risco de diferenca entre maquinas.`
- `Ollama e externo por padrao. Se voce ja roda um assistente local, o app conecta. Se preferir, o Docker Compose pode gerar um servico opcional desligado por default.`

**Backend necessario:**

- `workspace-stack.recommend`;
- `workspace-stack.save`;
- validacao de compatibilidade;
- `graph-read-model.configure`;
- health check de Neo4j quando escolhido;
- rebuild/export do grafo com `sourceRevision`;
- freshness/staleness do read-model;
- health checks por adapter escolhido;
- status de requisitos: satisfeito, pendente, dispensado com justificativa.

**Estado atual:**

- decidido em QRD-15.
- exemplos de backend existem para file/sqlite/neo4j/mongo, mas a UI ainda nao tem configuracao de stack.
- Neo4j existe como read-model/export/loader dry-run, nao como store transacional padrao.
- decisao vigente: Neo4j deve ser opcao suportada no primeiro release como `graph-read-model`, conforme [`APP-DECISIONS.md`](APP-DECISIONS.md) QRD-16.
- APIs de stack existem no shell local, mas a experiencia humana ainda precisa
  ser iterada e validada.

**Lacuna critica:**

- se essa etapa nao existir, a configuracao tecnica fica implicita e a pessoa nao entende por que o app recomendou SQLite, Docker, Postgres ou Neo4j.
- se Neo4j entrar sem `sourceRevision` e stale-check, o read-model pode virar segundo SSOT por acidente.

### 7.5 Etapa: Pessoas e papeis

**Objetivo:** cadastrar sujeitos de governanca primeiro, depois atribuir papeis com aceite, escopo e policy.

**Decisao vigente:** seguir [`APP-DECISIONS.md`](APP-DECISIONS.md) QRD-10, QRD-11 e QRD-19. Account/principal, membership, role assignment e authority sao conceitos diferentes. Papeis podem ser atribuidos a pessoas, times, grupos, service accounts e grupos externos; authority efetiva e sempre derivada.

**Regra de entrada:** convite nao substitui conta. Toda pessoa convidada precisa
criar ou usar uma conta no app (`/signup`) antes de aceitar membership e papeis
na organizacao. O convite pode carregar token/codigo, workspace alvo e papeis
propostos, mas so vira membership efetiva depois que um principal local
autenticado aceita o convite. Login externo futuro (GitHub, Google, OIDC) pode
autenticar a pessoa; nao concede authority governada automaticamente.

**Usuario ve:**

- lista de pessoas do workspace;
- lista de times, grupos e service accounts quando existirem;
- para cada pessoa: nome, email/identificador, status de convite, status de membership, papeis atribuidos;
- papeis diretos e herdados;
- origem da autoridade: direta, team, group, external-group;
- botao `Convidar pessoa`;
- botao `Reenviar convite`;
- botao `Revogar convite`;
- botao `Criar time/grupo local`;
- botao `Adicionar eu mesmo`;
- painel de acumulacoes sensiveis detectadas;
- painel de pendencias de aceite de papeis;
- painel de acesso efetivo: o que a pessoa pode ver/fazer e por que;
- explicacao do que cada papel permite e nao permite.

**Papeis iniciais:**

- administrador do workspace;
- sponsor/aprovador de governanca;
- responsavel financeiro;
- responsavel de seguranca/egress;
- responsavel tecnico;
- owner de fonte/repo;
- definidor de meta;
- atestador de actual/outcome;
- auditor/leitor.

**Backend necessario:**

- `member.invite`;
- `member.accept`;
- `member.reject`;
- `member.disable`;
- `invite.revoke`;
- `invite.resend`;
- `team.create`;
- `group.create`;
- `subject.addToGroup`;
- `subject.removeFromGroup`;
- `role.assign`;
- `role.accept`;
- `role.reject`;
- `role.revoke`;
- `authority.resolve`;
- `accessPolicy.evaluate`;
- `membership.resolve`;
- deteccao de SoD/acumulacao por profile.
- expiracao de convite local.
- owner humano, escopo e TTL para service accounts.

**Estado atual:**

- ha modelagem parcial de roles/authority e UI de papeis.
- nao ha convite real, aceite, revogacao, status de membro ou contrato de permissoes em produto.

**Requisitos do primeiro release funcional:**

- implementar convite local primeiro: convite gera token/codigo local e status `pending`; email/cloud fica para adapter futuro.
- fluxo de aceite de convite passa por `/signup` quando a pessoa ainda nao tem conta local.
- convite aceito vincula o token a um principal local e cria membership; papel proposto continua exigindo aceite separado quando aplicavel.
- implementar groups/teams locais simples no mock-api e backend antes de identity-provider externo, para a UI nascer compativel com empresa maior.
- papel atribuido a outra pessoa entra como `proposed` e so vira efetivo com aceite do sujeito.
- em `shared`, membership efetiva exige convite aceito.
- em `controlled`, identity-provider externo pode autenticar a pessoa, mas nao cria authority governada automaticamente.
- GitHub e Google entram como primeiros providers externos de produto; OIDC generico fica no caminho avancado.
- GitHub App/repos e Google Drive/Gmail/Calendar nao sao concedidos pelo login.
- service account exige owner humano, escopo e TTL.

### 7.6 Etapa: Governance host

**Objetivo:** escolher onde mora o SSOT file-first daquele workspace.

**Decisao vigente:** seguir [`APP-DECISIONS.md`](APP-DECISIONS.md) QRD-08, QRD-09 e QRD-21. Workspace pode existir sem host, mas onboarding real nao conclui sem governance host ou sandbox explicito. Os tres formatos de host sao suportados desde o primeiro release; a escolha e guiada por fit-check, nao por tamanho da organizacao.

**Opcoes:**

- host embutido em repo existente: `repo/.governance-host/`;
- host em pasta local: `workspace-slug-governance/` sem Git obrigatorio;
- host em repo dedicado: `workspace-slug-governance/` como repo Git proprio;
- somente demo/rascunho local por enquanto.

**Usuario ve:**

- diferenca entre host de governanca e fontes de trabalho;
- aviso: sem governance host, o app nao consegue governar de verdade;
- perguntas de fit:
  - governar este repo, varios repos ou apenas experimentar;
  - se quem escreve codigo tambem pode escrever governanca;
  - se governanca precisa de PR/CI/review proprio;
  - se o repo atual e monolito central;
  - se decisoes de governanca devem viver junto do codigo ou em espaco proprio;
- recomendacao com razao visivel;
- seletor de caminho local;
- validacao de permissao de escrita;
- validacao de CODEOWNERS/review para `.governance-host/` quando houver Git;
- aviso de colaboracao/auditoria rebaixadas para pasta local sem Git;
- preview dos arquivos que serao criados.

**Backend necessario:**

- `governanceHost.create`;
- `governanceHost.link`;
- `governanceHost.validate`;
- scaffold minimo;
- base-revision inicial;
- lock/event-log.
- `sourceRevision` inicial;
- persistencia de `host-distribution` e `fit-reason`;
- lint de risco por distribuicao.

**Estado atual:**

- runtime file-first existe na demo acme.
- workspace novo pode executar fit-check, criar/scaffoldar, vincular host ou
  declarar sandbox via `/api/local/governance-host`.
- a secao de configuracoes expoe os tres formatos; a validacao visual do fluxo
  completo ainda precisa acontecer.

**Lacuna critica:**

- sem validacao visual desta etapa, organizacoes novas podem continuar parecendo
  vazias mesmo quando o backend ja consegue criar/vincular o host.

### 7.7 Etapa: Fontes de trabalho

**Objetivo:** conectar repos, pastas ou outras fontes que representam onde o trabalho acontece.

**Nao usar copy "repositorios opcionais" sem qualificacao.**

**Decisao vigente:** seguir [`APP-DECISIONS.md`](APP-DECISIONS.md) QRD-22. Fonte sem Git e suportada desde o primeiro release como fonte real rebaixada, com `sourceTrust` explicito. Pasta local sincronizada com cloud nao e automaticamente versionada/auditada.

**Usuario ve:**

- explicacao: sem fonte, ainda da para planejar e registrar, mas execucao, contratos e outcomes ficam com evidencia manual;
- opcoes de fonte:
  - Git local;
  - pasta local sem Git;
  - pasta sincronizada com cloud;
  - Google Drive / Google Workspace;
  - Figma;
  - SharePoint / OneDrive;
  - Dropbox / Box;
  - Notion / Confluence;
  - upload/export manual;
  - monorepo com modulos;
  - backlog externo;
  - observabilidade/metrica;
  - CI/code quality;
  - API/schema registry.
- botao `Adicionar fonte`;
- teste de leitura;
- deteccao de pasta sincronizada quando possivel;
- nivel de confianca da fonte:
  - `snapshot-only`;
  - `cloud-sync-unverified`;
  - `provider-versioned`;
  - `provider-audited`;
  - `declared`;
  - `untrusted`;
- aviso do que a fonte prova e nao prova;
- scaffold `.governance` quando aplicavel;
- capacidades detectadas;
- pendencias de revisao humana.

**Backend necessario:**

- `workSource.add`;
- `workSource.scan`;
- `workSource.publishContext`;
- `workSource.detectCloudSync`;
- `workSource.captureSnapshot`;
- `workSource.resolveProviderRevision`;
- `workSource.resolveSourceTrust`;
- `capability.extractDraft`;
- `capability.ownerAttest`;
- `repoWork.publishAck`;
- `contractRegistry.publish`.

**Estado atual:**

- existem ferramentas CLI e adapters `git-local`, `ci-local`, `code-quality`, `observability`.
- `/sources` permite adicionar fontes por fluxo guiado, registrar snapshot pelo
  navegador e escanear caminho acessivel pelo processo do app.
- Settings reaproveita o mesmo componente de fontes.
- ainda nao ha produto para Google Drive/Figma/OneDrive/Dropbox/Notion/Confluence como provider-versioned.
- `sourceTrust` aparece por fonte, incluindo `snapshot-only`,
  `cloud-sync-unverified`, `declared` e estados derivados do scan.

**Lacuna critica:**

- a UI de fontes foi reformulada, mas ainda precisa ser validada visualmente a
  partir de workspace limpo.
- a tela ainda nao publica `context.json`, nao abre capability review e nao
  conecta GitHub/OAuth de verdade.

### 7.8 Etapa: Assistente e modelo

**Objetivo:** configurar um assistente local ou cloud para ajudar em explicacoes, triagem, matcher e extracao, sem vazar dados.

**Usuario ve:**

- pergunta inicial: `Como voce quer usar assistente?`;
- opcoes:
  - `Usar assistente local ja instalado`;
  - `Configurar assistente local pelo workspace`;
  - `Conectar gateway/provedor aprovado`;
  - `Continuar sem assistente`;
- deteccao de provedores locais comuns:
  - Ollama `localhost:11434`;
  - LM Studio `localhost:1234`;
  - Jan `localhost:1337`;
  - GPT4All `localhost:4891`;
  - LocalAI `localhost:8080`;
- primeiro preset recomendado: Ollama/local;
- alternativas: LM Studio, Jan, GPT4All, LocalAI, llama.cpp/vLLM, LiteLLM, OpenAI-compatible, cloud providers aprovados;
- endpoint;
- modelo;
- capacidades provadas do provider/modelo:
  - chat;
  - JSON estruturado;
  - tool/function calling;
  - embeddings;
  - rerank;
  - vision;
  - streaming;
  - context window;
- classificacao maxima permitida;
- politica de egress;
- botao `Testar conexao`;
- resultado do teste;
- resultado de `capability probe`;
- aviso quando o endpoint nao e loopback;
- explicacao: assistente nao decide, apenas sugere.

**Backend necessario:**

- `assistant.configure`;
- `assistant.health`;
- `assistant.discoverModels`;
- `assistant.capabilityProbe`;
- `assistant.testPrompt` com prompt inocuo;
- redaction;
- egress policy;
- audit log de sugestoes;
- allowlist por workspace/profile.
- Compose profile opcional para Ollama, desligado por default;
- confirmacao explicita antes de baixar modelo.

**Estado atual:**

- existe adapter `assistant-ollama` e APIs de health/advisory/configuracao.
- onboarding consegue persistir assistente local ou dispensa de assistente por
  workspace; provider cloud ainda exige aprovacao/egress e nao deve ser salvo
  como ativo sem policy.
- configuracao salva no shell local ainda nao equivale a policy governada
  completa para matcher/extracao.
- Docker Compose para Ollama ainda nao e gerado pela UI.
- nao ha ainda adapter generico `assistant-openai-compatible` como produto de configuracao.
- capabilities do provider/modelo ainda nao alimentam matcher/extracao de forma visivel.

**Lacuna critica:**

- ligar a UI ao adapter real e gravar configuracao por workspace.
- gerar perfil opcional `assistant` no Compose sem ativar ou baixar modelo automaticamente.
- impedir que um provider conectado seja tratado como apto para matcher/embedding sem capability probe.

### 7.9 Etapa: Integracoes

**Objetivo:** apresentar integracoes como aceleradores opcionais, sem fazer a
pessoa acreditar que o framework depende delas ou que uma ferramenta externa
vira SSOT/authority automaticamente.

**Decisao vigente:** seguir [`APP-DECISIONS.md`](APP-DECISIONS.md) QRD-26 e
QRD-33, alem de [`../integration-catalog.yml`](../integration-catalog.yml). A
primeira integracao cloud real alem de auth e GitHub como work-source/repo
provider. Login GitHub e conexao de repos sao fluxos separados.

**Superficies de integracao:**

| Superficie                     | Papel                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| Onboarding                     | sugerir poucas integracoes iniciais, sem obrigar decisao tecnica                       |
| `/integrations`                | hub dedicado para descobrir, comparar, conectar, testar, desativar e auditar providers |
| Settings                       | resumo e manutencao das integracoes ja relevantes ao workspace                         |
| Sugestoes contextuais por tela | mostrar a integracao certa no momento em que ela melhora o fluxo                       |
| Cup/CWP                        | explicar valor, risco, permissao, egress e alternativa sem integracao                  |

**Categorias iniciais:**

- assistant runtime;
- knowledge assistant;
- git provider;
- CI/status;
- code quality;
- observability;
- metric/BI;
- API/schema/contracts;
- backlog/importer;
- identity provider;
- deploy/release evidence;
- docs/knowledge.

**Usuario ve no onboarding:**

- "Voce pode comecar sem integracoes externas";
- 2-4 recomendacoes maximas de acordo com o caminho escolhido;
- o que ficara manual/rebaixado se a pessoa pular;
- link para `/integrations` como "ver todas as opcoes".

**Usuario ve em `/integrations`:**

- o que o framework ja entrega sem a integracao;
- o que a integracao melhora;
- se escreve estado autoritativo ou apenas evidencia/projecao;
- dados acessados;
- permissoes exigidas;
- quem pode solicitar;
- quem aprova/ativa;
- riscos e limitacoes;
- como falha;
- como testar conexao;
- como desativar;
- botao `Configurar`, `Testar`, `Solicitar aprovacao`, `Ver em breve`,
  `Desativar` ou `Nao usar`.

**Contrato de card de integracao:**

| Campo                         | Obrigatorio | Exemplo de copy                                                               |
| ----------------------------- | ----------- | ----------------------------------------------------------------------------- |
| O que o framework ja entrega  | sim         | "Sem GitHub, voce pode cadastrar pasta local; a confianca fica limitada."     |
| O que esta integracao melhora | sim         | "Le repos, branches, CODEOWNERS, PRs/checks e source revisions."              |
| Dados acessados               | sim         | "Repos selecionados, metadata de PR/check e arquivos permitidos."             |
| Permissoes exigidas           | sim         | "OAuth/App com leitura de repos selecionados."                                |
| Quem pode solicitar           | sim         | "`workspace-admin`, `source-owner` ou `technical-owner`."                     |
| Quem aprova/ativa             | sim         | "`source-owner`; `security-owner` quando houver cloud/controlled."            |
| Riscos/limitacoes             | sim         | "Login GitHub nao concede authority governada nem conecta repos sozinho."     |
| Como falha                    | sim         | "Sem permissao/revision/API, fica `limited` ou `blocked`, nunca `connected`." |
| Como testar                   | sim         | "Health/probe + leitura de repos permitidos + sourceRevision."                |
| Como desativar                | sim         | "Revogar provider e manter historico/auditoria da conexao anterior."          |
| Escreve estado autoritativo?  | sim         | "Nao, exceto adapter-contract explicito com sponsor/security."                |

**Status que a UI deve usar:**

| Status         | Significado                                                                   |
| -------------- | ----------------------------------------------------------------------------- |
| `disponivel`   | mecanismo executavel existe no backend/local adapter                          |
| `configuravel` | pode ser configurada, mas ainda precisa de health/probe/permissao para ativar |
| `limited`      | conectada, mas sem capability suficiente para uma funcao                      |
| `release-1`    | compromisso de primeira release; ainda pode estar em implementacao            |
| `em-breve`     | backlog priorizado no catalogo, sem mecanismo ativo                           |
| `adiado`       | classe conhecida, mas risk-gated ou fora do caminho padrao                    |
| `bloqueado`    | policy/egress/authority impede ativacao naquele workspace                     |
| `desativado`   | ja foi configurada, mas esta desligada ou revogada                            |

**Matriz de autoridade resumida:**

| Tipo de integracao                         | Quem pode solicitar                                  | Quem aprova/ativa                                                      |
| ------------------------------------------ | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| Interesse/backlog futuro                   | qualquer `member`                                    | nao ativa mecanismo                                                    |
| Local sem egress e baixo risco             | `workspace-admin`, `technical-owner`, `source-owner` | `workspace-admin` ou self-governed no solo                             |
| Fonte de trabalho/repo                     | `workspace-admin`, `source-owner`, `technical-owner` | `source-owner`/`technical-owner`; `security-owner` se controlled       |
| Assistente local loopback                  | `workspace-admin`                                    | `workspace-admin`; `security-owner` se policy exigir                   |
| Assistente remoto/cloud                    | `workspace-admin`                                    | `security-owner` obrigatorio; sponsor se dado sensivel/controlled      |
| Identity provider / SSO                    | `workspace-admin`, `sponsor`                         | `sponsor` + `security-owner`                                           |
| Backlog importer                           | `workspace-admin`, `product-owner`, `sponsor`        | `sponsor` ou `workspace-admin` + contrato de sync                      |
| Observabilidade/analytics/BI               | `technical-owner`, `metric-owner`, `attester`        | `metric-owner` + `security-owner` se cloud                             |
| CI/code quality/security                   | `technical-owner`, `source-owner`                    | `technical-owner`; `security-owner` se codigo privado sair do ambiente |
| Deploy/release/incident                    | `technical-owner`, `operations-owner`                | `operations-owner` + `security-owner` se cloud                         |
| Presentation adapter Pro/BYOL              | `workspace-admin`, `technical-owner`                 | `workspace-admin`; `cost-owner` se houver custo                        |
| Integracao que escreve estado autoritativo | `sponsor` ou `workspace-admin`                       | `sponsor` + `security-owner` + adapter-contract explicito              |

No perfil `solo`, solicitacao e aprovacao podem colapsar, mas o app deve
mostrar `self-governed`/`auto-declarado` quando isso afetar independencia.

**Alerta de backlog visivel:**

```text
Integracoes disponiveis em breve: GitLab, Bitbucket, OpenAPI/GraphQL, Jira/Linear, BigQuery/dbt, PostHog/Amplitude, PagerDuty, SonarQube/Semgrep e Backstage.
```

Esse alerta deve sempre vir acompanhado de uma frase de honestidade:

```text
Em breve significa backlog priorizado, nao mecanismo ativo. O app mostra o que ja funciona sem cada integracao.
```

**Backend necessario:**

- `integration.list`;
- `integration.configure`;
- `integration.test`;
- `integration.disable`;
- status por workspace;
- authority/egress decision por integracao;
- capability probe quando aplicavel;
- evidence provider feed.

**Estado atual:**

- catalogo versionado existe.
- adapters executaveis existem para alguns itens.
- APIs locais existem para backlog e status basico.
- UI de settings mostra catalogo, mas nao existe rota `/integrations` dedicada.
- sugestoes contextuais por tela ainda nao existem como produto.

**Decisao pendente:**

- contrato exato de permissoes GitHub App/OAuth para work-source.
- design da rota `/integrations`.
- quais integracoes aparecem como recomendadas no onboarding guiado.

**Recomendacao de corte inicial:**

1. GitHub work-source/repo provider;
2. Ollama/OpenAI-compatible assistant providers;
3. Git local;
4. CI local;
5. Code quality local/Sonar-compatible;
6. Observability fixture/local;
7. Neo4j read-model.

### 7.10 Etapa: Revisao e conclusao

**Objetivo:** deixar claro o que esta configurado, o que esta faltando e qual degradacao existe.

**Usuario ve:**

- perfil escolhido;
- pessoas/papeis;
- governance host;
- fontes conectadas;
- assistente;
- integracoes;
- pendencias;
- riscos visiveis;
- botao `Finalizar onboarding`;
- botao `Salvar rascunho`.

**Backend necessario:**

- `onboarding.saveDraft`;
- `onboarding.complete`;
- validacao minima por workspace;
- status `not-started | partial | finished | blocked`;
- lista de pendencias derivada.

**Estado atual:**

- status do onboarding persiste, incluindo passo parcial para retomada.
- perfil, regra de acumulo sensivel, fontes declaradas/snapshot e assistente
  local/dispensado persistem por comando.
- pessoas/papeis, governance host, stack e integracoes ja tem APIs, mas a
  experiencia visual precisa ser iterada e conferida contra Settings.

## 8. Home operacional (`/`)

**Objetivo:** responder "o que eu preciso fazer agora?" sem expor console tecnico.

**Usuario ve:**

- workspace atual;
- perfil de governanca;
- ciclo atual;
- proximo passo seguro;
- pendencias que precisam de acao humana;
- atalhos por tarefa;
- progresso de configuracao;
- dados de confianca: valido, pendente, sem evidencia, auto-declarado, break-glass, stale;
- card para continuar onboarding quando parcial.

**Atalhos:**

- configurar organizacao;
- conectar fontes de trabalho;
- planejar ciclo;
- registrar iniciativa;
- acompanhar resultados;
- resolver pendencias;
- auditar decisoes;
- abrir console tecnico.

**Backend necessario:**

- `home.summary`;
- `workspace.configStatus`;
- `queue.list`;
- `dashboard.summary`;
- `trust.badges`;
- `nextStep.derive`.

**Estado atual:**

- Home existe e mostra dados derivados para demo.
- workspace novo ainda e vazio/honesto, mas pouco acionavel.
- varios atalhos levam a telas parciais ou console.

**Lacuna:**

- Home precisa virar roteador funcional para tarefas reais, nao painel de demo.

## 9. Configuracoes (`/settings`)

### 9.1 Organizacao

**Deve permitir:**

- editar nome, tipo e locale do workspace;
- ver e alterar perfil de governanca via comando;
- ver impacto da mudanca de perfil;
- registrar aprovador quando mudanca reduz controle;
- manter historico de mudancas.

**Estado atual:**

- tela existe;
- alteracao de perfil esta desabilitada ou local.

**Backend pendente:**

- `workspace.update`;
- `profile-declaration.change`;
- `profile-change.approve`.

### 9.2 Pessoas e papeis

**Deve permitir:**

- listar pessoas;
- listar times, grupos e service accounts;
- convidar pessoa;
- reenviar/invalidar convite;
- atribuir papeis por pessoa;
- atribuir papeis por subject (`person`, `team`, `group`, `service-account`, `external-group`);
- aceitar/rejeitar papel proposto;
- mostrar papeis herdados;
- explicar por que um subject tem acesso ou autoridade;
- detectar acumulacoes sensiveis;
- explicar consequencia do acumulo por perfil;
- exigir aceite quando necessario.

**Estado atual:**

- backend real existe para convite local, aceite tokenizado, revogacao, status de membro,
  membership `principal -> person`, atribuicao de papeis por subject e authority derivada;
- Settings ja lista pessoas/times/grupos, cria e revoga convite, atribui papel proposto e mostra
  authority efetiva derivada;
- ainda falta uma tela/fluxo humano dedicado para aceite de convite por outra conta, aceite de
  membership/papel pela pessoa convidada e explicacao visual completa de autoridade herdada.

**Backend pendente:**

- access-policy por workspace para restringir quem pode convidar, propor papel e alterar grupos;
- integracao futura com identity-provider real para substituir a sessao local nao assinada.

### 9.3 Fontes de trabalho

**Deve permitir:**

- adicionar fonte;
- remover/arquivar fonte;
- testar leitura;
- publicar contexto;
- ver freshness;
- abrir pacote de capability review;
- ver drift e pendencias de attestation.

**Estado atual:**

- `/sources` existe como fluxo guiado de produto para projeto local, pasta,
  fonte sincronizada, monorepo/modulo, fonte cloud/manual e GitHub futuro.
- o fluxo salva fonte declarada, registra snapshot de navegador quando o
  browser nao revela path completo e executa scan quando o caminho e acessivel
  ao processo do app.
- Settings reutiliza o mesmo componente para evitar divergencia entre
  onboarding/configuracoes/sources.
- ainda faltam remover/arquivar fonte, publish de `context.json`, capability
  review e conexao provider-versioned real.

### 9.4 Assistente/modelo

**Deve permitir:**

- escolher provedor;
- configurar endpoint/modelo;
- testar conexao;
- definir classificacao maxima;
- aprovar egress cloud;
- ver historico de sugestoes;
- desativar assistente.

**Estado atual:**

- backend do Ollama existe;
- onboarding salva provider local testado ou dispensa de assistente;
- UI de configuracao ainda precisa expor historico, capability probe,
  defaults por funcao e aprovacao de egress cloud.

### 9.5 Integracoes

**Deve permitir:**

- ver catalogo;
- filtrar por categoria;
- configurar;
- testar;
- ver ultima execucao;
- ver evidencia produzida;
- desativar;
- marcar futura feature.

**Estado atual:**

- catalogo e adapters existem parcialmente;
- UI ainda e majoritariamente informativa.

### 9.6 Avancado

**Deve permitir:**

- ver source revision;
- abrir console tecnico;
- exportar read-model;
- verificar backends derivados;
- ver event-log;
- abrir diagnostics;
- rodar checks locais seguros.

**Estado atual:**

- console tecnico existe.

## 10. Planejamento de ciclo (`/planning`)

**Objetivo:** criar e acompanhar o business-tier sem virar um sistema completo de OKR/portfolio.

**Decisao vigente:** seguir [`APP-DECISIONS.md`](APP-DECISIONS.md) QRD-25. O caminho guiado exige apenas o minimo para criar um ciclo utilizavel, mas `thesis`, `opportunity-area` e `allocation` ficam disponiveis desde a release 1 como contexto opcional progressivo.

**Telas necessarias:**

1. **Ciclos**
   - criar periodo;
   - encerrar periodo;
   - continuar/split/merge objetivos do ciclo anterior.
2. **Objetivos**
   - criar business-objective recursivo;
   - nivel configuravel;
   - owner;
   - periodo;
   - cascades-to/cascades-from.
3. **Metricas**
   - criar metric-definition;
   - owner da metrica;
   - fonte;
   - unidade;
   - agregacao.
4. **Targets**
   - definir target por periodo;
   - expected tipado;
   - definidor;
   - atestador;
   - regra de independencia;
   - vinculo com allocation/budget quando aplicavel.
5. **Teses e oportunidades**
   - criar thesis;
   - vincular opportunity-area;
   - autorizar intents.
6. **Allocation**
   - registrar capacidade/budget reservado;
   - owner da alocacao;
   - periodo;
   - vinculo com objective/target;
   - impacto em dashboards quando aplicavel.

**Backend necessario:**

- comandos para objectives, metrics, targets, thesis, opportunity-area, allocation;
- resolver de rollover;
- resolver de independence target-definer vs actual-attester;
- dashboard rollup.

**Estado atual:**

- dados existem na demo acme.
- app mostra parte em dashboard/console.
- nao ha tela de planejamento funcional para workspace novo.

**Recomendacao de UX:**

- caminho guiado: pedir period + objective + metric-definition + target + owner/definer;
- secoes progressivas: permitir thesis, opportunity-area e allocation no mesmo fluxo sem bloquear conclusao;
- modo avancado: mostrar todos os campos desde o inicio;
- detalhes e dashboards: exibir causalidade/alocacao quando existirem e marcar quando estiverem ausentes.

## 11. Registro de iniciativa e intake (`/intake`)

**Objetivo:** permitir que negocio/produto/engenharia registre uma aposta ou necessidade sem exigir breakdown tecnico.

**Tela: Registrar iniciativa**

**Campos:**

- titulo;
- problema/oportunidade;
- objetivo/target autorizado;
- tipo de aposta: validar antes ou comprometer direto;
- sinal esperado;
- urgencia;
- contexto/anexos;
- duvidas abertas;
- classificacao;
- fonte: planned/reactive;
- solicitante;
- owner proposto.

**Backend necessario:**

- `proposal.create` ou `register.create`;
- anexos/link externo com policy;
- classificacao/secret scan;
- validacao de target autorizado.

**Estado atual:**

- `proposal.create` existe no backend/console.
- nao ha tela humana completa de intake.

**Lacunas:**

- anexos externos;
- prompt injection scan;
- link fetch policy;
- workflow de proposta ate triagem.

## 12. Triagem e matcher (`/triage`)

**Objetivo:** transformar registro em itens investigaveis, sugerir repos/contratos e preparar gate humano.

**Tela deve mostrar:**

- proposta/register;
- perguntas extraidas;
- disposicao de cada item: responder direto, exploration, falta info;
- matcher advisory;
- repos sugeridos;
- contratos relevantes;
- score;
- unknowns;
- evidencias;
- freshness de contextos;
- override humano com rationale;
- risco de egress/classificacao.

**Backend necessario:**

- `triage.save`;
- `matcher.run`;
- `assistant.suggestTriageQuestions`;
- `repoContext.search`;
- `contract.match`;
- audit de matcher.

**Estado atual:**

- `triage.save` existe.
- adapters de assistente existem parcialmente.
- matcher executavel completo ainda e lacuna.

**Decisao:**

- matcher deve ser multi-provider desde o contrato de produto;
- lexical deterministico e baseline local e auditavel;
- Ollama, OpenAI-compatible e cloud-approved podem complementar por funcao e por policy;
- toda sugestao aceita, rejeitada ou sobrescrita entra em auditoria.

## 13. Investigacao, explorations e discovery

**Objetivo:** permitir investigacao antes de compromisso.

**Tela deve permitir:**

- abrir exploration;
- timebox;
- owner;
- perguntas;
- repos/contratos investigados;
- evidencias;
- resultado: viable, not-viable, needs-more-info;
- supersedes/reopen append-only;
- promover achados para intent/breakdown.

**Backend necessario:**

- comandos de exploration/discovery;
- relacao com triage item;
- evidence attachments;
- lifecycle.

**Estado atual:**

- modelo conceitual cobre discovery/exploration.
- backend atual nao tem experiencia de produto para isso.

**Decisao:**

- entrar no primeiro release apenas se for necessario para validar triagem; caso contrario, triage pode abrir gate com itens simples.

## 14. Gate e ativacao (`/gates`)

**Objetivo:** decidir promover, descartar, devolver para triagem ou registrar excecao.

**Tela deve mostrar:**

- diff da proposta para intent;
- resultado da triagem;
- matcher recommendation vs decisao humana;
- evidencias;
- SoD;
- riscos;
- break-glass se aplicavel;
- botao `Promover`, `Descartar`, `Voltar para triagem`.

**Backend necessario:**

- `gate.decide`;
- `intent.activate`;
- append-only decision;
- authorization;
- base-revision.

**Estado atual:**

- comandos existem no backend/console.
- falta tela humana.

## 15. Intent, breakdown e execucao (`/work`)

**Objetivo:** acompanhar a iniciativa ativada ate suas pecas de execucao.

**Telas:**

1. **Intent detail**
   - objetivo;
   - target;
   - approach;
   - signal;
   - thesis;
   - decision-rule;
   - status;
   - owner;
   - outcomes esperados.
2. **Execution units**
   - experiment-run, migration-wave, feature-slice, incident-response, shape-up, cleanup, rollout-slice;
   - lifecycle;
   - verdict quando aplicavel.
3. **Repo-work**
   - repo;
   - purpose;
   - status;
   - ack local;
   - evidence;
   - source commit;
   - blocked/dropped/done.
4. **Breakdown editor**
   - adicionar/remover pecas;
   - validar contrato/repo;
   - dry-run;
   - aplicar via comando.

**Backend necessario:**

- `breakdown.apply`;
- `repo-work.ack`;
- `verdict.accept`;
- read-model por intent;
- resolver de done/outcome eligibility.

**Estado atual:**

- backend/comandos existem.
- `/work` existe como lista operacional read-only para a demo: busca
  `/api/work/items` com TanStack Query e renderiza TanStack Table + MUI +
  virtualizacao por `@tanstack/react-virtual`.
- UI de detalhe, editor de breakdown e acoes governadas ainda ficam fora da
  rota de produto.

**Lacuna:**

- falta transformar linhas em detalhe acionavel por tipo e ligar
  `breakdown.apply`, `repo-work.ack` e `verdict.accept` em fluxos humanos.

## 16. Fontes/repos/capabilities (`/sources`)

**Objetivo:** tornar visivel o que a organizacao sabe sobre cada fonte.

**Estado atual:** `/sources` existe como tela de produto. Ela primeiro explica a
relacao entre **pasta de governanca** (host do workspace, onde ficam decisoes,
configuracao e event-log) e **projetos/fontes de trabalho** (repos, pastas,
monorepos ou providers observados). A tela usa as APIs reais
`/api/local/work-sources`, `/api/local/work-sources/[id]/scan` e
`/api/local/work-sources/[id]/browser-scan`, reaproveita o mesmo componente em
Settings e cadastra fontes por comando/event-log do shell local.

A UX nao expoe `WorkSourceKind` como primeira decisao. Ela pergunta:

- projeto local ou projeto na nuvem;
- para local: projeto com Git, pasta sem Git, pasta ainda vazia/planejada,
  pasta sincronizada em nuvem, ou modulo de monorepo;
- para nuvem: GitHub, outro link/ferramenta externa, ou evidencia manual.

Repo Git local, pasta local, pasta sincronizada em nuvem e modulo de monorepo
podem usar duas entradas:

- **Selecionar pasta no Explorer:** cria snapshot no navegador (`snapshot-only`)
  com contagem de arquivos e hash de inventario; nao prova caminho absoluto,
  Git, autoria ou historico.
- **Modo avancado / caminho manual:** usa caminho acessivel pelo processo do app
  e executa scan local real (inventario/hash, Git head/dirty quando houver,
  deteccao de sync em nuvem quando possivel).

Fontes manuais e links externos entram como declaracao. GitHub redireciona para
integracoes; nao e campo de texto.

**Regra de produto:** caminho local nao e caminho do navegador; e caminho da
maquina/servidor onde o app esta rodando. Em uso solo local, isso normalmente e
a maquina da pessoa. Em uso compartilhado/controlled, o caminho precisa existir
no host do app ou vir de um provider conectado.

**Tela mostra por fonte hoje:**

- tipo;
- path/provider;
- status (`draft`, `connected`, `manual-evidence`);
- `sourceTrust` explicito;
- hash e contagem de arquivos do ultimo scan;
- Git head e arquivos alterados quando detectados;
- provider de sync em nuvem quando detectado;
- limitacoes e erros do scan.

**Acoes atuais:**

- adicionar fonte por fluxo guiado;
- registrar snapshot escolhido no Explorer;
- adicionar e escanear quando o tipo exige caminho;
- reescanear fonte existente;
- ver limitacoes de confianca sem precisar abrir console tecnico.

**Acoes futuras:**

- publicar contexto;
- preparar capability review;
- aprovar capability;
- remover capability;
- corrigir owner;
- abrir fonte no filesystem.

**Backend necessario:**

- repo-first adapters para publicar `context.json`;
- capability review;
- context publish;
- source health;
- adapters cloud (GitHub primeiro) com OAuth/permissao, sourceRevision e
  fail-closed.

**Lacunas:**

- a tela ainda nao publica `context.json`;
- nao abre filesystem diretamente;
- GitHub aparece como integracao pendente, nao como conectado;
- capabilities/owners/contratos derivados da fonte ainda dependem dos adapters
  repo-first existentes e da futura UI de capability review;
- scan de pasta local e evidencia util, mas nao prova autoria/historico sem Git
  ou provider versionado.

## 17. Contratos (`/contracts`)

**Objetivo:** coordenar interfaces compartilhadas entre repos e iniciativas.

**Tela deve mostrar:**

- contratos;
- owner/provider;
- consumers;
- revisions;
- compatibility-window tipada;
- migration plan;
- intents que tocam o contrato;
- contencao;
- decision-points;
- outcomes que citam revisao.

**Acoes:**

- propor revisao;
- aprovar/rejeitar;
- exigir consumer ack;
- publicar registry local;
- ver impacto no grafo.

**Backend necessario:**

- `contract.propose-revision`;
- resolver de consumers;
- contract-impact query;
- conflict/contention queue.

**Estado atual:**

- backend/grafo tem parte real.
- UI dedicada nao existe.

## 18. Resultados, outcomes e dashboards (`/results`)

**Objetivo:** mostrar se a governanca produziu resultado com confianca correta.

**Telas:**

- targets por ciclo;
- actual derivado;
- outcomes validos/invalidos;
- badges de confianca;
- rollup primario;
- aligns-with vs contributes-to;
- decision-rule;
- verdicts;
- self-attestation collapse.

**Backend necessario:**

- `outcome.publish`;
- resolver de metric/window/aggregation/attester;
- `verdict.accept`;
- dashboard read-model.

**Estado atual:**

- outcomes reais existem na demo.
- `/results` existe como tela de produto read-only para a demo: busca
  `/api/results/dashboard` com TanStack Query, exibe sourceRevision/derived,
  scorecards, targets e ECharts de target vs actual, confianca por ciclo,
  outcomes validos/invalidos e atingimento por objetivo.
- workspace novo nao tem fluxo para criar target/outcome.

**Lacuna:**

- publicar outcomes para workspace novo e ligar verdict/decision-rule ao
  dashboard ainda e trabalho de backend/fluxo.

## 19. Incidentes e operacao (`/operations`)

**Objetivo:** tratar trabalho reativo sem confundir com breakdown planejado.

**Tela deve mostrar:**

- incidentes declarados;
- severidade;
- telemetria;
- status: declared, mitigating, resolved, postmortem;
- follow-ups;
- standalone fixes/maintenance;
- outcomes operacionais;
- SLO/SLA quando houver.

**Acoes:**

- declarar incidente;
- anexar telemetria;
- mitigar/resolver;
- criar follow-up;
- completar standalone;
- publicar outcome operacional.

**Backend necessario:**

- `incident.declare`;
- `standalone.complete`;
- `outcome.publish`;
- incident lifecycle commands adicionais.

**Estado atual:**

- parte dos comandos existe.
- UI dedicada nao existe.

## 20. Auditoria e decisoes (`/audit`)

**Objetivo:** permitir revisar quem decidiu o que, quando, com qual autoridade e evidencia.

**Tela deve mostrar:**

- event-log;
- commands;
- base-revision;
- idempotency;
- nonce;
- authority;
- break-glass;
- policy decisions;
- matcher overrides;
- assistant suggestions accepted/rejected;
- diff antes/depois;
- filtros por workspace, pessoa, tipo, severidade.

**Backend necessario:**

- event-log query;
- policy/break-glass read-model;
- assistant audit read-model.

**Estado atual:**

- console tecnico mostra parte.
- auditoria de produto ainda nao existe.

## 21. Console tecnico (`/console`)

**Objetivo:** diagnostico avancado e operacao tecnica, nao onboarding principal.

**Deve conter:**

- graph explorer;
- comandos dry-run/execute;
- YAML/JSON;
- resolvers;
- event-log;
- API contract;
- source revision;
- backend examples;
- health checks.

**Estado atual:**

- existe e e a area mais completa.

**Risco:**

- se o app depender do console para tarefas comuns, ele continua sendo ferramenta de engenheiro/agente, nao produto para usuario.

## 22. Integracoes e matcher: contrato funcional

### 22.1 Integracoes que ja tem mecanismo inicial

| Integracao                          | Backend                | UI                | Proximo passo                                                      |
| ----------------------------------- | ---------------------- | ----------------- | ------------------------------------------------------------------ |
| Assistant providers                 | `Backend real parcial` | `UI parcial`      | configurar providers, default por funcao, health/probe e auditoria |
| Ollama/local assistant              | `Backend real`         | `UI parcial`      | preset local recomendado dentro de assistant providers             |
| Git local                           | `Backend real`         | `Futuro`          | adicionar fonte por path e testar Git                              |
| CI local                            | `Backend real`         | `Futuro`          | exibir evidencia de teste por repo-work                            |
| Code quality local/Sonar-compatible | `Backend real`         | `Futuro`          | conectar relatorio e badges                                        |
| Observability fixture/local         | `Backend real`         | `Futuro`          | ligar a target/outcome operacional                                 |
| Graph APIs                          | `Backend real`         | `Console tecnico` | criar telas de impacto/contratos/resultados                        |

### 22.2 Integracoes catalogadas, mas sem produto funcional

| Integracao                               | Decisao necessaria                                                            |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| GitHub work-source/repo provider         | implementar na release 1; login GitHub e conexao de repos continuam separados |
| Identity provider                        | escolher fluxo local-first vs provider real                                   |
| Backlog/Jira/Linear importer             | definir SSOT e direcao de sync                                                |
| Knowledge assistant/Onyx/Open WebUI/etc. | definir politica de contexto e egress                                         |
| Deploy/release evidence                  | definir primeira fonte de deploy                                              |
| BI/metric source                         | definir formato de actual attestation                                         |
| API schema registry                      | definir contrato com `contract` node                                          |

### 22.3 Projecao de backlog por ponto do fluxo

A UI nao deve esconder integracoes futuras em uma pagina tecnica separada. Cada ponto do fluxo deve mostrar:

- o que o framework ja entrega sem integracao externa;
- quais integracoes ja podem ser configuradas;
- quais integracoes estao priorizadas para release 1;
- quais aparecem como `em breve`, sempre com a frase de honestidade definida na QRD-26;
- quais estao adiadas por risco.

| Ponto do fluxo            | Integracoes de maior valor                                                                                      | Como deve aparecer no app                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Onboarding e conta        | GitHub OAuth, Google OAuth, OIDC generico, identity/directory                                                   | opcoes de login/autenticacao separadas de membership e authority                     |
| Fontes de trabalho        | GitHub work-source, Git local, GitLab, Bitbucket, pasta local, pasta sincronizada em nuvem                      | card "Conectar fontes de trabalho" com estado de confianca da fonte                  |
| Assistente e matcher      | lexical-deterministic, Ollama, OpenAI-compatible, Claude/Codex/Gemini aprovados por policy, knowledge assistant | configuracao de provider default por funcao, com egress e classificacao visiveis     |
| Planejamento e resultados | analytics warehouse, dbt, BI/metric source, product analytics                                                   | fonte de actual/target; ausencia vira "sem evidencia", nao erro silencioso           |
| Execucao e evidencia      | CI, test reports, coverage, code quality, code security                                                         | evidencia independente para repo-work, badges e pendencias                           |
| Contratos                 | OpenAPI, GraphQL, protobuf/AsyncAPI, service catalog                                                            | leitura de contratos e drift, nunca escrita autoritativa direta                      |
| Incidentes e operacao     | observability, incident-management, deploy/release evidence, feature flags                                      | telemetria, severidade, rollout, rollback e postmortem como referencias verificaveis |
| Intake e backlog          | Jira, Linear, Azure DevOps, GitHub Issues                                                                       | importador com contrato de SSOT e direcao de sync explicita                          |
| Grafo de governanca       | Neo4j, Cypher export, Graph APIs                                                                                | read-model derivado, impacto e caminhos; nunca segunda fonte de verdade              |

### 22.3.1 Hub dedicado `/integrations`

O hub `/integrations` e a tela central para entender e operar providers. Ele
nao substitui as sugestoes contextuais: ele consolida status, permissao, risco,
health, owner e historico.

**Deve permitir:**

- filtrar por status (`disponivel`, `configuravel`, `limited`, `release-1`,
  `em-breve`, `adiado`, `bloqueado`, `desativado`);
- filtrar por risco (`local`, `cloud`, `egress`, `requer security-owner`,
  `escreve estado`, `somente evidencia`);
- ver cards com o contrato definido na secao 7.9;
- abrir detalhe de permissao antes de conectar;
- testar conexao/health/capability quando houver mecanismo;
- solicitar aprovacao quando a pessoa nao tem authority;
- desativar/revogar provider sem apagar historico;
- explicar o que continua funcionando sem a integracao.

**Nao deve permitir:**

- marcar integracao como `connected` sem mecanismo real;
- transformar login em authority;
- transformar provider externo em SSOT sem adapter-contract;
- esconder egress/classificacao;
- permitir que uma integracao escreva YAML/event-log por default.

### 22.3.2 Sugestoes contextuais

Cada tela deve mostrar no maximo poucas integracoes relevantes. O objetivo nao
e vender marketplace; e explicar como elevar confianca, reduzir trabalho manual
ou automatizar evidencia naquele ponto do fluxo.

| Tela/feature  | Integracao sugerida                 | Quando sugerir                                          | O que deve explicar                                       |
| ------------- | ----------------------------------- | ------------------------------------------------------- | --------------------------------------------------------- |
| Signup        | GitHub OAuth, Google, OIDC          | quando a pessoa quer identidade externa                 | login nao concede membership/authority automaticamente    |
| Organizations | GitHub OAuth, OIDC                  | workspace shared/controlled                             | identidade ajuda convites, nao conecta repos sozinho      |
| Onboarding    | GitHub work-source, assistant local | quando pessoa escolhe configurar fontes/assistente      | pode pular; o app mostra o que fica manual                |
| Sources       | GitHub/GitLab/Bitbucket/Drive       | fonte local ficou `snapshot-only` ou cloud-sync sem API | provider eleva `sourceTrust` quando traz revision id      |
| Planning      | analytics/BI/dbt                    | target sem fonte de actual                              | sem integracao, medicao fica manual/rebaixada             |
| Intake        | Jira/Linear/GitHub Issues           | usuario ja tem backlog externo                          | importacao exige direcao de sync e SSOT explicito         |
| Triage        | service catalog/CODEOWNERS/matcher  | matcher tem baixa confianca ou unknowns                 | sugestao nao decide; humano confirma                      |
| Work          | CI/test reports/code quality        | repo-work precisa de evidencia independente             | testes viram evidence, nao aprovacao automatica           |
| Contracts     | OpenAPI/GraphQL/protobuf catalog    | contrato sem schema ou drift manual                     | schema ajuda drift, contrato governado continua no modelo |
| Results       | observability/analytics/BI          | outcome sem fonte ou attester fraco                     | numero sem fonte nao sobe como prova forte                |
| Operations    | observability/incident/deploy       | incident ou rollout sem evento verificavel              | telemetria evita texto bem-formado                        |
| Audit         | identity/directory/SIEM/export      | auditoria precisa fonte externa ou retencao             | event-log file-first continua canônico                    |
| Map           | Neo4j/service catalog               | mapa denso ou impacto de contrato dificil de navegar    | read-model melhora exploracao, nao vira SSOT              |
| Cup/CWP       | assistant/knowledge/matcher         | usuario pede ajuda contextual                           | provider segue policy; se bloqueado, Cup explica fallback |

### 22.3.3 Permissao e ativacao

O app deve separar tres atos:

1. **Solicitar** uma integracao.
2. **Aprovar/ativar** a integracao com authority adequada.
3. **Usar** a integracao em um fluxo especifico.

Uma mesma pessoa pode fazer os tres no perfil solo, mas o app deve marcar o
colapso. Em shared/controlled, os atos devem respeitar authority e policy.

**Copy obrigatoria para backlog visivel:**

```text
Integracoes disponiveis em breve: GitLab, Bitbucket, OpenAPI/GraphQL, Jira/Linear, BigQuery/dbt, PostHog/Amplitude, PagerDuty, SonarQube/Semgrep e Backstage.
```

```text
Em breve significa backlog priorizado, nao mecanismo ativo. O app mostra o que ja funciona sem cada integracao.
```

### 22.4 Matcher e assistentes

**Deve existir como:**

- orquestrador advisory multi-provider;
- entrada: register/triage item + repo contexts + contracts + policy;
- saida: sugestoes com score, unknowns, evidence, freshness e threshold;
- humano confirma ou sobrescreve;
- sugestao aceita, rejeitada, ignorada ou sobrescrita entra em auditoria.

**Providers e funcoes:**

- baseline obrigatorio: `lexical-deterministic`;
- providers locais: `ollama`, `openai-compatible` local, LM Studio/Jan/GPT4All/LocalAI/llama.cpp/vLLM quando aplicavel;
- gateways: LiteLLM/OpenAI-compatible interno;
- cloud-approved: Claude, Codex, Gemini ou outro provider aprovado por policy;
- default configuravel por funcao: explicar policy, resumir contexto, sugerir perguntas, sugerir matches, classificar fonte, rascunhar registro, rascunhar decisao;
- override por interacao: a pessoa pode trocar provider em uma triagem especifica;
- comparacao: a UI pode rodar mais de um provider e mostrar diferencas quando o custo/risco permitir.

**Status atual:**

- conceito e parte da infraestrutura de assistente existem;
- matcher completo ainda nao e tela funcional.

**Decisao:**

- implementar matcher como multi-provider desde o contrato de produto;
- lexical deterministico nao e "o matcher unico"; e o baseline local, explicavel e auditavel;
- Ollama e outros providers locais podem complementar quando tiverem capability-probe suficiente;
- Claude/Codex/Gemini e outros cloud providers so entram como `cloud-approved`, com egress policy, redaction, classificacao maxima e auditoria;
- a decisao humana sempre vence a sugestao.

## 23. Matriz de backend necessario por fluxo

| Fluxo            | Backend minimo para ser funcional                                               | Estado                                                                                 |
| ---------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Signup           | principal local + sessao                                                        | existe                                                                                 |
| Multi-workspace  | create/select/list workspace                                                    | existe parcialmente                                                                    |
| Governance host  | create/link/validate/scaffold                                                   | backend + UI parcial existem; falta validacao visual fim-a-fim                         |
| Membros/convites | invite/accept/assign/revoke                                                     | backend existe; falta UI completa                                                      |
| Perfil           | recommend/save/change/approve                                                   | save persiste; change/approve falta                                                    |
| Fontes           | add/scan/publish context                                                        | add/scan/snapshot UI existe; publish/capability/provider faltam                        |
| Assistente       | providers/defaults/health/probe/test/advisory/audit                             | provider/defaults/health/egress basicos existem em Settings; Cup/advisory/audit faltam |
| Integracoes      | list/configure/test/evidence feed                                               | backend parcial; UI parcial                                                            |
| Planning         | objectives/metrics/targets/cycle + thesis/opportunity-area/allocation opcionais | falta UI/comandos completos                                                            |
| Intake           | proposal/register create                                                        | backend existe para proposal; falta UI                                                 |
| Triage           | triage save + matcher multi-provider                                            | comando parcial; matcher falta                                                         |
| Gate             | decide/activate                                                                 | backend existe; falta UI                                                               |
| Breakdown        | apply + repo ack                                                                | backend existe; falta UI                                                               |
| Contracts        | propose/review/impact                                                           | backend parcial; falta UI                                                              |
| Outcomes         | publish/resolve/dashboard                                                       | dashboard read-only existe; publish/verdict para workspace novo falta                  |
| Incidents        | declare/lifecycle/follow-up                                                     | backend parcial; falta UI                                                              |
| Audit            | event-log/query/diff                                                            | backend parcial; falta UI                                                              |

## 24. Sequencia recomendada de implementacao

> **Nota 2026-07-05:** R0/R1 ja entregaram parte do backend e algumas telas
> parciais. A ordem abaixo continua como mapa funcional, mas a validacao de
> produto passa a ser acompanhada em [`APP-ITERATION-MAP.md`](APP-ITERATION-MAP.md),
> tela a tela, sempre com app aberto e estado limpo.

### R1 — Onboarding funcional real

**Objetivo:** transformar onboarding de demonstracao em configuracao persistida.

**Entregas:**

- persistir perfil, regra de acumulo, pessoas/papeis, governance host, fontes, assistente e integracoes;
- persistir `workspace-mode`, `execution-mode`, `operational-store` e `graph-read-model`;
- permitir selecionar `graph-read-model: neo4j` no caminho avancado;
- finalizar onboarding somente quando o minimo estiver salvo;
- Home refletir a configuracao real apos reload.

**Nao incluir:**

- planejamento completo;
- triagem/matcher completo;
- identity-provider cloud.

### R2 — Fontes de trabalho e governance host

**Objetivo:** permitir que um workspace novo governe algo real.

**Entregas:**

- escolher pasta/repo host;
- scaffold;
- adicionar fonte local;
- scan;
- context publish;
- capability review.
- quando `graph-read-model: neo4j` estiver habilitado, exportar/rebuildar grafo com `sourceRevision` e mostrar freshness.

### R3 — Assistente e integracoes operaveis

**Objetivo:** ligar a UI aos adapters ja existentes.

**Entregas:**

- configurar providers de assistente;
- definir default por funcao;
- testar Ollama e OpenAI-compatible;
- testar capability-probe;
- testar Git/CI/code-quality/observability;
- mostrar evidencia gerada.

### R4 — Planejamento progressivo

**Objetivo:** criar ciclo, objetivo, metrica e target no caminho guiado, mantendo thesis, opportunity-area e allocation disponiveis desde a release 1.

**Entregas:**

- telas para objectives, metrics, targets;
- secoes opcionais para thesis, opportunity-area e allocation;
- resolver de independence;
- dashboard basico.

### R5 — Intake → triagem → gate

**Objetivo:** registrar iniciativa e promover para intent.

**Entregas:**

- registro;
- triage;
- matcher multi-provider com baseline lexical deterministico;
- gate;
- activation.

### R6 — Breakdown → repo-work → contratos

**Objetivo:** transformar intent em trabalho rastreavel por fonte/repo.

**Entregas:**

- breakdown editor;
- repo-work ack;
- contrato impactado;
- fila de contencao.

### R7 — Outcomes, resultados e operacao

**Objetivo:** provar valor e trabalho reativo.

**Entregas:**

- publish outcome;
- verdict;
- incident flow;
- standalone completion;
- dashboard de resultados.

### R8 — Auditoria e administracao avancada

**Objetivo:** tornar a governanca auditavel por humanos.

**Entregas:**

- audit timeline;
- break-glass review;
- assistant/matcher audit;
- graph impact UX.

## 25. Decisoes que precisam ser tomadas

Nenhuma decisao de escopo de release esta aberta nesta trilha no momento. A QRD-26 decidiu que a primeira integracao cloud alem de auth sera GitHub como work-source/repo provider, separada de login/autenticacao.

As proximas discussoes devem ser de implementacao:

1. contrato exato de permissoes OAuth/App para GitHub work-source;
2. como a UI diferencia `disponivel`, `release 1`, `em breve` e `adiado`;
3. quais integracoes do backlog entram primeiro depois de GitHub, assistentes e Neo4j.

## 26. Definicao de "app saiu do papel"

O app so deve ser considerado funcional quando uma pessoa conseguir, sem console tecnico:

1. criar conta local;
2. criar workspace;
3. escolher perfil de governanca;
4. adicionar pelo menos uma pessoa/papel;
5. criar ou vincular governance host;
6. conectar pelo menos uma fonte de trabalho local;
7. configurar ou dispensar assistente;
8. testar pelo menos uma integracao real;
9. planejar um ciclo com objetivo, metrica e target, podendo adicionar thesis, opportunity-area e allocation no mesmo fluxo;
10. registrar uma iniciativa;
11. passar por triagem e gate;
12. gerar breakdown;
13. reconhecer trabalho em uma fonte/repo;
14. publicar outcome;
15. ver resultado no dashboard;
16. auditar a trilha de decisoes.

Enquanto qualquer uma dessas etapas depender de payload manual no console tecnico, o app ainda e uma demo tecnica, nao produto operacional.

## 27. Desenvolvimento guiado por contratos de teste

A partir da QRD-34, a especificacao funcional do app nao e considerada pronta
para implementacao sem um contrato de teste correspondente.

### Artefatos

| Artefato                           | Papel                                                   |
| ---------------------------------- | ------------------------------------------------------- |
| `TESTING-STRATEGY.md`              | regras do paradigma de testes                           |
| `test/contracts/app-contracts.yml` | contratos humanos versionados                           |
| `test/journeys/*.spec.ts`          | contratos executaveis ou backlog `fixme`                |
| `APP-ITERATION-MAP.md`             | status humano de iteracao, validacao visual e automacao |

### Regra por tela

Cada tela/fluxo deste documento deve ter, antes da implementacao incremental:

1. contrato em `app-contracts.yml`;
2. spec Playwright correspondente;
3. seed declarada;
4. criterio observavel de sucesso;
5. status inicial `fixme` ou `expected-fail` quando ainda nao implementado.

### Tipos de teste esperados

| Tipo                      | Exemplo                                               |
| ------------------------- | ----------------------------------------------------- |
| Jornada                   | signup -> workspace -> onboarding -> Home             |
| Consistencia entre telas  | fonte criada em `/sources` aparece em Settings e Home |
| Persistencia/reload       | onboarding parcial retoma no passo salvo              |
| Security/authority        | provider cloud nao ativa sem egress/approval          |
| Policy explanation        | Cup explica bloqueio citando policy versionada        |
| Derived/read-model safety | dashboard/mapa nao executa acao sem revision atual    |

### Relatorios

Playwright gera:

- terminal `list`;
- HTML em `test/reports/html`;
- JSON em `test/reports/results.json`;
- JUnit em `test/reports/results.xml`.

Allure fica como proxima camada de gestao quando houver volume suficiente de
contratos ativos. ReportPortal fica reservado para necessidade self-hosted de
analise historica mais pesada.
