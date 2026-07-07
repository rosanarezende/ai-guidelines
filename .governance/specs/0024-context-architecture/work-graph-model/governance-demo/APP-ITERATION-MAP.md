# Mapa de iteracao visual do app de governanca

> **Status:** mapa operacional para iterar e validar o app tela a tela.
> **Criado em:** 2026-07-05.
> **Autoridade funcional:** [`APP-FUNCTIONAL-SPEC.md`](APP-FUNCTIONAL-SPEC.md).
> **Matriz de cobertura automatizada:** [`APP-COVERAGE-MATRIX.md`](APP-COVERAGE-MATRIX.md).
> **Regra inicial:** toda tela nasce como `nao-iterado` e `nao-validado-visual`.
> **Uso:** marcar aqui apenas o que foi conferido com o app rodando, por uma pessoa, em um workspace limpo ou em um cenario explicitamente descrito.

Este arquivo existe para separar tres coisas que estavam se misturando:

- **contrato funcional**: o que o app precisa entregar;
- **mecanismo/backend**: o que ja existe em API, reducer, adapter, mock-api ou command runtime;
- **validacao visual real**: o que foi aberto no navegador, usado como pessoa usuaria e confirmado como compreensivel, persistente e coerente.

Checks automatizados e typecheck nao mudam o status deste mapa por si so.

A partir da QRD-34, cada linha que entrar em implementacao deve apontar para um
contrato em [`test/contracts/app-contracts.yml`](test/contracts/app-contracts.yml)
e para um spec Playwright. O contrato pode nascer `fixme`, mas nao deve nascer
sem ID, seed e criterio observavel.

## 1. Estados permitidos

### Iteracao

| Estado              | Significado                                                              |
| ------------------- | ------------------------------------------------------------------------ |
| `nao-iterado`       | Nao passou por rodada de produto/UX depois do reset deste mapa.          |
| `em-iteracao`       | Esta sendo ajustado nesta fase.                                          |
| `ajustes-pendentes` | Foi visto no app, mas ha problemas conhecidos antes de validar.          |
| `iterado`           | Fluxo/copy/layout foram ajustados e estao prontos para validacao visual. |

### Validacao visual

| Estado                | Significado                                                       |
| --------------------- | ----------------------------------------------------------------- |
| `nao-validado-visual` | Ainda nao foi conferido no navegador nesta fase.                  |
| `validado-local`      | Foi validado localmente com app rodando e cenario descrito.       |
| `reprovado`           | Foi conferido e falhou em usabilidade, coerencia ou persistencia. |
| `bloqueado`           | Nao da para validar por falta de backend, dado, rota ou decisao.  |

### Persistencia e consistencia

| Estado          | Significado                                                   |
| --------------- | ------------------------------------------------------------- |
| `nao-testado`   | Persistencia/reload/consistencia entre telas nao foi testada. |
| `persiste`      | Mudanca sobrevive reload e volta no mesmo workspace.          |
| `nao-persiste`  | Mudanca desaparece, volta para default ou perde passo.        |
| `divergente`    | Uma tela mostra uma coisa e outra tela mostra outra.          |
| `nao-aplicavel` | Tela puramente read-only ou future placeholder.               |

## 2. Evidencia minima para marcar como validado

Para marcar uma linha como `validado-local`, registrar na coluna de notas:

- data;
- modo usado (`real-runtime`, `mock-api` ou `demo-acme`);
- workspace/cenario usado;
- o que foi clicado/preenchido;
- se houve reload;
- se houve warning/erro visual ou de console relevante.

## 3. Mapa de telas e fluxos

