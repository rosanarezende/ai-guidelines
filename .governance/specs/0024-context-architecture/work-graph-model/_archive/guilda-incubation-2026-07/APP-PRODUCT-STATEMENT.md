# Declaracao de produto do app de governanca

> **Status:** contrato de intencao do produto para a `governance-demo`.
> **Data:** 2026-07-04.
> **Autoridade:** este documento define o que o app se propoe a ser e como ele se encaixa no framework/CLI. O modelo conceitual continua em [`../model.yml`](../model.yml); a topologia portal/Git fica em [`PRODUCT-TOPOLOGY.md`](PRODUCT-TOPOLOGY.md); as telas ficam em [`APP-FUNCTIONAL-SPEC.md`](APP-FUNCTIONAL-SPEC.md); as decisoes incrementais ficam em [`APP-DECISIONS.md`](APP-DECISIONS.md).

## 1. Em uma frase

O app e uma superficie humana open-source, desktop local-first e Git-backed para
operar governanca file-first do work graph sem exigir que a pessoa use YAML,
console tecnico ou comandos de terminal para cada decisao.

## 2. O que o app se propoe a ser

O app deve ser uma **superficie humana de governanca de trabalho**.

A v1 fundadora prioriza o uso **desktop local-first**: uma pessoa abre seus
workspaces, pastas e repos locais, cria ou vincula um governance host
Git-backed, trabalha offline quando necessario e sincroniza via Git/GitHub
quando fizer sentido. O portal web continua importante, mas como superficie
complementar para convites, pessoas nao tecnicas, leitura compartilhada,
portfolio publico e topologias self-hosted/hosted.

O produto deve:

- criar e selecionar workspaces/organizacoes;
- autenticar pessoas sem guardar senhas, usando magic link e provedores quando houver portal;
- gerenciar convites, memberships e registry de workspaces quando houver portal;
- guiar a adocao inicial do framework;
- configurar governance host, membros, papeis, fontes de trabalho, assistente e integracoes;
- oferecer um hub de integracoes para conectar ferramentas existentes com status, risco, permissao e alternativa manual claros;
- oferecer o Cup, um par contextual de trabalho que explica, orienta e rascunha proximos passos sem decidir pela pessoa;
- ajudar a planejar ciclos, registrar iniciativas, triar, decidir gates, quebrar trabalho, acompanhar execucao e publicar outcomes;
- mostrar dashboards e pendencias em linguagem humana;
- preservar a trilha de auditoria: quem decidiu, com qual autoridade, em qual revisao, com qual evidencia;
- integrar com ferramentas que a empresa ja usa, sem transformar essas ferramentas em segundo SSOT.

O app deve tornar a governanca **operavel por humanos**, nao apenas validavel por scripts.

## 3. O que o app nao e

O app nao deve ser:

- um substituto da CLI `ai-guidelines`;
- um segundo SSOT escondido em banco proprio;
- um Jira/Linear simplificado;
- um sistema completo de OKR/portfolio no primeiro ciclo;
- um produto pago assumido por default;
- um agente autonomo que decide gates, classificacao, ownership ou egress;
- um dashboard que mascara dado auto-declarado como evidencia verificada.

Se o app gravar algo que a CLI/runtime nao entende, o desenho esta errado.

## 4. Camadas do sistema

