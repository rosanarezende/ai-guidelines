# Governance Demo Policy Handbook

> **Escopo:** regras explicaveis para usuarios e assistentes sobre o que o app bloqueia, avisa, rebaixa ou registra.
> **Autoridade:** este handbook explica politicas do app. O modelo conceitual continua em [`../model.yml`](../model.yml), e as decisoes de produto ficam em [`APP-DECISIONS.md`](APP-DECISIONS.md).
> **Uso por assistente:** respostas devem citar a politica aplicavel e explicar a consequencia sem inventar excecao. Assistente e Cup/CWP podem sugerir proximo passo, mas nao podem aprovar, reclassificar, promover trust ou executar mutacao.

## 1. Principio geral

O app nao existe para bloquear trabalho pequeno. Ele existe para preservar a capacidade de responder:

- quem decidiu;
- com qual autoridade;
- com qual evidencia;
- em qual revisao;
- com que risco;
- o que foi excecao;
- o que ainda precisa revisao.

Em perfis menores, como `compact`, a regra e:

> O app nao bloqueia fragilidade organizacional. O app bloqueia falsificacao de confianca, perda de auditoria e risco de vazamento.

## 2. Niveis de enforcement

| Nivel          | Significado                                          | Quando usar                                                                             |
| -------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `allow`        | deixa seguir sem pendencia relevante                 | dado verificavel, autoridade resolvida e risco baixo                                    |
| `warn`         | deixa seguir, mas mostra limitacao                   | evidencia rebaixada, acumulacao comum, informacao incompleta mas nao enganosa           |
| `review-later` | deixa seguir e cria revisao em cadencia              | fragilidade organizacional recuperavel                                                  |
| `downgrade`    | aceita, mas nao conta como prova forte               | fonte manual, pasta local, self-attestation, provider sem API                           |
| `break-glass`  | deixa seguir apenas com justificativa, TTL e revisao | excecao necessaria, risco conhecido e rastreavel                                        |
| `block`        | nao deixa executar a mutacao                         | apagar trilha, aumentar trust sem prova, reduzir seguranca, publicar dashboard enganoso |

## 3. Politica do perfil compact

`compact` e para times pequenos que conseguem alguma separacao de responsabilidades, mas nao operam como uma organizacao `full`.

### 3.1 O que compact aceita com aviso

| Caso                     | Exemplo                                                                      | O app faz                                             | Por que                                                |
| ------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| Self-attestation tecnica | Ana define meta de latencia e anexa medicao porque so ela acessa o dashboard | aceita, marca `self-attested`, cria revisao posterior | bloquear criaria bypass; a limitacao fica visivel      |
| Fonte manual             | CSV exportado de planilha anexado como evidencia                             | aceita como `declared` ou `snapshot-only`             | melhor evidencia rebaixada do que nada                 |
| Acumulo de papel         | mesma pessoa e `technical-owner` e `source-owner`                            | aceita, mostra acumulacao e impacto                   | times pequenos acumulam papeis de forma legitima       |
| Excecao de processo      | aprovar resultado hoje sem segunda pessoa por prazo externo                  | exige justificativa, marca excecao e agenda revisao   | decisao e recuperavel se ficar auditavel               |
| Pasta cloud sem API      | pasta local sincronizada com Google Drive sem provider conectado             | aceita como `cloud-sync-unverified`                   | ha snapshot local, mas nao prova revision/autoria/sync |

Texto para assistente:

> O app deixou seguir porque isso e uma fragilidade visivel, nao uma falsificacao de prova. A decisao ficou registrada com confianca rebaixada e deve ser revisada depois.

### 3.2 O que compact bloqueia