| Ordem | Tela/fluxo                         | Rota principal                | Objetivo da iteracao                                                                                                           | Backend esperado                              | Iteracao            | Validacao visual       | Persistencia/consistencia | Notas                                                                                                                                                          |
| ----- | ---------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- | ------------------- | ---------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01    | Login passwordless e demo anonima  | `/login`                      | Entrar por link magico/provedor ou experimentar demo sem conta, sem confundir login com authority governada.                   | Better Auth magic link + bridge; demo local   | `iterado`           | `testado-automatizado` | `testado-automatizado`    | APP-01/03/47 ativos: `/login`, magic link/outbox, logout para `/login` e demo anonima sem conta de portal.                                                     |
| 02    | Selecionar/criar workspace         | `/organizations`              | Criar workspace novo, selecionar workspace existente e anexar demo sem vazar acme.                                             | create/select/list workspace                  | `iterado`           | `testado-automatizado` | `testado-automatizado`    | APP-02 ativo: login -> create workspace -> onboarding; settings/console nao vazam demo.                                                                        |
| 03    | Logout/troca de usuario            | shell/app header              | Encerrar sessao local sem apagar workspaces/event-log.                                                                         | `/api/local/logout`                           | `nao-iterado`       | `nao-validado-visual`  | `nao-testado`             |                                                                                                                                                                |
| 03A   | Navegacao global                   | shell/app header              | Implementar topbar + sidebar/drawer, itens, subitens, estados e acesso ao console/Cup.                                         | shell implementado; APP-35 active             | `iterado`           | `nao-validado-visual`  | `testado`                 | Falta validacao visual humana; filtragem fina por authority fica para telas restritas.                                                                         |
| 04    | Onboarding - entrada               | `/onboarding`                 | Escolher trilha por contexto de entrada: criador configura workspace; convidado entra como participante; demo faz tour seguro. | onboarding status + step + entry context      | `nao-iterado`       | `nao-validado-visual`  | `nao-testado`             | APP-36/37 expected-fail: UI ainda nao separa `workspace-setup` de `member-join`.                                                                               |
| 05    | Onboarding - perfil da organizacao | `/onboarding`                 | Guiar escolha de perfil por perguntas, nao dropdown cru.                                                                       | profile save + sensitive accumulation policy  | `nao-iterado`       | `nao-validado-visual`  | `nao-testado`             |                                                                                                                                                                |
| 06    | Onboarding - responsabilidades     | `/onboarding`                 | Mostrar perguntas de responsabilidades apenas quando fizer sentido pelo perfil.                                                | role/authority summary                        | `nao-iterado`       | `nao-validado-visual`  | `nao-testado`             |                                                                                                                                                                |
| 07    | Onboarding - pessoas e papeis      | `/onboarding`                 | Guiar a pessoa criadora a assumir papeis proprios; para convidado, mostrar papeis propostos, permissoes e aceite/recusa.       | members + roles + invites                     | `iterado`           | `testado-automatizado` | `testado-automatizado`    | APP-07 ativo para criador; APP-37 expected-fail para pessoa convidada (`member-join`).                                                                         |
| 08    | Onboarding - governance host       | `/onboarding` ou `/settings`  | Explicar onde a governanca vive e criar/vincular host sem confundir com fonte de trabalho.                                     | governance-host fit-check/create/link/sandbox | `iterado`           | `testado-automatizado` | `testado-automatizado`    | APP-08/34 ativos: gate em Sources, fit-check, sandbox explicito e host embutido distinto de sidecar.                                                           |
| 09    | Onboarding - fontes de trabalho    | `/onboarding` + `/sources`    | Guiar projeto local vs nuvem; pasta vazia/em andamento; Git/sem Git; relacao com `.governance`.                                | work-sources add/scan/browser-scan            | `iterado`           | `testado-automatizado` | `testado-automatizado`    | APP-09 ativo: onboarding guia local/nuvem e diferencia governance host de fonte.                                                                               |
| 10    | Onboarding - assistente/modelo     | `/onboarding`                 | Configurar ou dispensar assistente; explicar local/cloud/egress sem jargao.                                                    | assistant config/test/dismiss                 | `ajustes-pendentes` | `nao-validado-visual`  | `testado-automatizado`    | APP-10 ativo via Settings: local/cloud/egress e health existem. Etapa visual do onboarding ainda precisa validacao humana.                                     |
| 11    | Onboarding - integracoes           | `/onboarding`                 | Mostrar integracoes como opcionais, com disponivel/release-1/em-breve.                                                         | integration backlog/list/test parcial         | `nao-iterado`       | `nao-validado-visual`  | `nao-testado`             |                                                                                                                                                                |
| 12    | Onboarding - revisao final         | `/onboarding`                 | Mostrar o que ja funciona, o que esta pendente e o que sera rebaixado.                                                         | onboarding complete + pending list            | `iterado`           | `testado-automatizado` | `testado-automatizado`    | APP-12 ativo: revisao mostra pronto/pendente, finaliza e Home deixa de mostrar onboarding pendente.                                                            |
| 13    | Home - workspace parcial           | `/`                           | Mostrar proximo passo real para workspace sem demo quando onboarding ja foi iniciado.                                          | home summary/config status                    | `iterado`           | `testado-automatizado` | `testado-automatizado`    | APP-13 ativo: Home parcial mostra proximo passo e console tecnico indisponivel sem host.                                                                       |
| 14    | Home - demo acme                   | `/`                           | Mostrar pendencias, atalhos e resultados derivados sem parecer console tecnico.                                                | snapshot demo + resolver                      | `iterado`           | `testado-automatizado` | `testado-automatizado`    | APP-14 ativo: demo/sandbox fica explicita e lista de organizacoes reais continua separada.                                                                     |
| 15    | Configuracoes - organizacao/perfil | `/settings`                   | Editar/ver perfil, modo e stack sem divergir do onboarding.                                                                    | workspace/profile/mode/stack APIs             | `nao-iterado`       | `nao-validado-visual`  | `nao-testado`             |                                                                                                                                                                |
| 16    | Configuracoes - pessoas/papeis     | `/settings`                   | Gerenciar pessoas, times, grupos, convites, papeis e autoridade herdada.                                                       | members/roles APIs                            | `iterado`           | `testado-automatizado` | `testado-automatizado`    | APP-07/16 ativos: lista pessoas/grupos, convite token+revogacao, papel proposto e authority derivada.                                                          |
| 17    | Configuracoes - governance host    | `/settings`                   | Criar/vincular host e mostrar fit-check/risco por distribuicao.                                                                | governance-host APIs                          | `iterado`           | `testado-automatizado` | `testado-automatizado`    | APP-17 ativo: host vinculado mostra sourceRevision/warnings e console degradado mostra revisao.                                                                |
| 18    | Configuracoes - fontes             | `/settings` + `/sources`      | Mostrar as mesmas fontes e estados da tela dedicada.                                                                           | work-sources APIs                             | `iterado`           | `testado-automatizado` | `testado-automatizado`    | APP-18/CONS-02 ativos: Sources, Settings e Home mostram a mesma fonte.                                                                                         |
| 19    | Configuracoes - assistente         | `/settings`                   | Alterar provider/defaults depois do onboarding.                                                                                | assistant APIs                                | `iterado`           | `testado-automatizado` | `testado-automatizado`    | APP-10 ativo: provider list, health, egress cloud e defaults visiveis. APP-19 segue fixme por depender de `/integrations` e Cup.                               |
| 20    | Configuracoes - integracoes        | `/settings` + `/integrations` | Resumir providers conectados/limitados e apontar para o hub dedicado.                                                          | integration APIs/catalog                      | `nao-iterado`       | `nao-validado-visual`  | `nao-testado`             |                                                                                                                                                                |
| 21    | Fontes de trabalho dedicada        | `/sources`                    | Cadastrar fonte local/cloud/manual de modo simples e instrutivo.                                                               | work-sources add/scan/browser-scan            | `iterado`           | `testado-automatizado` | `testado-automatizado`    | APP-21 ativo: wizard diferencia local/cloud, fallback manual e GitHub como provider.                                                                           |
| 22    | Planejamento de ciclo              | `/planning`                   | Criar ciclo, objetivo, metrica e target; contexto opcional progressivo.                                                        | future commands                               | `nao-iterado`       | `nao-validado-visual`  | `bloqueado`               |                                                                                                                                                                |
| 23    | Registro de iniciativa             | `/intake`                     | Registrar uma aposta/necessidade sem breakdown tecnico inicial.                                                                | proposal/register command parcial             | `nao-iterado`       | `nao-validado-visual`  | `bloqueado`               |                                                                                                                                                                |
| 24    | Triagem/matcher                    | `/triage`                     | Transformar duvidas em itens e sugerir repos/fontes sem decidir sozinho.                                                       | triage + matcher multi-provider futuro        | `nao-iterado`       | `nao-validado-visual`  | `bloqueado`               |                                                                                                                                                                |
| 25    | Gate/ativacao                      | `/gates`                      | Aprovar/descartar/promover com autoridade e evidencia visiveis.                                                                | gate commands existentes/parciais             | `nao-iterado`       | `nao-validado-visual`  | `bloqueado`               |                                                                                                                                                                |
| 26    | Execucao/trabalho                  | `/work`                       | Ver repo-work, status, acks e pendencias operacionais.                                                                         | demo/read-only + commands parciais            | `nao-iterado`       | `nao-validado-visual`  | `nao-testado`             |                                                                                                                                                                |
| 27    | Contratos                          | `/contracts`                  | Ver contrato, consumidores, janela, revisoes e contention.                                                                     | graph/contracts parcial                       | `nao-iterado`       | `nao-validado-visual`  | `bloqueado`               |                                                                                                                                                                |
| 28    | Resultados/dashboards              | `/results`                    | Acompanhar targets/outcomes/actual/confidence com ECharts.                                                                     | demo/read-only + resolver                     | `nao-iterado`       | `nao-validado-visual`  | `nao-testado`             |                                                                                                                                                                |
| 29    | Mapa de governanca                 | `/map`                        | Explicar caminho entre objetivo, intent, contrato, evidencia e risco.                                                          | read-model/view-model                         | `nao-iterado`       | `nao-validado-visual`  | `nao-testado`             |                                                                                                                                                                |
| 30    | Operacao/incidentes                | `/operations`                 | Ver incidentes, follow-ups, SLO e trabalho operacional.                                                                        | demo/read-only parcial                        | `nao-iterado`       | `nao-validado-visual`  | `bloqueado`               |                                                                                                                                                                |
| 31    | Auditoria                          | `/audit`                      | Ver quem decidiu o que, quando, com qual evidencia.                                                                            | event-log/query parcial                       | `nao-iterado`       | `nao-validado-visual`  | `bloqueado`               |                                                                                                                                                                |
| 32    | Console tecnico                    | `/console`                    | Dar acesso tecnico a grafo/comandos/event-log sem substituir a UX principal.                                                   | console/read-model/runtime                    | `nao-iterado`       | `nao-validado-visual`  | `nao-testado`             |                                                                                                                                                                |
| 33    | Spikes visuais                     | `/spikes/visual-stack`        | Avaliar libs de visualizacao sem virar tela de produto.                                                                        | fixture/read-model                            | `nao-iterado`       | `nao-validado-visual`  | `nao-aplicavel`           |                                                                                                                                                                |
| 34    | Cup/CWP - overlay shell            | overlay transversal           | Botao global, painel lateral e copy estatica por rota sem provider de IA.                                                      | frontend shell                                | `nao-iterado`       | `nao-validado-visual`  | `nao-testado`             |                                                                                                                                                                |
| 35    | Cup/CWP - contexto da pagina       | overlay transversal           | Cada rota publica contexto minimo permitido para Cup explicar onde a pessoa esta.                                              | CwpPageContext local                          | `nao-iterado`       | `nao-validado-visual`  | `nao-testado`             |                                                                                                                                                                |
| 36    | Cup/CWP - policy explainer         | overlay transversal           | Explicar bloqueios, avisos e rebaixamentos citando `POLICY-HANDBOOK.md`.                                                       | policy handbook + resolver futuro             | `nao-iterado`       | `nao-validado-visual`  | `nao-testado`             |                                                                                                                                                                |
| 37    | Cup/CWP - specialist router        | overlay transversal           | Mudar linguagem e checklist por tela: sources, onboarding, results, triage, audit etc.                                         | roteamento deterministico                     | `nao-iterado`       | `nao-validado-visual`  | `nao-testado`             |                                                                                                                                                                |
| 38    | Cup/CWP - provider assistivo       | overlay transversal           | Usar Ollama/OpenAI-compatible/cloud-approved apenas depois de policy/egress.                                                   | assistant provider + egress                   | `nao-iterado`       | `nao-validado-visual`  | `bloqueado`               |                                                                                                                                                                |
| 39    | Cup/CWP - draft action             | overlay transversal           | Preparar rascunho/dry-run de comando com confirmacao humana e audit.                                                           | command runtime + baseRevision + audit futuro | `nao-iterado`       | `nao-validado-visual`  | `bloqueado`               |                                                                                                                                                                |
| 40    | Integracoes - hub dedicado         | `/integrations`               | Listar providers por valor/status/risco com cards de vantagens, limites e permissoes.                                          | integration backlog + status                  | `nao-iterado`       | `nao-validado-visual`  | `nao-testado`             |                                                                                                                                                                |
| 41    | Integracoes - detalhe/permissao    | `/integrations/[id]` ou modal | Mostrar dados acessados, permissoes, quem aprova, riscos, teste e como desativar.                                              | integration detail + authority                | `nao-iterado`       | `nao-validado-visual`  | `nao-testado`             |                                                                                                                                                                |
| 42    | Integracoes - sugestao contextual  | varias rotas                  | Mostrar poucas sugestoes no ponto do fluxo em que elevam confianca ou reduzem trabalho manual.                                 | integration catalog por surface               | `nao-iterado`       | `nao-validado-visual`  | `nao-testado`             |                                                                                                                                                                |
| 43    | Integracoes - autoridade/egress    | `/integrations`               | Separar solicitar, aprovar/ativar e usar; bloquear cloud sem authority/policy.                                                 | authority + egress decision                   | `nao-iterado`       | `nao-validado-visual`  | `nao-testado`             |                                                                                                                                                                |
| 44    | Integracoes - GitHub work-source   | `/integrations` + `/sources`  | Implementar primeira cloud work-source sem confundir login GitHub com repos/authority.                                         | GitHub adapter futuro                         | `nao-iterado`       | `nao-validado-visual`  | `bloqueado`               |                                                                                                                                                                |
| 45    | Auth real + cache escopado         | `/api/auth/[...all]`          | Montar Better Auth via Next.js; adaptar login/workspace/convite; manter TanStack Query escopado por conta/workspace.           | portal identity + Zod session scope           | `iterado-parcial`   | `testado-automatizado` | `testado-automatizado`    | APP-45 ativo: magic link Better Auth -> bridge local -> workspace -> convite -> login da pessoa convidada -> accept; cache fino segue em APP-46 expected-fail. |

