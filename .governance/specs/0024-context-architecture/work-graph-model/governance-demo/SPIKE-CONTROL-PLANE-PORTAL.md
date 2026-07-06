# Spike S1 - Portal/control plane sobre governance host Git-backed

> Status: implementado como bancada interna inicial em
> `/spikes/control-plane-portal`.
> Data: 2026-07-06.  
> Decisoes relacionadas: `APP-DECISIONS.md` QRD-36, QRD-41; APP-38..41; SEC-13.  
> Objetivo: validar se o app pode oferecer uma experiencia humana multiusuario
> para negocio/design/investidor sem quebrar o SSOT file-first/Git-backed da
> governanca.

## 1. Problema

O modelo local atual funciona para dogfood individual, mas nao responde bem ao
cenario:

1. uma mantenedora trabalha sozinha hoje;
2. quer versionar a governanca em um repo GitHub dedicado;
3. quer convidar, depois, pessoas de negocio, design e investimento;
4. essas pessoas precisam usar o app sem precisar operar Git, PRs ou branch
   protection manualmente.

Git/GitHub e adequado como cofre auditavel do governance host. Ele nao e uma boa
UX para todos os perfis. O spike testa a separacao:

```text
portal/control plane -> conta, sessao, convite, workspace registry
governance host Git  -> roles governados, iniciativas, decisions, event-log
work repos           -> codigo, design, docs, metricas, evidencias
```

## 2. Hipoteses

H1. O portal pode criar conta, workspace, convite e aceite sem armazenar o
conteudo governado como SSOT.

H2. Uma pessoa convidada pode entrar pelo portal sem precisar operar GitHub
diretamente.

H3. GitHub App / Git-backed adapter pode apontar para o governance host e gerar
propostas de alteracao, sem o portal gravar authority efetiva por conta propria.

H4. Login, membership no portal e provider link nao concedem role/authority
governada automaticamente.

H5. Tokens/secrets de provider nao aparecem em payload publico, event-log,
read-model, fixture ou UI.

H6. O mesmo contrato funciona com SQLite local e Postgres/shared, mesmo que o
spike implemente primeiro apenas SQLite.

## 3. Fora de escopo

- Escolher nome publico do produto.
- Escolher licenca final do app/server.
- Criar SaaS operado pela mantenedora.
- Conectar a GitHub real com credenciais pessoais nesta fase, salvo se for em
  modo dry-run/local e sem token versionado.
- Transformar Better Auth em decisao final sem evidencias.
- Mover authority efetiva para o control plane.
- Substituir governance host file-first/Git-backed por banco de dados.

## 4. Arquitetura alvo do spike

### 4.1 Control plane

Pode guardar:

- account id;
- email/name basicos;
- session;
- workspace registry;
- convite e status;
- provider link metadata;
- ponte para GitHub installation/repo pointer;
- preferencias de portal.

Nao pode guardar como SSOT:

- roles governados efetivos;
- decisoes;
- iniciativas;
- outcomes;
- event-log de governanca;
- conteudo de repos;
- evidencias sensiveis;
- tokens/secrets em payloads publicos.

### 4.2 Governance plane

Continua sendo:

- governance host em pasta local ou Git;
- repo dedicado `workspace-governance` ou `.governance-host/`;
- arquivos governados;
- mutation envelope;
- event-log;
- sourceRevision/fail-closed.

### 4.3 Git-backed bridge

O spike deve modelar um adapter de ponte, mesmo que fake/dry-run:

```text
workspace -> provider link -> governance host ref
proposal  -> branch/commit/PR candidate
read      -> sourceRevision + filtered read model
write     -> proposal, never silent authority mutation
```

No futuro, o adapter real de GitHub App deve respeitar:

- acesso minimo ao repo escolhido;
- branch protection;
- CODEOWNERS/required checks quando existirem;
- sourceRevision;
- nada de token em event-log/read-model.

## 5. Fluxos a provar

### Fluxo A - Criadora solo com host Git-backed