| Camada               | Papel                                                                                     | Exemplo atual                               |
| -------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------- |
| Desktop local        | Abre pastas/repos, le Git local, cria host, indexa SQLite e permite trabalho offline.     | Spike S2 desktop local-first                |
| Portal/control plane | Guarda conta, sessao, convite, membership e registry minimo de workspace quando usado.    | Better Auth + app Next                      |
| Modelo/SSOT          | Define ontologia, fluxos, estados, edges, politicas e invariantes.                        | `../model.yml`                              |
| Governance host      | Guarda a governanca real em arquivos versionados pelo usuario.                            | GitHub repo dedicado ou `.governance-host/` |
| Runtime/core         | Executa validacao, comandos, resolvers, event-log, read-models e adapters.                | `governance-demo/backend/src/`              |
| CLI `ai-guidelines`  | Superficie headless para terminal, CI, scripts e automacao repo-first.                    | `npm run flow -- ...`, `dist/cli/main.js`   |
| App                  | Superficie humana para onboarding, configuracao, decisao, dashboards e operacao diaria.   | `governance-demo/frontend/`                 |
| Cup/CWP              | Camada contextual de coautoria dentro do app; explica, sugere e prepara rascunhos.        | overlay transversal planejado               |
| Mock API/testes      | Simula persistencia mutavel para UX/e2e, sem contar como governanca real.                 | `governance-demo/mock-api/` planejada       |
| Contratos de teste   | Define comportamento esperado antes da implementacao e evita drift funcional.             | `TESTING-STRATEGY.md` + `test/contracts/`   |
| Integracoes          | Evidence providers, importers, assistants, projections e presentation adapters opcionais. | `/integrations` + `integration-catalog.yml` |

Regra central:

```text
Desktop guarda indice local e acesso autorizado a filesystem/repos.
Portal guarda identidade e acesso ao workspace quando a topologia usa portal.
Governance host guarda a governanca real.
CLI e app sao superficies diferentes sobre o mesmo modelo/runtime.
Nenhuma superficie pode inventar estado autoritativo que a outra nao consegue ler.
```

O app deve ser desenvolvido com a propria disciplina que ele promove:
funcionalidade nasce com contrato de teste, e mudanca funcional exige atualizar
o contrato antes de alterar a implementacao.

## 5. Relacao com a CLI `ai-guidelines`

O pacote atual do repositorio e `ai-guidelines`. Neste documento, "CLI" significa a superficie distribuivel desse framework (`dist/cli/main.js`, exposta por `npx ai-guidelines` ou `npm run flow -- ...` no repo).

A CLI continua sendo a superficie primaria para:

- `init`, `adopt`, `update` e bootstrap de repos;
- checks locais e CI;
- fluxos governados de review/work/decide;
- validacao de contratos do framework;
- automacao sem interface grafica;
- operacao por times que preferem terminal.

O app deve se integrar assim:

1. **Mesmo layout file-first.** O app cria/le/atualiza o mesmo governance host e os mesmos sidecars que a CLI entende.
2. **Mesmos comandos conceituais.** Uma acao da UI deve mapear para um comando/use case nomeado (`workspace.create`, `profile-declaration.save`, `proposal.create`, `gate.decide`, `outcome.publish`, etc.).
3. **Mesma revisao/base-revision.** A UI sempre mostra e envia revisao/base-revision quando a mutacao exige consistencia.
4. **Mesma trilha de auditoria.** App e CLI gravam event-log/audit de forma compatvel.
5. **Mesma politica de falha.** O que falha fechado na CLI tambem falha fechado no app.
6. **Sem shell-out como arquitetura principal.** O app pode chamar a CLI como ponte temporaria para comandos ja existentes, mas o alvo e compartilhar dominio/runtime/contratos, nao automatizar terminal por baixo da tela.

## 6. Fronteira entre app, CLI e backend

O desenho alvo e:

```text
Usuario humano
  -> App Next/MUI
  -> API/backend da governance-demo
  -> dominio/runtime/ports/adapters
  -> governance host + sidecars file-first

Usuario tecnico/CI
  -> CLI ai-guidelines
  -> dominio/runtime/ports/adapters
  -> governance host + sidecars file-first
```

Isso evita dois problemas:

- a UI virar apenas uma casca que edita YAML sem invariantes;
- a CLI virar um caminho paralelo que aceita estado que o app nao reconhece.

## 7. Produto open-source e desktop primeiro

O framework nasceu open-source. Portanto, o app deve ser desenhado primeiro como:

- open-source;
- desktop local-first;
- usavel localmente por uma pessoa sem conta de portal;
- capaz de trabalhar offline sobre repos e governance host locais;
- capaz de conectar um governance host Git-backed do proprio usuario;
- self-hostable quando usado como portal compartilhado;
- usavel por times via Git/GitHub e, quando necessario, portal compartilhado;
- transparente sobre o que e demo, mock, rascunho, evidencia manual e governanca real.