| Caso                                 | Exemplo                                                            | O app faz                                 | Por que                                          |
| ------------------------------------ | ------------------------------------------------------------------ | ----------------------------------------- | ------------------------------------------------ |
| Apagar event-log                     | remover eventos antigos para "limpar historico"                    | bloqueia                                  | sem trilha nao ha auditoria                      |
| Reescrever event-log                 | editar evento passado em vez de criar correcao/supersede           | bloqueia                                  | altera a memoria governada                       |
| Aumentar trust sem prova             | mudar `declared` para `provider-audited` manualmente               | bloqueia                                  | transforma declaracao em prova falsa             |
| Reduzir classificacao sensivel       | mudar `restricted` para `internal` para enviar ao assistente cloud | bloqueia ou exige break-glass forte       | risco de vazamento                               |
| Desativar egress policy              | desligar controle externo para testar matcher                      | bloqueia ou exige break-glass com TTL     | o controle existe para evitar vazamento          |
| Remover ultimo admin                 | retirar o ultimo `workspace-admin`                                 | bloqueia                                  | workspace fica sem recuperacao                   |
| Remover ultimo security-owner        | retirar a ultima autoridade de egress/security                     | bloqueia                                  | policy fica sem dono                             |
| Publicar outcome sem contrato minimo | somar "+8%" no dashboard sem fonte, janela ou attester             | bloqueia rollup; permite nota declarativa | dashboard nao pode somar numero sem prova minima |

Texto para assistente:

> O app bloqueou porque a acao reduziria a capacidade de auditar, aumentaria o nivel de confianca sem evidencia ou criaria risco de vazamento. Registre uma correcao, conecte uma fonte verificavel, use break-glass quando permitido, ou envolva a autoridade exigida.

## 4. Politica de fontes de trabalho

### 4.1 Trust levels

| Trust level             | O que significa                                                   | O que nao prova                                                 |
| ----------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------- |
| `snapshot-only`         | app leu arquivos locais e calculou hash                           | autoria, historico remoto, revisao independente                 |
| `cloud-sync-unverified` | pasta parece sincronizada por Drive/OneDrive/Dropbox, mas sem API | revision remota, autor, sync completo                           |
| `provider-versioned`    | provider conectado trouxe revision/version id e metadados         | revisao humana ou audit log completo, salvo se provider trouxer |
| `provider-audited`      | provider trouxe audit logs/identity suficientes                   | nao substitui Git para prova de codigo/release                  |
| `declared`              | humano anexou ou declarou evidencia                               | prova independente                                              |
| `untrusted`             | validacao falhou                                                  | nada alem do alerta                                             |

### 4.2 Exemplos

| Fonte                            | Como entra                                     | Pode alimentar                              | Nao pode provar sozinha                    |
| -------------------------------- | ---------------------------------------------- | ------------------------------------------- | ------------------------------------------ |
| Pasta local comum                | `local-folder`, `snapshot-only`                | contexto, intake, evidencia manual          | execucao de codigo, release, contrato      |
| Pasta Google Drive local sem API | `cloud-synced-folder`, `cloud-sync-unverified` | contexto e evidencia rebaixada              | historico/autoria/sync remoto              |
| Google Drive API                 | `provider-versioned`                           | docs, planilhas, evidencias com revision id | mudanca de codigo                          |
| Google Workspace audit           | `provider-audited` quando autorizado           | eventos auditaveis de Drive                 | decisao governada sem membership/authority |
| Figma API                        | `provider-versioned`                           | design/version/export hash                  | entrega em repo ou release                 |
| CSV manual                       | `declared`                                     | evidencia manual                            | actual auditado sem attester               |

Texto para assistente:

> Esta fonte pode ser usada, mas com confianca limitada. Para elevar o nivel de prova, conecte o provider pela API, capture revision id/export hash, defina attester e janela, ou versiona a fonte em Git quando fizer sentido.

## 5. Politica de integracoes e ativacao

### 5.1 Regras

- Integracoes potencializam o framework; nao substituem o SSOT file-first.
- Toda integracao deve declarar se le, escreve, exporta, importa, projeta ou
  apenas sugere.
- Por padrao, integracao externa nao escreve YAML/event-log autoritativo.
- Integracao que escreve estado autoritativo exige adapter-contract explicito,
  sponsor, security-owner, audit e rollback.
- Login externo nao concede membership, role nem authority automaticamente.
- Provider conectado pode ficar `limited` se nao provar capability para uma
  funcao especifica.
- Cloud/endpoint externo exige egress policy, classificacao maxima e allowlist.
- O app deve mostrar o que continua funcionando sem a integracao antes de pedir
  permissao.
- `em-breve` significa backlog priorizado, nao mecanismo ativo.

### 5.2 Exemplos

