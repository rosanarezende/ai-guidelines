# Walkthrough Iteration — sim v3

> Autoridade: `../model.yml` continua sendo o SSOT do modelo. Este arquivo acompanha a iteracao
> de produto da sim v3: bugs observados pela owner, decisoes de UX, perfil de uso e criterios para
> declarar que o app serve como dogfood real.

## Objetivo

Validar se a sim v3 e compreensivel e util para uma organizacao que esta adotando o framework em
repos existentes. A barra e a mesma do red-team: evidencia mecanizada, falha fechada quando
necessario e avisos honestos quando ha colapso ou cerimonia.

## Meta corrente — anti-compactacao

Esta seção e o ponto de retomada operacional da rodada atual. Se o contexto da conversa compactar,
retomar daqui antes de pedir nova rodada externa.

**Direção decidida agora:**

1. O app deve sair do estado de prototipo: signup, organizacoes/workspaces, onboarding, pessoas,
   papeis, fontes, assistente, integracoes e planejamento precisam ser exercitaveis por tela ou API
   real, sem depender do console tecnico.
2. O backend ativo da demo deve ser TypeScript strict no caminho importavel (`backend/src`,
   `frontend/server`, `mock-api/src`, testes novos). Código novo não deve nascer em `.mjs`.
3. Os `.mjs` remanescentes em `backend/tools`, `backend/backends`, repos acme e testes de repos são
   legado/CLI/fixture a auditar por lote; não devem crescer silenciosamente.
4. A mock-api e suas seeds são contrato de desenvolvimento, não apenas conveniência. As seeds devem
   virar matriz de regressão E2E para proteger os cenários de onboarding, perfis, convites, host,
   fontes, assistente, stack, planejamento e modos de organização.
5. Antes de encerrar esta meta, fazer uma auditoria final de legado em `governance-demo` e decidir
   para cada superfície se fica ativa, migra para TypeScript, move para `_archive` ou é removida.

**Fatia de controle fechada nesta trilha:** cobertura E2E base por seeds da mock-api, telas base de
settings e auditoria de legado. A auditoria versionada mora em
[`reviews/2026-07-04-legacy-surface-audit.md`](reviews/2026-07-04-legacy-surface-audit.md).

**Legado a auditar antes de declarar a meta pronta:**

| area                      | estado atual observado                                                  | decisão pendente                                            |
| ------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------- |
| `backend/tools/*.mjs`     | CLIs/checks herdados da sim v3; ainda executam validações centrais      | manter como CLI ativo por enquanto; migrar por lote para TS |
| `backend/backends/*.mjs`  | scripts de export/smoke dos exemplos de backend derivados               | manter como projeção ativa; migrar/mover em fatia própria   |
| `examples/backends/*`     | read-models derivados file/sqlite/neo4j/mongo + contrato de ação        | manter como artefato ativo derivado                         |
| `acme/repos/**/src/*.mjs` | código MVP dos repos ficticios acme, usado como fixture de empresa real | manter como fixture polyglot; adicionar TS só se útil       |
| `acme/repos/**/test.mjs`  | testes locais dos repos ficticios, usados por adapters/smokes           | manter fixture ou migrar junto do repo correspondente       |
| `_archive/*`              | historico v2 e apps estaticos v3 ja arquivados                          | manter arquivado; não reimportar para superfície ativa      |

## Estado Atual

- Branch: `feat/spec-0024-artifact-taxonomy-and-model-review-contract`
- Head inicial desta iteracao: `78ef7462`
- Head de referencia apos R0/R1 + seguranca do shell + format scripts: `12df9ea5`
- App: `frontend`
- Stack decidida: TypeScript strict + React/Next + Material UI
- Decisao: app ativo em `frontend/`, backend importavel em `backend/src/`, mock-api em
  `mock-api/`; nao manter adapter entre app antigo e app novo.
- Backend R0/R1: entregue em TypeScript no caminho ativo, com `mock-api` Hono/lowdb, data source
  `real-runtime|mock-api|demo-acme`, shell local file-first e APIs `/api/local/*`.
- Segurança R1.1: shell usa `applyAuthorizedShellCommand` antes do reducer; invite tokenizado cria
  membership real; `actorPersonId` vindo do cliente não é aceito como autoridade; onboarding
  `finished` exige host governado válido ou sandbox explícito.
- Formatação: scripts governados `format:governance-demo` e `format:governance-demo:check`
  existem para evitar depender de `validate` completo durante iteração da demo.

## Observacoes da Owner

