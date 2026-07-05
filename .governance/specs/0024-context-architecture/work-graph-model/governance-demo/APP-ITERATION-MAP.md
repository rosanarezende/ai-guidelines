# Mapa de iteracao visual do app de governanca

> **Status:** mapa operacional para iterar e validar o app tela a tela.
> **Criado em:** 2026-07-05.
> **Autoridade funcional:** [`APP-FUNCTIONAL-SPEC.md`](APP-FUNCTIONAL-SPEC.md).
> **Regra inicial:** toda tela nasce como `nao-iterado` e `nao-validado-visual`.
> **Uso:** marcar aqui apenas o que foi conferido com o app rodando, por uma pessoa, em um workspace limpo ou em um cenario explicitamente descrito.

Este arquivo existe para separar tres coisas que estavam se misturando:

- **contrato funcional**: o que o app precisa entregar;
- **mecanismo/backend**: o que ja existe em API, reducer, adapter, mock-api ou command runtime;
- **validacao visual real**: o que foi aberto no navegador, usado como pessoa usuaria e confirmado como compreensivel, persistente e coerente.

Checks automatizados e typecheck nao mudam o status deste mapa por si so.

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

| Ordem | Tela/fluxo                         | Rota principal               | Objetivo da iteracao                                                                              | Backend esperado                              | Iteracao      | Validacao visual      | Persistencia/consistencia | Notas |
| ----- | ---------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------- | --------------------- | ------------------------- | ----- |
| 01    | Criacao de conta local             | `/signup`                    | Entrar sem confundir conta local com auth corporativa.                                            | local principal + sessao + logout             | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 02    | Selecionar/criar workspace         | `/organizations`             | Criar workspace novo, selecionar workspace existente e anexar demo sem vazar acme.                | create/select/list workspace                  | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 03    | Logout/troca de usuario            | shell/app header             | Encerrar sessao local sem apagar workspaces/event-log.                                            | `/api/local/logout`                           | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 04    | Onboarding - entrada               | `/onboarding`                | Explicar o que sera configurado e retomar passo parcial sem voltar ao inicio.                     | onboarding status + step                      | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 05    | Onboarding - perfil da organizacao | `/onboarding`                | Guiar escolha de perfil por perguntas, nao dropdown cru.                                          | profile save + sensitive accumulation policy  | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 06    | Onboarding - responsabilidades     | `/onboarding`                | Mostrar perguntas de responsabilidades apenas quando fizer sentido pelo perfil.                   | role/authority summary                        | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 07    | Onboarding - pessoas e papeis      | `/onboarding`                | Trabalhar por pessoas/times/grupos recebendo papeis, com aceite quando outro sujeito e atribuido. | members + roles + invites                     | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 08    | Onboarding - governance host       | `/onboarding` ou `/settings` | Explicar onde a governanca vive e criar/vincular host sem confundir com fonte de trabalho.        | governance-host fit-check/create/link/sandbox | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 09    | Onboarding - fontes de trabalho    | `/onboarding` + `/sources`   | Guiar projeto local vs nuvem; pasta vazia/em andamento; Git/sem Git; relacao com `.governance`.   | work-sources add/scan/browser-scan            | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 10    | Onboarding - assistente/modelo     | `/onboarding`                | Configurar ou dispensar assistente; explicar local/cloud/egress sem jargao.                       | assistant config/test/dismiss                 | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 11    | Onboarding - integracoes           | `/onboarding`                | Mostrar integracoes como opcionais, com disponivel/release-1/em-breve.                            | integration backlog/list/test parcial         | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 12    | Onboarding - revisao final         | `/onboarding`                | Mostrar o que ja funciona, o que esta pendente e o que sera rebaixado.                            | onboarding complete + pending list            | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 13    | Home - workspace novo              | `/`                          | Mostrar proximo passo real para workspace sem demo.                                               | home summary/config status                    | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 14    | Home - demo acme                   | `/`                          | Mostrar pendencias, atalhos e resultados derivados sem parecer console tecnico.                   | snapshot demo + resolver                      | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 15    | Configuracoes - organizacao/perfil | `/settings`                  | Editar/ver perfil, modo e stack sem divergir do onboarding.                                       | workspace/profile/mode/stack APIs             | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 16    | Configuracoes - pessoas/papeis     | `/settings`                  | Gerenciar pessoas, times, grupos, convites, papeis e autoridade herdada.                          | members/roles APIs                            | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 17    | Configuracoes - governance host    | `/settings`                  | Criar/vincular host e mostrar fit-check/risco por distribuicao.                                   | governance-host APIs                          | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 18    | Configuracoes - fontes             | `/settings` + `/sources`     | Mostrar as mesmas fontes e estados da tela dedicada.                                              | work-sources APIs                             | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 19    | Configuracoes - assistente         | `/settings`                  | Alterar provider/defaults depois do onboarding.                                                   | assistant APIs                                | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 20    | Configuracoes - integracoes        | `/settings`                  | Configurar/testar adapters quando houver mecanismo real.                                          | integration APIs/catalog                      | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 21    | Fontes de trabalho dedicada        | `/sources`                   | Cadastrar fonte local/cloud/manual de modo simples e instrutivo.                                  | work-sources add/scan/browser-scan            | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 22    | Planejamento de ciclo              | `/planning`                  | Criar ciclo, objetivo, metrica e target; contexto opcional progressivo.                           | future commands                               | `nao-iterado` | `nao-validado-visual` | `bloqueado`               |       |
| 23    | Registro de iniciativa             | `/intake`                    | Registrar uma aposta/necessidade sem breakdown tecnico inicial.                                   | proposal/register command parcial             | `nao-iterado` | `nao-validado-visual` | `bloqueado`               |       |
| 24    | Triagem/matcher                    | `/triage`                    | Transformar duvidas em itens e sugerir repos/fontes sem decidir sozinho.                          | triage + matcher multi-provider futuro        | `nao-iterado` | `nao-validado-visual` | `bloqueado`               |       |
| 25    | Gate/ativacao                      | `/gates`                     | Aprovar/descartar/promover com autoridade e evidencia visiveis.                                   | gate commands existentes/parciais             | `nao-iterado` | `nao-validado-visual` | `bloqueado`               |       |
| 26    | Execucao/trabalho                  | `/work`                      | Ver repo-work, status, acks e pendencias operacionais.                                            | demo/read-only + commands parciais            | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 27    | Contratos                          | `/contracts`                 | Ver contrato, consumidores, janela, revisoes e contention.                                        | graph/contracts parcial                       | `nao-iterado` | `nao-validado-visual` | `bloqueado`               |       |
| 28    | Resultados/dashboards              | `/results`                   | Acompanhar targets/outcomes/actual/confidence com ECharts.                                        | demo/read-only + resolver                     | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 29    | Mapa de governanca                 | `/map`                       | Explicar caminho entre objetivo, intent, contrato, evidencia e risco.                             | read-model/view-model                         | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 30    | Operacao/incidentes                | `/operations`                | Ver incidentes, follow-ups, SLO e trabalho operacional.                                           | demo/read-only parcial                        | `nao-iterado` | `nao-validado-visual` | `bloqueado`               |       |
| 31    | Auditoria                          | `/audit`                     | Ver quem decidiu o que, quando, com qual evidencia.                                               | event-log/query parcial                       | `nao-iterado` | `nao-validado-visual` | `bloqueado`               |       |
| 32    | Console tecnico                    | `/console`                   | Dar acesso tecnico a grafo/comandos/event-log sem substituir a UX principal.                      | console/read-model/runtime                    | `nao-iterado` | `nao-validado-visual` | `nao-testado`             |       |
| 33    | Spikes visuais                     | `/spikes/visual-stack`       | Avaliar libs de visualizacao sem virar tela de produto.                                           | fixture/read-model                            | `nao-iterado` | `nao-validado-visual` | `nao-aplicavel`           |       |