1. Rosana cria conta no portal.
2. Cria workspace.
3. Escolhe topologia `git-backed`.
4. Informa/conecta repo de governance host.
5. Portal mostra que Git e cofre/auditoria; portal e interface.
6. Nenhum role governado efetivo nasce apenas por login.

### Fluxo B - Convite para pessoa nao tecnica

1. Rosana convida "Pessoa de negocio".
2. O convite nasce no control plane como pending.
3. A pessoa acessa o portal e cria conta.
4. Aceita convite.
5. Membership de portal e criada.
6. Authority governada continua vazia/pendente ate existir role governado aceito
   no governance host.

### Fluxo C - Proposta de mudanca

1. Pessoa convidada tenta registrar uma iniciativa.
2. Portal cria uma proposta governada, nao uma mutacao silenciosa.
3. A proposta tem sourceRevision.
4. O adapter Git-backed representa branch/PR candidate.
5. Se sourceRevision divergir, falha fechado.

### Fluxo D - Segredo nao vaza

1. Provider link inclui segredo/token simulado.
2. API publica, event-log, read-model e UI nunca exibem o segredo.
3. Teste falha se aparecer substring sensivel.

## 6. Testes obrigatorios

### APP-38

Workspace local continua possivel sem control plane compartilhado.

### APP-39

Workspace shared exige registry compartilhado, self-hosted ou Git-backed bridge
para convite real convergir.

### APP-40

Control plane responde "workspace existe / convidados / provider link" sem
expor conteudo governado.

### APP-41

Login GitHub/Google/OIDC/email autentica conta, mas nao concede membership,
role ou authority automaticamente.

### SEC-13

Token/secret de provider nao aparece em payload publico, event-log, read-model
ou UI.

### ARCH-CP-01

Import/guard impede que camada de portal/control plane importe diretamente
dados internos do governance host como se fossem seu proprio store.

### ARCH-CP-02

Toda proposta de escrita para governance host passa por adapter/proposal com
sourceRevision; nenhuma rota do portal escreve authority efetiva diretamente.

## 7. Entregaveis do spike

Minimo aceitavel:

- rota interna fora da navegacao principal, por exemplo
  `/spikes/control-plane-portal`;
- backend de spike com SQLite local ou store temporario;
- API/testes para signup, workspace, invite, accept, provider link;
- mock/dry-run de GitHub governance host bridge;
- testes APP-40, APP-41, SEC-13 e ARCH-CP;
- review em `_reviews/` com fato vs interpretacao;
- decisao recomendada: Better Auth aprovado, rejeitado ou pendente.

Implementado nesta primeira fatia:

- `@demo/domain` ganhou um kernel puro de spike para topologias, conta,
  workspace, convite, membership, provider link, proposta e sanitizacao.
- `backend/tests/control-plane-portal-spike.test.ts` prova APP-40, APP-41,
  SEC-13, sourceRevision fail-closed e as quatro topologias da QRD-41.
- `frontend/app/spikes/control-plane-portal/` renderiza a bancada interna.
- Better Auth foi instalado no workspace do app e instanciado server-side com o
  plugin `organization`, provando que os endpoints necessarios existem.
- O GitHub bridge ainda e dry-run/modelado, nao usa credenciais reais.

Nao aceitavel:

- UI bonita sem provas de separacao dos planos;
- login concedendo authority;
- token em payload;
- governance host lido e copiado para DB do portal como SSOT;
- commit direto em host sem sourceRevision/proposal.

## 8. Decisoes apos o spike

O spike deve alimentar estas decisoes:

1. Better Auth vira stack escolhida para portal/control plane ou apenas
   alternativa?
2. Git-backed governance host entra como topologia suportada na release inicial?
3. Portal self-hosted entra na release inicial ou fica como beta?
4. Hosted portal operado pela mantenedora continua futuro?
5. Quais fluxos precisam GitHub App real no primeiro release e quais podem
   ficar dry-run/manual?