| id  | tela          | observacao                                                                              | severidade | status            |
| --- | ------------- | --------------------------------------------------------------------------------------- | ---------- | ----------------- |
| W1  | boot          | warnings React/MUI e hydration mismatch ao abrir `npm run dev`                          | P0         | fechado no app v2 |
| W2  | primeira tela | nao fica claro se a tela e stakeholder, lider, dev ou auditor                           | P0         | fechado no app v2 |
| W3  | planejamento  | objetivos precisam ser navegaveis por ciclo/ano e mais proximos de dashboard executivo  | P1         | fechado no app v2 |
| W4  | arquitetura   | app deve ser TypeScript robusto; backend/runtime tambem sera migrado depois             | P0         | decidido          |
| W5  | configuracoes | integracoes e assistente inicial precisam aparecer no onboarding sem fingir mecanismo   | P0         | fechado como UX   |
| W6  | perfis        | admin, payer, sponsor, owner tecnico e actual-attester nao podem colapsar sem risco     | P0         | fechado como UX   |
| W7  | primeira tela | a entrada deve ser Home de Adocao/Governanca orientada a tarefa humana, nao grafo       | P0         | decidido          |
| W8  | onboarding    | perfil da organizacao nao deve ser menu tecnico; app deve diagnosticar e recomendar     | P0         | em iteracao       |
| W9  | onboarding    | perguntas dependentes e recomendacao so aparecem quando fazem sentido pelo diagnostico  | P0         | fechado no app    |
| W10 | home          | primeira visita sem onboarding concluido deve ir ao onboarding; parcial mostra retomada | P0         | fechado no app    |
| W11 | arquitetura   | onboarding multi-org nao pode nascer como estado local improvisado no frontend          | P0         | decidido          |
| W12 | i18n          | copy de produto deve sair de strings hardcoded e ir para locale versionado colocalizado | P0         | fechado no app    |
| W13 | arquitetura   | paginas/views estavam confusas; app deve organizar experiencias por feature             | P0         | fechado no app    |
| W14 | backend       | rotas locais nao podem confiar em payload do cliente para authority                     | P0         | fechado R1.1      |
| W15 | backend       | convite aceito precisa virar membership real, nao apenas estado visual                  | P0         | fechado R1.1      |
| W16 | onboarding    | `finished` nao pode ser setado sem host governado ou sandbox explicito                  | P0         | fechado R1.1      |
| W17 | e2e           | seeds da mock-api precisam virar cobertura de regressao, nao so fixture manual          | P1         | fechado base      |
| W18 | legado        | identificar o que ainda e legado em `governance-demo` antes de deletar/arquivar         | P1         | fechado base      |
| W19 | e2e           | telas críticas precisam provar UX real, nao só estado JSON das seeds                    | P1         | fechado base      |
| W20 | settings      | pessoas, papéis e fontes precisam ser exercitáveis por tela, sem console técnico        | P1         | fechado base      |

## Bugs Tecnicos

| id  | sintoma                                                   | causa provavel                                               | correcao esperada                                                         | status     |
| --- | --------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------- | ---------- |
| T1  | `item` vazando para DOM                                   | uso de `Grid` incompatível com a versao atual do MUI         | remover `Grid`; usar layout CSS grid via `Box`                            | fechado    |
| T2  | `alignItems`/`justifyContent`/`flexWrap` vazando para DOM | props de layout vazando por componentes de layout            | remover `Stack`/`Grid` da camada principal; usar `Box sx`                 | fechado    |
| T3  | hydration mismatch                                        | MUI/Emotion sem integracao SSR dedicada no App Router        | shell MUI client-only enquanto a sim nao instala pacote SSR dedicado      | fechado    |
| T4  | app sem tipos                                             | app em JS/JSX com `jsconfig`                                 | migrar para TS/TSX + `tsconfig` strict                                    | fechado    |
| T5  | runtime/backend sem contrato TS compartilhado             | `backend` tinha caminho ativo em `.mjs`; app duplicava tipos | criar dominio TS puro em `backend/src/domain/*.ts` e migrar runtime ativa | fechado R1 |
| T6  | strings de produto hardcoded                              | locale global ou por feature ampla escalaria mal             | locale colocalizado por view/step/section/componente/subdomínio/shell     | fechado    |
| T7  | telas em `app/ui/views` e arquivos grandes                | camada `ui` misturava produto, console e shared              | mover experiencias para `app/features/*`; `ui` fica shell/shared/theme    | fechado    |
| T8  | tools/scripts ainda em `.mjs`                             | CLIs herdados da sim v3 e fixtures acme continuam em JS      | auditar por area: migrar TS, manter fixture ou arquivar                   | aberto     |

## Perfis de Uso

| perfil         | objetivo                                                              | primeira tela       | pode executar                       |
| -------------- | --------------------------------------------------------------------- | ------------------- | ----------------------------------- |
| stakeholder    | acompanhar objetivos, targets, actuals, riscos e confianca            | Company Dashboard   | nao                                 |
| owner          | acompanhar intents, targets sob responsabilidade, outcomes e blockers | Owner Workspace     | dry-run controlado                  |
| tech-lead      | coordenar repo-work, contratos, evidencias e dependencias             | Execution Workspace | dry-run/execute conforme authority  |
| sre-ops        | acompanhar incidentes, standalone, SLO e operational bucket           | Ops Workspace       | dry-run/execute operacional         |
| adoption-admin | configurar perfil de governanca, papeis, assistente e integracoes     | Configuracoes       | ainda nao; futura mutacao governada |
| auditor-admin  | inspecionar issues, grafo, event-log e comandos                       | Audit Console       | sim, com authority resolvida        |

## Walkthroughs Obrigatorios

1. `objective -> target -> intent -> repo-work done -> outcome -> actual`
2. `intent-checkout-stack -> contract acme-user-context@v4 -> outcome -> target`
3. `incident -> standalone.complete -> outcome operacional -> warning self-attested visivel`
4. `issue/warning -> causa -> quem decide -> proxima mutacao governada`
5. `configuracoes -> perfil da org -> papeis -> assistente Ollama -> catalogo de integracoes -> revisao de riscos`
6. `seed -> rota relevante -> assert essencial`, para cada seed da mock-api que representa um
   estado de produto.
7. `auditoria de legado -> decisao por pasta`, cobrindo `examples`, `backend/backends`,
   `backend/tools`, repos acme e `_archive` — base fechada em
   `reviews/2026-07-04-legacy-surface-audit.md`.

## Proximas Fatias

1. Persistir mudanças reais de perfil/stack/host/fontes/assistente via comandos governados já
   existentes, com feedback humano claro na UI.
2. Navegação por periodo/ciclo dentro dos dashboards de objetivos e resultados.
3. Separação de console técnico/admin da experiência de leitura da owner.
4. Migração gradual de CLIs legados `.mjs` para TypeScript, em lotes funcionais, sem apagar fixtures
   acme nem exemplos derivados que ainda exercitam o dogfood.