## 3.1 Contratos automatizados

Os contratos alvo iniciais estao em
[`test/contracts/app-contracts.yml`](test/contracts/app-contracts.yml). Eles
nascem antes da implementacao e devem ser sincronizados com esta tabela.

| Contrato | Cobre linhas do mapa | Estado atual no YAML |
| -------- | -------------------- | -------------------- |
| APP-01   | 01                   | active               |
| APP-02   | 02, 13, 15           | active               |
| APP-03   | 03                   | active               |
| APP-35   | 03A                  | active               |
| APP-04   | 04, 13               | active               |
| APP-05   | 05, 06, 15           | active               |
| APP-06   | 05, 06               | active               |
| APP-07   | 07, 16               | active               |
| APP-36   | 04, 05, 07, 08, 09   | expected-fail        |
| APP-37   | 04, 07, 16           | expected-fail        |
| APP-08   | 08, 09, 18, 21       | active               |
| APP-09   | 09, 21               | active               |
| APP-10   | 10, 19               | active               |
| APP-11   | 11, 40               | fixme                |
| APP-12   | 12, 13, 15           | active               |
| APP-13   | 13                   | active               |
| APP-14   | 14                   | active               |
| APP-15   | 15                   | active               |
| APP-16   | 16                   | active               |
| APP-17   | 17, 32               | active               |
| APP-18   | 18, 21               | active               |
| APP-19   | 19                   | fixme                |
| APP-20   | 20, 40               | fixme                |
| APP-21   | 21                   | active               |
| APP-22   | 22, 28               | fixme                |
| APP-23   | 23, 24               | fixme                |
| APP-24   | 24                   | fixme                |
| APP-25   | 25, 31               | fixme                |
| APP-26   | 26, 28               | expected-fail        |
| APP-27   | 27, 29, 31           | fixme                |
| APP-28   | 28                   | expected-fail        |
| APP-29   | 29                   | expected-fail        |
| APP-30   | 30                   | fixme                |
| APP-31   | 31                   | fixme                |
| APP-32   | 32                   | expected-fail        |
| APP-33   | 22, 23, 24, 25, 31   | fixme                |
| APP-34   | 08, 17               | active               |
| INT-01   | 20, 40, 41, 43       | fixme                |
| INT-02   | 42                   | fixme                |
| INT-03   | 01, 20, 21, 44       | fixme                |
| APP-45   | 01, 02, 03, 45       | active               |
| APP-46   | 01, 02, 03, 45       | expected-fail        |
| APP-47   | 01, 14               | active               |
| CUP-01   | 34, 35, 36, 37       | fixme                |
| CUP-02   | 36, 40, 43           | fixme                |
| CUP-03   | 39                   | fixme                |
| CUP-04   | 35, 38, 43           | fixme                |
| SEC-01   | 10, 19, 43           | fixme                |
| SEC-02   | 28, 29, 32           | fixme                |
| SEC-03   | 01, 16, 20           | fixme                |
| SEC-04   | 31, 32               | fixme                |
| SEC-05   | 18, 21               | fixme                |
| SEC-06   | 16, 20, 43           | fixme                |
| SEC-07   | 16                   | fixme                |
| SEC-08   | 28, 31               | fixme                |
| SEC-09   | 20, 43               | fixme                |
| SEC-10   | 25, 31               | fixme                |
| SEC-11   | 07, 16               | active               |
| SEC-12   | 07, 16               | active               |
| CONS-01  | 05, 13, 15           | active               |
| CONS-02  | 18, 21, 13           | active               |
| CONS-03  | 20, 40, 42           | fixme                |

