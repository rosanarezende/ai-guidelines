# Governance Demo Testing Strategy

Status: active
Owner: work-graph-model / governance-demo
Last updated: 2026-07-05

## 1. Objetivo

A `governance-demo` passa a ser desenvolvida por contrato de comportamento.
Antes de implementar ou refatorar uma tela/fluxo/feature, o comportamento
esperado deve existir como teste versionado.

Isso muda o loop de desenvolvimento:

```text
decisao de produto -> contrato de teste -> teste fixme/failing -> implementacao -> teste active/pass
```

O objetivo nao e testar o que a UI entrega hoje. E escrever o que o produto
deve entregar e adaptar a aplicacao incrementalmente ate os contratos passarem.

## 2. Principios

1. **Teste e contrato governado.**
   Se uma funcionalidade muda, o contrato muda junto. Mudanca funcional sem
   mudanca de teste e suspeita.

2. **Comportamento acima de implementacao.**
   Testes devem observar o que a pessoa consegue fazer, o que fica persistido,
   o que aparece em outras telas e o que e bloqueado/rebaixado. Evitar selectors
   de layout ou estrutura interna.

3. **Fluxos entre telas sao primeira classe.**
   O produto e um sistema de governanca, nao uma colecao de paginas isoladas.
   O teste deve provar consistencia entre onboarding, Home, Settings, Sources,
   Integrations, Cup, Results e Audit.

4. **Skipped/fixme tambem e governado.**
   Um teste pendente precisa de motivo, ID de contrato e proxima fatia. Nao pode
   virar cimiterio invisivel.

5. **Mock valida experiencia; backend real valida governanca.**
   E2E de produto roda contra `mock-api` seedada. Invariantes de governanca,
   transacao, event-log, resolver e adapters continuam nos checks/backend.

6. **Texto pode mudar; contrato funcional nao.**
   Quando copy for parte do contrato de entendimento, usar locators por role e
   nome. Quando copy puder evoluir, usar `data-testid` semantico.

7. **Relatorio e ferramenta de gestao.**
   O resultado dos testes deve mostrar cobertura, pendencias, falhas, traces e
   historico suficiente para decidir a proxima fatia sem navegar manualmente.

## 3. Camadas de teste

| Camada                    | Ferramenta principal                      | Escopo                                                      | Status  |
| ------------------------- | ----------------------------------------- | ----------------------------------------------------------- | ------- |
| Static/typecheck          | TypeScript                                | contratos, dominio, view-models e APIs tipadas              | atual   |
| Domain/use-case           | Vitest (proposto)                         | reducers, policies, commands, adapters sem browser          | futuro  |
| Component/integration UI  | Testing Library + MSW (proposto)          | componentes/steps isolados com requests reais interceptados | futuro  |
| E2E/journey               | Playwright                                | fluxos entre telas, persistencia, auth local, mock-api      | atual   |
| Governance/backend checks | tools/checks + backend tests              | fail-closed, event-log, resolver, adapters                  | atual   |
| Reporting/management      | Playwright HTML/JSON/JUnit; Allure depois | visualizacao e historico de testes                          | inicial |

## 4. Ferramentas escolhidas

### Playwright

Motor principal de E2E e jornadas. Motivos:

- UI Mode e Trace Viewer ajudam a depurar fluxos longos;
- reports HTML/JSON/JUnit sao suficientes para a primeira leva;
- annotations (`fixme`, `skip`, `fail`) permitem backlog executavel;
- locators por role/test id suportam testes menos frageis;
- ja existe configuracao com `mock-api` + Next.

### Vitest

Adicionar quando a primeira fatia exigir testes de dominio/use-case. Usar para:

- reducer de onboarding/configuracao;
- authority/role resolution;
- policy decisions;
- mapping de integration status;
- view-models de mapas/dashboards/tabelas.

### Testing Library

Adicionar quando houver componentes suficientemente estaveis para testes de
UI sem abrir o app inteiro. Regra: testar comportamento acessivel, nao detalhe
interno de React/MUI.

### MSW

Adicionar quando testes de componente/hook precisarem requests HTTP reais sem
subir `mock-api`. Nao substitui a `mock-api` dos E2E.

### Allure Report

Recomendado como proxima camada de gestao quando houver volume de contratos.
Entrar depois da primeira leva Playwright ativa, para evitar instalar reporting
antes de haver sinal suficiente.

### ReportPortal

Opcional futuro para times maiores/self-hosted. Nao entra na primeira leva.

## 5. Estados de contrato de teste