| Caso                                        | O app faz                                   | Por que                                               |
| ------------------------------------------- | ------------------------------------------- | ----------------------------------------------------- |
| GitHub login conectado                      | autentica pessoa                            | nao conecta repos nem concede authority               |
| GitHub work-source solicitado               | pede permissao de repos selecionados        | fonte de trabalho e fluxo separado do login           |
| Pasta local sem Git                         | aceita como `snapshot-only`                 | contexto util, mas sem autoria/historico independente |
| Jira importer sem direcao de sync           | bloqueia ativacao                           | evita segundo SSOT e split-brain                      |
| Observability cloud em workspace controlled | exige security-owner/egress                 | pode expor metricas operacionais sensiveis            |
| SonarQube local com relatorio hashado       | aceita como evidencia limitada/configuravel | evidencia melhora repo-work, mas nao decide gate      |
| MUI X Pro/AG Grid Enterprise                | entra como presentation adapter             | troca renderer, nao dominio/view-model                |
| Provider marcado manualmente como connected | bloqueia ou rebaixa para declarado          | conexao precisa mecanismo/probe                       |

Texto para assistente/Cup:

> Esta integracao pode reduzir trabalho manual ou elevar a confianca, mas nao substitui a governanca autoritativa. Antes de conectar, veja quais dados ela acessa, quem pode aprovar, como falha e o que continua funcionando sem ela.

### 5.3 Autoridade minima

| Tipo de integracao                         | Solicitacao comum                              | Ativacao minima                                                  |
| ------------------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------- |
| Local sem egress e baixo risco             | workspace-admin, technical-owner, source-owner | workspace-admin ou self-governed no solo                         |
| Fonte de trabalho/repo                     | workspace-admin, source-owner, technical-owner | source-owner/technical-owner; security-owner se controlled/cloud |
| Assistente remoto/cloud                    | workspace-admin                                | security-owner; sponsor se dado sensivel ou workspace controlled |
| Identity provider / SSO                    | workspace-admin, sponsor                       | sponsor + security-owner                                         |
| Backlog importer                           | workspace-admin, product-owner, sponsor        | sponsor ou workspace-admin + contrato de sync                    |
| Observabilidade/analytics/BI               | technical-owner, metric-owner, attester        | metric-owner + security-owner se cloud                           |
| Integracao que escreve estado autoritativo | sponsor ou workspace-admin                     | sponsor + security-owner + adapter-contract explicito            |

No perfil solo, solicitacao e ativacao podem ser a mesma pessoa, mas isso deve
ficar visivel como colapso/self-governed quando afetar independencia.

## 6. Politica de assistente e egress

### 6.1 Regras

- Assistente sugere, explica e acelera; nao decide.
- Workspace pode ter varios providers de assistente e matcher.
- Cada funcao pode ter um provider default diferente.
- A pessoa pode trocar provider em uma interacao especifica quando a policy permitir.
- Endpoint local loopback tem menor risco, mas ainda precisa de prompt seguro e redaction.
- Endpoint nao-loopback exige policy de egress.
- Cloud provider exige allowlist e classificacao maxima permitida.
- Modelo conectado sem `capability-probe` fica `limited`.
- Nenhum modelo deve receber dado `restricted` sem policy explicita.
- Lexical deterministico e permitido como baseline local para matcher, mas nao transforma sugestao em decisao.
- Sugestao de matcher precisa registrar provider, modelo, input classification, source revision, score, unknowns e decisao humana.

### 6.2 Exemplos

| Caso                                        | O app faz                                                   | Por que                                                           |
| ------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| Ollama em `127.0.0.1`                       | permite teste local com prompt inocuo                       | nao sai da maquina por default                                    |
| Ollama em servidor remoto                   | exige policy/egress                                         | nao e mais local                                                  |
| OpenAI-compatible desconhecido              | exige health, model discovery e capability probe            | API compativel nao prova capacidade                               |
| Claude/Codex/Gemini                         | exige `cloud-approved`, allowlist e classificacao permitida | cloud pode ser util, mas nao recebe contexto sensivel por default |
| Varios providers deram sugestoes diferentes | mostra diferencas e registra escolha humana                 | comparar sugestoes e util; decidir continua humano                |
| Cloud provider com dado restricted          | bloqueia ate policy aprovada                                | risco de vazamento                                                |
| Matcher pede contexto com secrets           | redaction/secret scan antes de enviar                       | prompt nao pode carregar segredo                                  |

Texto para assistente:

> O assistente esta limitado pela politica de egress e pela classificacao dos dados. Ele pode explicar a pendencia e sugerir como resolver, mas nao pode ignorar policy nem enviar contexto bloqueado.

### 6.3 Cup/CWP

Cup e a interface contextual de coautoria do app. Ele usa as mesmas politicas
de assistente, egress, fonte, membership e outcome. Cup nao tem privilegio
especial por estar dentro da UI.

Regras especificas:

- Cup so ve o contexto que a rota e o resolver de policy autorizarem.
- Cup deve explicar quais dados nao consegue ver quando a policy bloquear.
- Cup pode usar modo deterministico sem provider externo para explicar a tela.
- Cup so pode chamar provider local/cloud depois de health, capability probe,
  classificacao e egress.
- Cup pode preparar rascunho ou dry-run; confirmacao humana continua obrigatoria.
- Cup deve registrar provider/modelo/policy quando uma sugestao influenciar uma
  decisao governada.

Texto para Cup:

> Posso ajudar com o que esta visivel nesta tela e com as politicas que se aplicam ao seu papel. Se algo estiver bloqueado por permissao, classificacao ou egress, eu explico o motivo e o proximo passo seguro em vez de contornar a regra.

## 7. Politica de outcomes e dashboards

### 7.1 Regra de rollup

Dashboard nao soma declaracao como se fosse prova.

Para um outcome entrar em rollup, precisa no minimo:

- target autorizado;
- janela;
- fonte ou evidencia;
- attester;
- relacao com intent/outcome;
- unidade comparavel;
- `sourceTrust` suficiente para o tipo de numero.

### 7.2 Exemplos

| Caso                          | O app faz                                     | Por que                                  |
| ----------------------------- | --------------------------------------------- | ---------------------------------------- |
| "+8%" sem fonte               | bloqueia rollup; aceita como nota declarativa | numero sem fonte engana stakeholder      |
| CSV manual com attester       | pode aparecer como declarado/rebaixado        | tem evidencia, mas nao provider auditado |
| BI export com hash e attester | pode entrar com trust definido                | ha janela, evidencia e responsavel       |
| Provider auditado             | pode entrar com confianca maior               | revision/evento vem do provider          |

Texto para assistente:

> O resultado pode ser registrado, mas ainda nao pode subir para o dashboard como actual confiavel. Falta fonte, janela, attester, unidade comparavel ou nivel minimo de confianca.

## 8. Politica de role, membership e authority

### 8.1 Regras

- Login nao e membership.
- Membership nao e authority.
- Papel atribuido a outra pessoa comeca como `proposed`.
- Papel so vira efetivo quando a pessoa aceita ou quando vem de grupo/time com policy explicita.
- Service account precisa owner humano, escopo e TTL.
- IdP externo autentica; nao concede authority governada automaticamente.

### 8.2 Exemplos

| Caso                                 | O app faz                       | Por que                              |
| ------------------------------------ | ------------------------------- | ------------------------------------ |
| Admin atribui `security-owner` a Bia | cria role assignment `proposed` | Bia precisa aceitar responsabilidade |
| Grupo GitHub sincronizado            | pode sugerir membership/group   | nao vira authority sem policy        |
| Ultimo admin removido                | bloqueia                        | workspace ficaria sem recuperacao    |
| Service account sem owner            | bloqueia                        | nao ha responsavel humano            |

Texto para assistente:

> A pessoa esta autenticada, mas ainda nao tem autoridade efetiva para esta acao. Convite, membership e papel precisam estar aceitos ou resolvidos por policy.

## 9. Como o app deve explicar decisoes

Toda explicacao deve seguir este formato:

1. **O que aconteceu:** acao aceita, rebaixada, pendente, bloqueada ou enviada para revisao.
2. **Qual politica se aplica:** compact, source trust, egress, outcome, membership ou authority.
3. **Por que:** risco concreto, nao jargao.
4. **O que fazer agora:** conectar fonte, aceitar papel, pedir revisao, registrar break-glass, anexar evidencia, ou corrigir configuracao.

Exemplo:

> O resultado foi registrado, mas nao entrou no dashboard. A politica de outcomes exige fonte, janela e attester para rollup. Como a evidencia veio de uma pasta local sem API, ela ficou `snapshot-only`. Para elevar a confianca, conecte o Google Drive ou anexe um export com hash e attester.