Isso nao impede um portal hospedado pela mantenedora no futuro. Pelo contrario:
o portal pode ser uma porta publica/portfolio do produto e uma superficie
melhor para pessoas de negocio, design, investimento e lideranca. A restricao e
outra: mesmo em portal hospedado, o conteudo governado deve morar no Git/host do
usuario, e o portal deve guardar apenas conta, sessao, convite, membership,
registry minimo de workspace e eventos de jornada permitidos por politica.

PWA pode existir como canal leve, demo publica ou superficie de leitura, mas nao
deve ser vendido como substituto do desktop para quem precisa operar codigo e
repos locais.

Nao devemos introduzir billing, plano pago, tenant cloud ou licenciamento como
se fossem requisitos centrais agora.

Papeis como `payer` ou `billing-owner` so devem existir quando houver um fluxo real de custo, contrato, cloud, compra ou aprovacao financeira. Ate la, devem ser opcionais ou nomeados como `cost-owner` quando o assunto for custo operacional, nao cobranca do produto.

## 8. Definicao de sucesso do app

O app comeca a sair do papel quando uma pessoa consegue, sem console tecnico:

1. entrar por magic link/provedor ou experimentar demo anonima sem conta;
2. criar ou selecionar workspace;
3. no desktop, escolher uma pasta local de trabalho;
4. detectar repos Git, dirty state, revisoes e fontes de trabalho;
5. escolher onde mora o governance host;
6. convidar ou cadastrar membros quando a topologia envolver mais pessoas;
7. atribuir papeis com aceite/policy;
8. conectar uma fonte de trabalho;
9. configurar ou dispensar assistente;
10. planejar ciclo minimo;
11. registrar iniciativa;
12. passar por triagem/gate;
13. gerar breakdown;
14. acompanhar repo-work/contratos;
15. publicar outcome;
16. ver resultado e pendencias;
17. auditar decisoes.

Enquanto a maioria desses passos depender de payload manual no console tecnico, o app e uma sim tecnica com UX parcial, nao uma superficie operacional completa.

Cup conta como sucesso quando reduz friccao nesses passos sem enfraquecer a
governanca: ele pode explicar, sugerir e preparar rascunhos, mas a mutacao
continua passando pelo mesmo backend, comando, policy, revisao e confirmacao
humana.

## 9. Principio de integracao com ferramentas externas

O app deve explicar sempre:

```text
O framework ja prove o modelo, o SSOT file-first, comandos, validacoes e auditoria.
Ferramentas externas conectadas servem para trazer evidencia, contexto, automacao e conveniencia.
Elas nao substituem a governanca autoritativa.
```

Exemplos:

- Git local ou provider remoto ajuda a provar revisao de codigo.
- CI ajuda a provar teste.
- SonarQube/alternativas ajudam a provar qualidade de codigo.
- Observabilidade ajuda a provar actual/outcome operacional.
- Ollama/assistente ajuda a explicar, sugerir e acelerar matcher/triagem.
- Backlog externo pode importar trabalho, mas nao vira SSOT sem adapter-contract explicito.

As integracoes devem aparecer de duas formas: um hub central para comparar,
conectar, testar e desativar providers; e sugestoes contextuais nas telas onde
elas realmente aumentam confianca ou reduzem trabalho manual. A primeira frase
de qualquer integracao deve deixar claro o que o framework ja faz sem ela.

## 10. Linguagem para usuarios

O app deve evitar termos internos como primeira camada de copy:

| Interno         | Copy humana preferida              |
| --------------- | ---------------------------------- |
| governance host | onde a governanca vai morar        |
| sidecar         | arquivos de governanca da fonte    |
| resolver        | verificacao                        |
| event-log       | historico/auditoria                |
| base-revision   | versao usada para decidir          |
| work graph      | mapa do trabalho                   |
| GlobalRef       | referencia                         |
| matcher         | sugestao de fonte/time/repositorio |

O console tecnico pode expor os termos tecnicos; o caminho feliz do app deve explicar consequencia e responsabilidade.