## 4. Matriz de consistencia entre telas

| Consistencia a provar                                                            | Telas envolvidas                               | Status        | Notas                |
| -------------------------------------------------------------------------------- | ---------------------------------------------- | ------------- | -------------------- |
| Perfil escolhido aparece igual em onboarding, Home e Settings.                   | `/onboarding`, `/`, `/settings`                | `nao-testado` |                      |
| Regra de acumulo sensivel altera copy/recomendacao e configuracao efetiva.       | `/onboarding`, `/settings`                     | `nao-testado` |                      |
| Onboarding parcial retoma no passo certo e Home mostra card de continuar.        | `/onboarding`, `/`                             | `nao-testado` |                      |
| Logout limpa sessao, mas nao apaga workspace nem event-log.                      | shell, `/login`, `/organizations`              | `testado`     | APP-03 ativo         |
| Workspace novo nao mostra dados da demo acme.                                    | `/organizations`, `/`, `/settings`, `/console` | `nao-testado` |                      |
| Governance host criado/vinculado destrava console e aparece em Settings.         | `/settings`, `/console`, `/`                   | `nao-testado` |                      |
| Fonte adicionada em `/sources` aparece igual em Settings e Home.                 | `/sources`, `/settings`, `/`                   | `testado`     | CONS-02 ativo        |
| Fonte sem Git fica rebaixada como snapshot/manual, nao como evidencia auditavel. | `/sources`, `/settings`, `/results`            | `nao-testado` |                      |
| Assistente local/defaults aparecem em Settings.                                  | `/settings`                                    | `testado`     | APP-10 ativo         |
| Provider cloud nao fica ativo sem aprovacao de egress.                           | `/onboarding`, `/settings`                     | `testado`     | APP-10 ativo         |
| Read-model derivado nunca permite acao sem sourceRevision/baseRevision atual.    | `/map`, `/results`, `/work`, `/console`        | `nao-testado` |                      |
| Demo acme e workspace real sao claramente distintos.                             | `/organizations`, `/`, `/settings`             | `nao-testado` |                      |
| Cup mostra contexto diferente por rota e nao vaza dados bloqueados.              | overlay Cup em todas as rotas                  | `nao-testado` |                      |
| Cup nao executa mutacao sem confirmacao humana e base/source revision atual.     | overlay Cup + rotas com comando                | `nao-testado` |                      |
| Cup explica bloqueios citando policy versionada, nao texto improvisado.          | overlay Cup + `POLICY-HANDBOOK.md`             | `nao-testado` |                      |
| Integracao cloud nao aparece como `connected` sem auth/permissao/probe real.     | `/integrations`, `/sources`, `/settings`       | `nao-testado` |                      |
| Login GitHub nao conecta repos nem concede authority automaticamente.            | `/login`, `/integrations`, `/sources`          | `nao-testado` |                      |
| Login/logout/aceite/troca de workspace nao reaproveitam cache sensivel.          | `/login`, `/organizations`, `TanStack Query`   | `nao-testado` | APP-46 expected-fail |
| Settings e `/integrations` mostram o mesmo status efetivo do provider.           | `/settings`, `/integrations`                   | `nao-testado` |                      |
| Sugestao contextual de integracao explica o que funciona sem a ferramenta.       | varias rotas                                   | `nao-testado` |                      |