| Estado          | Playwright/Vitest         | Quando usar                                                |
| --------------- | ------------------------- | ---------------------------------------------------------- |
| `active`        | `test(...)`               | comportamento existe e deve passar sempre                  |
| `expected-fail` | `test.fail(...)`          | fluxo roda, mas deve falhar ate a implementacao chegar     |
| `fixme`         | `test.fixme(...)`         | rota/infra ainda ausente ou teste travaria                 |
| `skip`          | `test.skip(...)`          | nao aplicavel naquela configuracao                         |
| `todo`          | `test.todo(...)` (Vitest) | contrato sem corpo ainda, apenas no nivel unitario         |
| `manual`        | somente no YAML           | validacao humana temporaria, com criterio para automatizar |

Regra: `skip` nao pode ser usado para esconder bug. Para bug conhecido, usar
`expected-fail` ou `fixme` com ID.

## 6. Estrutura dos testes

```text
governance-demo/test/
  contracts/
    app-contracts.yml        # inventario governado de contratos
  journeys/
    onboarding-journey.spec.ts
    first-wave-contracts.spec.ts
  reports/                  # gerado, nao versionado
```

O YAML e a fonte de leitura humana; os arquivos `.spec.ts` sao a prova
executavel. Todo contrato relevante deve aparecer nos dois.

## 7. Padrao de ID

| Prefixo   | Uso                         |
| --------- | --------------------------- |
| `APP-xx`  | tela/fluxo principal do app |
| `CUP-xx`  | overlay Cup/CWP             |
| `INT-xx`  | integracoes e providers     |
| `SEC-xx`  | seguranca/egress/authority  |
| `CONS-xx` | consistencia entre telas    |

O ID deve aparecer:

- no `APP-ITERATION-MAP.md`;
- em `test/contracts/app-contracts.yml`;
- no nome do teste Playwright;
- no relatorio quando falhar/pular.

## 8. Seeds

Seeds sao estados iniciais nomeados da `mock-api`. Elas existem para testar
fluxos sem precisar clicar tudo de novo.

Regras:

- cada teste deve declarar a seed que usa;
- seed nao pode esconder comportamento que o teste deveria provar;
- quando o objetivo e testar uma transicao, seed prepara o minimo e o teste
  executa a transicao;
- quando o objetivo e testar consistencia, seed pode criar o estado completo e
  o teste visita varias telas.

Seeds prioritarias para a primeira leva:

- `blank`;
- `partial-onboarding`;
- `workspace-local-host`;
- `workspace-with-local-source`;
- `workspace-with-assistant`;
- `workspace-with-integration-statuses`;
- `demo-acme`.

## 9. Seletores e estabilidade

Preferencia:

1. `getByRole` com nome quando a copy e parte do contrato.
2. `getByLabel` para campos.
3. `getByTestId` para elementos funcionais cuja copy pode mudar.
4. Nunca usar classe MUI, estrutura DOM interna, ordem visual ou seletor CSS
   fragil como contrato.

Nomes de `data-testid` devem ser semanticos:

- `source-wizard-local-project`;
- `onboarding-profile-recommendation`;
- `integration-card-github-work-source`;
- `cup-open-button`;
- `settings-source-list`.

## 10. Contratos entre telas

Toda configuracao que aparece em mais de uma tela precisa de teste de
consistencia.

Exemplos:

- perfil escolhido no onboarding aparece igual na Home e Settings;
- fonte criada em `/sources` aparece igual em Settings e checklist da Home;
- assistente configurado no onboarding aparece em Settings e Cup;
- integracao conectada no hub aparece como sugestao contextual nas telas
  relevantes;
- logout limpa sessao sem apagar workspace/event-log.

## 11. Relatorios

Primeira leva:

- `list` no terminal para feedback rapido;
- `html` para navegacao visual;
- `json` para futura ingestao pela propria governance-demo;
- `junit` para CI/historial externo.

Segunda leva:

- Allure Report para historico, anexos e gestao de pendencias;
- opcional: ReportPortal quando houver necessidade real de dashboard
  multi-run/self-hosted.

## 12. Criterio para iniciar uma tela

Antes de implementar/refatorar uma tela:

1. criar/atualizar contrato no YAML;
2. criar teste `fixme` ou `expected-fail`;
3. confirmar seed necessaria;
4. implementar a tela/API;
5. ativar o teste;
6. atualizar `APP-ITERATION-MAP.md`.

## 13. Primeira leva recomendada

Ordem:

1. Signup, logout e multi-workspace.
2. Onboarding resume/persistencia.
3. Onboarding perfil/responsabilidades.
4. Pessoas/papeis com aceite proposto.
5. Governance host.
6. Sources reformulada.
7. Settings espelhando onboarding.
8. Integrations hub basico.
9. Cup shell/contexto local.

Nada disso depende de navegar manualmente como fonte de verdade. A navegacao
manual continua util para UX, mas o contrato funcional passa a ser automatizado.
