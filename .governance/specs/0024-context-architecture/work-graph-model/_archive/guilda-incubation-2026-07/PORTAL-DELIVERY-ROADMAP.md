# Portal delivery roadmap

> Autoridade: `APP-DECISIONS.md` registra as decisoes QRD. Este arquivo e o
> roteiro didatico para nao perder o fio entre spike tecnico, produto usavel,
> hospedagem e custo.

## 1. Problema que esta sendo resolvido

O app precisa servir quatro situacoes sem transformar uma delas em requisito
universal:

1. **Uso solo local**: uma pessoa usa o app na propria maquina.
2. **Governanca versionada em Git**: uma pessoa ou time pequeno quer que a
   governanca more em um repo seguro, como GitHub, e nao apenas no disco local.
3. **Portal compartilhado self-hosted**: duas ou mais pessoas acessam a mesma
   UI, com contas, convites e papeis, sem depender de um SaaS operado pela
   mantenedora.
4. **Portal hospedado opcional**: no futuro, a mantenedora ou comunidade pode
   operar uma casca hospedada para reduzir friccao, mas isso nao deve ser
   requisito para usar o framework.

Em linguagem simples: **Git/GitHub pode ser o cofre auditavel da governanca;
o portal e a porta de entrada humana**. O portal ajuda pessoas de negocio,
design, investimento e engenharia a participar sem precisar operar Git
diretamente.

## 2. O que ja foi provado

### S1d - conta e organizacao

Better Auth executou HTTP real com SQLite:

- criar conta;
- emitir sessao/cookie;
- criar organizacao;
- listar organizacoes;
- persistir usuario, sessao, organizacao e membership `owner`.

### S1e - convite e aceite

Better Auth executou HTTP real com SQLite:

- a pessoa criadora convida outra pessoa;
- a pessoa convidada cria conta;
- a pessoa convidada aceita o convite;
- o banco passa a ter 2 usuarios, 2 sessoes, 1 organizacao, 2 memberships e
  1 convite aceito.

Limite importante: membership no portal **nao concede authority governada** e
nao exige que a pessoa convidada opere GitHub.

### PostgreSQL

O runner live agora foi executado contra um PostgreSQL real em container Docker
efemero (`postgres:16-alpine`):

```text
GOVERNANCE_PORTAL_POSTGRES_URL=...
GOVERNANCE_PORTAL_POSTGRES_SPIKE_APPLY=1
```

Com essas variaveis, S1f provou signup, workspace, invite, signup da pessoa
convidada, accept e leitura do mesmo workspace por duas contas. Sem essas
variaveis, o runner retorna `skipped-*`, de forma visivel.

### Docker Compose oficial para o modo compartilhado

QRD-43 decidiu um meio termo operacional:

- `local-solo` continua sem Docker; SQLite e arquivo/processo local;
- `self-hosted portal simples` ganha um compose oficial para PostgreSQL em
  [`deploy/shared-portal/`](deploy/shared-portal/);
- o compose sobe somente o banco do portal, nao o app e nao o read-model Neo4j;
- o check `tools/checks/check-shared-portal-compose.ts` mantem o compose dentro
  do caminho de verificacao governado.

Isto permite testar a experiencia compartilhada com custo baixo e sem escolher
Cloud/VPS/PaaS agora.

## 3. Proxima prova obrigatoria

Antes de escolher hospedagem, custo ou provedor, a proxima prova deve responder:

> "Duas pessoas conseguem usar o mesmo portal, enquanto a governanca oficial
> continua morando em Git/governance host, sem o portal virar dono da verdade?"

Fluxo minimo:

1. Rosana cria conta no portal.
2. Rosana cria um workspace.
3. O workspace aponta para um governance host versionado ou para um candidato
   de repo Git-backed.
4. Rosana convida outra pessoa.
5. A pessoa convidada faz signup.
6. A pessoa convidada aceita o convite.
7. As duas pessoas veem o workspace.
8. O portal mostra que membership no portal nao e o mesmo que authority
   governada.
9. Uma mudanca de governanca vira proposta com `sourceRevision`, nao escrita
   direta silenciosa.
10. O portal nao guarda conteudo governado nem secrets no seu banco.

Essa prova e mais importante que escolher provedor de deploy, porque ela valida
a experiencia real de time pequeno e a fronteira de seguranca.

## 4. Matriz de modos de entrega