## 5. Proxima ordem sugerida

1. Login passwordless, demo anonima, logout e multi-workspace.
2. Onboarding completo com estado limpo.
3. Settings refletindo exatamente o que foi escolhido no onboarding.
4. Fontes de trabalho e governance host.
5. Assistente e hub de integracoes.
6. Home operacional para workspace novo.
7. Map/results/work usando dados reais do workspace.

## 6. Oportunidades Cup/CWP por tela

Todas as oportunidades abaixo nascem como `nao-iterado`. Durante a validacao de
cada tela, registrar se Cup ajudaria com explicacao, rascunho, diagnostico,
policy ou proximo passo. Isso evita implementar um chat generico e ajuda a
descobrir onde o produto precisa de coautoria contextual.

| Tela/fluxo                     | Especialista Cup             | Oportunidade concreta                                                                                                               | Status        | Notas                                                                    |
| ------------------------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------ |
| Criacao de conta local         | `adoption-guide`             | Explicar que conta local nao e authority governada e quando usar GitHub/Google/OIDC.                                                | `nao-iterado` |                                                                          |
| Selecionar/criar workspace     | `workspace-guide`            | Ajudar a escolher workspace vazio, demo acme ou workspace existente.                                                                | `nao-iterado` |                                                                          |
| Logout/troca de usuario        | `adoption-guide`             | Explicar que logout nao apaga workspace/event-log.                                                                                  | `nao-iterado` |                                                                          |
| Onboarding - entrada           | `setup-guide`/`member-guide` | Explicar a trilha correta: setup do workspace para criador; entrada de participante para convidado.                                 | `nao-iterado` | APP-36/37 protegem a separacao de contexto antes de alterar UI.          |
| Onboarding - perfil            | `setup-guide`                | Traduzir perguntas em perfil recomendado e consequencias de enforcement.                                                            | `nao-iterado` |                                                                          |
| Onboarding - pessoas/papeis    | `authority-guide`            | Explicar quem esta configurando, quais papeis a pessoa assume, o que fica aberto e por que papel para outra pessoa fica `proposed`. | `iterado`     | APP-07 cobre criador; APP-37 define a experiencia separada de convidado. |
| Onboarding - governance host   | `host-guide`                 | Explicar onde a governanca vive: local, repo dedicado ou `.governance-host`.                                                        | `nao-iterado` |                                                                          |
| Onboarding - fontes            | `source-guide`               | Ajudar a escolher projeto local, pasta cloud, GitHub, pasta vazia ou fonte manual.                                                  | `nao-iterado` |                                                                          |
| Onboarding - assistente/modelo | `assistant-guide`            | Comparar Ollama/local/cloud-approved e explicar egress sem jargao.                                                                  | `nao-iterado` |                                                                          |
| Home                           | `next-step-guide`            | Explicar por que aquele e o proximo passo seguro.                                                                                   | `nao-iterado` |                                                                          |
| Settings                       | `configuration-guide`        | Reconciliar diferenca entre onboarding e configuracao atual.                                                                        | `nao-iterado` |                                                                          |
| Sources                        | `source-guide`               | Diagnosticar por que uma fonte ficou `snapshot-only` ou `cloud-sync-unverified`.                                                    | `nao-iterado` |                                                                          |
| Planning                       | `planning-guide`             | Rascunhar objetivo, metrica, target e contexto opcional progressivo.                                                                | `nao-iterado` |                                                                          |
| Intake                         | `initiative-guide`           | Rascunhar problema, hipotese, aposta, lacunas e fontes possivelmente afetadas.                                                      | `nao-iterado` |                                                                          |
| Triage                         | `triage-guide`               | Preparar perguntas, chamar matcher e comparar sugestoes sem decidir.                                                                | `nao-iterado` |                                                                          |
| Gates                          | `decision-guide`             | Explicar autoridade, evidencia, risco e consequencia antes da decisao humana.                                                       | `nao-iterado` |                                                                          |
| Work                           | `execution-guide`            | Explicar status de repo-work, bloqueio, ack e evidencia pendente.                                                                   | `nao-iterado` |                                                                          |
| Contracts                      | `contract-guide`             | Explicar consumers, owner, janela de compatibilidade e contention.                                                                  | `nao-iterado` |                                                                          |
| Results                        | `results-guide`              | Explicar outcome, actual, stale, self-attested e por que algo entrou ou nao no rollup.                                              | `nao-iterado` |                                                                          |
| Map                            | `graph-guide`                | Explicar caminho, vizinhanca, impacto e risco sem expor console tecnico.                                                            | `nao-iterado` |                                                                          |
| Operations                     | `operations-guide`           | Explicar incidente, follow-up, SLO e trabalho operacional.                                                                          | `nao-iterado` |                                                                          |
| Audit                          | `policy-guide`               | Explicar event-log, break-glass e quem decidiu o que.                                                                               | `nao-iterado` |                                                                          |
| Integrations                   | `integration-guide`          | Explicar provider, health, capability probe, egress e backlog.                                                                      | `nao-iterado` |                                                                          |
| Integrations hub               | `integration-guide`          | Comparar providers por valor, risco, permissao, status e alternativa sem integracao.                                                | `nao-iterado` |                                                                          |
| Console tecnico                | `technical-guide`            | Ajudar a navegar grafo/comandos sem executar nada sozinho.                                                                          | `nao-iterado` |                                                                          |

## 7. Decisao operacional sobre Cup antes da validacao visual

Pode iniciar C0-C3 antes de finalizar a validacao das telas:

- C0: overlay shell;
- C1: contexto por pagina;
- C2: policy explainer deterministico;
- C3: specialist router sem provider externo.

Essas fases ajudam a descobrir lacunas de UX enquanto validamos tela a tela. C4
em diante fica bloqueado ate haver provider/policy/egress/audit suficientes.