## 4. Matriz de consistencia entre telas

| Consistencia a provar                                                            | Telas envolvidas                               | Status        | Notas |
| -------------------------------------------------------------------------------- | ---------------------------------------------- | ------------- | ----- |
| Perfil escolhido aparece igual em onboarding, Home e Settings.                   | `/onboarding`, `/`, `/settings`                | `nao-testado` |       |
| Regra de acumulo sensivel altera copy/recomendacao e configuracao efetiva.       | `/onboarding`, `/settings`                     | `nao-testado` |       |
| Onboarding parcial retoma no passo certo e Home mostra card de continuar.        | `/onboarding`, `/`                             | `nao-testado` |       |
| Logout limpa sessao, mas nao apaga workspace nem event-log.                      | shell, `/signup`, `/organizations`             | `nao-testado` |       |
| Workspace novo nao mostra dados da demo acme.                                    | `/organizations`, `/`, `/settings`, `/console` | `nao-testado` |       |
| Governance host criado/vinculado destrava console e aparece em Settings.         | `/settings`, `/console`, `/`                   | `nao-testado` |       |
| Fonte adicionada em `/sources` aparece igual em Settings e Home.                 | `/sources`, `/settings`, `/`                   | `nao-testado` |       |
| Fonte sem Git fica rebaixada como snapshot/manual, nao como evidencia auditavel. | `/sources`, `/settings`, `/results`            | `nao-testado` |       |
| Assistente local salvo no onboarding aparece em Settings.                        | `/onboarding`, `/settings`                     | `nao-testado` |       |
| Provider cloud nao fica ativo sem aprovacao de egress.                           | `/onboarding`, `/settings`                     | `nao-testado` |       |
| Read-model derivado nunca permite acao sem sourceRevision/baseRevision atual.    | `/map`, `/results`, `/work`, `/console`        | `nao-testado` |       |
| Demo acme e workspace real sao claramente distintos.                             | `/organizations`, `/`, `/settings`             | `nao-testado` |       |

## 5. Proxima ordem sugerida

1. Signup, logout e multi-workspace.
2. Onboarding completo com estado limpo.
3. Settings refletindo exatamente o que foi escolhido no onboarding.
4. Fontes de trabalho e governance host.
5. Assistente/integracoes.
6. Home operacional para workspace novo.
7. Map/results/work usando dados reais do workspace.