| Modo                         | Para quem serve                                       | Onde ficam contas/convites                | Onde fica a governanca oficial             | Custo esperado                  | Risco principal                                      |
| ---------------------------- | ----------------------------------------------------- | ----------------------------------------- | ------------------------------------------ | ------------------------------- | ---------------------------------------------------- |
| `local-solo`                 | dev solo, sandbox, avaliacao local                    | na maquina local                          | pasta local ou repo Git opcional           | zero ou quase zero              | perder estado local se nao versionar/backupear       |
| `git-backed local app`       | solo ou time pequeno que quer cofre Git desde cedo    | local, ate existir portal compartilhado   | repo GitHub/Git dedicado ou embutido       | GitHub/Git provider existente   | convite humano ainda depende de portal compartilhado |
| `self-hosted portal simples` | 2+ pessoas, pequeno time, comunidade, cliente proprio | banco do portal da organizacao            | Git/governance host separado               | baixo, pago por quem hospeda    | operacao, backup, dominio, email                     |
| `hosted portal opcional`     | usuarios que querem menor friccao                     | banco operado pela mantenedora/comunidade | Git/governance host do usuario/organizacao | custo recorrente da mantenedora | responsabilidade por dados, seguranca e suporte      |

## 5. Quando decidir hospedagem e custo

Nao decidir provedor de hospedagem antes destas evidencias:

1. **Portal compartilhado funciona em store compartilhado real.**
   - Feito em S1f: Better Auth + PostgreSQL live.
   - Feito em S1f: convite/aceite em ambiente que nao e so memoria/local
     temporario, com leitura por duas contas.

2. **Governanca versionada funciona sem virar segundo SSOT.**
   - Provar Git-backed bridge real ou sandbox de GitHub App.
   - Provar proposta com `sourceRevision`.
   - Provar que o portal nao grava authority efetiva sozinho.

3. **Custo operacional e visivel.**
   - Listar servicos necessarios: app, banco, email, dominio, storage/logs,
     backups.
   - Separar custo de uso self-hosted do custo de um hosted operado pela
     mantenedora.
   - Definir o que pode ficar gratis/local e o que exige conta/provedor.

Somente depois disso escolher entre:

- container unico self-hosted;
- Docker Compose oficial para Postgres compartilhado (ja disponivel para
  dogfood);
- PaaS portavel;
- VPS;
- hosted futuro;
- ou outra alternativa.

## 6. Decisao que ainda nao deve ser tomada

Ainda nao cravar:

- provedor final de hospedagem;
- portal hosted operado pela mantenedora;
- politica de cobranca;
- nome publico do produto;
- licenca diferente para app/server;
- Better Auth como decisao final para todos os modos.

O que ja pode guiar implementacao:

- `local-solo` nao exige portal compartilhado;
- `shared` precisa de contas, convites e store compartilhado;
- `controlled` precisa de identity/provider mais forte e auditoria;
- GitHub login nao e GitHub work-source;
- GitHub/Git pode ser cofre da governanca, mas nao substitui o portal humano;
- Neo4j e read-model de grafo, nao banco de contas/convites.

## 7. Ordem recomendada das proximas fatias

### S1f - Portal compartilhado real (feito)

O mesmo fluxo S1e foi executado contra PostgreSQL live em ambiente controlado:

- signup criadora;
- workspace/organizacao;
- invite;
- signup convidada;
- accept;
- leitura por ambas;
- prova de que membership nao concede authority.

### S1g - Governance host Git-backed real (proxima)

Provar a ponte com Git/GitHub em sandbox:

- repo de governanca dedicado ou fixture Git local com semantica de provider;
- proposta de mudanca com `sourceRevision`;
- nenhum commit direto silencioso;
- segredo/token fora de payload/event-log/read-model.

### S1g.1 - Compose operacional do portal compartilhado (feito)

Fatia operacional pequena, sem alterar a prova de governanca:

- `deploy/shared-portal/docker-compose.yml` sobe PostgreSQL persistente local;
- `.env.example` documenta porta, banco, usuario e senha local;
- `README.md` explica quando usar compose e quando SQLite basta;
- `check-shared-portal-compose.ts` falha se o contrato operacional driftar;
- dogfood com `docker compose up -d postgres` roda S1f contra esse banco.

### S1h - Modo de entrega e custo

Com S1f e S1g provados, criar a matriz financeira:

- custo zero/local;
- custo baixo self-hosted;
- custo de hosted opcional;
- requisitos minimos por modo;
- responsabilidades de quem hospeda.

## 8. Sinal de pronto para decidir hospedagem

Podemos discutir hospedagem final quando estas perguntas tiverem resposta em
teste ou spike:

- Uma pessoa convidada consegue usar o portal sem GitHub?
- Um workspace compartilhado funciona fora da maquina local?
- O governance host versionado continua sendo a fonte de verdade?
- O portal consegue propor mudanca sem escrever authority sozinho?
- Existe plano de backup/restore do banco do portal?
- Existe plano de email/convite?
- O custo mensal minimo esta explicito?
- Se o portal sair do ar, a governanca continua recuperavel a partir do Git?
